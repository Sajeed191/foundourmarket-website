ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published',
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS trending boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS homepage_visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS banner_image text,
  ADD COLUMN IF NOT EXISTS mobile_image text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS region text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS views integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicks integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.validate_category_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('draft','published','hidden','archived') THEN
    RAISE EXCEPTION 'invalid category status: %', NEW.status;
  END IF;
  IF NEW.region NOT IN ('all','india','international') THEN
    RAISE EXCEPTION 'invalid category region: %', NEW.region;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS validate_category_status_trg ON public.categories;
CREATE TRIGGER validate_category_status_trg
BEFORE INSERT OR UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.validate_category_status();

CREATE OR REPLACE FUNCTION public.track_category_event(_id uuid, _event text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _event = 'view' THEN
    UPDATE public.categories SET views = views + 1 WHERE id = _id;
  ELSIF _event = 'click' THEN
    UPDATE public.categories SET clicks = clicks + 1 WHERE id = _id;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.reorder_category(_id uuid, _direction text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cur_order int;
  cur_id uuid;
  swap_id uuid;
  swap_order int;
BEGIN
  IF NOT has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','editor']::app_role[]) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT sort_order, id INTO cur_order, cur_id FROM public.categories WHERE id = _id;
  IF cur_id IS NULL THEN RETURN; END IF;

  IF _direction = 'up' THEN
    SELECT id, sort_order INTO swap_id, swap_order FROM public.categories
      WHERE sort_order < cur_order ORDER BY sort_order DESC LIMIT 1;
  ELSE
    SELECT id, sort_order INTO swap_id, swap_order FROM public.categories
      WHERE sort_order > cur_order ORDER BY sort_order ASC LIMIT 1;
  END IF;

  IF swap_id IS NULL THEN RETURN; END IF;

  UPDATE public.categories SET sort_order = swap_order WHERE id = cur_id;
  UPDATE public.categories SET sort_order = cur_order WHERE id = swap_id;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;