-- ============ marketing_automations ============
CREATE TABLE public.marketing_automations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  automation_type TEXT NOT NULL DEFAULT 'customer',
  trigger_key TEXT NOT NULL,
  region TEXT NOT NULL DEFAULT 'all',
  channel TEXT NOT NULL DEFAULT 'email',
  action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
  priority INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_automations TO authenticated;
GRANT ALL ON public.marketing_automations TO service_role;

ALTER TABLE public.marketing_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing automations staff read"
ON public.marketing_automations FOR SELECT
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'manager'::app_role, 'editor'::app_role]));

CREATE POLICY "marketing automations staff insert"
ON public.marketing_automations FOR INSERT
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'manager'::app_role, 'editor'::app_role]));

CREATE POLICY "marketing automations staff update"
ON public.marketing_automations FOR UPDATE
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'manager'::app_role, 'editor'::app_role]));

CREATE POLICY "marketing automations staff delete"
ON public.marketing_automations FOR DELETE
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'manager'::app_role, 'editor'::app_role]));

CREATE TRIGGER trg_marketing_automations_updated_at
BEFORE UPDATE ON public.marketing_automations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ marketing_campaigns ============
CREATE TABLE public.marketing_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  campaign_type TEXT NOT NULL DEFAULT 'custom',
  automation_id UUID REFERENCES public.marketing_automations(id) ON DELETE SET NULL,
  region TEXT NOT NULL DEFAULT 'all',
  segment TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  audience_size INTEGER NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ,
  launched_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;
GRANT ALL ON public.marketing_campaigns TO service_role;

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "marketing campaigns staff read"
ON public.marketing_campaigns FOR SELECT
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'manager'::app_role, 'editor'::app_role]));

CREATE POLICY "marketing campaigns staff insert"
ON public.marketing_campaigns FOR INSERT
WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'manager'::app_role, 'editor'::app_role]));

CREATE POLICY "marketing campaigns staff update"
ON public.marketing_campaigns FOR UPDATE
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'manager'::app_role, 'editor'::app_role]));

CREATE POLICY "marketing campaigns staff delete"
ON public.marketing_campaigns FOR DELETE
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'manager'::app_role, 'editor'::app_role]));

CREATE TRIGGER trg_marketing_campaigns_updated_at
BEFORE UPDATE ON public.marketing_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_marketing_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX idx_marketing_campaigns_automation ON public.marketing_campaigns(automation_id);

-- ============ realtime ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_automations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.marketing_campaigns;