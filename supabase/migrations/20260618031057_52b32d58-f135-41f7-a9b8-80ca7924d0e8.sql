-- Prevent non-staff customers from setting/altering staff-only answer fields on product_questions.
-- RLS WITH CHECK cannot reference OLD values, so enforce via a BEFORE UPDATE/INSERT trigger.

CREATE OR REPLACE FUNCTION public.guard_product_question_answer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_staff boolean;
BEGIN
  is_staff := has_any_role(auth.uid(), ARRAY['admin'::app_role, 'super_admin'::app_role, 'manager'::app_role, 'support'::app_role]);

  IF is_staff THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Non-staff may never create a question that already carries an answer attribution.
    NEW.answer := NULL;
    NEW.answered_by := NULL;
    NEW.answered_at := NULL;
    RETURN NEW;
  END IF;

  -- UPDATE by non-staff: forbid changes to staff-only answer fields.
  IF NEW.answer IS DISTINCT FROM OLD.answer
     OR NEW.answered_by IS DISTINCT FROM OLD.answered_by
     OR NEW.answered_at IS DISTINCT FROM OLD.answered_at THEN
    RAISE EXCEPTION 'Only staff can set or modify answer fields on product questions';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_product_question_answer ON public.product_questions;
CREATE TRIGGER trg_guard_product_question_answer
BEFORE INSERT OR UPDATE ON public.product_questions
FOR EACH ROW EXECUTE FUNCTION public.guard_product_question_answer();

-- Add an explicit WITH CHECK to the own-update policy so rows must remain owned by the caller.
DROP POLICY IF EXISTS "own question update" ON public.product_questions;
CREATE POLICY "own question update" ON public.product_questions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);