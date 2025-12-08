-- Add type and external_link columns to books table

ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'free' CHECK (type IN ('free', 'paid')),
ADD COLUMN IF NOT EXISTS external_link TEXT;

-- Update existing rows to have type 'free' (already handled by default, but good to be explicit if needed)
UPDATE public.books SET type = 'free' WHERE type IS NULL;
