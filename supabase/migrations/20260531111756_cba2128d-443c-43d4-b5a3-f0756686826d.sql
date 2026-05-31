CREATE OR REPLACE FUNCTION public.svc_payment_center(
  _actor uuid,
  _search text DEFAULT NULL,
  _status text DEFAULT 'all',
  _limit int DEFAULT 50,
  _offset int DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_staff boolean;
  _q text;
  _kpis jsonb;
  _rows jsonb;
  _total bigint;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM user_roles
    WHERE user_id = _actor AND role IN ('admin','super_admin','manager')
  ) INTO _is_staff;
  IF NOT _is_staff THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  _q := nullif(btrim(coalesce(_search, '')), '');
  _limit := least(greatest(coalesce(_limit, 50), 1), 200);
  _offset := greatest(coalesce(_offset, 0), 0);

  SELECT jsonb_build_object(
    'succeeded_count', count(*) FILTER (WHERE p.status = 'succeeded'),
    'pending_count',   count(*) FILTER (WHERE p.status = 'pending'),
    'failed_count',    count(*) FILTER (WHERE p.status = 'failed'),
    'total_revenue',   coalesce(sum(p.amount) FILTER (WHERE p.status = 'succeeded'), 0),
    'today_revenue',   coalesce(sum(p.amount) FILTER (WHERE p.status = 'succeeded' AND p.created_at >= date_trunc('day', now())), 0)
  ) INTO _kpis
  FROM payments p;

  _kpis := _kpis
    || (SELECT jsonb_build_object(
          'refunded_count', count(*) FILTER (WHERE status <> 'failed'),
          'refund_value',   coalesce(sum(amount) FILTER (WHERE status <> 'failed'), 0)
        ) FROM refunds)
    || (SELECT jsonb_build_object('today_orders', count(*)) FROM orders WHERE created_at >= date_trunc('day', now()));

  SELECT count(DISTINCT p.id) INTO _total
  FROM payments p
  LEFT JOIN orders o ON o.id = p.order_id
  LEFT JOIN profiles pr ON pr.id = p.user_id
  WHERE (_status = 'all' OR p.status = _status)
    AND (
      _q IS NULL
      OR p.transaction_id ILIKE '%'||_q||'%'
      OR p.razorpay_payment_id ILIKE '%'||_q||'%'
      OR p.razorpay_order_id ILIKE '%'||_q||'%'
      OR p.order_id::text ILIKE '%'||_q||'%'
      OR o.contact_email ILIKE '%'||_q||'%'
      OR o.tracking_number ILIKE '%'||_q||'%'
      OR o.razorpay_payment_id ILIKE '%'||_q||'%'
      OR pr.full_name ILIKE '%'||_q||'%'
      OR pr.phone ILIKE '%'||_q||'%'
    );

  SELECT coalesce(jsonb_agg(t.row ORDER BY t.created_at DESC), '[]'::jsonb) INTO _rows
  FROM (
    SELECT p.created_at,
      jsonb_build_object(
        'id', p.id, 'order_id', p.order_id, 'user_id', p.user_id,
        'method', p.method, 'status', p.status, 'amount', p.amount, 'currency', p.currency,
        'transaction_id', p.transaction_id, 'razorpay_payment_id', p.razorpay_payment_id,
        'razorpay_order_id', p.razorpay_order_id, 'fee', p.fee, 'gateway_tax', p.gateway_tax,
        'created_at', p.created_at,
        'customer_name', pr.full_name, 'customer_phone', pr.phone,
        'customer_email', o.contact_email,
        'order_total', o.total, 'order_status', o.status, 'payment_status', o.payment_status,
        'tracking_number', coalesce(o.tracking_number, s.tracking_number)
      ) AS row
    FROM payments p
    LEFT JOIN orders o ON o.id = p.order_id
    LEFT JOIN profiles pr ON pr.id = p.user_id
    LEFT JOIN LATERAL (
      SELECT tracking_number FROM shipments WHERE order_id = p.order_id ORDER BY created_at DESC LIMIT 1
    ) s ON true
    WHERE (_status = 'all' OR p.status = _status)
      AND (
        _q IS NULL
        OR p.transaction_id ILIKE '%'||_q||'%'
        OR p.razorpay_payment_id ILIKE '%'||_q||'%'
        OR p.razorpay_order_id ILIKE '%'||_q||'%'
        OR p.order_id::text ILIKE '%'||_q||'%'
        OR o.contact_email ILIKE '%'||_q||'%'
        OR o.tracking_number ILIKE '%'||_q||'%'
        OR o.razorpay_payment_id ILIKE '%'||_q||'%'
        OR pr.full_name ILIKE '%'||_q||'%'
        OR pr.phone ILIKE '%'||_q||'%'
      )
    ORDER BY p.created_at DESC
    LIMIT _limit OFFSET _offset
  ) t;

  RETURN jsonb_build_object('kpis', _kpis, 'rows', _rows, 'total', _total);
END;
$$;

REVOKE ALL ON FUNCTION public.svc_payment_center(uuid, text, text, int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.svc_payment_center(uuid, text, text, int, int) TO service_role;