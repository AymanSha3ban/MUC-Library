-- ==============================================================================
-- 🛡️ SECURITY ADVISOR FIXES
-- ==============================================================================
-- This script addresses:
-- 1. "RLS references user_metadata" warning by replacing it with a secure DB lookup.
-- 2. "Function Search Path Mutable" warning for get_total_users.

BEGIN;

-- ==============================================================================
-- 1. SECURE ADMIN CHECK FUNCTION
-- ==============================================================================

-- Create a helper function to check admin status securely.
-- - SECURITY DEFINER: Runs as owner (postgres) to read the users table even if RLS blocks it.
-- - STABLE: Allows Supabase to cache the result within a transaction (init plan).
-- - SET search_path = public: Prevents search_path hijacking.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Check if the current user has the 'admin' role in the public.users table
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ==============================================================================
-- 2. UPDATE RLS POLICIES TO USE PUBLIC.IS_ADMIN()
-- ==============================================================================

-- A. PUBLIC.USERS
-- ------------------------------------------------------------------------------
-- Recreate the consolidated policy using the secure function
DROP POLICY IF EXISTS "Users and admins can view profiles" ON public.users;

CREATE POLICY "Users and admins can view profiles" ON public.users
FOR SELECT USING (
  (select auth.uid()) = id
  OR
  (select public.is_admin()) = true
);

-- B. PUBLIC.DEPARTMENTS
-- ------------------------------------------------------------------------------
-- Update admin access policies to use the secure function

DROP POLICY IF EXISTS "Allow admin insert access" ON public.departments;
DROP POLICY IF EXISTS "Allow admin update access" ON public.departments;
DROP POLICY IF EXISTS "Allow admin delete access" ON public.departments;

CREATE POLICY "Allow admin insert access" ON public.departments
FOR INSERT WITH CHECK (
  (select public.is_admin()) = true
);

CREATE POLICY "Allow admin update access" ON public.departments
FOR UPDATE USING (
  (select public.is_admin()) = true
);

CREATE POLICY "Allow admin delete access" ON public.departments
FOR DELETE USING (
  (select public.is_admin()) = true
);

-- C. PUBLIC.BOOKS (Ensure they are also secure if they exist)
-- ------------------------------------------------------------------------------
-- Assuming 'Admins can insert/update/delete books' policies exist from previous setup
-- We'll explicitly recreate them to ensure they use the secure check.

DROP POLICY IF EXISTS "Admins can insert books" ON public.books;
DROP POLICY IF EXISTS "Admins can update books" ON public.books;
DROP POLICY IF EXISTS "Admins can delete books" ON public.books;

-- If 'Admins can ...' policies didn't exist, this just ensures they are created securely.
-- Previous migration "fix_rls.sql" or "initial_schema" established these.

CREATE POLICY "Admins can insert books" ON public.books
FOR INSERT WITH CHECK (
  (select public.is_admin()) = true
);

CREATE POLICY "Admins can update books" ON public.books
FOR UPDATE USING (
  (select public.is_admin()) = true
);

CREATE POLICY "Admins can delete books" ON public.books
FOR DELETE USING (
  (select public.is_admin()) = true
);

-- D. STORAGE POLICIES (Optional but recommended)
-- ------------------------------------------------------------------------------
-- Storage policies often use metadata too. Let's fix them if we can, knowing the bucket names.
-- Based on 'fix_rls.sql': 'books-covers', 'books-pdfs'
-- We won't break the script if storage schema differs slightly, but we should try to be consistent.

-- NOTE: Storage policies are often on `storage.objects`. If we want to fix them, we need to target that table.
-- Since the user didn't explicitly flag storage errors in the screenshot (only table RLS), we will skip this for now
-- to avoid touching the global storage schema unnecessarily, unless requested.


-- ==============================================================================
-- 3. FIX MUTABLE SEARCH PATH ON GET_TOTAL_USERS
-- ==============================================================================

ALTER FUNCTION public.get_total_users() SET search_path = public;

COMMIT;
