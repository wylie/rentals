# Rental Management System

A modern bike and helmet rental management system built with Next.js and Supabase, designed specifically for iPad use with cross-device synchronization.

## 🎯 Key Features

- **Cross-Device Sync**: Access your data from any device - reports and inventory status sync automatically
- **Real-Time Updates**: Changes appear instantly on all connected devices
- **Live Inventory Management**: Easy-to-use interface for checking bikes and helmets in/out
- **Comprehensive Reports**: Track usage statistics with daily and weekly summaries
- **User Authentication**: Secure email/password login system
- **Station Management**: Support for multiple stations (frontdesk, bikepark)
- **CSV Export**: Export usage reports for further analysis

## 🗂️ What Changed

This project has been upgraded from local storage to cloud-based data storage:

### Before (Local Storage)
- ❌ Data stored only on current device
- ❌ Reports separate for each iPad
- ❌ No cross-device synchronization
- ❌ Simple PIN authentication

### After (Supabase Cloud Database)
- ✅ Data synced across all devices
- ✅ Reports accessible from anywhere
- ✅ Real-time cross-device updates
- ✅ Secure email/password authentication
- ✅ Cloud backup of all data

## 🚀 Quick Start

### 1. Set Up Supabase (Required for cross-device sync)

1. Create a free account at [supabase.com](https://supabase.com/)
2. Create a new project
3. In the SQL Editor, run the required SQL files in this project root:
	- `supabase-subcategories.sql`
	- `supabase-app-settings.sql`
	- `supabase-bike-return-checks.sql`
4. Get your project URL and API key from Settings → API
5. Update `.env.local` with your credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_actual_supabase_publishable_key
# Optional legacy fallback if needed:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
NEXT_PUBLIC_APP_ADMIN_LOGIN_EMAIL=admin@example.com
# Optional staff account with separate PIN:
# NEXT_PUBLIC_APP_STAFF_LOGIN_EMAIL=staff@example.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SITE_URL=https://fleetrental.app
```

Use your own GA4 Measurement ID from Google Analytics (Data Streams → Web).

For Vercel deployment, add the same variables in Project Settings → Environment Variables and redeploy.

### 2. Install and Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run smoke checks (local)
npm run smoke
```

## 🚢 Operations (Vercel)

- **Health endpoint**: `/api/health` returns environment readiness and status.
- **Smoke tests**:
	- `npm run smoke` (defaults to `http://localhost:3000`)
	- `npm run smoke:prod` (checks `https://www.fleetrental.app`)
- **Release checklist**: See `RELEASE_CHECKLIST.md` for deployment and post-deploy verification steps.

### 3. First Time Setup

1. Open the app in your browser
2. Sign up for a new account
3. The system will automatically create 40 bikes and 60 helmets
4. Start tracking rentals!

## 📱 Usage

### Authentication
- Sign up with email/password on first use
- Sign in from any device with the same credentials
- All your data will be available across devices

### Inventory Management
- **Green items**: Available for checkout
- **Red items**: Currently in use
- Tap any item to check in/out
- Changes sync automatically to all devices

### Reports
- View daily and weekly usage statistics
- Export data as CSV files
- Reports are shared across all your devices

### Settings
- Configure session timeout (how long you stay logged in)
- Switch between stations (frontdesk, bikepark)
- Logout securely

## 📊 Google Analytics (GA4)

This app is configured for GA4 route-level tracking and custom operational events.

### Required env vars

Set these in `.env.local` (and in deployment env vars):

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SITE_URL=https://fleetrental.app
```

### What is tracked

- **Page views (manual SPA tracking)** for route changes and query changes:
	- `/` (PIN page)
	- `/front-desk`
	- `/bike-park`
	- `/bike-park/inventory`
	- `/bike-park/reports`
- **Auth events**:
	- `login_attempt` (method: `pin`)
	- `login` (method: `pin`)
	- `login_failed` (reasons: `pin_too_short`, `invalid_pin`, `unexpected_error`)
- **Navigation/operations events** already in app, including settings, fleet updates, report clearing, and section/view changes.
- **Home redirect event**:
	- `redirected_from_home_to_front_desk` when an already-authenticated user hits `/`.

### Recommended GA4 configuration

In GA4 Admin:

1. Go to **Events** and mark important events as **Key events** (formerly conversions), for example:
	 - `login`
	 - `reports_cleared`
	 - `fleet_updated`
2. Create custom dimensions for frequently used event parameters (scope: Event), for example:
	 - `section`
	 - `view`
	 - `reason`
	 - `settings_tab`
3. Build a standard report or Exploration using:
	 - Dimension: **Page path + query string**
	 - Metrics: **Views**, **Users**, **Event count**

### Quick validation checklist

- Open **Realtime** in GA4.
- Visit `/`, then `/front-desk`, `/bike-park/inventory`, `/bike-park/reports`.
- Confirm each route appears as a distinct page path.
- Trigger a login failure/success and confirm `login_failed` / `login` events appear.

### Dev-only debug toggle

In local development, a floating **GA Debug** button appears in the bottom-right corner.

- Toggle it **On** to log all tracked page views and events to the browser console.
- State is persisted in `localStorage` with key `ga_debug_mode`.
- This toggle is hidden automatically outside development mode.

## 🆕 Recent Updates

- UI refactored for improved alignment and modern select menu styling
- Subcategory assignment is now absolute, with dropdown-based asset counts and auto-partitioning
- Material Symbols Outlined used for consistent iconography
- Bug fixes for asset assignment, modal logic, and build-blocking syntax errors
- Reports page select menu updated to match new UI style

## 📋 Database Schema

The system uses these main tables:
- **assets**: Bikes and helmets with user isolation
- **asset_states**: Current status of each item
- **sessions**: Rental history and tracking

All data is secured with Row Level Security (RLS) - users can only access their own data.

## 🔧 Configuration Files

- `/.env.local` - Supabase credentials
- `/supabase-subcategories.sql` - Subcategory sync schema script
- `/supabase-app-settings.sql` - App settings sync schema script
- `/supabase-bike-return-checks.sql` - Bike Park return checklist schema script
- `/SUPABASE_SETUP.md` - Detailed setup instructions

## 🛠️ Development

Built with:
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Supabase** - Database and authentication

## 📖 Documentation

For detailed setup instructions, see:
- `SUPABASE_SETUP.md` - Complete Supabase configuration guide

## 🆘 Troubleshooting

### "Setup Required" Screen
- Make sure you've created a Supabase project
- Update `.env.local` with your actual credentials
- Restart the development server

### Authentication Issues
- Verify your Supabase project is configured correctly
- Check that you've run the SQL schema
- Ensure your email is verified (check spam folder)

### Data Not Syncing
- Check internet connection on both devices
- Ensure both devices are signed in to the same account
- Try refreshing the page

## 📄 License

This project is private and proprietary.