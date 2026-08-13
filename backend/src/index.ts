import express from "express";
import { buildDashboard } from "./dashboard";
import { GlabError } from "./glab";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.get("/api/dashboard", async (req, res) => {
  try {
    const { after, before } = req.query;
    const dateRange =
      typeof after === "string" && typeof before === "string"
        ? { after, before }
        : undefined;
    const dashboard = await buildDashboard(dateRange);
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
