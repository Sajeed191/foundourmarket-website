-- Security staff helper (admin, super_admin, manager, support)
CREATE OR REPLACE FUNCTION public.is_security_staff(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','super_admin','manager','support')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_security_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin','super_admin','manager')
  );
$$;

-- ============================== FRAUD ALERTS ==============================
CREATE TABLE public.fraud_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_key text NOT NULL UNIQUE,
  fraud_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  score integer NOT NULL DEFAULT 0,
  subject_type text NOT NULL DEFAULT 'customer',
  subject_id text,
  subject_label text,
  title text NOT NULL,
  detail text,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'open',
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.fraud_alerts TO authenticated;
GRANT ALL ON public.fraud_alerts TO service_role;

ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security staff read fraud_alerts"
ON public.fraud_alerts FOR SELECT TO authenticated
USING (public.is_security_staff(auth.uid()));

CREATE POLICY "security staff insert fraud_alerts"
ON public.fraud_alerts FOR INSERT TO authenticated
WITH CHECK (public.is_security_staff(auth.uid()));

CREATE POLICY "security staff update fraud_alerts"
ON public.fraud_alerts FOR UPDATE TO authenticated
USING (public.is_security_staff(auth.uid()))
WITH CHECK (public.is_security_staff(auth.uid()));

CREATE POLICY "security admin delete fraud_alerts"
ON public.fraud_alerts FOR DELETE TO authenticated
USING (public.is_security_admin(auth.uid()));

CREATE INDEX idx_fraud_alerts_status ON public.fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_subject ON public.fraud_alerts(subject_type, subject_id);
CREATE INDEX idx_fraud_alerts_severity ON public.fraud_alerts(severity);

-- ============================== ACCOUNT LOCKS ==============================
CREATE TABLE public.account_locks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  locked boolean NOT NULL DEFAULT true,
  reason text,
  severity text NOT NULL DEFAULT 'high',
  locked_by uuid,
  unlocked_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_locks TO authenticated;
GRANT ALL ON public.account_locks TO service_role;

ALTER TABLE public.account_locks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security staff read account_locks"
ON public.account_locks FOR SELECT TO authenticated
USING (public.is_security_staff(auth.uid()));

CREATE POLICY "security admin insert account_locks"
ON public.account_locks FOR INSERT TO authenticated
WITH CHECK (public.is_security_admin(auth.uid()));

CREATE POLICY "security admin update account_locks"
ON public.account_locks FOR UPDATE TO authenticated
USING (public.is_security_admin(auth.uid()))
WITH CHECK (public.is_security_admin(auth.uid()));

CREATE POLICY "security admin delete account_locks"
ON public.account_locks FOR DELETE TO authenticated
USING (public.is_security_admin(auth.uid()));

-- ============================== FRAUD ACTIONS (audit) ==============================
CREATE TABLE public.fraud_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id uuid NOT NULL DEFAULT auth.uid(),
  action text NOT NULL,
  fraud_type text,
  severity text,
  subject_type text,
  subject_id text,
  alert_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.fraud_actions TO authenticated;
GRANT ALL ON public.fraud_actions TO service_role;

ALTER TABLE public.fraud_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "security staff read fraud_actions"
ON public.fraud_actions FOR SELECT TO authenticated
USING (public.is_security_staff(auth.uid()));

CREATE POLICY "security staff insert fraud_actions"
ON public.fraud_actions FOR INSERT TO authenticated
WITH CHECK (public.is_security_staff(auth.uid()) AND actor_id = auth.uid());

CREATE INDEX idx_fraud_actions_created ON public.fraud_actions(created_at DESC);
CREATE INDEX idx_fraud_actions_subject ON public.fraud_actions(subject_type, subject_id);

-- updated_at triggers (reuse existing helper if present)
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_fraud_alerts_updated BEFORE UPDATE ON public.fraud_alerts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_account_locks_updated BEFORE UPDATE ON public.account_locks
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.fraud_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.account_locks;