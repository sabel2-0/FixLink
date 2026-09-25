# FixLink

Scaffolded automatically. Follow these steps in order before running the app.

## 1. Create your Supabase project
Go to https://supabase.com, create a new project, and note your project URL and anon key
(Settings > API).

## 2. Run the database migration
Open Supabase Dashboard > SQL Editor, paste the contents of
`supabase/migrations/0001_init.sql`, and run it.

## 3. Create the storage bucket
Dashboard > Storage > New bucket:
  - Name: `certs`
  - Public: OFF

The storage policies for it are already included at the bottom of the migration file above —
run the migration AFTER creating the bucket (storage policies reference it by name).

## 4. Enable email verification
Dashboard > Authentication > Providers > Email > turn ON "Confirm email".
Dashboard > Authentication > URL Configuration:
  - Site URL: http://localhost:3000
  - Redirect URLs: http://localhost:3000/auth/callback

## 5. Fill in your environment variables
Edit `.env.local` (already created from `.env.local.example`) with your real
Supabase URL, anon key, and service role key.

## 6. Generate real TypeScript types (optional but recommended)
```
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.types.ts
```

## 7. Run the app
```
npm run dev
```
Visit http://localhost:3000/register, sign up as a technician, upload a fake PDF as
a certificate, then log in as an admin (create one manually by updating a row's `role`
to `admin` in the `profiles` table) and visit /admin/technicians to verify it.

## What's built already
- Full folder structure for customer / technician / admin areas
- Supabase client + server helpers, role-based middleware
- Registration with technician NC2 certificate upload to private storage
- Email verification flow (Supabase-native) with callback route
- Admin technician certificate review page (view file, verify/reject)
- SQL schema + RLS policies + storage policies + auto-profile trigger
- CSS variables and utility classes ported from the prototype

## What's still a placeholder
- Customer booking wizard (`src/app/app/book`)
- Bookings list/detail, estimates, quotes, chat, live map, reviews, commissions,
  disputes, audit log screens

Build these next, screen by screen, wiring each to Supabase via TanStack Query hooks
in `src/hooks/`.
