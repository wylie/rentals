'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import StationSelector from './StationSelector'

interface NavigationProps {
  currentView: 'inventory' | 'reports'
  onViewChange: (view: 'inventory' | 'reports') => void
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [tempTimeout, setTempTimeout] = useState('')
  const { sessionTimeoutHours, setSessionTimeout, logout } = useApp()

  const handleOpenSettings = () => {
    setTempTimeout(sessionTimeoutHours.toString())
    setShowSettings(true)
  }

  const handleSaveSettings = () => {
    const hours = parseFloat(tempTimeout)
    if (hours > 0 && hours <= 168) {
      setSessionTimeout(hours)
      setShowSettings(false)
    }
  }

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout()
    }
  }
  return (
    <>
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Rentals Management
              </h1>
            </div>

            {/* Navigation Links */}
            <div className="flex space-x-4">
              <button
                onClick={() => onViewChange('inventory')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'inventory'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Live Inventory
              </button>
              <button
                onClick={() => onViewChange('reports')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'reports'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Reports
              </button>
            </div>

            {/* Right side controls */}
            <div className="flex items-center space-x-3">
              <StationSelector />
              <button
                onClick={handleOpenSettings}
                className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Settings"
              >
                ⚙️
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Logout"
              >
                🚪
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (hours)
                </label>
                <input
                  id="sessionTimeout"
                  type="number"
                  min="0.1"
                  max="168"
                  step="0.5"
                  value={tempTimeout}
                  onChange={(e) => setTempTimeout(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="4"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How long to stay logged in (0.1 to 168 hours)
                </p>
                <div className="mt-2 text-xs text-gray-600">
                  <p><strong>Quick options:</strong></p>
                  <div className="flex space-x-2 mt-1">
                    <button onClick={() => setTempTimeout('1')} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200">1hr</button>
                    <button onClick={() => setTempTimeout('4')} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200">4hrs</button>
                    <button onClick={() => setTempTimeout('8')} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200">8hrs</button>
                    <button onClick={() => setTempTimeout('24')} className="px-2 py-1 bg-gray-100 rounded text-xs hover:bg-gray-200">1day</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveSettings}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
