'use client'

import { useRef, useEffect } from 'react'
import Link from 'next/link'
import { useApp } from '@/contexts/AppContext'
import Navigation from './Navigation'
import LiveInventory from './LiveInventory'
import Reports from './Reports'
import AuthScreen from './AuthScreen'
import SupabaseConfigNotice from './SupabaseConfigNotice'
import { isSupabaseConfigured } from '@/lib/supabase'
import { event } from '@/lib/ga'

interface MainAppProps {
  currentArea: 'frontdesk' | 'bikepark'
  bikeParkView?: 'inventory' | 'reports'
}

export default function MainApp({ currentArea, bikeParkView = 'inventory' }: MainAppProps) {
  const { isAuthenticated, loading, setCurrentStation } = useApp()
  const reportsRef = useRef<{ clearReports: () => Promise<void> }>(null)

  // Keep station synced with the selected route
  useEffect(() => {
    setCurrentStation(currentArea === 'bikepark' ? 'Bike Park' : 'Main Location')
  }, [currentArea, setCurrentStation])

  useEffect(() => {
    event('section_viewed', {
      section: currentArea,
    })
  }, [currentArea])

  useEffect(() => {
    if (currentArea !== 'bikepark') {
      return
    }

    event('bikepark_view_changed', {
      view: bikeParkView,
    })
  }, [currentArea, bikeParkView])

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
        onClearReports={async () => {
          if (reportsRef.current) {
            await reportsRef.current.clearReports()
          }
        }}
      />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {currentArea === 'bikepark' && (
          <div className="mb-4">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <Link
                href="/bike-park/inventory"
                onClick={() => {
                  event('button_clicked', {
                    button_name: 'bikepark_inventory_tab',
                    section: 'bikepark'
                  })
                }}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium border rounded-l-md transition-colors ${
                  bikeParkView === 'inventory'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-lg">inventory_2</span>
                <span>Inventory</span>
              </Link>
              <Link
                href="/bike-park/reports"
                onClick={() => {
                  event('button_clicked', {
                    button_name: 'bikepark_reports_tab',
                    section: 'bikepark'
                  })
                }}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium border rounded-r-md transition-colors ${
                  bikeParkView === 'reports'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-lg">assessment</span>
                <span>Reports</span>
              </Link>
            </div>
          </div>
        )}
        {currentArea === 'frontdesk' ? (
          <LiveInventory />
        ) : (
          bikeParkView === 'inventory' ? <LiveInventory /> : <Reports ref={reportsRef} />
        )}
      </main>
    </div>
  )
}
