DROP POLICY IF EXISTS "anyone can subscribe" ON public.newsletter_subscribers;

CREATE POLICY "subscribe with own or anonymous email"
  ON public.newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NULL OR email = auth.email())
    AND status = 'subscribed'
  );