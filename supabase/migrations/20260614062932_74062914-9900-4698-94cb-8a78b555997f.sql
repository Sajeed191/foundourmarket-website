CREATE OR REPLACE FUNCTION public.customer_restriction_message(
  _user_id uuid,
  _operation text
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p record;
BEGIN
  IF _user_id IS NULL THEN
    RETURN 'Not authenticated';
  END IF;

  SELECT account_status, ordering_blocked, reviews_disabled
    INTO p
  FROM public.profiles
  WHERE id = _user_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  IF p.account_status = 'suspended' THEN
    RETURN 'Your account is temporarily suspended. Please contact support.';
  ELSIF p.account_status IN ('banned', 'deleted') THEN
    RETURN 'Your account has been restricted. Contact support for assistance.';
  ELSIF _operation IN ('order', 'cart', 'checkout', 'payment') AND p.ordering_blocked IS TRUE THEN
    RETURN 'Ordering is currently disabled for your account. Please contact support.';
  ELSIF _operation = 'review' AND p.reviews_disabled IS TRUE THEN
    RETURN 'Review functionality is disabled for your account.';
  ELSIF _operation = 'wishlist' AND p.account_status IN ('suspended', 'banned', 'deleted') THEN
    RETURN 'Your account has been restricted. Contact support for assistance.';
  END IF;

  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.customer_restriction_message(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_restriction_message(uuid, text) TO service_role;

CREATE OR REPLACE FUNCTION public.enforce_customer_can_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  msg text;
BEGIN
  msg := public.customer_restriction_message(NEW.user_id, 'order');
  IF msg IS NOT NULL THEN
    RAISE EXCEPTION '%', msg USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_customer_can_order ON public.orders;
CREATE TRIGGER trg_enforce_customer_can_order
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.enforce_customer_can_order();

CREATE OR REPLACE FUNCTION public.enforce_customer_can_cart()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  owner_id uuid;
  msg text;
BEGIN
  SELECT c.user_id INTO owner_id FROM public.carts c WHERE c.id = NEW.cart_id;
  msg := public.customer_restriction_message(owner_id, 'cart');
  IF msg IS NOT NULL THEN
    RAISE EXCEPTION '%', msg USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_customer_can_cart ON public.cart_items;
CREATE TRIGGER trg_enforce_customer_can_cart
BEFORE INSERT OR UPDATE OF cart_id, quantity, saved_for_later ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.enforce_customer_can_cart();

CREATE OR REPLACE FUNCTION public.enforce_customer_can_wishlist()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  msg text;
BEGIN
  msg := public.customer_restriction_message(NEW.user_id, 'wishlist');
  IF msg IS NOT NULL THEN
    RAISE EXCEPTION '%', msg USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_customer_can_wishlist ON public.wishlist;
CREATE TRIGGER trg_enforce_customer_can_wishlist
BEFORE INSERT OR UPDATE OF user_id, product_slug ON public.wishlist
FOR EACH ROW
EXECUTE FUNCTION public.enforce_customer_can_wishlist();

CREATE OR REPLACE FUNCTION public.enforce_customer_can_review()
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
  IF actor IS NOT NULL THEN
    SELECT public.has_role(actor, 'admin')
        OR public.has_role(actor, 'super_admin')
        OR public.has_role(actor, 'manager')
        OR public.has_role(actor, 'support')
      INTO is_staff;
  END IF;

  IF is_staff THEN
    RETURN NEW;
  END IF;

  msg := public.customer_restriction_message(NEW.user_id, 'review');
  IF msg IS NOT NULL THEN
    RAISE EXCEPTION '%', msg USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_customer_can_review ON public.product_reviews;
CREATE TRIGGER trg_enforce_customer_can_review
BEFORE INSERT OR UPDATE OF rating, title, body, media ON public.product_reviews
FOR EACH ROW
EXECUTE FUNCTION public.enforce_customer_can_review();

CREATE OR REPLACE FUNCTION public.enforce_customer_can_review_vote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  msg text;
BEGIN
  msg := public.customer_restriction_message(NEW.user_id, 'review');
  IF msg IS NOT NULL THEN
    RAISE EXCEPTION '%', msg USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_customer_can_review_vote ON public.review_votes;
CREATE TRIGGER trg_enforce_customer_can_review_vote
BEFORE INSERT OR UPDATE OF user_id, vote ON public.review_votes
FOR EACH ROW
EXECUTE FUNCTION public.enforce_customer_can_review_vote();

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
  v_msg text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  v_msg := public.customer_restriction_message(v_uid, 'review');
  IF v_msg IS NOT NULL THEN
    RAISE EXCEPTION '%', v_msg USING ERRCODE = 'P0001';
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
  v_msg text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  v_msg := public.customer_restriction_message(v_uid, 'review');
  IF v_msg IS NOT NULL THEN
    RAISE EXCEPTION '%', v_msg USING ERRCODE = 'P0001';
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