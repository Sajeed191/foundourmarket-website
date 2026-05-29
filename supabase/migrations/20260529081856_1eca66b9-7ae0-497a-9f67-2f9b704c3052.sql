-- 1. Extend orders with Razorpay references
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;

CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);

-- 2. Extend payments with Razorpay references
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS signature TEXT,
  ADD COLUMN IF NOT EXISTS fee NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gateway_tax NUMERIC NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON public.payments(razorpay_payment_id);

-- 3. Refunds table
CREATE TABLE IF NOT EXISTS public.refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  payment_id UUID,
  razorpay_refund_id TEXT,
  razorpay_payment_id TEXT,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  notes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own refunds select" ON public.refunds
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders o WHERE o.id = refunds.order_id AND o.user_id = auth.uid())
  );

CREATE POLICY "staff refunds select" ON public.refunds
  FOR SELECT USING (has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','support']::app_role[]));

CREATE POLICY "staff refunds insert" ON public.refunds
  FOR INSERT WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','super_admin','manager']::app_role[]));

CREATE POLICY "staff refunds update" ON public.refunds
  FOR UPDATE USING (has_any_role(auth.uid(), ARRAY['admin','super_admin','manager']::app_role[]));

CREATE TRIGGER refunds_set_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Webhook logs table
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  event TEXT NOT NULL,
  payload JSONB,
  signature_valid BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'received',
  error TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT ON public.webhook_logs TO authenticated;
GRANT ALL ON public.webhook_logs TO service_role;

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff webhook logs select" ON public.webhook_logs
  FOR SELECT USING (has_any_role(auth.uid(), ARRAY['admin','super_admin','manager']::app_role[]));

-- 5. Store settings (single row) for COD toggle + prepaid discount
CREATE TABLE IF NOT EXISTS public.store_settings (
  id BOOLEAN NOT NULL DEFAULT true PRIMARY KEY,
  cod_enabled BOOLEAN NOT NULL DEFAULT false,
  prepaid_discount_percent NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT store_settings_singleton CHECK (id = true)
);

GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT ALL ON public.store_settings TO service_role;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "store settings public read" ON public.store_settings
  FOR SELECT USING (true);

CREATE POLICY "admins update store settings" ON public.store_settings
  FOR UPDATE USING (has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));

CREATE POLICY "admins insert store settings" ON public.store_settings
  FOR INSERT WITH CHECK (has_any_role(auth.uid(), ARRAY['admin','super_admin']::app_role[]));

CREATE TRIGGER store_settings_set_updated_at
  BEFORE UPDATE ON public.store_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed the singleton settings row (COD off by default)
INSERT INTO public.store_settings (id, cod_enabled, prepaid_discount_percent)
VALUES (true, false, 0)
ON CONFLICT (id) DO NOTHING;

-- Enable realtime for payment-related tables
ALTER TABLE public.refunds REPLICA IDENTITY FULL;
ALTER TABLE public.payments REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.refunds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;