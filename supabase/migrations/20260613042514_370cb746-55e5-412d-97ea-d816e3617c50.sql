CREATE TABLE public.international_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  country text,
  product_slug text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.international_waitlist TO authenticated;
GRANT ALL ON public.international_waitlist TO service_role;

ALTER TABLE public.international_waitlist ENABLE ROW LEVEL SECURITY;

-- Authenticated users may add themselves to the waitlist (writes also occur via the service role).
CREATE POLICY "Users can join the international waitlist"
  ON public.international_waitlist
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Staff may review international demand.
CREATE POLICY "Staff can read the international waitlist"
  ON public.international_waitlist
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.has_role(auth.uid(), 'manager')
  );

CREATE INDEX idx_international_waitlist_country ON public.international_waitlist (country);
CREATE INDEX idx_international_waitlist_created_at ON public.international_waitlist (created_at DESC);