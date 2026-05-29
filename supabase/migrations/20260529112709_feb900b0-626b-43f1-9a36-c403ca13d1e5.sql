-- Allow users to delete their own notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='notifications' AND policyname='Users delete own notifications'
  ) THEN
    CREATE POLICY "Users delete own notifications"
      ON public.notifications FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- New preference categories + push (in-app) toggles
ALTER TABLE public.email_preferences
  ADD COLUMN IF NOT EXISTS payment_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS security_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_order_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_payment_updates boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS push_security_updates boolean NOT NULL DEFAULT true;

-- Notify on payment status change
CREATE OR REPLACE FUNCTION public.notify_payment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.user_id IS NOT NULL AND (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    INSERT INTO public.notifications(user_id, type, title, body, link, data)
    VALUES (NEW.user_id, 'payment',
            'Payment ' || NEW.payment_status,
            'Payment for order #' || substr(NEW.id::text,1,8) || ' is now ' || NEW.payment_status || '.',
            '/orders/' || NEW.id::text,
            jsonb_build_object('order_id', NEW.id, 'payment_status', NEW.payment_status, 'total', NEW.total, 'currency', NEW.currency));
  END IF;
  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS trg_notify_payment_status ON public.orders;
CREATE TRIGGER trg_notify_payment_status
  AFTER UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.notify_payment_status();

-- Notify on saved payment method changes (security)
CREATE OR REPLACE FUNCTION public.notify_payment_method_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id, type, title, body, link, data)
    VALUES (NEW.user_id, 'security',
            'New payment method added',
            'A payment method was added to your account. If this wasn''t you, review your account security.',
            '/account/payment-methods',
            jsonb_build_object('payment_method_id', NEW.id, 'event', 'added'));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.notifications(user_id, type, title, body, link, data)
    VALUES (OLD.user_id, 'security',
            'Payment method removed',
            'A payment method was removed from your account.',
            '/account/payment-methods',
            jsonb_build_object('payment_method_id', OLD.id, 'event', 'removed'));
    RETURN OLD;
  END IF;
  RETURN NULL;
END $function$;

DROP TRIGGER IF EXISTS trg_notify_pm_security_ins ON public.saved_payment_methods;
CREATE TRIGGER trg_notify_pm_security_ins
  AFTER INSERT ON public.saved_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.notify_payment_method_security();

DROP TRIGGER IF EXISTS trg_notify_pm_security_del ON public.saved_payment_methods;
CREATE TRIGGER trg_notify_pm_security_del
  AFTER DELETE ON public.saved_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.notify_payment_method_security();

-- Ensure realtime streaming for notifications
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

ALTER TABLE public.notifications REPLICA IDENTITY FULL;