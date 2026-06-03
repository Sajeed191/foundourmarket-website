
-- ============================================================
-- PAYMENT GATEWAYS: hide infrastructure flags from public
-- ============================================================
DROP POLICY IF EXISTS "payment gateways public read" ON public.payment_gateways;

CREATE POLICY "staff read payment gateways"
ON public.payment_gateways
FOR SELECT
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role,'manager'::app_role]));

CREATE OR REPLACE VIEW public.payment_gateways_public AS
  SELECT provider, display_name, enabled, mode, supports_region,
         configured, last_checked_at, updated_at
  FROM public.payment_gateways;

GRANT SELECT ON public.payment_gateways_public TO anon, authenticated;

-- ============================================================
-- STORE SETTINGS: hide staff WhatsApp numbers from anonymous users
-- ============================================================
DROP POLICY IF EXISTS "store settings public read" ON public.store_settings;

-- Signed-in users (incl. staff) can read the full row (needed for WhatsApp numbers)
CREATE POLICY "authenticated read store settings"
ON public.store_settings
FOR SELECT
TO authenticated
USING (true);

-- Public/anon view excludes support_whatsapp_numbers
CREATE OR REPLACE VIEW public.store_settings_public AS
  SELECT id, cod_enabled, prepaid_discount_percent, include_seed_in_analytics,
         shipping_mode, free_shipping_enabled, flat_shipping_inr, flat_shipping_usd,
         free_shipping_threshold_inr, free_shipping_threshold_usd,
         support_status, support_response_minutes, updated_at
  FROM public.store_settings;

GRANT SELECT ON public.store_settings_public TO anon, authenticated;
