-- ============================================================
-- P2-C SEO Intelligence: data model + service RPC
-- ============================================================

-- 1) Search Console snapshots (persisted real GSC pulls) -----
CREATE TABLE IF NOT EXISTS public.seo_search_console (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  dimension     TEXT NOT NULL CHECK (dimension IN ('query','page')),
  keyword       TEXT,
  page          TEXT,
  clicks        INTEGER NOT NULL DEFAULT 0,
  impressions   INTEGER NOT NULL DEFAULT 0,
  ctr           NUMERIC NOT NULL DEFAULT 0,
  position      NUMERIC NOT NULL DEFAULT 0,
  country       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seo_sc_snapshot ON public.seo_search_console (snapshot_date DESC, dimension);
CREATE INDEX IF NOT EXISTS idx_seo_sc_keyword  ON public.seo_search_console (keyword);
CREATE INDEX IF NOT EXISTS idx_seo_sc_page     ON public.seo_search_console (page);

GRANT SELECT ON public.seo_search_console TO authenticated;
GRANT ALL ON public.seo_search_console TO service_role;

ALTER TABLE public.seo_search_console ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read seo search console"
  ON public.seo_search_console FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','editor']::app_role[]));

-- 2) SEO settings singleton ----------------------------------
CREATE TABLE IF NOT EXISTS public.seo_settings (
  id            UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_url      TEXT NOT NULL DEFAULT 'https://foundourmarket.com',
  last_sync_at  TIMESTAMPTZ,
  last_sync_status TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.seo_settings TO authenticated;
GRANT ALL ON public.seo_settings TO service_role;

ALTER TABLE public.seo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff read seo settings"
  ON public.seo_settings FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','editor']::app_role[]));

INSERT INTO public.seo_settings (site_url)
SELECT 'https://foundourmarket.com'
WHERE NOT EXISTS (SELECT 1 FROM public.seo_settings);

-- 3) svc_seo_intelligence: service_role-only aggregation ------
CREATE OR REPLACE FUNCTION public.svc_seo_intelligence(p_since timestamptz DEFAULT (now() - interval '30 days'))
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result      jsonb;
  v_snapshot    date;
  v_audit       jsonb;
  v_meta        jsonb;
  v_sc          jsonb;
  v_rev_pages   jsonb;
  v_rev_kw      jsonb;
