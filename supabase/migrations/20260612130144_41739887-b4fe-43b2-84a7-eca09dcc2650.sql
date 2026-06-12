CREATE OR REPLACE FUNCTION public.notify_return_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  msg text;
  ref text;
BEGIN
  -- Only act when a meaningful status field actually changes
  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.refund_status IS DISTINCT FROM OLD.refund_status
     OR NEW.replacement_status IS DISTINCT FROM OLD.replacement_status THEN

    ref := 'FOM-' || upper(substr(NEW.id::text, 1, 8));

    IF NEW.status IS DISTINCT FROM OLD.status THEN
      msg := 'Your return ' || ref || ' is now "' || COALESCE(NEW.status, 'updated') || '".';
    ELSIF NEW.refund_status IS DISTINCT FROM OLD.refund_status THEN
      msg := 'Refund status for return ' || ref || ' is now "' || COALESCE(NEW.refund_status, 'updated') || '".';
    ELSE
      msg := 'Replacement status for return ' || ref || ' is now "' || COALESCE(NEW.replacement_status, 'updated') || '".';
    END IF;

    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (
      NEW.user_id,
      'return',
      'Return status updated',
      msg,
      '/account/returns',
      jsonb_build_object(
        'return_id', NEW.id,
        'status', NEW.status,
        'refund_status', NEW.refund_status,
        'replacement_status', NEW.replacement_status,
        'changed_at', now()
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_return_status_change ON public.returns;
CREATE TRIGGER trg_notify_return_status_change
AFTER UPDATE ON public.returns
FOR EACH ROW
EXECUTE FUNCTION public.notify_return_status_change();