'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { getFleetCounts, addAssetsToFleet, removeAssetsFromFleet, forceFleetReset } from '@/lib/database'

interface NavigationProps {
  currentView: 'inventory' | 'reports'
  onViewChange: (view: 'inventory' | 'reports') => void
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [tempTimeout, setTempTimeout] = useState('')
  const [fleetCounts, setFleetCounts] = useState({ bikes: 0, helmets: 0 })
  const [tempBikeCount, setTempBikeCount] = useState('')
  const [tempHelmetCount, setTempHelmetCount] = useState('')
  const [isUpdatingFleet, setIsUpdatingFleet] = useState(false)
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinMessage, setPinMessage] = useState('')
  const [pinError, setPinError] = useState('')
  const [isUpdatingPin, setIsUpdatingPin] = useState(false)
  const { sessionTimeoutHours, setSessionTimeout, changePin, logout } = useApp()

  const handleOpenSettings = async () => {
    setTempTimeout(sessionTimeoutHours.toString())
    
    // Load current fleet counts
    try {
      const counts = await getFleetCounts()
      setFleetCounts(counts)
      setTempBikeCount(counts.bikes.toString())
      setTempHelmetCount(counts.helmets.toString())
    } catch (error) {
      console.error('Error loading fleet counts:', error)
    }
    
    setShowSettings(true)
  }

  const handleSaveSettings = async () => {
    setIsUpdatingFleet(true)
    
    try {
      // Update session timeout
      const hours = parseFloat(tempTimeout)
      if (hours > 0 && hours <= 168) {
        setSessionTimeout(hours)
      }
      
      // Update fleet counts using force reset for accuracy
      const newBikeCount = parseInt(tempBikeCount, 10)
      const newHelmetCount = parseInt(tempHelmetCount, 10)
      
      if (newBikeCount !== fleetCounts.bikes || newHelmetCount !== fleetCounts.helmets) {
        console.log('🔄 Resetting fleet to exact counts...')
        
        // Add timeout to prevent hanging
        const resetPromise = forceFleetReset(newBikeCount, newHelmetCount)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Fleet reset timeout')), 20000)
        )
        
        try {
          await Promise.race([resetPromise, timeoutPromise])
          console.log('✅ Fleet reset completed successfully')
        } catch (resetError) {
          console.error('❌ Fleet reset failed:', resetError)
          
          // Try individual operations as fallback
          console.log('🔄 Trying fallback approach...')
          
          const bikeDiff = newBikeCount - fleetCounts.bikes
          const helmetDiff = newHelmetCount - fleetCounts.helmets
          
          if (bikeDiff > 0) {
            await addAssetsToFleet('bike', bikeDiff)
          } else if (bikeDiff < 0) {
            await removeAssetsFromFleet('bike', Math.abs(bikeDiff))
          }
          
          if (helmetDiff > 0) {
            await addAssetsToFleet('helmet', helmetDiff)
          } else if (helmetDiff < 0) {
            await removeAssetsFromFleet('helmet', Math.abs(helmetDiff))
          }
          
          console.log('✅ Fallback fleet update completed')
        }
      }
      
      setShowSettings(false)
      
      // Small delay before reload to ensure database operations complete
      setTimeout(() => {
        window.location.reload()
      }, 500)
      
    } catch (error) {
      console.error('Error saving settings:', error)
      alert(`Error updating settings: ${error.message}. Please try again.`)
      setIsUpdatingFleet(false) // Make sure to clear loading state
    }
  }

  const handleChangePin = async () => {
    setPinError('')
    setPinMessage('')

    if (newPin.trim().length < 4) {
      setPinError('New PIN must be at least 4 digits')
      return
    }
    if (newPin !== confirmPin) {
      setPinError('New PIN and confirmation do not match')
      return
    }

    setIsUpdatingPin(true)
    try {
      const { error } = await changePin(currentPin.trim(), newPin.trim())
      if (error) {
        setPinError(error.message || 'Failed to update PIN')
        return
      }

      setPinMessage('PIN updated successfully')
      setCurrentPin('')
      setNewPin('')
      setConfirmPin('')
    } catch (error) {
      setPinError('Failed to update PIN')
    } finally {
      setIsUpdatingPin(false)
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
            
            <div className="space-y-6">
              {/* Session Timeout Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Session Settings</h3>
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

              {/* Fleet Management Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Fleet Management</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="bikeCount" className="block text-sm font-medium text-gray-700 mb-1">
                      🚴‍♂️ Number of Bikes
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setTempBikeCount(Math.max(0, parseInt(tempBikeCount) - 1).toString())}
                        className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm font-bold"
                        disabled={isUpdatingFleet}
                      >
                        −
                      </button>
                      <input
                        id="bikeCount"
                        type="number"
                        min="0"
                        max="999"
                        value={tempBikeCount}
                        onChange={(e) => setTempBikeCount(e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isUpdatingFleet}
                      />
                      <button
                        onClick={() => setTempBikeCount((parseInt(tempBikeCount) + 1).toString())}
                        className="px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 text-sm font-bold"
                        disabled={isUpdatingFleet}
                      >
                        +
                      </button>
                      <span className="text-xs text-gray-500">
                        Currently: {fleetCounts.bikes}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="helmetCount" className="block text-sm font-medium text-gray-700 mb-1">
                      ⛑️ Number of Helmets
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setTempHelmetCount(Math.max(0, parseInt(tempHelmetCount) - 1).toString())}
                        className="px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 text-sm font-bold"
                        disabled={isUpdatingFleet}
                      >
                        −
                      </button>
                      <input
                        id="helmetCount"
                        type="number"
                        min="0"
                        max="999"
                        value={tempHelmetCount}
                        onChange={(e) => setTempHelmetCount(e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isUpdatingFleet}
                      />
                      <button
                        onClick={() => setTempHelmetCount((parseInt(tempHelmetCount) + 1).toString())}
                        className="px-2 py-1 bg-green-100 text-green-600 rounded hover:bg-green-200 text-sm font-bold"
                        disabled={isUpdatingFleet}
                      >
                        +
                      </button>
                      <span className="text-xs text-gray-500">
                        Currently: {fleetCounts.helmets}
                      </span>
                    </div>
                  </div>

                  {(tempBikeCount !== fleetCounts.bikes.toString() || tempHelmetCount !== fleetCounts.helmets.toString()) && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-700">
                      <p><strong>Changes will be applied when you save:</strong></p>
                      {tempBikeCount !== fleetCounts.bikes.toString() && (
                        <p>• Bikes: {fleetCounts.bikes} → {tempBikeCount} 
                          ({parseInt(tempBikeCount) - fleetCounts.bikes > 0 ? '+' : ''}{parseInt(tempBikeCount) - fleetCounts.bikes})
                        </p>
                      )}
                      {tempHelmetCount !== fleetCounts.helmets.toString() && (
                        <p>• Helmets: {fleetCounts.helmets} → {tempHelmetCount} 
                          ({parseInt(tempHelmetCount) - fleetCounts.helmets > 0 ? '+' : ''}{parseInt(tempHelmetCount) - fleetCounts.helmets})
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* PIN Management Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Access PIN</h3>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="currentPin" className="block text-sm font-medium text-gray-700 mb-1">
                      Current PIN
                    </label>
                    <input
                      id="currentPin"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter current PIN"
                      disabled={isUpdatingPin}
                    />
                  </div>
                  <div>
                    <label htmlFor="newPin" className="block text-sm font-medium text-gray-700 mb-1">
                      New PIN
                    </label>
                    <input
                      id="newPin"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new PIN"
                      disabled={isUpdatingPin}
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New PIN
                    </label>
                    <input
                      id="confirmPin"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new PIN"
                      disabled={isUpdatingPin}
                    />
                  </div>

                  {pinError && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      {pinError}
                    </div>
                  )}

                  {pinMessage && (
                    <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                      {pinMessage}
                    </div>
                  )}

                  <button
                    onClick={handleChangePin}
                    disabled={isUpdatingPin}
                    className={`w-full py-2 px-4 rounded-md transition-colors ${
                      isUpdatingPin
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isUpdatingPin ? 'Updating PIN...' : 'Update PIN'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveSettings}
                disabled={isUpdatingFleet}
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  isUpdatingFleet 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isUpdatingFleet ? 'Updating Fleet...' : 'Save'}
              </button>
              <button
                onClick={() => setShowSettings(false)}
                disabled={isUpdatingFleet}
                className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                  isUpdatingFleet
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
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
