'use client'

import { useState, useRef } from 'react'
import { useApp } from '@/contexts/AppContext'
import Navigation from './Navigation'
import LiveInventory from './LiveInventory'
import Reports from './Reports'
import AuthScreen from './AuthScreen'
import SupabaseConfigNotice from './SupabaseConfigNotice'
import { isSupabaseConfigured } from '@/lib/supabase'

export default function MainApp() {
  const [currentArea, setCurrentArea] = useState<'frontdesk' | 'bikepark'>('frontdesk')
  const { isAuthenticated, loading } = useApp()
  const reportsRef = useRef<{ clearReports: () => Promise<void> }>(null)

  // Show configuration notice if Supabase is not configured
  if (!isSupabaseConfigured()) {
    return <SupabaseConfigNotice />
  }

  if (!isAuthenticated) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-lg">Loading...</div>
        </div>
      )
    }

    return <AuthScreen />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation 
        currentArea={currentArea}
        onAreaChange={setCurrentArea}
        onClearReports={async () => {
          if (reportsRef.current) {
            await reportsRef.current.clearReports()
          }
        }}
      />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {currentArea === 'frontdesk' ? (
          <LiveInventory />
        ) : (
          <Reports ref={reportsRef} />
        )}
      </main>
    </div>
  )
}
