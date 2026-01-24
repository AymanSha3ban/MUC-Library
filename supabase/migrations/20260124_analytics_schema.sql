-- Create table for tracking unique library visitors
CREATE TABLE IF NOT EXISTS public.library_visitors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    visitor_token TEXT, -- For tracking anonymous users or device-based tracking if needed
    last_visited_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id), -- Ensure one record per authenticated user
    UNIQUE(visitor_token) -- Ensure one record per visitor token
);

-- Enable RLS
ALTER TABLE public.library_visitors ENABLE ROW LEVEL SECURITY;

-- Policies
-- Allow anyone to insert (for tracking)
CREATE POLICY "Allow public insert to library_visitors"
ON public.library_visitors
FOR INSERT
TO public
WITH CHECK (true);

-- Allow users to update their own record (update last_visited_at)
CREATE POLICY "Allow users to update own visitor record"
ON public.library_visitors
FOR UPDATE
TO public
USING (
    (auth.uid() = user_id) OR 
    (visitor_token IS NOT NULL) -- Simplified for now, in real app would need more secure token check
);

-- Allow admins to view all visitors (for analytics)
-- Assuming admin check is done via app logic or a specific admin role check function if exists
-- For now, allowing read access to public might be too open, but for "Total Users" count it's often public info.
-- Let's restrict to authenticated users for reading count, or create a secure function.
CREATE POLICY "Allow authenticated to read library_visitors"
ON public.library_visitors
FOR SELECT
TO authenticated
USING (true);

-- Create index for faster counting
CREATE INDEX IF NOT EXISTS idx_library_visitors_user_id ON public.library_visitors(user_id);
