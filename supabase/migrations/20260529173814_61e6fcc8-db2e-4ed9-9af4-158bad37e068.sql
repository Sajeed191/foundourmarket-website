ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS warranty text NOT NULL DEFAULT '12 months';