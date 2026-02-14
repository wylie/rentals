# Rentals Management System

A responsive web application for managing bike and helmet inventory, optimized for iPad usage. No external database required - all data is stored locally in the browser.

## 🌟 Features

- **Live Inventory**: Grid view of all bikes (01-40) and helmets (01-60) with real-time availability status
- **Reports**: Usage analytics for today and last 7 days with CSV export functionality  
- **Cross-Tab Updates**: Real-time synchronization across multiple browser tabs using localStorage events
- **Station Selector**: Switch between Front Desk and Bike Park stations (persisted locally)
- **Simple Authentication**: PIN-based access control (default: 1234)
- **Offline Ready**: Works completely offline - no internet connection required after initial load

## 🚀 Live Demo

Visit the live demo at: `https://yourusername.github.io/rentals/`

## 📋 How It Works

1. **First Visit**: App automatically creates sample data (40 bikes + 60 helmets) 
2. **Asset Management**: Tap any asset button to toggle between Available/In Use
3. **Session Tracking**: Each checkout/return creates a session record with timestamps and station info
4. **Data Persistence**: All data stored in browser's localStorage - survives page refreshes
5. **Cross-Tab Sync**: Changes in one tab instantly appear in other open tabs

## 🛠 Tech Stack

- **Frontend**: Next.js 14 with React and TypeScript
- **Styling**: Tailwind CSS for responsive design
- **Data**: localStorage with cross-tab event synchronization 
- **Deployment**: GitHub Pages with static export

## 🏃‍♂️ Quick Start

### Development

```bash
# Clone the repository
git clone https://github.com/yourusername/rentals.git
cd rentals

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Deployment to GitHub Pages

1. **Fork this repository** or create your own from this template

2. **Enable GitHub Pages**:
   - Go to your repository Settings
   - Navigate to "Pages" section
   - Set Source to "GitHub Actions"

3. **Deploy**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

4. **Access your site** at: `https://yourusername.github.io/rentals/`

The GitHub Action will automatically build and deploy your site whenever you push to the main branch.

## 📱 Usage

### Authentication
- Default PIN: `1234`
- Can be customized in the code or environment variable

### Managing Inventory
- **Green buttons**: Available assets
- **Red buttons**: Assets currently in use  
- **Tap to toggle**: Instantly switch between available/in-use
- **Station tracking**: Records which station (Front Desk/Bike Park) handled each transaction

### Reports
- View today's usage statistics
- See 7-day rolling totals
- Export detailed CSV reports
- All calculations done in real-time from stored session data

### Data Management
- **Automatic initialization**: Sample data created on first visit
- **Persistent storage**: Data survives browser restarts
- **Cross-tab sync**: Changes sync instantly across tabs
- **Manual reset**: Clear browser data to reset to initial state

## 🔧 Customization

### Changing Asset Counts

Edit `src/lib/localStorage.ts` to adjust the number of bikes or helmets:

```typescript
// Current: 40 bikes, 60 helmets
const bikes: Asset[] = Array.from({ length: 40 }, ...)
const helmets: Asset[] = Array.from({ length: 60 }, ...)
```

### Changing Default PIN

Update `src/components/AuthScreen.tsx`:

```typescript
const correctPin = '1234' // Change this value
```

### Customizing Stations

Modify station names in `src/components/StationSelector.tsx`.

## 🏗 Architecture

### Data Structure
- **Assets**: Bike/helmet definitions with ID, type, label
- **Asset States**: Current availability status for each asset
- **Sessions**: Historical checkout/return records with timestamps

### Real-time Updates
- Uses browser's `storage` event to sync changes across tabs
- Custom event dispatching for same-tab updates
- No polling or external dependencies required

### File Structure
```
src/
├── components/          # React components
├── contexts/           # React context providers
├── lib/               # Local storage utilities
└── app/               # Next.js app router pages
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test locally: `npm run dev`
5. Build and verify: `npm run build`
6. Submit a pull request

## 📄 License

MIT License - feel free to use this project for any purpose.

## 🆘 Troubleshooting

### Data Not Persisting
- Check if browser has localStorage enabled
- Ensure you're not in private/incognito mode
- Some browsers limit localStorage in file:// URLs

### Cross-Tab Sync Not Working  
- Only works across tabs from same origin
- localStorage events don't fire in the tab that makes the change (by design)
- Verify you're not blocking JavaScript

### GitHub Pages Deployment Issues
- Ensure repository is public or you have GitHub Pro
- Check Actions tab for build logs
- Verify Pages setting is set to "GitHub Actions"

---

**Perfect for**: Bike rental shops, equipment libraries, inventory management, or any business that needs simple asset tracking without complex databases.