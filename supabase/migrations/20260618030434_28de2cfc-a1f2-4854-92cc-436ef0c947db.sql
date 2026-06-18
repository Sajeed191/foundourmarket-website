GRANT SELECT ON public.badge_settings TO anon;

DROP POLICY IF EXISTS "Public can read badge settings" ON public.badge_settings;
CREATE POLICY "Public can read badge settings"
ON public.badge_settings
FOR SELECT
TO anon, authenticated
USING (true);