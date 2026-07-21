
-- 1. New columns to track deletion authorship
ALTER TABLE public.product_reviews
  ADD COLUMN IF NOT EXISTS deleted_by uuid,
  ADD COLUMN IF NOT EXISTS deleted_reason text;

-- 2. Allow 'deleted' status
CREATE OR REPLACE FUNCTION public.validate_review_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('published','pending','hidden','rejected','deleted') THEN
    RAISE EXCEPTION 'invalid review status: %', NEW.status;
  END IF;
  IF NEW.sentiment IS NOT NULL AND NEW.sentiment NOT IN ('positive','neutral','negative','mixed') THEN
    RAISE EXCEPTION 'invalid sentiment: %', NEW.sentiment;
  END IF;
  RETURN NEW;
END $$;

-- 3. Customer soft delete → status = 'deleted', track author
CREATE OR REPLACE FUNCTION public.soft_delete_own_review(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.product_reviews
     SET deleted_at = now(),
         status = 'deleted',
         deleted_by = v_uid,
         updated_at = now()
   WHERE id = p_id
     AND (user_id = v_uid
          OR public.has_any_role(v_uid, ARRAY['admin','super_admin','manager','support']::app_role[]));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found';
  END IF;
END $$;

-- 4. Admin soft delete with optional reason
CREATE OR REPLACE FUNCTION public.admin_soft_delete_review(p_id uuid, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL
     OR NOT public.has_any_role(v_uid, ARRAY['admin','super_admin','manager','support']::app_role[]) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  UPDATE public.product_reviews
     SET deleted_at = now(),
         status = 'deleted',
         deleted_by = v_uid,
         deleted_reason = p_reason,
         updated_at = now()
   WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found';
  END IF;
END $$;

-- 5. Admin restore
CREATE OR REPLACE FUNCTION public.admin_restore_review(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL
     OR NOT public.has_any_role(v_uid, ARRAY['admin','super_admin','manager','support']::app_role[]) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  UPDATE public.product_reviews
     SET deleted_at = NULL,
         status = 'published',
         deleted_by = NULL,
         deleted_reason = NULL,
         updated_at = now()
   WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found';
  END IF;
END $$;

-- 6. Admin permanent delete (removes row + cascades to votes/reports)
CREATE OR REPLACE FUNCTION public.admin_hard_delete_review(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL
     OR NOT public.has_any_role(v_uid, ARRAY['admin','super_admin']::app_role[]) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;
  DELETE FROM public.product_reviews WHERE id = p_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found';
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.admin_soft_delete_review(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_restore_review(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_hard_delete_review(uuid) TO authenticated;
