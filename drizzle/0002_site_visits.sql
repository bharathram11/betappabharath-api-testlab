CREATE TABLE IF NOT EXISTS site_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  opened_at TEXT NOT NULL,
  path TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  device TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_site_visits_opened
ON site_visits (opened_at DESC);
