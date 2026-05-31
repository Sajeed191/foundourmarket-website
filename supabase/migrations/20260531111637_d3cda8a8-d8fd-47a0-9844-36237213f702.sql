-- Payment & Customer Intelligence Center: indexed searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Ordering / filtering on payments
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments USING btree (status);

-- Trigram indexes for fast ILIKE contains searches
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id_trgm ON public.payments USING gin (transaction_id gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id_trgm ON public.payments USING gin (razorpay_payment_id gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id_trgm ON public.payments USING gin (razorpay_order_id gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders USING btree (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders USING btree (payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_contact_email_trgm ON public.orders USING gin (contact_email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number_trgm ON public.orders USING gin (tracking_number gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_payment_id_trgm ON public.orders USING gin (razorpay_payment_id gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm ON public.profiles USING gin (full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_phone_trgm ON public.profiles USING gin (phone gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON public.refunds USING btree (order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON public.refunds USING btree (payment_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking_number_trgm ON public.shipments USING gin (tracking_number gin_trgm_ops);