-- Analytics event store schema (JOS-72 / 7.3). Apply once against a fresh
-- Neon/Vercel Postgres database — see README.md "Analytics store". Not a
-- migrations framework; this file is the single source of truth for the
-- table shape.

CREATE TABLE IF NOT EXISTS visit_session (
  id TEXT PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL,
  last_event_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS analytics_event (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES visit_session (id),
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'page_view',
      'section_reach',
      'chat_open',
      'question_asked',
      'resume_download',
      'contact_click'
    )
  ),
  occurred_at TIMESTAMPTZ NOT NULL,
  page_path TEXT NOT NULL,
  section_id TEXT,
  scroll_depth_percent INTEGER,
  contact_target TEXT CHECK (
    contact_target IS NULL OR contact_target IN ('scheduling', 'email', 'linkedin')
  ),
  country_or_region TEXT,
  referrer_domain TEXT,
  device_class TEXT NOT NULL CHECK (device_class IN ('mobile', 'tablet', 'desktop'))
);

CREATE INDEX IF NOT EXISTS analytics_event_session_id_idx
  ON analytics_event (session_id);

CREATE INDEX IF NOT EXISTS analytics_event_occurred_at_idx
  ON analytics_event (occurred_at);
