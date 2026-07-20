
CREATE OR REPLACE FUNCTION public.submit_review(
  p_product_slug text,
  p_rating integer,
  p_title text DEFAULT NULL::text,
  p_body text DEFAULT NULL::text,
  p_media jsonb DEFAULT '[]'::jsonb
)
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
  -- NOTE: purchase gate removed. Any signed-in customer may submit a review.
  -- The BEFORE INSERT trigger `mark_review_verified` still tags real
  -- buyers with verified_purchase = true; non-buyers get FALSE automatically.
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
  VALUES (p_product_slug, v_uid, p_rating, NULLIF(btrim(p_title), ''), NULLIF(btrim(p_body), ''), COALESCE(p_media, '[]'::jsonb), false)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;
