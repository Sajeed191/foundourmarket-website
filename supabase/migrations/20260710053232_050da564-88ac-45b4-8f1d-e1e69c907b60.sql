-- Close privilege-escalation vector: the "own profile insert" policy only checks
-- auth.uid() = id and the existing guard_profile_admin_fields_trg is BEFORE UPDATE
-- only. A user creating their own profile row could set privileged admin/lifecycle
-- fields to arbitrary values. This BEFORE INSERT guard forces those fields back to
-- safe defaults for non-staff, non-service contexts. Region fields are intentionally
-- left to enforce_region_lock().

CREATE OR REPLACE FUNCTION public.guard_profile_admin_fields_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  is_staff boolean;
BEGIN
  is_staff := public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'manager')
    OR public.has_role(auth.uid(), 'support');

  -- service_role / unauthenticated server contexts (no auth.uid) bypass this guard
  IF auth.uid() IS NULL OR is_staff THEN
    RETURN NEW;
  END IF;

  -- Non-staff users may not set administrative / lifecycle fields at creation.
  -- Force each back to its safe default. (market_region / region_locked_at are
  -- handled by enforce_region_lock and are intentionally not touched here.)
  NEW.account_status   := 'active';
  NEW.banned_at        := NULL;
  NEW.ban_reason       := NULL;
  NEW.banned_by        := NULL;
  NEW.suspended_at     := NULL;
  NEW.suspended_by     := NULL;
  NEW.ordering_blocked := false;
  NEW.reviews_disabled := false;
  NEW.tier_override    := NULL;
  NEW.deleted_at       := NULL;
  NEW.deleted_by       := NULL;
  NEW.is_seeded        := false;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS guard_profile_admin_fields_insert_trg ON public.profiles;
CREATE TRIGGER guard_profile_admin_fields_insert_trg
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_admin_fields_insert();