-- =====================================================================
-- PHASE 10 — REVENUE AUTOMATION ENGINE (EXECUTION LAYER)
-- Adds real customer-facing execution + coupon attribution + revenue attribution.
-- =====================================================================

-- 1. Coupon attribution columns (link generated coupons to segment/campaign/automation)
ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS source        text,
  ADD COLUMN IF NOT EXISTS segment       text,
  ADD COLUMN IF NOT EXISTS campaign_id   uuid,
  ADD COLUMN IF NOT EXISTS automation_id uuid,
  ADD COLUMN IF NOT EXISTS created_by    uuid;

CREATE INDEX IF NOT EXISTS idx_promo_codes_source   ON public.promo_codes (source);
CREATE INDEX IF NOT EXISTS idx_promo_codes_segment  ON public.promo_codes (segment);
CREATE INDEX IF NOT EXISTS idx_orders_promo_code    ON public.orders (promo_code) WHERE promo_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_carts_updated_at     ON public.carts (updated_at);

-- =====================================================================
-- 2. svc_activate_segment — real execution against a live audience.
--    Actions: notify | coupon | campaign | export
-- =====================================================================
CREATE OR REPLACE FUNCTION public.svc_activate_segment(
  _actor uuid,
  p_segment text,
  p_action text,
  p_label text DEFAULT NULL,
  p_message text DEFAULT NULL,
  p_kind text DEFAULT 'percent',
  p_value numeric DEFAULT 10,
  p_link text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_users     uuid[];
  v_count     integer := 0;
  v_now       timestamptz := now();
  v_thr_vip   numeric := 50000;
  v_thr_ltv   numeric := 30000;
  v_code      text;
  v_campaign  uuid;
  v_run       uuid := gen_random_uuid();
  v_audience  jsonb := '[]'::jsonb;
  v_title     text;
  v_body      text;
BEGIN
  IF NOT has_any_role(_actor, ARRAY['admin'::app_role,'super_admin'::app_role,'manager'::app_role,'editor'::app_role]) THEN
    RAISE EXCEPTION 'Not authorised to activate segments';
  END IF;

  -- ---------------- AUDIENCE RESOLUTION (live data, excludes seeded) ----------------
  IF p_segment IN ('vip','high_value') THEN
    SELECT array_agg(uid) INTO v_users FROM (
      SELECT o.user_id uid FROM orders o JOIN profiles p ON p.id=o.user_id
      WHERE NOT o.is_seeded AND NOT COALESCE(p.is_seeded,false) AND o.status <> 'cancelled'
      GROUP BY o.user_id HAVING sum(o.total) >= v_thr_vip) q;
  ELSIF p_segment IN ('high_ltv','high_spend') THEN
    SELECT array_agg(uid) INTO v_users FROM (
      SELECT o.user_id uid FROM orders o JOIN profiles p ON p.id=o.user_id
      WHERE NOT o.is_seeded AND NOT COALESCE(p.is_seeded,false) AND o.status <> 'cancelled'
      GROUP BY o.user_id HAVING sum(o.total) >= v_thr_ltv) q;
  ELSIF p_segment IN ('frequent','frequent_buyers') THEN
    SELECT array_agg(uid) INTO v_users FROM (
      SELECT o.user_id uid FROM orders o
      WHERE NOT o.is_seeded AND o.status <> 'cancelled'
      GROUP BY o.user_id HAVING count(*) >= 4) q;
  ELSIF p_segment IN ('dormant','dormant_buyers','winback') THEN
    SELECT array_agg(uid) INTO v_users FROM (
      SELECT o.user_id uid FROM orders o
      WHERE NOT o.is_seeded AND o.status <> 'cancelled'
      GROUP BY o.user_id HAVING max(o.created_at) < v_now - interval '90 days') q;
  ELSIF p_segment IN ('new','new_customers') THEN
    SELECT array_agg(id) INTO v_users FROM profiles
      WHERE NOT COALESCE(is_seeded,false) AND created_at > v_now - interval '30 days';
  ELSIF p_segment IN ('refund_risk') THEN
    SELECT array_agg(uid) INTO v_users FROM (
      SELECT o.user_id uid FROM returns r JOIN orders o ON o.id=r.order_id
      WHERE NOT o.is_seeded GROUP BY o.user_id) q;
  ELSIF p_segment IN ('abandoned_cart','abandoned') THEN
    SELECT array_agg(uid) INTO v_users FROM (
      SELECT c.user_id uid FROM carts c JOIN cart_items ci ON ci.cart_id=c.id
      WHERE c.user_id IS NOT NULL AND c.updated_at < v_now - interval '30 minutes'
        AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id=c.user_id AND NOT o.is_seeded AND o.created_at > c.updated_at)
      GROUP BY c.user_id) q;
  ELSIF p_segment IN ('wishlist','wishlist_heavy') THEN
    SELECT array_agg(uid) INTO v_users FROM (
      SELECT user_id uid FROM wishlist WHERE NOT COALESCE(is_seeded,false) AND user_id IS NOT NULL
      GROUP BY user_id) q;
  ELSIF p_segment IN ('coupon_hunters') THEN
    SELECT array_agg(uid) INTO v_users FROM (
      SELECT o.user_id uid FROM orders o
      WHERE NOT o.is_seeded AND o.promo_code IS NOT NULL
      GROUP BY o.user_id HAVING count(*) >= 2) q;
  ELSE
    RAISE EXCEPTION 'Unknown segment %', p_segment;
  END IF;

  v_users := COALESCE(v_users, ARRAY[]::uuid[]);
  -- strip nulls + cap to a safe batch size
  SELECT array_agg(u) INTO v_users FROM (
    SELECT DISTINCT unnest(v_users) u
  ) s WHERE u IS NOT NULL;
  v_users := COALESCE(v_users, ARRAY[]::uuid[]);
  IF array_length(v_users,1) > 5000 THEN
    v_users := v_users[1:5000];
  END IF;
  v_count := COALESCE(array_length(v_users,1), 0);

  -- ---------------- ACTION EXECUTION ----------------
  IF p_action = 'notify' THEN
    v_title := COALESCE(NULLIF(p_label,''), 'A little something for you');
    v_body  := COALESCE(NULLIF(p_message,''), 'We picked this just for you — open the app to see more.');
    IF v_count > 0 THEN
      INSERT INTO notifications (user_id, type, title, body, link, priority, data)
      SELECT u, 'marketing', v_title, v_body, COALESCE(p_link,'/'), 'normal',
             jsonb_build_object('segment', p_segment, 'source', 'segment_activation')
      FROM unnest(v_users) u;
    END IF;

  ELSIF p_action = 'coupon' THEN
    -- unique attributed coupon
    LOOP
      v_code := upper(regexp_replace(left(p_segment,4),'[^a-zA-Z0-9]','','g')) || '-' || upper(substr(md5(random()::text),1,6));
      EXIT WHEN NOT EXISTS (SELECT 1 FROM promo_codes WHERE code = v_code);
    END LOOP;
    INSERT INTO promo_codes (code, kind, value, active, max_uses, min_subtotal, expires_at, source, segment, created_by)
    VALUES (v_code,
            CASE WHEN p_kind = 'fixed' THEN 'fixed' ELSE 'percent' END,
            GREATEST(0, p_value), true,
            GREATEST(v_count, 1), 0, v_now + interval '30 days',
            'segment_activation', p_segment, _actor);
    v_audience := jsonb_build_object('code', v_code);

  ELSIF p_action = 'campaign' THEN
    INSERT INTO marketing_campaigns (name, campaign_type, region, segment, status, audience_size, config, metrics, launched_at, created_by)
    VALUES (COALESCE(NULLIF(p_label,''), initcap(replace(p_segment,'_',' ')) || ' Activation'),
            'segment_'||p_segment, 'all', p_segment, 'active', v_count,
            jsonb_build_object('segment', p_segment, 'source','segment_activation'),
            '{}'::jsonb, v_now, _actor)
    RETURNING id INTO v_campaign;
    v_audience := jsonb_build_object('campaign_id', v_campaign);

  ELSIF p_action = 'export' THEN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
              'user_id', p.id, 'name', COALESCE(p.full_name,''),
              'email', COALESCE(au.email,''), 'country', COALESCE(p.country,''))), '[]'::jsonb)
      INTO v_audience
    FROM profiles p
    LEFT JOIN auth.users au ON au.id = p.id
    WHERE p.id = ANY(v_users);

  ELSE
    RAISE EXCEPTION 'Unknown action %', p_action;
  END IF;

  -- execution monitor + activity audit
  INSERT INTO automation_executions
    (run_id, automation_id, trigger_key, status, matched_count, action_taken, summary, details, campaign_id, triggered_by, actor_id)
  VALUES (v_run, NULL, 'segment:'||p_segment,
          CASE WHEN v_count > 0 OR p_action IN ('coupon','campaign') THEN 'success' ELSE 'skipped' END,
          v_count, p_action,
          p_action||' · '||p_segment||' · '||v_count||' matched',
          jsonb_build_object('segment', p_segment, 'action', p_action) || v_audience,
          v_campaign, 'manual', _actor);

  INSERT INTO admin_activity_logs (actor_id, action, entity_type, entity_id, metadata)
  VALUES (_actor, 'segment.'||p_action, 'segment', p_segment,
          jsonb_build_object('matched', v_count, 'run_id', v_run) || v_audience);

  RETURN jsonb_build_object(
    'segment', p_segment, 'action', p_action, 'matched', v_count,
    'run_id', v_run, 'result', v_audience, 'ran_at', v_now);
