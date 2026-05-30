-- ============================================================
-- P1 — Marketing Automation Execution Engine
-- ============================================================

-- 1. Execution audit / history / analytics table
CREATE TABLE public.automation_executions (
  id            uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id        uuid NOT NULL,
  automation_id uuid REFERENCES public.marketing_automations(id) ON DELETE CASCADE,
  trigger_key   text NOT NULL,
  status        text NOT NULL DEFAULT 'success', -- success | skipped | failed
  matched_count integer NOT NULL DEFAULT 0,
  action_taken  text,
  summary       text,
  details       jsonb NOT NULL DEFAULT '{}'::jsonb,
  error         text,
  campaign_id   uuid,
  triggered_by  text NOT NULL DEFAULT 'cron', -- cron | manual
  actor_id      uuid,
  created_at    timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_automation_executions_automation ON public.automation_executions(automation_id, created_at DESC);
CREATE INDEX idx_automation_executions_created ON public.automation_executions(created_at DESC);
CREATE INDEX idx_automation_executions_run ON public.automation_executions(run_id);

GRANT SELECT ON public.automation_executions TO authenticated;
GRANT ALL ON public.automation_executions TO service_role;

ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "automation executions staff read"
ON public.automation_executions FOR SELECT
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role,'super_admin'::app_role,'manager'::app_role,'editor'::app_role]));

ALTER PUBLICATION supabase_realtime ADD TABLE public.automation_executions;

-- 2. Helper: notify all admin/manager staff
CREATE OR REPLACE FUNCTION public.notify_staff(
  p_type text, p_title text, p_body text, p_link text, p_priority text, p_data jsonb
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_count integer := 0;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link, priority, data)
  SELECT DISTINCT ur.user_id, p_type, p_title, p_body, p_link, p_priority, COALESCE(p_data,'{}'::jsonb)
  FROM public.user_roles ur
  WHERE ur.role IN ('admin','super_admin','manager');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- 3. The execution engine
