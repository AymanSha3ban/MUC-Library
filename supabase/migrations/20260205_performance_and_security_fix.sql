-- ==============================================================================
-- 🛠️ PERFORMANCE & SECURITY OPTIMIZATION MIGRATION
-- ==============================================================================
-- This script addresses:
-- 1. "Auth RLS Initialization Plan" warnings by wrapping auth calls in subqueries (init plans).
-- 2. "Multiple Permissive Policies" on public.users by consolidating them.
-- 3. "Unindexed Foreign Keys" by adding missing indexes.

BEGIN;

-- ==============================================================================
-- 1. OPTIMIZE PUBLIC.USERS RLS (Consolidation + Init Plans)
-- ==============================================================================

-- Drop existing policies to remove overlaps and performance bottlenecks
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role has full access" ON public.users;
-- Also drop any potentially conflicting "permissive" policies mentioned in warnings if their names differ
-- (Note: Standard Supabase templates might have "Can view own user data", checking mostly for standard names)

-- Consolidated SELECT Policy:
-- Combines "View Own Profile" and "Admin View All" into one optimized policy.
-- Uses (select auth.uid()) for stability.
CREATE POLICY "Users and admins can view profiles" ON public.users
FOR SELECT USING (
  (select auth.uid()) = id
  OR
  (select auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Optimized UPDATE Policy:
-- Wraps auth.uid() in a subquery.
CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (
  (select auth.uid()) = id
);

-- ==============================================================================
-- 2. OPTIMIZE PUBLIC.RATINGS RLS (Init Plans)
-- ==============================================================================

-- Drop existing policies (assuming standard naming from ratings_schema.sql)
DROP POLICY IF EXISTS "Users can read all ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON public.ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.ratings;

-- View: Public/Authenticated read access (unchanged logic, usually public)
CREATE POLICY "Users can read all ratings" ON public.ratings
FOR SELECT USING (true);

-- Insert: Wrap auth.uid()
CREATE POLICY "Users can insert their own ratings" ON public.ratings
FOR INSERT WITH CHECK (
  (select auth.uid()) = user_id
);

-- Update: Wrap auth.uid()
CREATE POLICY "Users can update their own ratings" ON public.ratings
FOR UPDATE USING (
  (select auth.uid()) = user_id
);

-- Delete: Wrap auth.uid()
CREATE POLICY "Users can delete their own ratings" ON public.ratings
FOR DELETE USING (
  (select auth.uid()) = user_id
);

-- ==============================================================================
-- 3. OPTIMIZE PUBLIC.DEPARTMENTS RLS (Init Plans + Security Check)
-- ==============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access" ON public.departments;
DROP POLICY IF EXISTS "Allow admin insert access" ON public.departments;
DROP POLICY IF EXISTS "Allow admin update access" ON public.departments;
DROP POLICY IF EXISTS "Allow admin delete access" ON public.departments;

-- Read: Public access
CREATE POLICY "Allow public read access" ON public.departments
FOR SELECT USING (true);

-- Write (Insert, Update, Delete): Restrict to Admin
-- Previous implementation might have been just "authenticated", but for "Admin access"
-- and security best practices, we use the admin role check wrapped in a subquery.
CREATE POLICY "Allow admin insert access" ON public.departments
FOR INSERT WITH CHECK (
  (select auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Allow admin update access" ON public.departments
FOR UPDATE USING (
  (select auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Allow admin delete access" ON public.departments
FOR DELETE USING (
  (select auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- ==============================================================================
-- 4. ADD MISSING INDEXES
-- ==============================================================================

-- public.books (college_id)
CREATE INDEX IF NOT EXISTS idx_books_college_id ON public.books(college_id);

-- public.departments (college_id)
CREATE INDEX IF NOT EXISTS idx_departments_college_id ON public.departments(college_id);

-- public.ratings (book_id, user_id)
CREATE INDEX IF NOT EXISTS idx_ratings_book_id ON public.ratings(book_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);

COMMIT;
