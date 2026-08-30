import { Router } from "express";
import { buildDashboard } from "../dashboard";
import { GlabError } from "../glab";
import { getDailyEntry, listDailyDates } from "../standup";
import type { DailyEntry } from "../types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIMEZONE = "America/Sao_Paulo";

function todayStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}


function forcedDailyRange(date: string): { after: string; before: string } {
  const [year, month, day] = date.split("-").map(Number);
  const after = new Date(Date.UTC(year, month - 1, day));
  after.setUTCDate(after.getUTCDate() - 2);
  return { after: after.toISOString().slice(0, 10), before: date };
}

function entryFromDashboard(date: string, dashboard: Awaited<ReturnType<typeof buildDashboard>>): DailyEntry {
  return {
    date,
    ontem: dashboard.narrativa.ontem,
    hoje: dashboard.narrativa.hoje,
    geradoViaLLM: dashboard.narrativa.geradoViaLLM,
    criadoEm: dashboard.atualizadoEm,
    ontemItems: dashboard.narrativa.ontemItems,
    hojeItems: dashboard.narrativa.hojeItems,
    stats: dashboard.narrativa.stats,
  };
}

async function respondWithGitlabErrors(res: import("express").Response, action: () => Promise<DailyEntry>): Promise<void> {
  try {
    res.json(await action());
  } catch (error) {
    if (error instanceof GlabError) {
      res.status(502).json({ error: error.message, details: error.stderr });
      return;
    }
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    res.status(500).json({ error: message });
  }
}

export const dailyRouter = Router();

dailyRouter.get("/", async (_req, res) => {
  res.json(await listDailyDates());
});

dailyRouter.get("/:date", async (req, res) => {
  const { date } = req.params;
  if (!DATE_RE.test(date)) {
    res.status(400).json({ error: "Data inválida, use o formato YYYY-MM-DD" });
    return;
  }

  let entry: DailyEntry | null = await getDailyEntry(date);

  // Só gera na hora pro dia de hoje — dias passados sem registro ficam
  // mesmo sem histórico (ver CLAUDE.md: sem backfill de dias anteriores ao
  // início dessa feature).
  //
  // Usa o retorno de `buildDashboard` diretamente em vez de reler do banco:
  // quando a LLM falha, o fallback heurístico não é persistido (ver
  // `standup.ts`), então uma releitura aqui voltaria vazia mesmo com um
  // resultado válido em mãos.
  if (!entry && date === todayStr()) {
    await respondWithGitlabErrors(res, async () => entryFromDashboard(date, await buildDashboard()));
    return;
  }

  if (!entry) {
    res.status(404).json({ error: "Nenhum registro de daily para essa data." });
    return;
  }

  res.json(entry);
});


dailyRouter.post("/:date/generate", async (req, res) => {
  const { date } = req.params;
  if (!DATE_RE.test(date)) {
    res.status(400).json({ error: "Data inválida, use o formato YYYY-MM-DD" });
    return;
  }

  await respondWithGitlabErrors(res, async () => {
    const dashboard = await buildDashboard(forcedDailyRange(date), {
      standupDate: date,
      persistStandup: true,
    });
    return entryFromDashboard(date, dashboard);
  });
});
