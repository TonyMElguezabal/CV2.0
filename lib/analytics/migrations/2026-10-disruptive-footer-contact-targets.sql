-- JOS-191 (disruptive-footer): widen analytics_event.contact_target to the
-- five-channel set (adds 'github' and 'whatsapp').
--
-- Applied by the owner, never by the agent. Run once against the live Neon
-- database. Idempotent: DROP ... IF EXISTS, then re-ADD.
--
-- The constraint name is the Postgres auto-name for the inline column CHECK
-- in lib/analytics/schema.sql. Verify it first with:
--   SELECT conname FROM pg_constraint WHERE conrelid = 'analytics_event'::regclass AND contype = 'c';
-- and confirm 'analytics_event_contact_target_check' appears before running.

BEGIN;

ALTER TABLE analytics_event
  DROP CONSTRAINT IF EXISTS analytics_event_contact_target_check;

ALTER TABLE analytics_event
  ADD CONSTRAINT analytics_event_contact_target_check CHECK (
    contact_target IS NULL OR contact_target IN ('scheduling', 'email', 'linkedin', 'github', 'whatsapp')
  );

COMMIT;
