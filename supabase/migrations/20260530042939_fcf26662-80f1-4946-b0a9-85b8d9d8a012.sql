CREATE OR REPLACE FUNCTION public.notify_staff_new_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.notify_roles(
    ARRAY['admin','super_admin','manager','support']::app_role[],
    'review',
    'New product review',
    'A customer left a ' || NEW.rating || '★ review on ' || NEW.product_slug,
    '/products/' || NEW.product_slug,
    jsonb_build_object('review_id', NEW.id, 'product_slug', NEW.product_slug, 'rating', NEW.rating)
  );
  RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.notify_staff_new_question()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.notify_roles(
    ARRAY['admin','super_admin','manager','support']::app_role[],
    'question',
    'New product question',
    'A customer asked a question on ' || NEW.product_slug,
    '/products/' || NEW.product_slug,
    jsonb_build_object('question_id', NEW.id, 'product_slug', NEW.product_slug)
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_staff_new_review ON public.product_reviews;
CREATE TRIGGER trg_notify_staff_new_review
AFTER INSERT ON public.product_reviews
FOR EACH ROW EXECUTE FUNCTION public.notify_staff_new_review();

DROP TRIGGER IF EXISTS trg_notify_staff_new_question ON public.product_questions;
CREATE TRIGGER trg_notify_staff_new_question
AFTER INSERT ON public.product_questions
FOR EACH ROW EXECUTE FUNCTION public.notify_staff_new_question();