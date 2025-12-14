-- Drop the existing constraint
ALTER TABLE public.books DROP CONSTRAINT IF EXISTS books_category_check;

-- Add the new constraint including 'Basic Science & Humanities'
ALTER TABLE public.books ADD CONSTRAINT books_category_check 
CHECK (category IN ('computer', 'robotics', 'electrical', 'architecture', 'Basic Science & Humanities'));
