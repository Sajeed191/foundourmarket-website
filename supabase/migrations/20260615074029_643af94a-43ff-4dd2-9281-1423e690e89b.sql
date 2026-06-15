CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE INDEX IF NOT EXISTS idx_notifications_user_active
  ON public.notifications (user_id, created_at DESC)
  WHERE archived_at IS NULL;

-- Auto-archive read notifications older than 30 days to keep the active list lean.
SELECT cron.schedule(
  'auto-archive-old-notifications',
  '0 3 * * *',
  $$
  UPDATE public.notifications
  SET archived_at = now()
  WHERE archived_at IS NULL
    AND read_at IS NOT NULL
    AND read_at < now() - INTERVAL '30 days';
  $$
);