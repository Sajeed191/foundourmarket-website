CREATE OR REPLACE FUNCTION public.notify_shipment_event()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _order_id uuid;
  _user_id uuid;
BEGIN
  SELECT s.order_id, o.user_id
    INTO _order_id, _user_id
  FROM public.shipments s
  LEFT JOIN public.orders o ON o.id = s.order_id
  WHERE s.id = NEW.shipment_id;

  IF _user_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, body, link, data)
    VALUES (_user_id, 'shipment',
            'Shipment update: ' || NEW.status,
            COALESCE(NEW.description, 'Your shipment status changed to ' || NEW.status),
            '/orders/' || _order_id::text,
            jsonb_build_object('shipment_id', NEW.shipment_id, 'status', NEW.status));
  END IF;

  IF _order_id IS NOT NULL THEN
    PERFORM public.notify_roles(
      ARRAY['admin','super_admin','manager','support','fulfillment','warehouse_staff']::app_role[],
      'ops_shipment',
      'Shipment ' || NEW.status,
      'Order #' || substr(_order_id::text,1,8) || ' shipment is now ' || NEW.status || '.',
      '/admin-shipments',
      jsonb_build_object('shipment_id', NEW.shipment_id, 'order_id', _order_id, 'status', NEW.status),
      'normal'
    );
  END IF;

  RETURN NEW;
END $function$;