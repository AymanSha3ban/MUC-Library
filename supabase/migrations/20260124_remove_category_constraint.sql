-- Drop the restrictive category constraint to allow dynamic department names
ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_category_check;
