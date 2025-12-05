# MUC Engineering Library

A full-stack digital library for MUC Engineering College, built with React (Vite) and Supabase.

## Features
- **Authentication**: University email verification (`@muc.edu.eg`) via QR code and email OTP.
- **Role-Based Access**: Students can view/download; Admins can manage books.
- **Library Management**: Upload books (PDFs + Covers) to Supabase Storage.
- **Interactive UI**: 3D elements, animations, and responsive design.
- **No Server Storage**: All files are stored in Supabase Storage buckets.

## Setup Instructions

### 1. Supabase Setup
1. Create a new Supabase project.
2. Go to the SQL Editor and run the content of `supabase/migrations/20240101000000_initial_schema.sql`.
3. Run the content of `supabase/storage_policies.sql` to create buckets and policies.
4. Get your Project URL and Anon Key from Project Settings > API.

### 2. Environment Variables
1. Copy `.env.example` to `.env` (or create `.env`).
2. Fill in your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### 3. Edge Functions
1. Install Supabase CLI.
2. Login: `supabase login`
3. Link your project: `supabase link --project-ref your-project-ref`
4. Set secrets for Edge Functions:
   ```bash
   supabase secrets set SUPABASE_URL=your_project_url
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   supabase secrets set SMTP_HOST=smtp.provider.com
   supabase secrets set SMTP_PORT=465
   supabase secrets set SMTP_USER=your_smtp_user
   supabase secrets set SMTP_PASS=your_smtp_password
   supabase secrets set FROM_EMAIL=library@muc.edu.eg
   supabase secrets set FRONTEND_URL=http://localhost:5173
   ```
5. Deploy functions:
   ```bash
   supabase functions deploy send-verification
   supabase functions deploy verify-token
   ```

### 4. Frontend Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Testing
- **Login**: Use any `@muc.edu.eg` email. Check your email (or logs if testing locally) for the code.
- **Admin**: The email `ayman.23120261@muc.edu.eg` is hardcoded as Admin. Login with this email to access the Dashboard.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS, Framer Motion, React Three Fiber.
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions).
# MUC-Library
