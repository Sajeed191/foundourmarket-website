
-- 1. Products: add reserved_quantity
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS reserved_quantity integer NOT NULL DEFAULT 0;

-- 2. Orders: add fulfillment quick-lookup fields
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'unfulfilled',
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS carrier text;

-- 3. inventory_logs
CREATE TABLE IF NOT EXISTS public.inventory_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL,
  variant_id uuid,
  change integer NOT NULL,
  reason text NOT NULL,
  reference_id uuid,
  reference_type text,
  actor_id uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins view inventory logs" ON public.inventory_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins insert inventory logs" ON public.inventory_logs
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. shipping_zones
CREATE TABLE IF NOT EXISTS public.shipping_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  countries text[] NOT NULL DEFAULT '{}',
  base_rate numeric NOT NULL DEFAULT 0,
  free_threshold numeric,
  estimated_days_min integer NOT NULL DEFAULT 3,
  estimated_days_max integer NOT NULL DEFAULT 7,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shipping_zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "zones viewable by everyone" ON public.shipping_zones
  FOR SELECT USING (active = true);
CREATE POLICY "admins manage zones select" ON public.shipping_zones
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins manage zones insert" ON public.shipping_zones
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins manage zones update" ON public.shipping_zones
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins manage zones delete" ON public.shipping_zones
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER shipping_zones_updated BEFORE UPDATE ON public.shipping_zones
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. shipments
CREATE TABLE IF NOT EXISTS public.shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  carrier text,
  tracking_number text,
  tracking_url text,
  status text NOT NULL DEFAULT 'pending',
  shipped_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own shipments select" ON public.shipments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins shipments select" ON public.shipments
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins shipments insert" ON public.shipments
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins shipments update" ON public.shipments
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins shipments delete" ON public.shipments
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER shipments_updated BEFORE UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_shipments_order ON public.shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_user ON public.shipments(user_id);

-- 6. shipment_events
CREATE TABLE IF NOT EXISTS public.shipment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id uuid NOT NULL,
  status text NOT NULL,
  description text,
  location text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.shipment_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own shipment events select" ON public.shipment_events
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.shipments s WHERE s.id = shipment_events.shipment_id AND s.user_id = auth.uid()));
CREATE POLICY "admins shipment events select" ON public.shipment_events
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins shipment events insert" ON public.shipment_events
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_shipment_events_shipment ON public.shipment_events(shipment_id);

-- 7. returns
CREATE TABLE IF NOT EXISTS public.returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL,
  user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'requested',
  reason text NOT NULL,
  notes text,
  refund_amount numeric NOT NULL DEFAULT 0,
  refund_status text NOT NULL DEFAULT 'pending',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own returns select" ON public.returns
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own returns insert" ON public.returns
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins returns select" ON public.returns
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins returns update" ON public.returns
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins returns delete" ON public.returns
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER returns_updated BEFORE UPDATE ON public.returns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX IF NOT EXISTS idx_returns_order ON public.returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_user ON public.returns(user_id);

-- 8. return_items
CREATE TABLE IF NOT EXISTS public.return_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id uuid NOT NULL,
  order_item_id uuid NOT NULL,
  product_slug text NOT NULL,
  quantity integer NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own return items select" ON public.return_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.returns r WHERE r.id = return_items.return_id AND r.user_id = auth.uid()));
CREATE POLICY "own return items insert" ON public.return_items
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.returns r WHERE r.id = return_items.return_id AND r.user_id = auth.uid()));
CREATE POLICY "admins return items select" ON public.return_items
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins return items update" ON public.return_items
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "admins return items delete" ON public.return_items
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX IF NOT EXISTS idx_return_items_return ON public.return_items(return_id);

-- 9. Trigger: log inventory on order item insert (alongside existing stock decrement)
CREATE OR REPLACE FUNCTION public.log_inventory_on_order_item()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.inventory_logs (product_slug, change, reason, reference_id, reference_type)
  VALUES (NEW.product_slug, -NEW.quantity, 'order', NEW.order_id, 'order');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_log_inventory_on_order_item ON public.order_items;
CREATE TRIGGER trg_log_inventory_on_order_item
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.log_inventory_on_order_item();

-- 10. Trigger: restore stock when return marked completed
CREATE OR REPLACE FUNCTION public.restore_stock_on_return_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item record;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    FOR item IN SELECT product_slug, quantity FROM public.return_items WHERE return_id = NEW.id LOOP
      UPDATE public.products
        SET stock_quantity = stock_quantity + item.quantity,
            in_stock = true
        WHERE slug = item.product_slug;
      INSERT INTO public.inventory_logs (product_slug, change, reason, reference_id, reference_type)
      VALUES (item.product_slug, item.quantity, 'return', NEW.id, 'return');
    END LOOP;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_restore_stock_on_return_complete ON public.returns;
CREATE TRIGGER trg_restore_stock_on_return_complete
  AFTER UPDATE ON public.returns
  FOR EACH ROW EXECUTE FUNCTION public.restore_stock_on_return_complete();

-- 11. Sync orders.fulfillment_status + tracking from shipment changes
CREATE OR REPLACE FUNCTION public.sync_order_fulfillment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.orders
    SET fulfillment_status = NEW.status,
        tracking_number = COALESCE(NEW.tracking_number, tracking_number),
        carrier = COALESCE(NEW.carrier, carrier)
    WHERE id = NEW.order_id;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_sync_order_fulfillment ON public.shipments;
CREATE TRIGGER trg_sync_order_fulfillment
  AFTER INSERT OR UPDATE ON public.shipments
  FOR EACH ROW EXECUTE FUNCTION public.sync_order_fulfillment();

-- 12. Seed default shipping zones
INSERT INTO public.shipping_zones (name, countries, base_rate, free_threshold, estimated_days_min, estimated_days_max, sort_order)
VALUES
  ('Domestic', ARRAY['US'], 5.99, 50, 2, 5, 1),
  ('International', ARRAY['CA','GB','AU','DE','FR','IN'], 14.99, 150, 7, 14, 2)
ON CONFLICT DO NOTHING;
