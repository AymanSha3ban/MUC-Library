-- ==========================================
-- 🛠️ Comprehensive RLS Fix Script
-- Run this script in the Supabase SQL Editor
-- ==========================================

-- 1. Fix Users Table Policies
-- ---------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role has full access" ON public.users;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" ON public.users
FOR SELECT USING (
  auth.uid() = id
);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
FOR UPDATE USING (
  auth.uid() = id
);

-- Allow admins to view all users (using metadata to avoid recursion)
CREATE POLICY "Admins can view all users" ON public.users
FOR SELECT USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 2. Fix Books Table Policies
-- ---------------------------
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Books are viewable by everyone" ON public.books;
DROP POLICY IF EXISTS "Admins can insert books" ON public.books;
DROP POLICY IF EXISTS "Admins can update books" ON public.books;
DROP POLICY IF EXISTS "Admins can delete books" ON public.books;

-- Public read access
CREATE POLICY "Books are viewable by everyone" ON public.books
FOR SELECT USING (true);

-- Admin write access (using metadata)
CREATE POLICY "Admins can insert books" ON public.books
FOR INSERT WITH CHECK (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can update books" ON public.books
FOR UPDATE USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admins can delete books" ON public.books
FOR DELETE USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 3. Fix Storage Policies
-- -----------------------
-- Note: You must ensure buckets 'books-covers', 'books-pdfs', and 'profiles' exist.

DROP POLICY IF EXISTS "Admin Upload Covers" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Covers" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Covers" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete PDFs" ON storage.objects;
DROP POLICY IF EXISTS "User Upload Profile" ON storage.objects;
DROP POLICY IF EXISTS "User Update Profile" ON storage.objects;
DROP POLICY IF EXISTS "Public View Profiles" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Books Content" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Books Content" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Books Content" ON storage.objects;
DROP POLICY IF EXISTS "Public View Covers" ON storage.objects;

-- Admin access for Books Content
CREATE POLICY "Admin Upload Books Content" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id IN ('books-covers', 'books-pdfs') AND
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin Update Books Content" ON storage.objects
FOR UPDATE USING (
  bucket_id IN ('books-covers', 'books-pdfs') AND
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "Admin Delete Books Content" ON storage.objects
FOR DELETE USING (
  bucket_id IN ('books-covers', 'books-pdfs') AND
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- User access for Profiles
-- Allow users to upload to their own folder: profiles/{user_id}/*
CREATE POLICY "User Upload Profile" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profiles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "User Update Profile" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profiles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public to view profiles (or restricted to authenticated users if preferred)
CREATE POLICY "Public View Profiles" ON storage.objects
FOR SELECT USING (
  bucket_id = 'profiles'
);

-- Public view for book covers
CREATE POLICY "Public View Covers" ON storage.objects
FOR SELECT USING (
  bucket_id = 'books-covers'
);
