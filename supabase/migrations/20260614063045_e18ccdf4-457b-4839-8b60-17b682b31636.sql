ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS message_id text;

CREATE INDEX IF NOT EXISTS idx_email_logs_message_id ON public.email_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_created ON public.email_logs(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.enforce_customer_can_update_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  msg text;
  actor uuid := auth.uid();
  is_staff boolean := false;
BEGIN
  IF actor IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT public.has_role(actor, 'admin')
      OR public.has_role(actor, 'super_admin')
      OR public.has_role(actor, 'manager')
      OR public.has_role(actor, 'support')
    INTO is_staff;

  IF is_staff THEN
    RETURN NEW;
  END IF;

  IF NEW.id = actor THEN
    msg := public.customer_restriction_message(NEW.id, 'account');
    IF msg IS NOT NULL THEN
      RAISE EXCEPTION '%', msg USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_customer_can_update_profile ON public.profiles;
CREATE TRIGGER trg_enforce_customer_can_update_profile
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_customer_can_update_profile();

CREATE OR REPLACE FUNCTION public.enforce_customer_can_update_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user uuid;
  msg text;
  actor uuid := auth.uid();
  is_staff boolean := false;
BEGIN
  IF actor IS NOT NULL THEN
    SELECT public.has_role(actor, 'admin')
        OR public.has_role(actor, 'super_admin')
        OR public.has_role(actor, 'manager')
        OR public.has_role(actor, 'support')
      INTO is_staff;
  END IF;

  IF is_staff THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  target_user := COALESCE(NEW.user_id, OLD.user_id);
  msg := public.customer_restriction_message(target_user, 'account');
  IF msg IS NOT NULL THEN
    RAISE EXCEPTION '%', msg USING ERRCODE = 'P0001';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_customer_can_update_address ON public.addresses;
CREATE TRIGGER trg_enforce_customer_can_update_address
BEFORE INSERT OR UPDATE OR DELETE ON public.addresses
FOR EACH ROW
EXECUTE FUNCTION public.enforce_customer_can_update_address();