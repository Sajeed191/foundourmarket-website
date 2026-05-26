
-- 1) Extend products with inventory + search
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS products_search_vector_idx ON public.products USING GIN(search_vector);
CREATE UNIQUE INDEX IF NOT EXISTS products_sku_unique ON public.products(sku) WHERE sku IS NOT NULL;

CREATE OR REPLACE FUNCTION public.products_search_vector_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.name,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.tagline,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.category,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description,'')), 'C');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS products_search_vector_trg ON public.products;
CREATE TRIGGER products_search_vector_trg
BEFORE INSERT OR UPDATE OF name, tagline, category, description
ON public.products FOR EACH ROW EXECUTE FUNCTION public.products_search_vector_update();

UPDATE public.products SET name = name; -- backfill search_vector

-- 2) product_images
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug TEXT NOT NULL,
  url TEXT NOT NULL,
  alt TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_images_slug_idx ON public.product_images(product_slug, sort_order);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product images viewable by everyone" ON public.product_images FOR SELECT USING (true);
CREATE POLICY "admins insert product images" ON public.product_images FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update product images" ON public.product_images FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete product images" ON public.product_images FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- 3) product_variants
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  price_override NUMERIC,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_variants_slug_idx ON public.product_variants(product_slug, sort_order);
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_sku_unique ON public.product_variants(sku) WHERE sku IS NOT NULL;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "variants viewable by everyone" ON public.product_variants FOR SELECT USING (true);
CREATE POLICY "admins insert variants" ON public.product_variants FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "admins update variants" ON public.product_variants FOR UPDATE USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete variants" ON public.product_variants FOR DELETE USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER product_variants_set_updated_at BEFORE UPDATE ON public.product_variants
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4) carts + cart_items
CREATE TABLE IF NOT EXISTS public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cart select" ON public.carts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own cart insert" ON public.carts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own cart update" ON public.carts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own cart delete" ON public.carts FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER carts_set_updated_at BEFORE UPDATE ON public.carts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_slug TEXT NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_slug, variant_id)
);
CREATE INDEX IF NOT EXISTS cart_items_cart_idx ON public.cart_items(cart_id);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cart items select" ON public.cart_items FOR SELECT
USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()));
CREATE POLICY "own cart items insert" ON public.cart_items FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()));
CREATE POLICY "own cart items update" ON public.cart_items FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()));
CREATE POLICY "own cart items delete" ON public.cart_items FOR DELETE
USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND c.user_id = auth.uid()));
CREATE TRIGGER cart_items_set_updated_at BEFORE UPDATE ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) Stock decrement trigger on order_items insert
CREATE OR REPLACE FUNCTION public.decrement_stock_on_order_item()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(0, stock_quantity - NEW.quantity),
      in_stock = (stock_quantity - NEW.quantity) > 0
  WHERE slug = NEW.product_slug;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS order_items_decrement_stock ON public.order_items;
CREATE TRIGGER order_items_decrement_stock
AFTER INSERT ON public.order_items
FOR EACH ROW EXECUTE FUNCTION public.decrement_stock_on_order_item();

-- 6) Full-text search RPC (security definer for public access)
CREATE OR REPLACE FUNCTION public.search_products(
  q TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  min_price NUMERIC DEFAULT NULL,
  max_price NUMERIC DEFAULT NULL,
  min_rating NUMERIC DEFAULT NULL,
  sort_by TEXT DEFAULT 'relevance',
  page_limit INTEGER DEFAULT 24,
  page_offset INTEGER DEFAULT 0
)
RETURNS SETOF public.products
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ts_q tsquery;
BEGIN
  IF q IS NOT NULL AND length(trim(q)) > 0 THEN
    ts_q := websearch_to_tsquery('english', q);
  END IF;

  RETURN QUERY
  SELECT p.* FROM public.products p
  WHERE (ts_q IS NULL OR p.search_vector @@ ts_q)
    AND (category_filter IS NULL OR p.category = category_filter)
    AND (min_price IS NULL OR p.price >= min_price)
    AND (max_price IS NULL OR p.price <= max_price)
    AND (min_rating IS NULL OR p.rating >= min_rating)
  ORDER BY
    CASE WHEN sort_by = 'relevance' AND ts_q IS NOT NULL THEN ts_rank(p.search_vector, ts_q) END DESC NULLS LAST,
    CASE WHEN sort_by = 'price_asc' THEN p.price END ASC,
    CASE WHEN sort_by = 'price_desc' THEN p.price END DESC,
    CASE WHEN sort_by = 'rating' THEN p.rating END DESC,
    CASE WHEN sort_by = 'newest' THEN p.created_at END DESC,
    p.sort_order ASC
  LIMIT page_limit OFFSET page_offset;
END $$;
