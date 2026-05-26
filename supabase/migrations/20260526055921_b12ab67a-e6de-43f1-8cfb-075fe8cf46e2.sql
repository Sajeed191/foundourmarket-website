REVOKE EXECUTE ON FUNCTION public.refresh_product_rating(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_review_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;