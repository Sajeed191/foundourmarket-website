CREATE OR REPLACE FUNCTION public.trending_products(page_limit integer DEFAULT 10)
RETURNS SETOF public.products
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH views AS (
    SELECT split_part(path, '/', 3) AS slug,
           count(*) FILTER (WHERE created_at > now() - interval '24 hours') AS v24,
           count(*) FILTER (WHERE created_at > now() - interval '7 days')  AS v7
    FROM public.page_views
    WHERE path LIKE '/products/%'
      AND created_at > now() - interval '7 days'
    GROUP BY 1
  ),
  carts AS (
    SELECT product_slug AS slug,
           sum(quantity) FILTER (WHERE created_at > now() - interval '7 days') AS c7
    FROM public.cart_items
    WHERE created_at > now() - interval '7 days'
    GROUP BY 1
  ),
  sales AS (
    SELECT product_slug AS slug,
           sum(quantity) FILTER (WHERE created_at > now() - interval '24 hours') AS s24,
           sum(quantity) FILTER (WHERE created_at > now() - interval '7 days')  AS s7
    FROM public.order_items
    WHERE created_at > now() - interval '7 days'
    GROUP BY 1
  ),
  scores AS (
    SELECT p.id,
      (COALESCE(v.v24,0) * 3.0 + COALESCE(v.v7,0) * 1.0
       + COALESCE(c.c7,0) * 5.0
       + COALESCE(s.s24,0) * 12.0 + COALESCE(s.s7,0) * 5.0) AS trend_score
    FROM public.products p
    LEFT JOIN views v ON v.slug = p.slug
    LEFT JOIN carts c ON c.slug = p.slug
    LEFT JOIN sales s ON s.slug = p.slug
    WHERE p.status = 'published'
      AND COALESCE(p.hide_from_search, false) = false
  )
  SELECT p.*
  FROM public.products p
  JOIN scores sc ON sc.id = p.id
  WHERE sc.trend_score > 0
  ORDER BY sc.trend_score DESC, p.sold_count DESC NULLS LAST, p.created_at DESC
  LIMIT page_limit;
$$;

GRANT EXECUTE ON FUNCTION public.trending_products(integer) TO anon, authenticated, service_role;