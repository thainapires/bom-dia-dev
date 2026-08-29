CREATE TABLE IF NOT EXISTS daily_entries (
  date TEXT PRIMARY KEY,
  ontem TEXT NOT NULL,
  hoje TEXT NOT NULL,
  gerado_via_llm INTEGER NOT NULL DEFAULT 0,
  model TEXT,
  created_at TEXT NOT NULL
);
