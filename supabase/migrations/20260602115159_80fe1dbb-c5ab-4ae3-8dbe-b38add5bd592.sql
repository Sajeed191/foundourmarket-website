-- 1. product_reviews: stop anonymous users from reading moderation / anti-fraud / sentiment internals.
-- Authenticated users (incl. admins) keep full access; RLS still restricts rows.
REVOKE SELECT ON public.product_reviews FROM anon;
GRANT SELECT (
  id, product_slug, user_id, rating, title, body, media, status,
  pinned, featured, verified_purchase, helpful_count, not_helpful_count,
  admin_reply, admin_reply_at, created_at
) ON public.product_reviews TO anon;

-- 2. promo_codes: remove public visibility of campaign/usage metadata.
-- Coupon validation runs server-side via service role (applyCoupon), so storefront is unaffected.
DROP POLICY IF EXISTS "active promo codes viewable by everyone" ON public.promo_codes;
REVOKE SELECT ON public.promo_codes FROM anon;