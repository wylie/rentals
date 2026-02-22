# 🚀 Quick Deployment Guide

Your rental management system is ready to deploy to GitHub Pages!

## ✅ What's Been Done

- ✅ Removed Supabase dependency
- ✅ Implemented localStorage-based data storage
- ✅ Added cross-tab real-time synchronization
- ✅ Configured Next.js for static export
- ✅ Created GitHub Actions deployment workflow
- ✅ Added all necessary configuration files

## 🌐 Deploy to GitHub Pages (Free Hosting)

### Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and create a new repository
2. Name it `rentals` (or any name you prefer)
3. Make it **public** (required for free GitHub Pages)
4. **Don't** initialize with README (we already have one)

### Step 2: Push Your Code

```bash
# Initialize git repository
git init

# Add all files
git add .

# Make first commit
git commit -m "Initial commit: Local-only rental management system"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOURUSERNAME/rentals.git

# Push to GitHub
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** tab
3. Scroll down to **Pages** section in the sidebar
4. Under "Source", select **"GitHub Actions"**
5. **That's it!** The deployment will start automatically

### Step 4: Access Your Site

After 2-3 minutes, your site will be live at:

```
https://fleetrental.app/
```

## 📱 How to Use

### First Time Setup

1. Visit your deployed site
2. Enter PIN: `1234` (default)
3. The app will automatically create:
   - 40 bikes (Bike 01 - Bike 40)
   - 60 helmets (Helmet 01 - Helmet 60)

### Managing Inventory

- **Green buttons** = Available
- **Red buttons** = In Use
- **Tap any button** to toggle status
- **Station selector** tracks Front Desk vs Bike Park
- **Real-time sync** across browser tabs

### Viewing Reports

1. Click "Reports" in navigation
2. See today's and week's usage statistics
3. Click "Export CSV" for detailed data

## 🔄 Making Updates

Whenever you want to update your site:

```bash
# Make your changes, then:
git add .
git commit -m "Description of changes"
git push
```

GitHub will automatically rebuild and deploy your changes!

## 💡 Pro Tips

### Customization

- **Change PIN**: Edit `src/components/AuthScreen.tsx`
- **Adjust bike/helmet counts**: Edit `src/lib/localStorage.ts`
- **Modify stations**: Edit `src/components/StationSelector.tsx`

### Data Management

- **Data persists** in browser localStorage
- **Works offline** after first load
- **To reset data**: Clear browser data for your site
- **Cross-device**: Each device maintains its own data

### Troubleshooting

- **Build failing?** Check the Actions tab in your GitHub repository
- **Site not updating?** Wait a few minutes and hard refresh (Ctrl+F5)
- **Data not saving?** Ensure localStorage is enabled in browser

## 📊 Key Features

✅ **No Database Required** - Everything runs locally  
✅ **Real-time Updates** - Changes sync across tabs instantly  
✅ **Offline Ready** - Works without internet after loading  
✅ **Mobile Optimized** - Perfect for iPad and tablets  
✅ **Free Hosting** - GitHub Pages costs nothing  
✅ **Easy Updates** - Just push to GitHub to deploy  

---

**Your rental management system is now production-ready! 🎉**