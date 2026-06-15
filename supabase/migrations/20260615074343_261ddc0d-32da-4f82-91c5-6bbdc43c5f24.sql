ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS return_id uuid,
  ADD COLUMN IF NOT EXISTS refund_id uuid,
  ADD COLUMN IF NOT EXISTS shipment_id uuid,
  ADD COLUMN IF NOT EXISTS dispute_id uuid,
  ADD COLUMN IF NOT EXISTS seller_id uuid,
  ADD COLUMN IF NOT EXISTS context jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_support_tickets_order ON public.support_tickets (order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_tickets_return ON public.support_tickets (return_id) WHERE return_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_support_tickets_refund ON public.support_tickets (refund_id) WHERE refund_id IS NOT NULL;