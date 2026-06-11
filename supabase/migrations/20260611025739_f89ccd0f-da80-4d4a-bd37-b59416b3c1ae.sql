-- Remove unrestricted owner write policies (they allowed setting moderation columns)
DROP POLICY IF EXISTS "own review insert" ON public.product_reviews;
DROP POLICY IF EXISTS "own review update" ON public.product_reviews;

-- Secure submit: only safe, user-editable fields are accepted.
CREATE OR REPLACE FUNCTION public.submit_review(
  p_product_slug text,
  p_rating integer,
  p_title text DEFAULT NULL,
  p_body text DEFAULT NULL,
  p_media jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
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

  INSERT INTO public.product_reviews (product_slug, user_id, rating, title, body, media)
  VALUES (p_product_slug, v_uid, p_rating, NULLIF(btrim(p_title), ''), NULLIF(btrim(p_body), ''), COALESCE(p_media, '[]'::jsonb))
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Secure edit: author can only change rating/title/body/media on their own review.
CREATE OR REPLACE FUNCTION public.update_own_review(
  p_id uuid,
  p_rating integer,
  p_title text DEFAULT NULL,
  p_body text DEFAULT NULL,
  p_media jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be between 1 and 5';
  END IF;
  IF p_title IS NOT NULL AND length(p_title) > 200 THEN
    RAISE EXCEPTION 'Title too long';
  END IF;
  IF p_body IS NOT NULL AND length(p_body) > 5000 THEN
    RAISE EXCEPTION 'Body too long';
  END IF;

  UPDATE public.product_reviews
  SET rating = p_rating,
      title = NULLIF(btrim(p_title), ''),
      body = NULLIF(btrim(p_body), ''),
      media = CASE WHEN p_media IS NULL THEN media ELSE p_media END,
      updated_at = now()
  WHERE id = p_id AND user_id = v_uid;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Review not found';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_review(text, integer, text, text, jsonb) FROM public, anon;
REVOKE ALL ON FUNCTION public.update_own_review(uuid, integer, text, text, jsonb) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.submit_review(text, integer, text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_own_review(uuid, integer, text, text, jsonb) TO authenticated;