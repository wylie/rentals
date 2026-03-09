# Deployment Guide (Vercel)

This project is optimized for Vercel hosting.

## 1. Connect the repository

1. In Vercel, click **Add New -> Project**.
2. Import this GitHub repository.
3. Keep framework preset as **Next.js**.

## 2. Configure environment variables

In **Project Settings -> Environment Variables**, add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (preferred)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy, optional)
- `NEXT_PUBLIC_APP_LOGIN_EMAIL`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` (optional, for analytics)
- `NEXT_PUBLIC_SITE_URL` (recommended: your production domain)

Apply them to **Production**, **Preview**, and **Development** as needed.

## 3. Redeploy

After saving env vars:

1. Go to **Deployments**.
2. Select latest deployment.
3. Click **Redeploy**.

The app will show "Setup Required" until `NEXT_PUBLIC_SUPABASE_URL` and either `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are valid.

## 4. Domain

Set your custom domain in **Project Settings -> Domains**.

If using `fleetrental.app`, set:

- `NEXT_PUBLIC_SITE_URL=https://fleetrental.app`

## 5. Local development

Keep the same variables in `.env.local` for local runs.

```bash
npm install
npm run dev
```
