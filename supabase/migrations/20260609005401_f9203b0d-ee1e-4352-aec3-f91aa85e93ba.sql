-- 1. analytics_events: enforce ownership on insert
DROP POLICY IF EXISTS "Anyone can insert analytics events" ON public.analytics_events;
CREATE POLICY "Insert own analytics events" ON public.analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 2. recommendation_events: enforce ownership on insert
DROP POLICY IF EXISTS "anyone insert rec events" ON public.recommendation_events;
CREATE POLICY "Insert own rec events" ON public.recommendation_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 3. visitor_sessions: enforce ownership on insert
DROP POLICY IF EXISTS "anyone insert visitor session" ON public.visitor_sessions;
CREATE POLICY "Insert own visitor session" ON public.visitor_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 4. newsletter_subscribers: allow a signed-in user to read their own record
CREATE POLICY "subscribers view own record" ON public.newsletter_subscribers
  FOR SELECT TO authenticated
  USING (email = auth.email());

-- 5. products_public view: drop operational orders_count column
DROP VIEW IF EXISTS public.products_public;
CREATE VIEW public.products_public AS
  SELECT id, slug, name, tagline, category, price, rating, reviews, image, description,
    in_stock, discount, sort_order, created_at, updated_at, featured, sku, stock_quantity,
    low_stock_threshold, reserved_quantity, views_count, price_inr, compare_price_inr,
    price_usd, compare_price_usd, india_visible, international_visible, warranty, status,
    shipping_fee_inr, shipping_fee_usd, razorpay_enabled, stripe_enabled, paypal_enabled,
    cod_enabled, return_eligible, replacement_eligible, return_window_days, pickup_supported,
    international_shipping, fragile, customs_info, restock_eta, preorder, scheduled_publish_at,
    scheduled_expiry_at, sold_count, wishlist_count, tags, features, meta_keywords, seo_title,
    seo_description, specifications, attributes, bestseller, trending, new_arrival, hot_deal,
    inventory_tracking, shipping_class, delivery_estimate, collection, homepage_section,
    flash_deal, staff_pick, recommended, homepage_hero, gift_idea, is_category_banner,
    hide_from_search, hide_from_recommendations, homepage_position, category_position,
    featured_until, related_products, cross_sell_products, upsell_products, premium,
    fast_selling, editors_choice, priority_score, collections, rating_source
  FROM public.products
  WHERE deleted_at IS NULL;
GRANT SELECT ON public.products_public TO anon, authenticated, service_role;

-- 6. promo_codes: stop broadcasting via Realtime (admin-only reads remain)
ALTER PUBLICATION supabase_realtime DROP TABLE public.promo_codes;