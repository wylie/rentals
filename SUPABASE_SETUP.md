# Supabase Setup Instructions

This project has been updated to use Supabase for cloud database storage, which means your reports and data will now sync across all devices where you log in.

## 1. Create a Supabase Account

1. Go to [supabase.com](https://supabase.com/)
2. Sign up for a free account
3. Create a new project

## 2. Set up the Database

1. In your Supabase dashboard, go to the **SQL Editor**
2. Run `supabase-subcategories.sql` to enable subcategory sync across devices
3. Run `supabase-app-settings.sql` to sync company name and session timeout across devices
4. Run `supabase-bike-return-checks.sql` to store Bike Park return checklists

This will create all the necessary tables and security policies.

## 3. Get Your Supabase Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL**
   - **anon public key**
## 4. Configure Environment Variables

1. Open the `.env.local` file in your project
2. Replace the placeholder values with your actual Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_project_url_here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_actual_supabase_publishable_key_here
# Optional legacy fallback if needed:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
NEXT_PUBLIC_APP_LOGIN_EMAIL=shared-login@example.com
```

For Vercel production/preview deployments, add the same keys in **Project Settings -> Environment Variables** and redeploy.

## 5. Start the Development Server

```bash
npm run dev
```

## What Changed

### Authentication
- **Now**: Shared PIN authentication with Supabase
- A single app login email is used behind the scenes
- The PIN can be changed from the Settings screen in the app

### Data Storage
- **Before**: All data stored in browser's localStorage (device-specific)
- **Now**: All data stored in Supabase cloud database (synced across devices)
- Reports, inventory status, and session data are now shared across all devices

### Key Features
- ✅ **Cross-device sync**: Access your data from any iPad/device
- ✅ **Automatic updates**: Changes appear on all devices within 3 seconds
- ✅ **Cloud backup**: Your data is safely stored in the cloud
- ✅ **Shared PIN authentication**: Simple login from any device

## First Time Setup

1. Create a Supabase Auth user for your shared login email
2. Set its password to the default PIN (1234)
3. The system will automatically create your initial inventory (40 bikes, 60 helmets)
4. Your reports will start tracking from that point forward

## Troubleshooting

### Environment Variables
Make sure your `.env.local` file has the correct Supabase URL and API key. The file should not have any quotes around the values.

### Database Setup
If you see authentication errors, make sure you've run the SQL schema in your Supabase project.

### Multi-Device Sync
Changes on one device will appear on other devices within 3 seconds automatically. Make sure both devices are logged in with the same PIN.

## Security

- Each user's data is completely isolated using Row Level Security (RLS)
- Users can only access their own bikes, helmets, and rental sessions
- All API calls are automatically authenticated and authorized