BEGIN
  -- latest search console snapshot date
  SELECT max(snapshot_date) INTO v_snapshot FROM public.seo_search_console;

  -- ---- Metadata audit: score every public entity ----------
  WITH ent AS (
    -- products
    SELECT 'product'::text AS type, p.id::text AS id, p.slug, p.name AS title,
           '/product/' || p.slug AS url,
           p.seo_title AS meta_title, p.seo_description AS meta_desc,
           (p.meta_keywords IS NOT NULL AND array_length(p.meta_keywords,1) > 0) AS has_kw,
           (p.image IS NOT NULL AND length(p.image) > 0) AS has_img
    FROM public.products p
    WHERE p.deleted_at IS NULL AND coalesce(p.status,'active') <> 'archived'
    UNION ALL
    SELECT 'category', c.id::text, c.slug, c.name, '/category/' || c.slug,
           c.seo_title, c.seo_description, true, (c.image IS NOT NULL)
    FROM public.categories c
    WHERE coalesce(c.status,'active') <> 'archived'
    UNION ALL
    SELECT 'page', pg.id::text, pg.slug, pg.title, '/' || pg.slug,
           pg.meta_title, pg.meta_description, true, true
    FROM public.cms_pages pg
    WHERE pg.published = true
    UNION ALL
    SELECT 'post', po.id::text, po.slug, po.title, '/blog/' || po.slug,
           po.meta_title, po.meta_description, true, (po.cover_image IS NOT NULL)
    FROM public.cms_posts po
    WHERE po.published_at IS NOT NULL
  ),
  scored AS (
    SELECT type, id, slug, title, url, meta_title, meta_desc,
      GREATEST(0, LEAST(100,
        100
        - CASE WHEN meta_title IS NULL OR length(trim(meta_title)) = 0 THEN 35
               WHEN length(meta_title) < 15 OR length(meta_title) > 60 THEN 10 ELSE 0 END
        - CASE WHEN meta_desc IS NULL OR length(trim(meta_desc)) = 0 THEN 30
               WHEN length(meta_desc) < 70 OR length(meta_desc) > 160 THEN 10 ELSE 0 END
        - CASE WHEN NOT has_kw THEN 10 ELSE 0 END
        - CASE WHEN NOT has_img THEN 10 ELSE 0 END
      ))::int AS score,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN meta_title IS NULL OR length(trim(meta_title))=0 THEN 'missing_title'
             WHEN length(meta_title) < 15 THEN 'title_too_short'
             WHEN length(meta_title) > 60 THEN 'title_too_long' END,
        CASE WHEN meta_desc IS NULL OR length(trim(meta_desc))=0 THEN 'missing_description'
             WHEN length(meta_desc) < 70 THEN 'description_too_short'
             WHEN length(meta_desc) > 160 THEN 'description_too_long' END,
        CASE WHEN NOT has_kw THEN 'missing_keywords' END,
        CASE WHEN NOT has_img THEN 'missing_image' END
      ], NULL) AS issues
    FROM ent
  )
  SELECT
    jsonb_build_object(
      'rows', coalesce((
        SELECT jsonb_agg(to_jsonb(s) ORDER BY s.score ASC, s.type)
        FROM (SELECT * FROM scored WHERE array_length(issues,1) > 0 ORDER BY score ASC LIMIT 100) s
      ), '[]'::jsonb),
      'avg_score', coalesce((SELECT round(avg(score))::int FROM scored), 0),
      'total', (SELECT count(*) FROM scored),
      'perfect', (SELECT count(*) FROM scored WHERE array_length(issues,1) IS NULL),
      'by_type', coalesce((
        SELECT jsonb_object_agg(type, c) FROM (
          SELECT type, count(*) c FROM scored GROUP BY type
        ) t
      ), '{}'::jsonb)
    ),
    jsonb_build_object(
      'missing_title',       (SELECT count(*) FROM scored WHERE 'missing_title' = ANY(issues)),
      'missing_description', (SELECT count(*) FROM scored WHERE 'missing_description' = ANY(issues)),
      'missing_keywords',    (SELECT count(*) FROM scored WHERE 'missing_keywords' = ANY(issues)),
      'missing_image',       (SELECT count(*) FROM scored WHERE 'missing_image' = ANY(issues)),
      'title_issues',        (SELECT count(*) FROM scored WHERE 'title_too_short' = ANY(issues) OR 'title_too_long' = ANY(issues)),
      'description_issues',  (SELECT count(*) FROM scored WHERE 'description_too_short' = ANY(issues) OR 'description_too_long' = ANY(issues))
    )
  INTO v_audit, v_meta;

  -- ---- Search Console metrics (latest snapshot) -----------
  IF v_snapshot IS NOT NULL THEN
    WITH q AS (
      SELECT keyword, clicks, impressions, ctr, position
      FROM public.seo_search_console
      WHERE snapshot_date = v_snapshot AND dimension = 'query' AND keyword IS NOT NULL
    ),
    pg AS (
      SELECT page, clicks, impressions, ctr, position
      FROM public.seo_search_console
      WHERE snapshot_date = v_snapshot AND dimension = 'page' AND page IS NOT NULL
    )
    SELECT jsonb_build_object(
      'available', true,
      'snapshot_date', v_snapshot,
      'totals', jsonb_build_object(
        'clicks', coalesce((SELECT sum(clicks) FROM q),0),
        'impressions', coalesce((SELECT sum(impressions) FROM q),0),
        'ctr', coalesce((SELECT round((sum(clicks)::numeric / NULLIF(sum(impressions),0))::numeric, 4) FROM q),0),
        'position', coalesce((SELECT round(avg(position)::numeric,1) FROM q),0),
        'keywords', (SELECT count(*) FROM q)
      ),
      'top_keywords', coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (
          SELECT keyword, clicks, impressions, round(ctr::numeric,4) ctr, round(position::numeric,1) position
          FROM q ORDER BY clicks DESC LIMIT 25) t),'[]'::jsonb),
      -- striking distance: positions 4-20 with real impressions
      'striking_distance', coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (
          SELECT keyword, clicks, impressions, round(ctr::numeric,4) ctr, round(position::numeric,1) position
          FROM q WHERE position >= 4 AND position <= 20 AND impressions >= 10
          ORDER BY impressions DESC LIMIT 25) t),'[]'::jsonb),
      -- ctr opportunities: high impressions, weak ctr vs expectation for its position
      'ctr_opportunities', coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (
          SELECT keyword, clicks, impressions, round(ctr::numeric,4) ctr, round(position::numeric,1) position,
                 round((CASE
                    WHEN position <= 1 THEN 0.28 WHEN position <= 2 THEN 0.15 WHEN position <= 3 THEN 0.10
                    WHEN position <= 5 THEN 0.06 WHEN position <= 10 THEN 0.03 ELSE 0.01 END)::numeric,4) AS expected_ctr
          FROM q
          WHERE impressions >= 20
            AND ctr < (CASE
                    WHEN position <= 1 THEN 0.28 WHEN position <= 2 THEN 0.15 WHEN position <= 3 THEN 0.10
                    WHEN position <= 5 THEN 0.06 WHEN position <= 10 THEN 0.03 ELSE 0.01 END) * 0.6
          ORDER BY impressions DESC LIMIT 25) t),'[]'::jsonb),
      'top_pages', coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (
          SELECT page, clicks, impressions, round(ctr::numeric,4) ctr, round(position::numeric,1) position
          FROM pg ORDER BY clicks DESC LIMIT 25) t),'[]'::jsonb),
      'indexed_pages', (SELECT count(DISTINCT page) FROM pg WHERE impressions > 0)
    ) INTO v_sc;
  ELSE
    v_sc := jsonb_build_object('available', false);
  END IF;

  -- ---- Organic revenue per landing page -------------------
  WITH organic AS (
    SELECT at.landing_path AS page, oa.revenue
    FROM public.order_attributions oa
    JOIN public.attribution_touches at
      ON at.session_id = oa.session_id
    WHERE oa.order_created_at >= p_since
      AND at.landing_path IS NOT NULL
      AND (at.utm_medium IS NULL OR at.utm_medium IN ('organic','seo'))
      AND (at.referrer ILIKE '%google.%' OR at.referrer ILIKE '%bing.%'
           OR at.referrer ILIKE '%duckduckgo%' OR at.referrer ILIKE '%search%'
           OR at.utm_medium = 'organic')
  )
  SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.revenue DESC), '[]'::jsonb)
  INTO v_rev_pages
  FROM (
    SELECT page, round(sum(revenue)::numeric,2) AS revenue, count(*) AS orders
    FROM organic GROUP BY page ORDER BY sum(revenue) DESC LIMIT 50
  ) t;

  -- ---- Revenue per keyword (allocate page revenue by clicks share) ----
  IF v_snapshot IS NOT NULL THEN
    WITH organic AS (
      SELECT at.landing_path AS page, oa.revenue
      FROM public.order_attributions oa
      JOIN public.attribution_touches at ON at.session_id = oa.session_id
      WHERE oa.order_created_at >= p_since AND at.landing_path IS NOT NULL
        AND (at.referrer ILIKE '%google.%' OR at.referrer ILIKE '%bing.%' OR at.utm_medium = 'organic')
    ),
    page_rev AS (SELECT page, sum(revenue) revenue FROM organic GROUP BY page),
    pg_clicks AS (
      SELECT page, keyword, clicks FROM public.seo_search_console
      WHERE snapshot_date = v_snapshot AND dimension = 'query' AND page IS NOT NULL AND keyword IS NOT NULL
    ),
    pg_tot AS (SELECT page, sum(clicks) tot FROM pg_clicks GROUP BY page)
    SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY t.est_revenue DESC), '[]'::jsonb)
    INTO v_rev_kw
    FROM (
      SELECT pc.keyword,
             sum(pc.clicks) AS clicks,
             round(sum(pr.revenue * pc.clicks / NULLIF(pt.tot,0))::numeric, 2) AS est_revenue
      FROM pg_clicks pc
      JOIN pg_tot pt ON pt.page = pc.page
      JOIN page_rev pr ON pr.page = pc.page
      GROUP BY pc.keyword
      HAVING sum(pr.revenue * pc.clicks / NULLIF(pt.tot,0)) > 0
      ORDER BY est_revenue DESC LIMIT 50
    ) t;
  ELSE
    v_rev_kw := '[]'::jsonb;
  END IF;

  v_result := jsonb_build_object(
    'generated_at', now(),
    'since', p_since,
    'audit', v_audit,
    'metadata_summary', v_meta,
    'search_console', v_sc,
    'revenue_pages', v_rev_pages,
    'revenue_keywords', v_rev_kw
  );
  RETURN v_result;
END;
$$;

-- Lock down: only service_role may execute directly (P1-8 posture)
REVOKE ALL ON FUNCTION public.svc_seo_intelligence(timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.svc_seo_intelligence(timestamptz) TO service_role;