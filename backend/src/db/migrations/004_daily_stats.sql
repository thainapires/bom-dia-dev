CREATE TABLE daily_stats (
  date TEXT PRIMARY KEY,
  total_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  word_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

INSERT INTO daily_stats (date, total_tasks, completed_tasks, word_count, updated_at)
SELECT date, COUNT(*), SUM(done), 0, datetime('now')
FROM checklist_items
GROUP BY date;
