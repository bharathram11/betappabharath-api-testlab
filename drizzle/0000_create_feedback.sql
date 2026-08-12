CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  created_by TEXT NOT NULL,
  email TEXT NOT NULL,
  type TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Open'
);
CREATE INDEX IF NOT EXISTS idx_feedback_status_created ON feedback (status, created_at DESC);
