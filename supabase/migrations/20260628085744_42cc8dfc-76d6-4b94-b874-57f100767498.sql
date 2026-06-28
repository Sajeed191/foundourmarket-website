-- 1. Remove the unnecessary public anon/authenticated read policy on product_questions.
-- Public reads flow through the SECURITY DEFINER function get_product_questions,
-- which omits user_id. Staff and owner policies remain intact.
DROP POLICY IF EXISTS "public read published questions" ON public.product_questions;

-- 2. Ensure the public-safe store settings view is reachable by the storefront.
GRANT SELECT ON public.store_settings_public TO anon, authenticated;