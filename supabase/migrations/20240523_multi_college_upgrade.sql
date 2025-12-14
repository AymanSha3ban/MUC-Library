-- 1. Create colleges table
CREATE TABLE IF NOT EXISTS public.colleges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS on colleges
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

-- 3. Policies for colleges
-- Allow public read access
CREATE POLICY "Allow public read access on colleges"
ON public.colleges FOR SELECT
TO public
USING (true);

-- Allow admin full access
CREATE POLICY "Admins can insert colleges" ON public.colleges
FOR INSERT WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can update colleges" ON public.colleges
FOR UPDATE USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can delete colleges" ON public.colleges
FOR DELETE USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 4. Insert default colleges
INSERT INTO public.colleges (name) VALUES
('Engineering'),
('Nursing'),
('Physical Therapy'),
('Business')
ON CONFLICT (name) DO NOTHING;

-- 5. Update books table
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES public.colleges(id),
ADD COLUMN IF NOT EXISTS book_format TEXT DEFAULT 'digital' CHECK (book_format IN ('digital', 'external', 'physical')),
ADD COLUMN IF NOT EXISTS shelf_location TEXT;

-- 6. Migrate existing books
-- Assign all existing books to 'Engineering' college
DO $$
DECLARE
    engineering_id UUID;
BEGIN
    SELECT id INTO engineering_id FROM public.colleges WHERE name = 'Engineering';
    
    IF engineering_id IS NOT NULL THEN
        UPDATE public.books 
        SET college_id = engineering_id 
        WHERE college_id IS NULL;
    END IF;
    
    -- Update book_format based on existing type
    UPDATE public.books
    SET book_format = CASE 
        WHEN type = 'paid' THEN 'external'
        ELSE 'digital'
    END
    WHERE book_format IS NULL OR book_format = 'digital'; -- Only update if not already set or default
END $$;
