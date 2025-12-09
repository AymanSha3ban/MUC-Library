-- Update public.users table
UPDATE public.users
SET role = 'admin'
WHERE email = 'yasmin-abdelnaby@muc.edu.eg';

-- Update auth.users metadata (used by RLS policies)
UPDATE auth.users
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"role": "admin"}'::jsonb
    ELSE raw_user_meta_data || '{"role": "admin"}'::jsonb
  END
WHERE email = 'yasmin-abdelnaby@muc.edu.eg';
