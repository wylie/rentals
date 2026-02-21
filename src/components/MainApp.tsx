'use client'

import { useState, useRef, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import Navigation from './Navigation'
import LiveInventory from './LiveInventory'
import Reports from './Reports'
import AuthScreen from './AuthScreen'
import SupabaseConfigNotice from './SupabaseConfigNotice'
import { isSupabaseConfigured } from '@/lib/supabase'

export default function MainApp() {
  const [currentArea, setCurrentArea] = useState<'frontdesk' | 'bikepark'>('frontdesk')
  const [bikeParkView, setBikeParkView] = useState<'inventory' | 'reports'>('inventory')
  const { isAuthenticated, loading } = useApp()
  const reportsRef = useRef<{ clearReports: () => Promise<void> }>(null)

  // Load saved tab preferences from localStorage
  useEffect(() => {
    const savedArea = localStorage.getItem('selectedArea') as 'frontdesk' | 'bikepark' | null
    const savedBikeParkView = localStorage.getItem('selectedBikeParkView') as 'inventory' | 'reports' | null
    
    if (savedArea) {
      setCurrentArea(savedArea)
    }
    if (savedBikeParkView) {
      setBikeParkView(savedBikeParkView)
    }
  }, [])

  // Save tab preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('selectedArea', currentArea)
  }, [currentArea])

  useEffect(() => {
    localStorage.setItem('selectedBikeParkView', bikeParkView)
  }, [bikeParkView])

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
        {currentArea === 'bikepark' && (
          <div className="mb-4">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                onClick={() => setBikeParkView('inventory')}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium border rounded-l-md transition-colors ${
                  bikeParkView === 'inventory'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-lg">inventory_2</span>
                <span>Inventory</span>
              </button>
              <button
                onClick={() => setBikeParkView('reports')}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium border rounded-r-md transition-colors ${
                  bikeParkView === 'reports'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-lg">assessment</span>
                <span>Reports</span>
              </button>
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
