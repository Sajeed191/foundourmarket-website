-- Tighten INSERT: email must match the authenticated user's email
DROP POLICY IF EXISTS "Users can join the international waitlist" ON public.international_waitlist;
CREATE POLICY "Users can join the international waitlist"
ON public.international_waitlist
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND lower(email) = lower(auth.email()));

-- Allow users to read their own waitlist entry
CREATE POLICY "Users can read their own waitlist entry"
ON public.international_waitlist
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);