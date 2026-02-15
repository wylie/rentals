# Supabase Setup Instructions

This project has been updated to use Supabase for cloud database storage, which means your reports and data will now sync across all devices where you log in.

## 1. Create a Supabase Account

1. Go to [supabase.com](https://supabase.com/)
2. Sign up for a free account
3. Create a new project

## 2. Set up the Database

1. In your Supabase dashboard, go to the **SQL Editor**
2. Copy the contents of `supabase-schema.sql` (in the project root)
3. Paste it into the SQL Editor and click **Run**

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
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key_here
```

## 5. Start the Development Server

```bash
npm run dev
```

## What Changed

### Authentication
- **Before**: Simple PIN-based authentication stored locally
- **Now**: Full email/password authentication with Supabase
- You can now sign up for an account and sign in from any device

### Data Storage
- **Before**: All data stored in browser's localStorage (device-specific)
- **Now**: All data stored in Supabase cloud database (synced across devices)
- Reports, inventory status, and session data are now shared across all devices

### Key Features
- ✅ **Cross-device sync**: Access your data from any iPad/device
- ✅ **Real-time updates**: Changes appear immediately on all connected devices
- ✅ **Secure authentication**: Each user has their own isolated data
- ✅ **Cloud backup**: Your data is safely stored in the cloud
- ✅ **Account management**: Sign up/sign in from any device

## First Time Setup

When you first sign up:
1. Create an account with email/password
2. The system will automatically create your initial inventory (40 bikes, 60 helmets)
3. Your reports will start tracking from that point forward

## Troubleshooting

### Environment Variables
Make sure your `.env.local` file has the correct Supabase URL and API key. The file should not have any quotes around the values.

### Database Setup
If you see authentication errors, make sure you've run the SQL schema in your Supabase project.

### Real-time Updates
If changes don't appear immediately on other devices, check your internet connection and ensure both devices are signed in to the same account.

## Security

- Each user's data is completely isolated using Row Level Security (RLS)
- Users can only access their own bikes, helmets, and rental sessions
- All API calls are automatically authenticated and authorized