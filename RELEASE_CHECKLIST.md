# Release Checklist

Use this checklist for each production deployment.

## 1. Pre-deploy

1. Confirm branch is up to date and changes are merged to `main`.
2. Confirm Vercel env vars are set for Production:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_APP_ADMIN_LOGIN_EMAIL`
   - `NEXT_PUBLIC_APP_STAFF_LOGIN_EMAIL` (if used)
   - `NEXT_PUBLIC_SITE_URL`
3. Confirm Supabase admin/staff users exist and PINs are current.

## 2. Deploy

1. Deploy from `main` in Vercel (or allow auto-deploy).
2. Wait for deployment status to become Ready.

## 3. Verification

1. Open `https://www.fleetrental.app/api/health` and verify status is `ok`.
2. Run smoke test:
   - `npm run smoke:prod`
3. Manual auth check:
   - Admin PIN logs in and can open full Settings tabs.
   - Staff PIN logs in and only sees PIN + Logout in Settings.
4. Validate main routes load:
   - `/`
   - `/front-desk`
   - `/bike-park/inventory`
   - `/bike-park/reports`

## 4. Rollback plan

1. If verification fails, redeploy previous successful Vercel deployment.
2. Re-check env vars and Supabase auth user mapping.
