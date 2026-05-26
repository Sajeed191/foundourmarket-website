
-- Recommendation events: signals feed
CREATE TABLE IF NOT EXISTS public.recommendation_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  session_id TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('view','add_to_cart','purchase','wishlist','search','category_view')),
  product_slug TEXT,
  category TEXT,
  query TEXT,
  weight NUMERIC NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rec_events_user ON public.recommendation_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rec_events_session ON public.recommendation_events(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rec_events_product ON public.recommendation_events(product_slug);
ALTER TABLE public.recommendation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone insert rec events" ON public.recommendation_events
  FOR INSERT WITH CHECK (true);
CREATE POLICY "own rec events read" ON public.recommendation_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins read rec events" ON public.recommendation_events
  FOR SELECT USING (has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role,'manager'::app_role]));

-- Recommendation scores per user x product (computed)
CREATE TABLE IF NOT EXISTS public.recommendation_scores (
  user_id UUID NOT NULL,
  product_slug TEXT NOT NULL,
  score NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_slug)
);
ALTER TABLE public.recommendation_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own scores read" ON public.recommendation_scores
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins manage scores" ON public.recommendation_scores
  FOR ALL USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Personalized feed cache
CREATE TABLE IF NOT EXISTS public.personalized_feed_cache (
  user_id UUID PRIMARY KEY,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.personalized_feed_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own feed read" ON public.personalized_feed_cache
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own feed write" ON public.personalized_feed_cache
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trending products view (last 7 days)
CREATE OR REPLACE VIEW public.trending_products AS
SELECT
  e.product_slug,
  COUNT(*) FILTER (WHERE event_type = 'view') AS views_7d,
  COUNT(*) FILTER (WHERE event_type = 'add_to_cart') AS atc_7d,
  COUNT(*) FILTER (WHERE event_type = 'purchase') AS purchases_7d,
  (COUNT(*) FILTER (WHERE event_type = 'view')
   + 3 * COUNT(*) FILTER (WHERE event_type = 'add_to_cart')
   + 8 * COUNT(*) FILTER (WHERE event_type = 'purchase'))::numeric AS trend_score
FROM public.recommendation_events e
WHERE e.created_at > now() - interval '7 days'
  AND e.product_slug IS NOT NULL
GROUP BY e.product_slug;

GRANT SELECT ON public.trending_products TO anon, authenticated;

-- Frequently bought together (co-purchase pairs)
CREATE OR REPLACE VIEW public.frequently_bought_together AS
SELECT
  a.product_slug AS slug_a,
  b.product_slug AS slug_b,
  COUNT(*) AS co_count
FROM public.order_items a
JOIN public.order_items b
  ON a.order_id = b.order_id AND a.product_slug < b.product_slug
GROUP BY a.product_slug, b.product_slug;

GRANT SELECT ON public.frequently_bought_together TO anon, authenticated;

-- Helper: get recommendations for a product (co-purchase based)
CREATE OR REPLACE FUNCTION public.get_fbt(_slug TEXT, _limit INT DEFAULT 4)
RETURNS TABLE(product_slug TEXT, co_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN slug_a = _slug THEN slug_b ELSE slug_a END AS product_slug,
         co_count
  FROM public.frequently_bought_together
  WHERE slug_a = _slug OR slug_b = _slug
  ORDER BY co_count DESC
  LIMIT _limit;
$$;
