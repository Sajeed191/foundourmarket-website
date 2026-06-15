-- 1. Soft-delete columns
ALTER TABLE public.product_reviews ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.product_questions ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

-- 2. Purchase verification helper: user has a delivered/completed order containing this product
CREATE OR REPLACE FUNCTION public.can_review_product(_slug text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.order_items oi ON oi.order_id = o.id
    WHERE o.user_id = auth.uid()
      AND oi.product_slug = _slug
      AND o.status IN ('delivered', 'completed')
  )
$$;

-- 3. submit_review now requires a verified purchase and stamps verified_purchase
CREATE OR REPLACE FUNCTION public.submit_review(p_product_slug text, p_rating integer, p_title text DEFAULT NULL::text, p_body text DEFAULT NULL::text, p_media jsonb DEFAULT '[]'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
  v_msg text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  v_msg := public.customer_restriction_message(v_uid, 'review');
  IF v_msg IS NOT NULL THEN
    RAISE EXCEPTION '%', v_msg USING ERRCODE = 'P0001';
  END IF;
  IF NOT public.can_review_product(p_product_slug) THEN
    RAISE EXCEPTION 'Only verified purchasers can review this product.' USING ERRCODE = 'P0001';
  END IF;
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  IF p_product_slug IS NULL OR length(p_product_slug) = 0 OR length(p_product_slug) > 200 THEN
    RAISE EXCEPTION 'Invalid product';
  END IF;
  IF p_title IS NOT NULL AND length(p_title) > 200 THEN
    RAISE EXCEPTION 'Title too long';
  END IF;
  IF p_body IS NOT NULL AND length(p_body) > 5000 THEN
    RAISE EXCEPTION 'Body too long';
  END IF;

  INSERT INTO public.product_reviews (product_slug, user_id, rating, title, body, media, verified_purchase)
  VALUES (p_product_slug, v_uid, p_rating, NULLIF(btrim(p_title), ''), NULLIF(btrim(p_body), ''), COALESCE(p_media, '[]'::jsonb), true)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

-- 4. Soft-delete own review (owner or staff)
CREATE OR REPLACE FUNCTION public.soft_delete_own_review(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.product_reviews
  SET deleted_at = now(), status = 'hidden', updated_at = now()
  WHERE id = p_id
    AND (user_id = v_uid OR public.has_any_role(v_uid, ARRAY['admin','super_admin','manager','support']::app_role[]));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found';
  END IF;
END;
$function$;

-- 5. Soft-delete own question (owner or staff)
CREATE OR REPLACE FUNCTION public.soft_delete_own_question(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  UPDATE public.product_questions
  SET deleted_at = now(), updated_at = now()
  WHERE id = p_id
    AND (user_id = v_uid OR public.has_any_role(v_uid, ARRAY['admin','super_admin','manager','support']::app_role[]));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Question not found';
  END IF;
END;
$function$;

-- 6. Exclude soft-deleted reviews from the public view
CREATE OR REPLACE VIEW public.product_reviews_public AS
  SELECT id, product_slug, user_id, rating, title, body, media, status, pinned, featured,
         verified_purchase, helpful_count, not_helpful_count, admin_reply, admin_reply_at,
         created_at, updated_at
  FROM public.product_reviews
  WHERE status = 'published'::text AND deleted_at IS NULL;

-- 7. Exclude soft-deleted questions from the feed
CREATE OR REPLACE FUNCTION public.get_product_questions(_slug text)
RETURNS TABLE(id uuid, product_slug text, question text, answer text, answered_at timestamp with time zone, created_at timestamp with time zone, is_mine boolean, author_name text, author_avatar text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  select
    q.id,
    q.product_slug,
    q.question,
    q.answer,
    q.answered_at,
    q.created_at,
    (auth.uid() = q.user_id) as is_mine,
    p.full_name  as author_name,
    p.avatar_url as author_avatar
  from public.product_questions q
  left join public.profiles p on p.id = q.user_id
  where q.product_slug = _slug
    and q.deleted_at is null
  order by q.created_at desc
$function$;

GRANT EXECUTE ON FUNCTION public.can_review_product(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.soft_delete_own_review(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.soft_delete_own_question(uuid) TO authenticated;