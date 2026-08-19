import express from "express";
import { buildDashboard } from "./dashboard";
import { GlabError } from "./glab";
import { notesRouter } from "./routes/notes";
import type { DashboardResponse } from "./types";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(express.json());
app.use("/api/notes", notesRouter);

const DASHBOARD_CACHE_TTL_MS = 15 * 60 * 1000;
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

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
