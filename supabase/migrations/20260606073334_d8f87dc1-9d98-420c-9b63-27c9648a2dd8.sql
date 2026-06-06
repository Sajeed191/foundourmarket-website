-- Harden realtime broadcast INSERT authorization.
-- The app only uses postgres_changes subscriptions (SELECT); no client-side
-- broadcast exists. Replace the permissive ELSE true fallback with ELSE false
-- so authenticated customers can no longer inject broadcast payloads into
-- staff/operational channels. Staff may still broadcast to live-/activity-feed.
DROP POLICY IF EXISTS "fom_realtime_insert" ON realtime.messages;
CREATE POLICY "fom_realtime_insert" ON realtime.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    CASE
      WHEN realtime.topic() LIKE 'live-%' OR realtime.topic() = 'activity-feed'
        THEN public.has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'manager'::app_role])
      ELSE false
    END
  );