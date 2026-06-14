-- Create a staff-detection helper
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','super_admin','manager','support')
  );
$$;

-- Recreate the own-profile update policy with a WITH CHECK that prevents
-- non-staff users from modifying admin/lifecycle-controlled columns.
DROP POLICY IF EXISTS "own profile update" ON public.profiles;

CREATE POLICY "own profile update" ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND (
    public.is_staff(auth.uid())
    OR (
      account_status     IS NOT DISTINCT FROM (SELECT p.account_status     FROM public.profiles p WHERE p.id = auth.uid())
      AND ordering_blocked   IS NOT DISTINCT FROM (SELECT p.ordering_blocked   FROM public.profiles p WHERE p.id = auth.uid())
      AND reviews_disabled   IS NOT DISTINCT FROM (SELECT p.reviews_disabled   FROM public.profiles p WHERE p.id = auth.uid())
      AND tier_override      IS NOT DISTINCT FROM (SELECT p.tier_override      FROM public.profiles p WHERE p.id = auth.uid())
      AND ban_reason         IS NOT DISTINCT FROM (SELECT p.ban_reason         FROM public.profiles p WHERE p.id = auth.uid())
      AND banned_by          IS NOT DISTINCT FROM (SELECT p.banned_by          FROM public.profiles p WHERE p.id = auth.uid())
      AND banned_at          IS NOT DISTINCT FROM (SELECT p.banned_at          FROM public.profiles p WHERE p.id = auth.uid())
      AND suspended_at       IS NOT DISTINCT FROM (SELECT p.suspended_at       FROM public.profiles p WHERE p.id = auth.uid())
      AND suspended_by       IS NOT DISTINCT FROM (SELECT p.suspended_by       FROM public.profiles p WHERE p.id = auth.uid())
      AND region_locked_at   IS NOT DISTINCT FROM (SELECT p.region_locked_at   FROM public.profiles p WHERE p.id = auth.uid())
      AND market_region      IS NOT DISTINCT FROM (SELECT p.market_region      FROM public.profiles p WHERE p.id = auth.uid())
    )
  )
);

GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated, service_role;