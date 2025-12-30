-- Secure verifications table
-- Ensure the table exists (it should from initial schema, but good to be safe)
CREATE TABLE IF NOT EXISTS public.verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies if any (to be safe)
DROP POLICY IF EXISTS "Service role has full access to verifications" ON public.verifications;
DROP POLICY IF EXISTS "Everyone can insert verifications" ON public.verifications;

-- Create strict policies
-- Only the service role (Edge Functions) should be able to insert/select/update
-- We do NOT want public access to this table
CREATE POLICY "Service role full access" ON public.verifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- If we need the client to read it (e.g. for verifying token), we might need a specific policy
-- But the current flow seems to use Edge Function for verification too, so no public access needed.
