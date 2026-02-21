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
3. In the SQL Editor, run the contents of `supabase-schema.sql`
4. Run `supabase-subcategories.sql` to sync subcategories across devices
5. Run `supabase-app-settings.sql` to sync app settings (company name/session timeout) across devices
6. Run `supabase-bike-return-checks.sql` to store Bike Park return checklists
7. Get your project URL and API key from Settings → API
8. Update `.env.local` with your credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
```

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
```

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

## 📋 Database Schema

The system uses these main tables:
- **assets**: Bikes and helmets with user isolation
- **asset_states**: Current status of each item
- **sessions**: Rental history and tracking

All data is secured with Row Level Security (RLS) - users can only access their own data.

## 🔧 Configuration Files

- `/.env.local` - Supabase credentials
- `/supabase-schema.sql` - Database setup script
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
- `supabase-schema.sql` - Database schema

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