-- 1. Extend products with admin OS fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS cost_price_inr numeric,
  ADD COLUMN IF NOT EXISTS cost_price_usd numeric,
  ADD COLUMN IF NOT EXISTS shipping_fee_inr numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_fee_usd numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS razorpay_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS stripe_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS paypal_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS cod_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS return_eligible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS replacement_eligible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS return_window_days integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS pickup_supported boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS international_shipping boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS fragile boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS customs_info text,
  ADD COLUMN IF NOT EXISTS barcode text,
  ADD COLUMN IF NOT EXISTS warehouse_location text,
  ADD COLUMN IF NOT EXISTS restock_eta text,
  ADD COLUMN IF NOT EXISTS preorder boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_expiry_at timestamptz;

-- Validate status values via trigger (CHECK avoided per guidelines)
CREATE OR REPLACE FUNCTION public.validate_product_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('draft','published','hidden','archived','scheduled','preorder','out_of_stock') THEN
    RAISE EXCEPTION 'invalid product status: %', NEW.status;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_validate_product_status ON public.products;
CREATE TRIGGER trg_validate_product_status
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.validate_product_status();

-- 2. Version history table
CREATE TABLE IF NOT EXISTS public.product_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_slug text NOT NULL,
  snapshot jsonb NOT NULL,
  edited_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_versions_slug ON public.product_versions (product_slug, created_at DESC);

GRANT SELECT, INSERT ON public.product_versions TO authenticated;
GRANT ALL ON public.product_versions TO service_role;

ALTER TABLE public.product_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can read product versions" ON public.product_versions;
CREATE POLICY "Staff can read product versions"
ON public.product_versions
FOR SELECT
TO authenticated
USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));

DROP POLICY IF EXISTS "Staff can insert product versions" ON public.product_versions;
CREATE POLICY "Staff can insert product versions"
ON public.product_versions
FOR INSERT
TO authenticated
WITH CHECK (public.has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));

-- 3. Auto-snapshot a product version on every meaningful change
CREATE OR REPLACE FUNCTION public.snapshot_product_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.product_versions (product_slug, snapshot, edited_by)
  VALUES (OLD.slug, to_jsonb(OLD), auth.uid());
  -- keep only the latest 30 versions per product
  DELETE FROM public.product_versions
  WHERE id IN (
    SELECT id FROM public.product_versions
    WHERE product_slug = OLD.slug
    ORDER BY created_at DESC
    OFFSET 30
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_snapshot_product_version ON public.products;
CREATE TRIGGER trg_snapshot_product_version
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.snapshot_product_version();