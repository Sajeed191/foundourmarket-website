DROP POLICY IF EXISTS "categories are viewable by everyone" ON public.categories;

CREATE POLICY "published categories viewable by everyone"
ON public.categories
FOR SELECT
USING (status = 'published');

CREATE POLICY "staff can view all categories"
ON public.categories
FOR SELECT
USING (public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','editor']::app_role[]));