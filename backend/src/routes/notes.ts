import { Router } from "express";
import { dbAll, dbGet, dbRun } from "../db";
import type { ChecklistItem, DailyStats, Note, NoteSummary, NotesDayResponse } from "../types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DEFAULT_RECENT_LIMIT = 5;

export const notesRouter = Router();

// Conteúdo salvo antes do editor rich-text era texto puro (sem tags). Em vez
// de migrar os dados, envolve em HTML só na hora de servir — no primeiro
// save pelo editor novo o conteúdo já vira HTML de verdade.
function ensureHtml(content: string): string {
  if (content.includes("<")) return content;
  if (!content.trim()) return "";
  return content
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.split("\n").join("<br>")}</p>`)
    .join("");
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(html: string): number {
  const text = stripHtml(html);
  return text ? text.split(" ").length : 0;
}

function toStats(row: { total_tasks: number; completed_tasks: number; word_count: number } | undefined): DailyStats {
  const totalTasks = row?.total_tasks ?? 0;
  const completedTasks = row?.completed_tasks ?? 0;
  return {
    totalTasks,
    completedTasks,
    wordCount: row?.word_count ?? 0,
    progressPercent: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  };
}

function toNote(row: {
  id: number;
  date: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}): Note {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    content: ensureHtml(row.content),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getStats(date: string): Promise<DailyStats> {
  const row = await dbGet<{ total_tasks: number; completed_tasks: number; word_count: number }>(
    "SELECT total_tasks, completed_tasks, word_count FROM daily_stats WHERE date = ?",
    [date],
  );
  return toStats(row);
}

async function recomputeChecklistStats(date: string): Promise<void> {
  const row = await dbGet<{ total: number; completed: number | null }>(
    "SELECT COUNT(*) as total, SUM(done) as completed FROM checklist_items WHERE date = ?",
    [date],
  );
  await dbRun(
    `INSERT INTO daily_stats (date, total_tasks, completed_tasks, word_count, updated_at)
     VALUES (?, ?, ?, 0, ?)
     ON CONFLICT(date) DO UPDATE SET
       total_tasks = excluded.total_tasks, completed_tasks = excluded.completed_tasks, updated_at = excluded.updated_at`,
    [date, row?.total ?? 0, row?.completed ?? 0, new Date().toISOString()],
  );
}

async function recomputeWordCount(date: string, content: string): Promise<void> {
  await dbRun(
    `INSERT INTO daily_stats (date, total_tasks, completed_tasks, word_count, updated_at)
     VALUES (?, 0, 0, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       word_count = excluded.word_count, updated_at = excluded.updated_at`,
    [date, countWords(content), new Date().toISOString()],
  );
}

async function getChecklist(date: string): Promise<ChecklistItem[]> {
  const items = await dbAll<{ id: number; text: string; done: number; position: number }>(
    "SELECT id, text, done, position FROM checklist_items WHERE date = ? ORDER BY position ASC, id ASC",
    [date],
  );
  return items.map((item) => ({
    id: item.id,
    text: item.text,
    done: Boolean(item.done),
    position: item.position,
  }));
}

async function getDayPayload(date: string): Promise<NotesDayResponse> {
  const [noteRow, checklist, stats] = await Promise.all([
    dbGet<{ id: number; date: string; title: string; content: string; created_at: string; updated_at: string }>(
      "SELECT id, date, title, content, created_at, updated_at FROM notes WHERE date = ? ORDER BY id DESC LIMIT 1",
      [date],
    ),
    getChecklist(date),
    getStats(date),
  ]);

  return {
    date,
    note: noteRow ? toNote(noteRow) : null,
    checklist,
    stats,
  };
}

function todayStr(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

// Rotas literais antes de "/:id" — senão "/recent" seria capturado como id.
notesRouter.get("/recent", async (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || DEFAULT_RECENT_LIMIT, 1), 50);
  const beforeId = req.query.beforeId ? Number(req.query.beforeId) : null;

  const rows = await dbAll<{
    id: number;
    date: string;
    title: string;
    content: string;
    created_at: string;
  }>(
    beforeId
      ? "SELECT id, date, title, content, created_at FROM notes WHERE id < ? ORDER BY id DESC LIMIT ?"
      : "SELECT id, date, title, content, created_at FROM notes ORDER BY id DESC LIMIT ?",
    beforeId ? [beforeId, limit + 1] : [limit + 1],
  );

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);

  const notes: NoteSummary[] = page.map((row) => ({
    id: row.id,
    date: row.date,
    title: row.title,
    preview: stripHtml(ensureHtml(row.content)).slice(0, 140),
    createdAt: row.created_at,
  }));

  res.json({ notes, hasMore });
});

notesRouter.get("/:id(\\d+)", async (req, res) => {
  const row = await dbGet<{ id: number; date: string; title: string; content: string; created_at: string; updated_at: string }>(
    "SELECT id, date, title, content, created_at, updated_at FROM notes WHERE id = ?",
    [Number(req.params.id)],
  );
  if (!row) {
    res.status(404).json({ error: "Nota não encontrada." });
    return;
  }
  res.json(toNote(row));
});

notesRouter.put("/:id(\\d+)", async (req, res) => {
  const id = Number(req.params.id);
  const existing = await dbGet<{ date: string }>("SELECT date FROM notes WHERE id = ?", [id]);
  if (!existing) {
    res.status(404).json({ error: "Nota não encontrada." });
    return;
  }

  const content = typeof req.body?.content === "string" ? req.body.content : "";
  const title = typeof req.body?.title === "string" ? req.body.title : "";
  const now = new Date().toISOString();

  await dbRun("UPDATE notes SET title = ?, content = ?, updated_at = ? WHERE id = ?", [title, content, now, id]);
  await recomputeWordCount(existing.date, content);

  const [noteRow, stats] = await Promise.all([
    dbGet<{ id: number; date: string; title: string; content: string; created_at: string; updated_at: string }>(
      "SELECT id, date, title, content, created_at, updated_at FROM notes WHERE id = ?",
      [id],
    ),
    getStats(existing.date),
  ]);

  res.json({ note: toNote(noteRow!), stats });
});

notesRouter.use("/day/:date", (req, res, next) => {
  if (!DATE_RE.test(req.params.date)) {
    res.status(400).json({ error: "Data inválida, use o formato YYYY-MM-DD" });
    return;
  }
  next();
});

notesRouter.get("/day/:date", async (req, res) => {
  res.json(await getDayPayload(req.params.date));
});

notesRouter.post("/day/:date", async (req, res) => {
  const { date } = req.params;
  if (date !== todayStr()) {
    res.status(400).json({ error: "Só é possível criar notas novas pra hoje." });
    return;
  }

  const now = new Date().toISOString();
  await dbRun("INSERT INTO notes (date, title, content, created_at, updated_at) VALUES (?, '', '', ?, ?)", [
    date,
    now,
    now,
  ]);

  res.status(201).json(await getDayPayload(date));
});

notesRouter.post("/day/:date/checklist", async (req, res) => {
  const { date } = req.params;
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) {
    res.status(400).json({ error: "Texto do item não pode ser vazio" });
    return;
  }

  const row = await dbGet<{ maxPosition: number | null }>(
    "SELECT MAX(position) as maxPosition FROM checklist_items WHERE date = ?",
    [date],
  );

  await dbRun(
    "INSERT INTO checklist_items (date, text, done, position, created_at) VALUES (?, ?, 0, ?, ?)",
    [date, text, (row?.maxPosition ?? -1) + 1, new Date().toISOString()],
  );
  await recomputeChecklistStats(date);

  res.status(201).json(await getDayPayload(date));
});

notesRouter.patch("/day/:date/checklist/:id(\\d+)", async (req, res) => {
  const { date } = req.params;
  const id = Number(req.params.id);
  const hasDone = typeof req.body?.done === "boolean";
  const hasText = typeof req.body?.text === "string";

  if (!hasDone && !hasText) {
    res.status(400).json({ error: "Informe 'done' e/ou 'text' pra atualizar o item" });
    return;
  }

  if (hasText) {
    const text = req.body.text.trim();
    if (!text) {
      res.status(400).json({ error: "Texto do item não pode ser vazio" });
      return;
    }
    await dbRun("UPDATE checklist_items SET text = ? WHERE id = ? AND date = ?", [text, id, date]);
  }

  if (hasDone) {
    await dbRun("UPDATE checklist_items SET done = ? WHERE id = ? AND date = ?", [
      req.body.done ? 1 : 0,
      id,
      date,
    ]);
    await recomputeChecklistStats(date);
  }

  res.json(await getDayPayload(date));
});

notesRouter.delete("/day/:date/checklist/:id(\\d+)", async (req, res) => {
  const { date } = req.params;
  await dbRun("DELETE FROM checklist_items WHERE id = ? AND date = ?", [Number(req.params.id), date]);
  await recomputeChecklistStats(date);

  res.json(await getDayPayload(date));
});

notesRouter.post("/day/:date/checklist/reorder", async (req, res) => {
  const { date } = req.params;
  const orderedIds = Array.isArray(req.body?.orderedIds) ? (req.body.orderedIds as unknown[]) : null;
  if (!orderedIds || !orderedIds.every((id) => typeof id === "number")) {
    res.status(400).json({ error: "'orderedIds' precisa ser um array de números" });
    return;
  }

  for (let position = 0; position < orderedIds.length; position++) {
    await dbRun("UPDATE checklist_items SET position = ? WHERE id = ? AND date = ?", [
      position,
      orderedIds[position],
      date,
    ]);
  }

  res.json(await getDayPayload(date));
});

notesRouter.post("/day/:date/checklist/clear-completed", async (req, res) => {
  const { date } = req.params;
  await dbRun("DELETE FROM checklist_items WHERE date = ? AND done = 1", [date]);
  await recomputeChecklistStats(date);

  res.json(await getDayPayload(date));
});
