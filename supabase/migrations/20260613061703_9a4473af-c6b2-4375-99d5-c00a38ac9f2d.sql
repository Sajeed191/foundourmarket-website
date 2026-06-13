-- New marketplace-grade auto title format: "Buy {Name} Online | FoundOurMarket™"
-- Name is capped so the brand suffix is always preserved.
CREATE OR REPLACE FUNCTION public.fom_seo_title(p_name text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT 'Buy ' || left(coalesce(nullif(trim(p_name), ''), 'Product'), 45)
         || ' Online | FoundOurMarket™';
$$;

-- Backfill ONLY products whose current title is the previous auto-generated
-- format ("{Name} | FoundOurMarket"). Manual / already-new titles are skipped.
UPDATE public.products
SET seo_title = public.fom_seo_title(name)
WHERE deleted_at IS NULL
  AND seo_title = (left(coalesce(nullif(trim(name), ''), 'Product'), 70) || ' | FoundOurMarket')
  OR (deleted_at IS NULL AND seo_title = trim(name) || ' | FoundOurMarket');
