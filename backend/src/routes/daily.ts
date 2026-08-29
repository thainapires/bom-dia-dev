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
    try {
      const dashboard = await buildDashboard();
      entry = {
        date,
        ontem: dashboard.narrativa.ontem,
        hoje: dashboard.narrativa.hoje,
        geradoViaLLM: dashboard.narrativa.geradoViaLLM,
        criadoEm: dashboard.atualizadoEm,
      };
    } catch (error) {
      if (error instanceof GlabError) {
        res.status(502).json({ error: error.message, details: error.stderr });
        return;
      }
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      res.status(500).json({ error: message });
      return;
    }
  }

  if (!entry) {
    res.status(404).json({ error: "Nenhum registro de daily para essa data." });
    return;
  }

  res.json(entry);
});
