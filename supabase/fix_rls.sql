-- Fix infinite recursion by using user_metadata for role check

-- 1. Fix Users Table Policies
DROP POLICY IF EXISTS "Admins can view all users" ON "public"."users";
DROP POLICY IF EXISTS "Users can view their own profile" ON "public"."users";
DROP POLICY IF EXISTS "Users can update their own profile" ON "public"."users";

CREATE POLICY "Users can view their own profile" ON "public"."users"
FOR SELECT USING (
  auth.uid() = id
);

CREATE POLICY "Users can update their own profile" ON "public"."users"
FOR UPDATE USING (
  auth.uid() = id
);

-- Use metadata for admin check to avoid recursion
CREATE POLICY "Admins can view all users" ON "public"."users"
FOR SELECT USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- 2. Fix Storage Policies
DROP POLICY IF EXISTS "Admin Upload Covers" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Covers" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Covers" ON storage.objects;

DROP POLICY IF EXISTS "Admin Upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete PDFs" ON storage.objects;

-- Re-create with metadata check
CREATE POLICY "Admin Upload Covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'books-covers' AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin Update Covers" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'books-covers' AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin Delete Covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'books-covers' AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin Upload PDFs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'books-pdfs' AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin Update PDFs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'books-pdfs' AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Admin Delete PDFs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'books-pdfs' AND
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
