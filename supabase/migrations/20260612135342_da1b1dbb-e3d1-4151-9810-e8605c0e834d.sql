CREATE OR REPLACE FUNCTION public.ensure_shipment_for_fulfilled_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_status text;
  target_step integer;
  new_shipment_id uuid;
  event_time timestamptz := COALESCE(NEW.updated_at, now());
BEGIN
  IF public.order_lifecycle_step(NEW.status) >= public.order_lifecycle_step(NEW.fulfillment_status) THEN
    target_status := lower(COALESCE(NEW.status, ''));
  ELSE
    target_status := lower(COALESCE(NEW.fulfillment_status, ''));
  END IF;

  IF target_status = 'completed' THEN
    target_status := 'delivered';
  END IF;

  target_step := public.order_lifecycle_step(target_status);

  IF target_step < public.order_lifecycle_step('packed') THEN
    RETURN NEW;
  END IF;

  IF target_status IN ('cancelled', 'canceled') THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.shipments WHERE order_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.shipments (
    order_id,
    user_id,
    carrier,
    tracking_number,
    status,
    packed_at,
    shipped_at,
    delivered_at,
    actual_delivery,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.user_id,
    NEW.carrier,
    NEW.tracking_number,
    CASE
      WHEN target_status IN ('packed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered') THEN target_status
      ELSE 'packed'
    END,
    CASE WHEN target_step >= public.order_lifecycle_step('packed') THEN event_time ELSE NULL END,
    CASE WHEN target_step >= public.order_lifecycle_step('shipped') THEN COALESCE(NEW.fulfilled_at, event_time) ELSE NULL END,
    CASE WHEN target_step >= public.order_lifecycle_step('delivered') THEN COALESCE(NEW.fulfilled_at, event_time) ELSE NULL END,
    CASE WHEN target_step >= public.order_lifecycle_step('delivered') THEN COALESCE(NEW.fulfilled_at, event_time) ELSE NULL END,
    NEW.created_at,
    now()
  )
  RETURNING id INTO new_shipment_id;

  INSERT INTO public.shipment_events (
    shipment_id,
    status,
    description,
    occurred_at,
    source,
    courier
  ) VALUES (
    new_shipment_id,
    CASE
      WHEN target_status IN ('packed', 'shipped', 'in_transit', 'out_for_delivery', 'delivered') THEN target_status
      ELSE 'packed'
    END,
    'Shipment record created automatically from order status',
    event_time,
    'system',
    NEW.carrier
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ensure_shipment_for_fulfilled_order ON public.orders;
CREATE TRIGGER trg_ensure_shipment_for_fulfilled_order
  AFTER INSERT OR UPDATE OF status, fulfillment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_shipment_for_fulfilled_order();