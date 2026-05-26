
CREATE TABLE public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('percent','fixed')),
  value numeric NOT NULL CHECK (value > 0),
  active boolean NOT NULL DEFAULT true,
  max_uses integer,
  uses integer NOT NULL DEFAULT 0,
  min_subtotal numeric NOT NULL DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_promo_codes_code ON public.promo_codes(lower(code));

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "active promo codes viewable by everyone"
  ON public.promo_codes FOR SELECT
  USING (active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "admins view all promo codes"
  ON public.promo_codes FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "admins insert promo codes"
  ON public.promo_codes FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "admins update promo codes"
  ON public.promo_codes FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete promo codes"
  ON public.promo_codes FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER promo_codes_updated_at
  BEFORE UPDATE ON public.promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.orders
  ADD COLUMN discount numeric NOT NULL DEFAULT 0,
  ADD COLUMN promo_code text;
