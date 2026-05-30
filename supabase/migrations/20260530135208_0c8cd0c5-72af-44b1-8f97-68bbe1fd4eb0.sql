CREATE OR REPLACE FUNCTION public.admin_user_directory()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_any_role(auth.uid(), ARRAY['admin','super_admin','manager','support','editor']::app_role[]) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  WITH roles AS (
    SELECT user_id, array_agg(role::text ORDER BY role::text) AS roles
    FROM public.user_roles GROUP BY user_id
  ),
  ord AS (
    SELECT o.user_id,
      count(*) FILTER (WHERE o.payment_status='paid' OR o.status IN ('paid','fulfilled','delivered','shipped','processing','completed')) AS orders_count,
      coalesce(sum(o.total) FILTER (WHERE o.payment_status='paid' OR o.status IN ('paid','fulfilled','delivered','shipped','processing','completed')),0) AS revenue,
      count(*) FILTER (WHERE o.promo_code IS NOT NULL AND length(o.promo_code)>0) AS promo_count,
      min(o.created_at) AS first_order_at,
      max(o.created_at) AS last_order_at,
      max(o.contact_email) AS contact_email,
      max(o.market_region) AS order_region
    FROM public.orders o
    WHERE o.user_id IS NOT NULL AND coalesce(o.is_seeded,false)=false
    GROUP BY o.user_id
  ),
  refs AS (
    SELECT o.user_id, coalesce(sum(rf.amount),0) AS refund_amount
    FROM public.refunds rf JOIN public.orders o ON o.id=rf.order_id
    WHERE o.user_id IS NOT NULL AND lower(rf.status) IN ('processed','succeeded','completed','paid')
    GROUP BY o.user_id
  ),
  rev AS (SELECT user_id, count(*) AS reviews FROM public.product_reviews WHERE user_id IS NOT NULL AND coalesce(is_seeded,false)=false GROUP BY user_id),
  qs AS (SELECT user_id, count(*) AS questions FROM public.product_questions WHERE user_id IS NOT NULL AND coalesce(is_seeded,false)=false GROUP BY user_id),
  wl AS (SELECT user_id, count(*) AS wishlist FROM public.wishlist WHERE user_id IS NOT NULL AND coalesce(is_seeded,false)=false GROUP BY user_id),
  tix AS (
    SELECT user_id,
      count(*) AS tickets,
      count(*) FILTER (WHERE status NOT IN ('resolved','closed')) AS open_tickets
    FROM public.support_tickets WHERE user_id IS NOT NULL AND coalesce(is_seeded,false)=false GROUP BY user_id
  ),
  staff_tix AS (
    SELECT assigned_to AS uid,
      count(*) AS assigned_tickets,
      count(*) FILTER (WHERE status IN ('resolved','closed')) AS resolved_tickets
    FROM public.support_tickets WHERE assigned_to IS NOT NULL GROUP BY assigned_to
  ),
  acts AS (
    SELECT actor_id AS uid, count(*) AS activity_count, max(created_at) AS last_admin_action
    FROM public.admin_activity_logs WHERE actor_id IS NOT NULL GROUP BY actor_id
  ),
  sess AS (
    SELECT user_id,
      count(DISTINCT country) AS country_count,
      count(DISTINCT device) AS device_count,
      coalesce(sum(page_views),0) AS total_page_views,
      max(last_seen) AS last_seen
    FROM public.visitor_sessions WHERE user_id IS NOT NULL GROUP BY user_id
  ),
  last_sess AS (
    SELECT DISTINCT ON (user_id) user_id, device, country, referrer, landing_path, started_at, last_seen
    FROM public.visitor_sessions WHERE user_id IS NOT NULL ORDER BY user_id, last_seen DESC NULLS LAST
  ),
  last_ev AS (
    SELECT DISTINCT ON (user_id) user_id, path AS current_path, event AS last_event, created_at AS last_event_at
    FROM public.analytics_events WHERE user_id IS NOT NULL AND coalesce(is_seeded,false)=false
    ORDER BY user_id, created_at DESC
  )
  SELECT jsonb_build_object(
    'generated_at', now(),
    'users', coalesce(jsonb_agg(jsonb_build_object(
      'id', au.id,
      'email', coalesce(au.email, ord.contact_email),
      'full_name', p.full_name,
      'avatar_url', p.avatar_url,
      'phone', p.phone,
      'country', coalesce(p.country, last_sess.country),
      'market_region', coalesce(p.market_region, ord.order_region),
      'profile_created_at', coalesce(p.created_at, au.created_at),
      'auth_created_at', au.created_at,
      'last_sign_in_at', au.last_sign_in_at,
      'roles', coalesce(roles.roles, ARRAY[]::text[]),
      'orders_count', coalesce(ord.orders_count,0),
      'revenue', coalesce(ord.revenue,0),
      'promo_count', coalesce(ord.promo_count,0),
      'first_order_at', ord.first_order_at,
      'last_order_at', ord.last_order_at,
      'refund_amount', coalesce(refs.refund_amount,0),
      'reviews', coalesce(rev.reviews,0),
      'questions', coalesce(qs.questions,0),
      'wishlist', coalesce(wl.wishlist,0),
      'tickets', coalesce(tix.tickets,0),
      'open_tickets', coalesce(tix.open_tickets,0),
      'assigned_tickets', coalesce(staff_tix.assigned_tickets,0),
      'resolved_tickets', coalesce(staff_tix.resolved_tickets,0),
      'activity_count', coalesce(acts.activity_count,0),
      'last_admin_action', acts.last_admin_action,
      'session_country_count', coalesce(sess.country_count,0),
      'session_device_count', coalesce(sess.device_count,0),
      'total_page_views', coalesce(sess.total_page_views,0),
      'last_seen', coalesce(sess.last_seen, last_sess.last_seen),
      'device', last_sess.device,
      'referrer', last_sess.referrer,
      'landing_path', last_sess.landing_path,
      'current_path', last_ev.current_path,
      'last_event', last_ev.last_event,
      'last_event_at', last_ev.last_event_at
    )), '[]'::jsonb)
  ) INTO result
  FROM auth.users au
  LEFT JOIN public.profiles p ON p.id = au.id
  LEFT JOIN roles ON roles.user_id = au.id
  LEFT JOIN ord ON ord.user_id = au.id
  LEFT JOIN refs ON refs.user_id = au.id
  LEFT JOIN rev ON rev.user_id = au.id
  LEFT JOIN qs ON qs.user_id = au.id
  LEFT JOIN wl ON wl.user_id = au.id
  LEFT JOIN tix ON tix.user_id = au.id
  LEFT JOIN staff_tix ON staff_tix.uid = au.id
  LEFT JOIN acts ON acts.uid = au.id
  LEFT JOIN sess ON sess.user_id = au.id
  LEFT JOIN last_sess ON last_sess.user_id = au.id
  LEFT JOIN last_ev ON last_ev.user_id = au.id;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_user_directory() TO authenticated;