import express from "express";
import { buildDashboard } from "./dashboard";
import { migrationsReady } from "./db";
import { GlabError } from "./glab";
import { dailyRouter } from "./routes/daily";
import { notesRouter } from "./routes/notes";
import { WakatimeError, getWakatimeStats, getWakatimeTimeline } from "./wakatime";
import type { DashboardResponse, WakatimeRangeKey } from "./types";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(express.json());
app.use("/api/notes", notesRouter);
app.use("/api/daily", dailyRouter);

const DASHBOARD_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
let dashboardCache: DashboardResponse | null = null;

app.get("/api/dashboard", async (req, res) => {
  try {
    const { after, before, refresh } = req.query;
    const hasCustomRange = typeof after === "string" && typeof before === "string";
    const dateRange = hasCustomRange ? { after, before } : undefined;
    const forceRefresh = refresh === "true" || hasCustomRange;

    const isCacheFresh =
      dashboardCache !== null &&
      Date.now() - new Date(dashboardCache.atualizadoEm).getTime() < DASHBOARD_CACHE_TTL_MS;

    if (!forceRefresh && isCacheFresh) {
      res.json(dashboardCache);
      return;
    }

    const dashboard = await buildDashboard(dateRange);
    if (!hasCustomRange) dashboardCache = dashboard;
    res.json(dashboard);
  } catch (error) {
    if (error instanceof GlabError) {
      res.status(502).json({ error: error.message, details: error.stderr });
      return;
    }
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    res.status(500).json({ error: message });
  }
});

app.get("/api/wakatime", async (req, res) => {
  try {
    const { range, start, end } = req.query;
    const stats = await getWakatimeStats({
      range: typeof range === "string" ? (range as WakatimeRangeKey) : undefined,
      start: typeof start === "string" ? start : undefined,
      end: typeof end === "string" ? end : undefined,
    });
    res.json(stats);
  } catch (error) {
    if (error instanceof WakatimeError) {
      res.status(502).json({ error: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    res.status(500).json({ error: message });
  }
});

app.get("/api/wakatime/timeline", async (req, res) => {
  try {
    const { date } = req.query;
    const timeline = await getWakatimeTimeline({ date: typeof date === "string" ? date : undefined });
    res.json(timeline);
  } catch (error) {
    if (error instanceof WakatimeError) {
      res.status(502).json({ error: error.message });
      return;
    }
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    res.status(500).json({ error: message });
  }
});

migrationsReady
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("[db] Falha ao rodar migrations no Turso:", error);
    process.exit(1);
  });
