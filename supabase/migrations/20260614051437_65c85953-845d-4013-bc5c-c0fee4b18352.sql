DROP POLICY IF EXISTS "subscribe with own or anonymous email" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "authenticated subscribers use account email" ON public.newsletter_subscribers;

CREATE POLICY "authenticated subscribers use account email"
  ON public.newsletter_subscribers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND lower(email) = lower(auth.email())
    AND status = 'subscribed'
  );