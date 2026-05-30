-- Enterprise Traffic Intelligence: atomic visit tracking
-- Writes a page_view and upserts the visitor_session in one call.
-- SECURITY DEFINER so guests (anon) can keep their session updated without
-- needing a broad UPDATE policy on visitor_sessions.

CREATE OR REPLACE FUNCTION public.track_visit(
  _path text,
  _session_id text,
  _referrer text DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _country text DEFAULT NULL,
  _device text DEFAULT NULL,
  _is_new_session boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _path IS NULL OR length(_path) = 0 OR _session_id IS NULL OR length(_session_id) = 0 THEN
    RETURN;
  END IF;

  INSERT INTO public.page_views(path, user_id, session_id, referrer, user_agent, country, device, is_seeded)
  VALUES (left(_path, 1024), _uid, left(_session_id, 128), left(_referrer, 1024), left(_user_agent, 512), left(_country, 64), left(_device, 32), false);

  INSERT INTO public.visitor_sessions(session_id, user_id, started_at, last_seen, page_views, country, device, referrer, landing_path)
  VALUES (left(_session_id, 128), _uid, now(), now(), 1, left(_country, 64), left(_device, 32), left(_referrer, 1024), left(_path, 1024))
  ON CONFLICT (session_id) DO UPDATE
    SET last_seen = now(),
        page_views = public.visitor_sessions.page_views + 1,
        user_id = COALESCE(public.visitor_sessions.user_id, EXCLUDED.user_id),
        country = COALESCE(public.visitor_sessions.country, EXCLUDED.country),
        device = COALESCE(public.visitor_sessions.device, EXCLUDED.device);
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_visit(text, text, text, text, text, text, boolean) TO anon, authenticated;

-- Helpful indexes for the analytics dashboards at scale.
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON public.page_views (session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_seeded ON public.page_views (is_seeded);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_last_seen ON public.visitor_sessions (last_seen DESC);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_started ON public.visitor_sessions (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON public.analytics_events (event);
CREATE INDEX IF NOT EXISTS idx_analytics_events_product ON public.analytics_events (product_slug);