-- =====================================================
-- Phase A: Address book, Save for later, Demo payments
-- All additive — no drops, no data loss
-- =====================================================

-- 1. ADDRESS BOOK ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text,
  full_name text NOT NULL,
  phone text,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text,
  postal text NOT NULL,
  country text NOT NULL,
  is_default_shipping boolean NOT NULL DEFAULT false,
  is_default_billing boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON public.addresses(user_id);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own addresses select" ON public.addresses;
CREATE POLICY "own addresses select" ON public.addresses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own addresses insert" ON public.addresses;
CREATE POLICY "own addresses insert" ON public.addresses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "own addresses update" ON public.addresses;
CREATE POLICY "own addresses update" ON public.addresses
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own addresses delete" ON public.addresses;
CREATE POLICY "own addresses delete" ON public.addresses
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS addresses_set_updated_at ON public.addresses;
CREATE TRIGGER addresses_set_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enforce a single default per kind per user
CREATE OR REPLACE FUNCTION public.enforce_single_default_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_default_shipping THEN
    UPDATE public.addresses
       SET is_default_shipping = false
     WHERE user_id = NEW.user_id
       AND id <> NEW.id
       AND is_default_shipping = true;
  END IF;
  IF NEW.is_default_billing THEN
    UPDATE public.addresses
       SET is_default_billing = false
     WHERE user_id = NEW.user_id
       AND id <> NEW.id
       AND is_default_billing = true;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS addresses_single_default ON public.addresses;
CREATE TRIGGER addresses_single_default
  AFTER INSERT OR UPDATE OF is_default_shipping, is_default_billing ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_default_address();

-- 2. SAVE FOR LATER -------------------------------------------------
ALTER TABLE public.cart_items
  ADD COLUMN IF NOT EXISTS saved_for_later boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_cart_items_cart_saved
  ON public.cart_items(cart_id, saved_for_later);

-- 3. DEMO PAYMENTS --------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text,
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  method text NOT NULL,            -- 'demo_card' | 'demo_upi' | 'demo_cod'
  status text NOT NULL,            -- 'succeeded' | 'failed' | 'pending'
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  transaction_id text NOT NULL,    -- fake demo id
  demo boolean NOT NULL DEFAULT true,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own payments select" ON public.payments;
CREATE POLICY "own payments select" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own payments insert" ON public.payments;
CREATE POLICY "own payments insert" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "admins view all payments" ON public.payments;
CREATE POLICY "admins view all payments" ON public.payments
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
