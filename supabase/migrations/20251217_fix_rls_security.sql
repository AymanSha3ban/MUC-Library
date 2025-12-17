-- ==========================================
-- 🛠️ Fix RLS Security Issues
-- ==========================================

-- 1. Create is_admin() function
-- -----------------------------
-- This function securely checks if the current user is an admin by querying the public.users table.
-- It is defined as SECURITY DEFINER to run with the privileges of the creator (postgres),
-- allowing it to bypass RLS on public.users to check the role.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix Users Table Policies
-- ---------------------------
-- Drop existing insecure policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users; -- From initial schema
-- Note: "Users can view their own profile" and "Users can update their own profile" are usually fine if they use auth.uid() = id

-- Re-create Admin policy
CREATE POLICY "Admins can view all users" ON public.users
FOR SELECT USING (
  public.is_admin()
);

-- Ensure other user policies are present and correct (idempotent)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
FOR SELECT USING (
  auth.uid() = id
);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (
  auth.uid() = id
);

-- 3. Fix Books Table Policies
-- ---------------------------
-- Drop existing insecure policies
DROP POLICY IF EXISTS "Admins can insert books" ON public.books;
DROP POLICY IF EXISTS "Admins can update books" ON public.books;
DROP POLICY IF EXISTS "Admins can delete books" ON public.books;

-- Re-create Admin policies using is_admin()
CREATE POLICY "Admins can insert books" ON public.books
FOR INSERT WITH CHECK (
  public.is_admin()
);

CREATE POLICY "Admins can update books" ON public.books
FOR UPDATE USING (
  public.is_admin()
);

CREATE POLICY "Admins can delete books" ON public.books
FOR DELETE USING (
  public.is_admin()
);

-- Ensure public read access exists
DROP POLICY IF EXISTS "Books are viewable by everyone" ON public.books;
CREATE POLICY "Books are viewable by everyone" ON public.books
FOR SELECT USING (true);


-- 4. Fix Colleges Table Policies
-- ------------------------------
-- Drop existing insecure policies
DROP POLICY IF EXISTS "Admins can insert colleges" ON public.colleges;
DROP POLICY IF EXISTS "Admins can update colleges" ON public.colleges;
DROP POLICY IF EXISTS "Admins can delete colleges" ON public.colleges;

-- Re-create Admin policies using is_admin()
CREATE POLICY "Admins can insert colleges" ON public.colleges
FOR INSERT WITH CHECK (
  public.is_admin()
);

CREATE POLICY "Admins can update colleges" ON public.colleges
FOR UPDATE USING (
  public.is_admin()
);

CREATE POLICY "Admins can delete colleges" ON public.colleges
FOR DELETE USING (
  public.is_admin()
);

-- Ensure public read access exists
DROP POLICY IF EXISTS "Allow public read access on colleges" ON public.colleges;
CREATE POLICY "Allow public read access on colleges" ON public.colleges
FOR SELECT USING (true);


-- 5. Fix Storage Policies
-- -----------------------
-- Drop existing insecure policies
DROP POLICY IF EXISTS "Admin Upload Books Content" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Books Content" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Books Content" ON storage.objects;

-- Re-create Admin policies using is_admin()
CREATE POLICY "Admin Upload Books Content" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id IN ('books-covers', 'books-pdfs') AND
  public.is_admin()
);

CREATE POLICY "Admin Update Books Content" ON storage.objects
FOR UPDATE USING (
  bucket_id IN ('books-covers', 'books-pdfs') AND
  public.is_admin()
);

CREATE POLICY "Admin Delete Books Content" ON storage.objects
FOR DELETE USING (
  bucket_id IN ('books-covers', 'books-pdfs') AND
  public.is_admin()
);
