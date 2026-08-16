import { Router } from "express";
import { db } from "../db";
import type { NotesDay } from "../types";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const notesRouter = Router();

function getNotesDay(date: string): NotesDay {
  const note = db
    .prepare<[string], { content: string }>("SELECT content FROM notes WHERE date = ?")
    .get(date);

  const items = db
    .prepare<
      [string],
      { id: number; text: string; done: number; position: number }
    >(
      "SELECT id, text, done, position FROM checklist_items WHERE date = ? ORDER BY position ASC, id ASC",
    )
    .all(date);

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

notesRouter.get("/:date", (req, res) => {
  res.json(getNotesDay(req.params.date));
});

notesRouter.put("/:date", (req, res) => {
  const content = typeof req.body?.content === "string" ? req.body.content : "";
  db.prepare(
    `INSERT INTO notes (date, content, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`,
  ).run(req.params.date, content, new Date().toISOString());
  res.json(getNotesDay(req.params.date));
});

notesRouter.post("/:date/checklist", (req, res) => {
  const text = typeof req.body?.text === "string" ? req.body.text.trim() : "";
  if (!text) {
    res.status(400).json({ error: "Texto do item não pode ser vazio" });
    return;
  }

  const row = db
    .prepare<
      [string],
      { maxPosition: number | null }
    >("SELECT MAX(position) as maxPosition FROM checklist_items WHERE date = ?")
    .get(req.params.date);

  db.prepare(
    "INSERT INTO checklist_items (date, text, done, position, created_at) VALUES (?, ?, 0, ?, ?)",
  ).run(req.params.date, text, (row?.maxPosition ?? -1) + 1, new Date().toISOString());

  res.status(201).json(getNotesDay(req.params.date));
});

notesRouter.patch("/:date/checklist/:id", (req, res) => {
  if (typeof req.body?.done !== "boolean") {
    res.status(400).json({ error: "Campo 'done' precisa ser boolean" });
    return;
  }

  db.prepare("UPDATE checklist_items SET done = ? WHERE id = ? AND date = ?").run(
    req.body.done ? 1 : 0,
    Number(req.params.id),
    req.params.date,
  );

  res.json(getNotesDay(req.params.date));
});

notesRouter.delete("/:date/checklist/:id", (req, res) => {
  db.prepare("DELETE FROM checklist_items WHERE id = ? AND date = ?").run(
    Number(req.params.id),
    req.params.date,
  );

  res.json(getNotesDay(req.params.date));
});
