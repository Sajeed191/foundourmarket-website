-- Remove the overly-permissive user INSERT policy on payments.
-- Payment records must only be created by trusted server-side code
-- (server functions + webhook handler) via the service-role client.
DROP POLICY IF EXISTS "own payments insert" ON public.payments;