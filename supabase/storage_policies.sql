-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('books-pdfs', 'books-pdfs', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('books-covers', 'books-covers', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true);

-- Storage Policies

-- Profiles: Public read, User upload to own folder
CREATE POLICY "Public Profiles Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'profiles');

CREATE POLICY "User Upload Profile" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "User Update Profile" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Books Covers: Public read, Admin upload
CREATE POLICY "Public Covers Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'books-covers');

CREATE POLICY "Admin Upload Covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'books-covers' AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin Update Covers" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'books-covers' AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin Delete Covers" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'books-covers' AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Books PDFs: Public read (or restricted to students?), Admin upload
CREATE POLICY "Public PDFs Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'books-pdfs');

CREATE POLICY "Admin Upload PDFs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'books-pdfs' AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin Update PDFs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'books-pdfs' AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin Delete PDFs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'books-pdfs' AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
