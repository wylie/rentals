'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import Navigation from './Navigation'
import LiveInventory from './LiveInventory'
import Reports from './Reports'
import AuthScreen from './AuthScreen'
import SupabaseConfigNotice from './SupabaseConfigNotice'
import { isSupabaseConfigured } from '@/lib/supabase'

export default function MainApp() {
  const [currentView, setCurrentView] = useState<'inventory' | 'reports'>('inventory')
  const { isAuthenticated, loading } = useApp()

  // Show configuration notice if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return <SupabaseConfigNotice />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {currentView === 'inventory' ? (
          <LiveInventory />
        ) : (
          <Reports />
        )}
      </main>
    </div>
  )
}
