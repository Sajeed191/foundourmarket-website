
ALTER TABLE public.banners
  ADD COLUMN IF NOT EXISTS width_px integer,
  ADD COLUMN IF NOT EXISTS height_px integer;

INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read banners" ON storage.objects;
CREATE POLICY "Public read banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'banners');

DROP POLICY IF EXISTS "Editors upload banners" ON storage.objects;
CREATE POLICY "Editors upload banners"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'banners'
    AND public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','editor']::app_role[])
  );

DROP POLICY IF EXISTS "Editors update banners" ON storage.objects;
CREATE POLICY "Editors update banners"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'banners'
    AND public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','editor']::app_role[])
  );

DROP POLICY IF EXISTS "Editors delete banners" ON storage.objects;
CREATE POLICY "Editors delete banners"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'banners'
    AND public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','editor']::app_role[])
  );
