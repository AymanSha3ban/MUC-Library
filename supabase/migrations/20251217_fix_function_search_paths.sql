-- ==========================================
-- 🛠️ Fix Function Search Path Mutable Warnings
-- ==========================================

-- 1. Fix is_admin()
-- -----------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- 2. Fix increment_read_count()
-- -----------------------------
CREATE OR REPLACE FUNCTION public.increment_read_count(book_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.books
  SET read_count = COALESCE(read_count, 0) + 1
  WHERE id = book_id;
END;
$$;

-- 3. Fix update_book_average_rating()
-- -----------------------------------
CREATE OR REPLACE FUNCTION public.update_book_average_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    avg_rating NUMERIC;
BEGIN
    SELECT AVG(rating) INTO avg_rating
    FROM public.ratings
    WHERE book_id = COALESCE(NEW.book_id, OLD.book_id);

    UPDATE public.books
    SET rating = COALESCE(ROUND(avg_rating, 1), 0)
    WHERE id = COALESCE(NEW.book_id, OLD.book_id);

    RETURN NULL;
END;
$$;