CREATE OR REPLACE FUNCTION public.run_marketing_automations(
  p_force boolean DEFAULT false,
  p_triggered_by text DEFAULT 'cron'
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_actor          uuid := auth.uid();
  v_run_id         uuid := gen_random_uuid();
  a                record;
  v_count          integer;
  v_summary        text;
  v_details        jsonb;
  v_action         text;
  v_cadence        integer;
  v_status         text;
  v_action_taken   text;
  v_campaign_id    uuid;
  v_total_runs     integer := 0;
  v_total_actions  integer := 0;
  v_now            timestamptz := now();
BEGIN
  -- Manual runs require staff; cron (no auth.uid) is allowed.
  IF v_actor IS NOT NULL AND NOT has_any_role(v_actor, ARRAY['admin'::app_role,'super_admin'::app_role,'manager'::app_role,'editor'::app_role]) THEN
    RAISE EXCEPTION 'Not authorised to run automations';
  END IF;

  FOR a IN
    SELECT * FROM public.marketing_automations
    WHERE enabled = true AND status = 'active'
    ORDER BY priority DESC
  LOOP
    -- cadence gate (minutes). Default 360 (6h). Forced runs bypass.
    v_cadence := COALESCE((a.schedule->>'cadence_minutes')::int, 360);
    IF NOT p_force AND a.last_run_at IS NOT NULL
       AND a.last_run_at > v_now - make_interval(mins => v_cadence) THEN
      CONTINUE;
    END IF;

    v_count := 0; v_summary := NULL; v_details := '{}'::jsonb;
    v_status := 'success'; v_action_taken := NULL; v_campaign_id := NULL;

    BEGIN
      -- ---------------- TRIGGER EVALUATION (live data) ----------------
      IF a.trigger_key IN ('segment_vip','tag_high_value') THEN
        SELECT count(*) INTO v_count FROM (
          SELECT o.user_id FROM orders o
          JOIN profiles p ON p.id = o.user_id
          WHERE NOT o.is_seeded AND o.status NOT IN ('cancelled')
          GROUP BY o.user_id
          HAVING sum(o.total) >= COALESCE((a.action_config->>'min_spend')::numeric, 50000)
        ) q;
        v_summary := v_count || ' high-value customers qualify';

      ELSIF a.trigger_key IN ('segment_loyal','lifecycle_repeat') THEN
        SELECT count(*) INTO v_count FROM (
          SELECT o.user_id FROM orders o
          WHERE NOT o.is_seeded AND o.status NOT IN ('cancelled')
          GROUP BY o.user_id
          HAVING count(*) >= 3 AND max(o.created_at) > v_now - interval '60 days'
        ) q;
        v_summary := v_count || ' loyal repeat customers';

      ELSIF a.trigger_key = 'segment_at_risk' THEN
        SELECT count(*) INTO v_count FROM (
          SELECT o.user_id FROM orders o
          WHERE NOT o.is_seeded AND o.status NOT IN ('cancelled')
          GROUP BY o.user_id
          HAVING count(*) >= 2
             AND max(o.created_at) BETWEEN v_now - interval '120 days' AND v_now - interval '60 days'
        ) q;
        v_summary := v_count || ' customers showing churn risk';

      ELSIF a.trigger_key IN ('segment_dormant','lifecycle_winback','lifecycle_inactive') THEN
        SELECT count(*) INTO v_count FROM (
          SELECT o.user_id FROM orders o
          WHERE NOT o.is_seeded AND o.status NOT IN ('cancelled')
          GROUP BY o.user_id
          HAVING max(o.created_at) < v_now - interval '120 days'
        ) q;
        v_summary := v_count || ' dormant customers to win back';

      ELSIF a.trigger_key IN ('segment_new','lifecycle_welcome','lifecycle_first_purchase') THEN
        SELECT count(*) INTO v_count FROM profiles p
        WHERE NOT p.is_seeded AND p.created_at > v_now - interval '30 days';
        v_summary := v_count || ' new customers in last 30 days';

      ELSIF a.trigger_key = 'tag_refund_heavy' THEN
        SELECT count(*) INTO v_count FROM (
          SELECT o.user_id FROM returns r
          JOIN orders o ON o.id = r.order_id
          WHERE NOT o.is_seeded
          GROUP BY o.user_id HAVING count(*) >= 2
        ) q;
        v_summary := v_count || ' refund-heavy customers';

      ELSIF a.trigger_key = 'inv_low_stock' THEN
        SELECT count(*) INTO v_count FROM products
        WHERE status = 'published' AND in_stock
          AND stock_quantity > 0 AND stock_quantity <= low_stock_threshold;
        v_summary := v_count || ' products low on stock';

      ELSIF a.trigger_key = 'inv_back_in_stock' THEN
        SELECT count(*) INTO v_count FROM products
        WHERE status = 'published' AND stock_quantity > low_stock_threshold AND in_stock;
        v_summary := v_count || ' products well stocked';

      ELSIF a.trigger_key IN ('inv_dead','inv_clearance') THEN
        SELECT count(*) INTO v_count FROM products pr
        WHERE pr.status = 'published' AND pr.stock_quantity > 0
          AND NOT EXISTS (
            SELECT 1 FROM order_items oi JOIN orders o ON o.id = oi.order_id
            WHERE oi.product_id = pr.id AND NOT o.is_seeded
              AND o.created_at > v_now - interval '60 days'
          );
        v_summary := v_count || ' dead-stock products (no sales 60d)';

      ELSIF a.trigger_key = 'inv_overstock' THEN
        SELECT count(*) INTO v_count FROM products
        WHERE status = 'published'
          AND stock_quantity >= COALESCE((a.action_config->>'overstock_qty')::int, 100);
        v_summary := v_count || ' overstocked products';

      ELSIF a.trigger_key IN ('inv_fast','prod_bestsellers','prod_trending') THEN
        SELECT count(*) INTO v_count FROM (
          SELECT oi.product_id FROM order_items oi JOIN orders o ON o.id = oi.order_id
          WHERE NOT o.is_seeded AND o.created_at > v_now - interval '30 days'
          GROUP BY oi.product_id HAVING sum(oi.quantity) >= COALESCE((a.action_config->>'min_units')::int, 10)
        ) q;
        v_summary := v_count || ' fast-moving products (30d)';

      ELSIF a.trigger_key = 'prod_high_margin' THEN
        SELECT count(*) INTO v_count FROM products
        WHERE status = 'published' AND price > 0 AND cost > 0
          AND (price - cost) / price >= COALESCE((a.action_config->>'min_margin')::numeric, 0.4);
        v_summary := v_count || ' high-margin products';

      ELSIF a.trigger_key = 'prod_new' THEN
        SELECT count(*) INTO v_count FROM products
        WHERE status = 'published' AND created_at > v_now - interval '21 days';
        v_summary := v_count || ' new arrivals';

      ELSIF a.trigger_key = 'revenue_target' THEN
        SELECT COALESCE(sum((metrics->>'revenue')::numeric),0) >= COALESCE((a.action_config->>'target')::numeric,100000)
          INTO v_status FROM marketing_campaigns; -- placeholder cast
        SELECT CASE WHEN COALESCE(sum((metrics->>'revenue')::numeric),0)
               >= COALESCE((a.action_config->>'target')::numeric,100000) THEN 1 ELSE 0 END
          INTO v_count FROM marketing_campaigns;
        v_summary := CASE WHEN v_count > 0 THEN 'Revenue target reached' ELSE 'Revenue below target' END;
        v_status := 'success';

      ELSIF a.trigger_key = 'profit_target' THEN
        SELECT CASE WHEN COALESCE(sum((metrics->>'profit')::numeric),0)
               >= COALESCE((a.action_config->>'target')::numeric,50000) THEN 1 ELSE 0 END
          INTO v_count FROM marketing_campaigns;
        v_summary := CASE WHEN v_count > 0 THEN 'Profit target reached' ELSE 'Profit below target' END;

      ELSE
        -- generic storefront / unhandled trigger: evaluate as "n/a"
        v_count := 0;
        v_summary := 'No live evaluator for trigger ' || a.trigger_key;
        v_status := 'skipped';
      END IF;

      -- ---------------- ACTION EXECUTION ----------------
      v_action := COALESCE(a.action_config->>'action',
                           CASE WHEN a.channel = 'notification' THEN 'notify' ELSE 'create_campaign' END);

      IF v_count > 0 AND v_status <> 'skipped' THEN
        IF v_action IN ('create_campaign','schedule_campaign') THEN
          -- avoid duplicate live campaign for the same automation
          IF NOT EXISTS (
            SELECT 1 FROM marketing_campaigns
            WHERE automation_id = a.id AND status IN ('active','scheduled')
          ) THEN
            INSERT INTO marketing_campaigns
              (name, campaign_type, automation_id, region, segment, status, audience_size, config, metrics, scheduled_at, launched_at, created_by)
            VALUES (
              a.name, a.trigger_key, a.id, a.region,
              a.action_config->>'segment',
              CASE WHEN v_action = 'schedule_campaign' THEN 'scheduled' ELSE 'active' END,
              v_count, a.action_config, '{}'::jsonb,
              CASE WHEN v_action = 'schedule_campaign'
                   THEN v_now + make_interval(mins => COALESCE((a.action_config->>'delay_minutes')::int, 60))
                   ELSE NULL END,
              CASE WHEN v_action = 'create_campaign' THEN v_now ELSE NULL END,
              v_actor
            ) RETURNING id INTO v_campaign_id;
            v_action_taken := v_action;
            v_total_actions := v_total_actions + 1;
          ELSE
            v_action_taken := 'campaign_exists';
          END IF;

        ELSIF v_action = 'pause_campaign' THEN
          UPDATE marketing_campaigns SET status = 'paused'
          WHERE automation_id = a.id AND status = 'active';
          v_action_taken := 'pause_campaign';
          v_total_actions := v_total_actions + 1;

        ELSE
          v_action_taken := 'notify';
        END IF;

        -- always notify staff + audit when a trigger fires
        PERFORM notify_staff(
          'automation',
          a.name || ' triggered',
          v_summary,
          '/admin-marketing-automation',
          CASE WHEN a.priority >= 5 THEN 'high' ELSE 'normal' END,
          jsonb_build_object('automation_id', a.id, 'trigger_key', a.trigger_key, 'matched', v_count, 'campaign_id', v_campaign_id)
        );

        INSERT INTO admin_activity_logs (actor_id, action, entity_type, entity_id, metadata)
        VALUES (v_actor, 'automation.executed', 'automation', a.id::text,
          jsonb_build_object('trigger_key', a.trigger_key, 'matched', v_count, 'action', v_action_taken, 'campaign_id', v_campaign_id, 'run_id', v_run_id));
      END IF;

      v_details := jsonb_build_object('cadence_minutes', v_cadence, 'channel', a.channel, 'region', a.region);

      INSERT INTO automation_executions
        (run_id, automation_id, trigger_key, status, matched_count, action_taken, summary, details, campaign_id, triggered_by, actor_id)
      VALUES (v_run_id, a.id, a.trigger_key,
        CASE WHEN v_count > 0 AND v_status <> 'skipped' THEN 'success' ELSE v_status END,
        v_count, v_action_taken, v_summary, v_details, v_campaign_id, p_triggered_by, v_actor);

      UPDATE marketing_automations SET last_run_at = v_now WHERE id = a.id;
      v_total_runs := v_total_runs + 1;

    EXCEPTION WHEN OTHERS THEN
      INSERT INTO automation_executions
        (run_id, automation_id, trigger_key, status, matched_count, summary, error, triggered_by, actor_id)
      VALUES (v_run_id, a.id, a.trigger_key, 'failed', 0, 'Execution error', SQLERRM, p_triggered_by, v_actor);
      v_total_runs := v_total_runs + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'run_id', v_run_id,
    'automations_evaluated', v_total_runs,
    'actions_taken', v_total_actions,
    'ran_at', v_now
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.run_marketing_automations(boolean, text) TO authenticated;

-- 4. Schedule the engine every 15 minutes
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'run-marketing-automations') THEN
    PERFORM cron.unschedule('run-marketing-automations');
  END IF;
  PERFORM cron.schedule(
    'run-marketing-automations',
    '*/15 * * * *',
    $cron$ SELECT public.run_marketing_automations(false, 'cron'); $cron$
  );
END $$;