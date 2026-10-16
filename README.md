# Chattr — Vercel deployment

## 1. Supabase setup (once)
1. Run every file in `supabase/migrations/` in the Supabase SQL editor (in order).
2. Authentication → Providers: enable **Google** (and **Apple**) with your OAuth credentials.
3. Authentication → URL Configuration:
   - Site URL: `https://<your-app>.vercel.app`
   - Redirect URLs: `https://<your-app>.vercel.app`, `https://*-<team>.vercel.app` (previews), `http://localhost:8080`
4. Make yourself admin (SQL editor):
   `INSERT INTO public.user_roles (user_id, role) SELECT id, 'admin' FROM auth.users WHERE email = 'you@example.com';`

## 2. Deploy to Vercel
1. Push this folder to GitHub and import it in Vercel (framework: Vite is auto-detected via `vercel.json`).
2. Project Settings → Environment Variables (all environments):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   (values are in `.env.example`)
3. Deploy. Env vars are baked in at build time, so redeploy after changing them.

## Local
```
cp .env.example .env
npm install
npm run dev   # http://localhost:8080
```
