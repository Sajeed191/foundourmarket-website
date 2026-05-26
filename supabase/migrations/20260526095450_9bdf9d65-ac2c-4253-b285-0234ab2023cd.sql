
-- 1) Fix SECURITY DEFINER views by recreating with security_invoker
ALTER VIEW public.trending_products SET (security_invoker = on);
ALTER VIEW public.frequently_bought_together SET (security_invoker = on);

-- 2) Tighten visitor_sessions UPDATE policy (was USING true)
DROP POLICY IF EXISTS "anyone update own visitor session" ON public.visitor_sessions;
CREATE POLICY "own visitor session update"
  ON public.visitor_sessions
  FOR UPDATE
  USING (user_id IS NOT DISTINCT FROM auth.uid())
  WITH CHECK (user_id IS NOT DISTINCT FROM auth.uid());

-- 3) Lock down SECURITY DEFINER functions that are only used by triggers or RLS
-- Revoke from PUBLIC/anon/authenticated; keep ownership for triggers/RLS evaluation
DO $$
DECLARE fn text;
BEGIN
  FOR fn IN
    SELECT 'public.'||p.proname||'('||pg_get_function_identity_arguments(p.oid)||')'
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef
      AND p.proname NOT IN ('search_products','get_fbt','manage_user_role')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
  END LOOP;
END $$;

-- Ensure intended RPCs remain callable
GRANT EXECUTE ON FUNCTION public.search_products(text, text, numeric, numeric, numeric, text, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_fbt(text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.manage_user_role(uuid, app_role, boolean, text) TO authenticated;

-- 4) Storage: restrict product-images bucket to individual object reads (no listing)
-- Drop overly-broad existing policies and recreate per-object reads + admin writes.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND (qual LIKE '%product-images%' OR with_check LIKE '%product-images%')
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "product-images public read by name"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images' AND name IS NOT NULL);

CREATE POLICY "product-images admin insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "product-images admin update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'::app_role));

CREATE POLICY "product-images admin delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'::app_role));