END; $function$;

-- =====================================================================
-- 3. svc_revenue_attribution — real revenue KPIs from live records.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.svc_revenue_attribution(_actor uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_now              timestamptz := now();
  v_total_rev        numeric := 0;
  v_coupon_rev       numeric := 0;
  v_coupon_orders    integer := 0;
  v_recovered_rev    numeric := 0;
  v_recovered_orders integer := 0;
  v_winback_rev      numeric := 0;
  v_campaign_rev     numeric := 0;
  v_repeat_rev       numeric := 0;
  v_repeat_orders    integer := 0;
  v_notif_sent       integer := 0;
  v_notif_converted  integer := 0;
  v_spend            numeric := 0;
BEGIN
  IF NOT has_any_role(_actor, ARRAY['admin'::app_role,'super_admin'::app_role,'manager'::app_role,'editor'::app_role]) THEN
    RAISE EXCEPTION 'Not authorised';
  END IF;

  SELECT COALESCE(sum(total),0) INTO v_total_rev
  FROM orders WHERE NOT is_seeded AND status <> 'cancelled';

  -- coupon-attributed revenue (orders that used a promo code)
  SELECT COALESCE(sum(total),0), count(*) INTO v_coupon_rev, v_coupon_orders
  FROM orders WHERE NOT is_seeded AND status <> 'cancelled' AND promo_code IS NOT NULL;

  -- recovered revenue: a paid order placed AFTER a cart-recovery notification to the same user
  SELECT COALESCE(sum(o.total),0), count(*) INTO v_recovered_rev, v_recovered_orders
  FROM orders o
  WHERE NOT o.is_seeded AND o.status <> 'cancelled'
    AND EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = o.user_id
        AND (n.data->>'source' = 'cart_recovery' OR n.data->>'segment' = 'abandoned_cart' OR lower(n.title) LIKE '%cart%')
        AND n.created_at < o.created_at
        AND n.created_at > o.created_at - interval '14 days');

  -- winback revenue: paid order after a dormant/winback notification
  SELECT COALESCE(sum(o.total),0) INTO v_winback_rev
  FROM orders o
  WHERE NOT o.is_seeded AND o.status <> 'cancelled'
    AND EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = o.user_id
        AND (n.data->>'segment' IN ('dormant','winback'))
        AND n.created_at < o.created_at
        AND n.created_at > o.created_at - interval '30 days');

  -- campaign revenue + spend (from real campaign metrics)
  SELECT COALESCE(sum((metrics->>'revenue')::numeric),0), COALESCE(sum(spend),0)
    INTO v_campaign_rev, v_spend
  FROM marketing_campaigns;

  -- repeat-customer revenue
  SELECT COALESCE(sum(o.total),0), count(*) INTO v_repeat_rev, v_repeat_orders
  FROM orders o
  WHERE NOT o.is_seeded AND o.status <> 'cancelled'
    AND o.user_id IN (
      SELECT user_id FROM orders WHERE NOT is_seeded AND status <> 'cancelled'
      GROUP BY user_id HAVING count(*) > 1);

  -- notification conversion (marketing notifications → order within 7d)
  SELECT count(*) INTO v_notif_sent
  FROM notifications WHERE type = 'marketing' AND created_at > v_now - interval '90 days';

  SELECT count(DISTINCT n.id) INTO v_notif_converted
  FROM notifications n
  WHERE n.type = 'marketing' AND n.created_at > v_now - interval '90 days'
    AND EXISTS (
      SELECT 1 FROM orders o WHERE o.user_id = n.user_id AND NOT o.is_seeded
        AND o.status <> 'cancelled' AND o.created_at BETWEEN n.created_at AND n.created_at + interval '7 days');

  RETURN jsonb_build_object(
    'total_revenue', v_total_rev,
    'coupon_revenue', v_coupon_rev,
    'coupon_orders', v_coupon_orders,
    'recovered_revenue', v_recovered_rev,
    'recovered_orders', v_recovered_orders,
    'winback_revenue', v_winback_rev,
    'campaign_revenue', v_campaign_rev,
    'campaign_spend', v_spend,
    'campaign_roi', CASE WHEN v_spend > 0 THEN round((v_campaign_rev / v_spend)::numeric, 2) ELSE 0 END,
    'repeat_revenue', v_repeat_rev,
    'repeat_orders', v_repeat_orders,
    'notif_sent', v_notif_sent,
    'notif_converted', v_notif_converted,
    'notif_conversion_rate', CASE WHEN v_notif_sent > 0 THEN round((v_notif_converted::numeric / v_notif_sent), 4) ELSE 0 END,
    'generated_at', v_now);
END; $function$;

-- =====================================================================
-- 4. Lock down — service_role only (called via admin client in server fns)
-- =====================================================================
REVOKE ALL ON FUNCTION public.svc_activate_segment(uuid,text,text,text,text,text,numeric,text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.svc_activate_segment(uuid,text,text,text,text,text,numeric,text) TO service_role;
REVOKE ALL ON FUNCTION public.svc_revenue_attribution(uuid) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.svc_revenue_attribution(uuid) TO service_role;