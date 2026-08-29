import { Router } from "express";
import { dbAll, dbGet, dbRun } from "../db";
import type { NotesDay } from "../types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const notesRouter = Router();

async function getNotesDay(date: string): Promise<NotesDay> {
  const note = await dbGet<{ content: string }>("SELECT content FROM notes WHERE date = ?", [date]);

  const items = await dbAll<{ id: number; text: string; done: number; position: number }>(
    "SELECT id, text, done, position FROM checklist_items WHERE date = ? ORDER BY position ASC, id ASC",
    [date],
  );

  return {
    date,
    content: note?.content ?? "",
    checklist: items.map((item) => ({
      id: item.id,
      text: item.text,
      done: Boolean(item.done),
      position: item.position,
    })),
  };
}

notesRouter.use("/:date", (req, res, next) => {
  if (!DATE_RE.test(req.params.date)) {
    res.status(400).json({ error: "Data inválida, use o formato YYYY-MM-DD" });
    return;
  }
  next();
});

notesRouter.get("/:date", async (req, res) => {
  res.json(await getNotesDay(req.params.date));
});

notesRouter.put("/:date", async (req, res) => {
  const content = typeof req.body?.content === "string" ? req.body.content : "";
  await dbRun(
    `INSERT INTO notes (date, content, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`,
    [req.params.date, content, new Date().toISOString()],
  );
  res.json(await getNotesDay(req.params.date));
});

notesRouter.post("/:date/checklist", async (req, res) => {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) {
    res.status(400).json({ error: "Texto do item não pode ser vazio" });
    return;
  }

  const row = await dbGet<{ maxPosition: number | null }>(
    "SELECT MAX(position) as maxPosition FROM checklist_items WHERE date = ?",
    [req.params.date],
  );

  await dbRun(
    "INSERT INTO checklist_items (date, text, done, position, created_at) VALUES (?, ?, 0, ?, ?)",
    [req.params.date, text, (row?.maxPosition ?? -1) + 1, new Date().toISOString()],
  );

  res.status(201).json(await getNotesDay(req.params.date));
});

notesRouter.patch("/:date/checklist/:id", async (req, res) => {
  if (typeof req.body?.done !== "boolean") {
    res.status(400).json({ error: "Campo 'done' precisa ser boolean" });
    return;
  }

  await dbRun("UPDATE checklist_items SET done = ? WHERE id = ? AND date = ?", [
    req.body.done ? 1 : 0,
    Number(req.params.id),
    req.params.date,
  ]);

  res.json(await getNotesDay(req.params.date));
});

notesRouter.delete("/:date/checklist/:id", async (req, res) => {
  await dbRun("DELETE FROM checklist_items WHERE id = ? AND date = ?", [
    Number(req.params.id),
    req.params.date,
  ]);

  res.json(await getNotesDay(req.params.date));
});
