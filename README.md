# MUC University Library

A comprehensive, full-stack digital library system designed for MUC University, serving Engineering, Nursing, Physical Therapy, and Business colleges. Built with React (Vite) and Supabase.

## Features

### 📚 Multi-College Support
- **Dynamic Filtering:** Resources are organized by college (Engineering, Nursing, Physical Therapy, Business).
- **Specialized Sections:** Dedicated handling for "Basic Science & Humanities" across all colleges.
- **Global Access:** Seamless navigation between different college libraries.

### 🎨 Advanced UI/UX
- **Cinematic Experience:** 3D interactive book animations using **React Three Fiber**.
- **Modern Design:** Glassmorphism effects, rich gradients, and smooth transitions powered by **Framer Motion**.
- **Responsive Layout:** Fully optimized for desktop, tablet, and mobile devices.

### 🔐 Secure Authentication
- **University Verification:** Exclusive access for `@muc.edu.eg` email addresses.
- **Dual-Factor Auth:** Secure login via QR code scanning and email OTP verification.
- **Role-Based Access Control (RBAC):**
    - **Students:** View, search, and download resources.
    - **Admins:** Manage book inventory, upload resources, and edit metadata.

### 🛠️ Library Management
- **Admin Dashboard:** Powerful interface for adding, editing, and categorizing books.
- **Cloud Storage:** Secure hosting of PDF files and cover images via **Supabase Storage**.
- **Format Support:** Handles Digital (PDF), Physical, and External (Paid) book formats.

### 👥 Meet the Developers
- **Professional Credits:** A dedicated page showcasing the development team.
- **Academic Supervision:** Acknowledgment of the academic supervisors who guided the project.

## Tech Stack

- **Frontend:**
    - [React](https://reactjs.org/) (Vite)
    - [TailwindCSS](https://tailwindcss.com/)
    - [Framer Motion](https://www.framer.com/motion/)
    - [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
    - [Lucide React](https://lucide.dev/)

- **Backend:**
    - [Supabase](https://supabase.com/) (PostgreSQL Database, Auth, Storage, Edge Functions)

## Setup Instructions

### 1. Supabase Setup
1. Create a new Supabase project.
2. Go to the SQL Editor and run the content of `supabase/migrations/20240101000000_initial_schema.sql`.
3. Run the content of `supabase/storage_policies.sql` to create buckets and policies.
4. Get your **Project URL** and **Anon Key** from Project Settings > API.

### 2. Environment Variables
1. Copy `.env.example` to `.env` (or create `.env`).
2. Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   ```

### 3. Edge Functions (Optional for Auth)
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
- **Login:** Use any `@muc.edu.eg` email. Check your email (or logs if testing locally) for the OTP code.
- **Admin Access:** The email `ayman.23120261@muc.edu.eg` is configured as a Super Admin. Login with this email to access the Admin Dashboard.

---
&copy; 2025 MUC University. All Rights Reserved.

**Developed by [Ayman Shaaban](https://www.linkedin.com/in/ayman-shaaban-204516273/)**
