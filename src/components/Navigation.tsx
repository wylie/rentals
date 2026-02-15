'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { getFleetCounts, addAssetsToFleet, removeAssetsFromFleet, forceFleetReset } from '@/lib/database'

interface NavigationProps {
  currentView: 'inventory' | 'reports'
  onViewChange: (view: 'inventory' | 'reports') => void
}

type SettingsTab = 'session' | 'fleet' | 'pin' | 'company'

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>('session')
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
  const [tempCompanyName, setTempCompanyName] = useState('')
  const { sessionTimeoutHours, companyName, setSessionTimeout, setCompanyName, changePin, logout } = useApp()

  const handleOpenSettings = async () => {
    setTempTimeout(sessionTimeoutHours.toString())
    setTempCompanyName(companyName)
    
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

      // Update company name
      setCompanyName(tempCompanyName)
      
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
      
    } catch (error: any) {
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
          <div className="py-3">
            {/* First Row: Logo and Right Controls */}
            <div className="flex justify-between items-center mb-3">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                {companyName && <span className="text-blue-600">{companyName} </span>}
                Rental Management
              </h1>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleOpenSettings}
                  className="flex items-center px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  title="Settings"
                >
                  <span className="material-symbols-outlined">settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-2 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Logout"
                >
                  <span className="material-symbols-outlined">logout</span>
                </button>
              </div>
            </div>

            {/* Second Row: Navigation Links */}
            <div className="flex space-x-2">
              <button
                onClick={() => onViewChange('inventory')}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'inventory'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-lg">inventory_2</span>
                <span>Live Inventory</span>
              </button>
              <button
                onClick={() => onViewChange('reports')}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentView === 'reports'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-lg">assessment</span>
                <span>Reports</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">Settings</h2>
            </div>
            
            {/* Tabs */}
            <div className="border-b bg-gray-50">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('session')}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'session'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">timer</span>
                  <span>Session</span>
                </button>
                <button
                  onClick={() => setActiveTab('fleet')}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'fleet'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">garage</span>
                  <span>Fleet</span>
                </button>
                <button
                  onClick={() => setActiveTab('pin')}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'pin'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">lock</span>
                  <span>Access PIN</span>
                </button>
                <button
                  onClick={() => setActiveTab('company')}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'company'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">business</span>
                  <span>Company</span>
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Session Timeout Tab */}
              {activeTab === 'session' && (
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="4"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      How long to stay logged in (0.1 to 168 hours)
                    </p>
                    <div className="mt-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Quick options:</p>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setTempTimeout('1')} className="px-3 py-1.5 bg-gray-100 rounded text-sm hover:bg-gray-200">1 hour</button>
                        <button onClick={() => setTempTimeout('4')} className="px-3 py-1.5 bg-gray-100 rounded text-sm hover:bg-gray-200">4 hours</button>
                        <button onClick={() => setTempTimeout('8')} className="px-3 py-1.5 bg-gray-100 rounded text-sm hover:bg-gray-200">8 hours</button>
                        <button onClick={() => setTempTimeout('24')} className="px-3 py-1.5 bg-gray-100 rounded text-sm hover:bg-gray-200">1 day</button>
                        <button onClick={() => setTempTimeout('168')} className="px-3 py-1.5 bg-gray-100 rounded text-sm hover:bg-gray-200">1 week</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Fleet Management Tab */}
              {activeTab === 'fleet' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Adjust the total number of bikes and helmets in your fleet. Changes will take effect after saving.
                  </p>
                  
                  <div>
                    <label htmlFor="bikeCount" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                      <span className="material-symbols-outlined text-blue-600">pedal_bike</span>
                      <span>Number of Bikes</span>
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setTempBikeCount(Math.max(0, parseInt(tempBikeCount) - 1).toString())}
                        className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        disabled={isUpdatingFleet}
                      >
                        <span className="material-symbols-outlined">remove</span>
                      </button>
                      <input
                        id="bikeCount"
                        type="number"
                        min="0"
                        max="999"
                        value={tempBikeCount}
                        onChange={(e) => setTempBikeCount(e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                        disabled={isUpdatingFleet}
                      />
                      <button
                        onClick={() => setTempBikeCount((parseInt(tempBikeCount) + 1).toString())}
                        className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        disabled={isUpdatingFleet}
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                      <span className="text-sm text-gray-500">
                        Currently: <strong>{fleetCounts.bikes}</strong>
                      </span>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="helmetCount" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                      <span className="material-symbols-outlined text-orange-600">sports_motorsports</span>
                      <span>Number of Helmets</span>
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setTempHelmetCount(Math.max(0, parseInt(tempHelmetCount) - 1).toString())}
                        className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        disabled={isUpdatingFleet}
                      >
                        <span className="material-symbols-outlined">remove</span>
                      </button>
                      <input
                        id="helmetCount"
                        type="number"
                        min="0"
                        max="999"
                        value={tempHelmetCount}
                        onChange={(e) => setTempHelmetCount(e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold"
                        disabled={isUpdatingFleet}
                      />
                      <button
                        onClick={() => setTempHelmetCount((parseInt(tempHelmetCount) + 1).toString())}
                        className="flex items-center justify-center w-10 h-10 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                        disabled={isUpdatingFleet}
                      >
                        <span className="material-symbols-outlined">add</span>
                      </button>
                      <span className="text-sm text-gray-500">
                        Currently: <strong>{fleetCounts.helmets}</strong>
                      </span>
                    </div>
                  </div>

                  {(tempBikeCount !== fleetCounts.bikes.toString() || tempHelmetCount !== fleetCounts.helmets.toString()) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                      <p className="text-sm font-semibold text-blue-900 mb-1">Changes to be applied:</p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {tempBikeCount !== fleetCounts.bikes.toString() && (
                          <li>
                            • Bikes: {fleetCounts.bikes} → {tempBikeCount} 
                            <span className={parseInt(tempBikeCount) - fleetCounts.bikes > 0 ? 'text-green-600' : 'text-red-600'}>
                              {' '}({parseInt(tempBikeCount) - fleetCounts.bikes > 0 ? '+' : ''}{parseInt(tempBikeCount) - fleetCounts.bikes})
                            </span>
                          </li>
                        )}
                        {tempHelmetCount !== fleetCounts.helmets.toString() && (
                          <li>
                            • Helmets: {fleetCounts.helmets} → {tempHelmetCount} 
                            <span className={parseInt(tempHelmetCount) - fleetCounts.helmets > 0 ? 'text-green-600' : 'text-red-600'}>
                              {' '}({parseInt(tempHelmetCount) - fleetCounts.helmets > 0 ? '+' : ''}{parseInt(tempHelmetCount) - fleetCounts.helmets})
                            </span>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* PIN Management Tab */}
              {activeTab === 'pin' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Change the PIN used to access this application. The PIN must be at least 4 digits.
                  </p>
                  
                  <div>
                    <label htmlFor="currentPin" className="block text-sm font-medium text-gray-700 mb-2">
                      Current PIN
                    </label>
                    <input
                      id="currentPin"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={currentPin}
                      onChange={(e) => setCurrentPin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter current PIN"
                      disabled={isUpdatingPin}
                    />
                  </div>
                  <div>
                    <label htmlFor="newPin" className="block text-sm font-medium text-gray-700 mb-2">
                      New PIN
                    </label>
                    <input
                      id="newPin"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter new PIN (min 4 digits)"
                      disabled={isUpdatingPin}
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPin" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New PIN
                    </label>
                    <input
                      id="confirmPin"
                      type="password"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Confirm new PIN"
                      disabled={isUpdatingPin}
                    />
                  </div>

                  {pinError && (
                    <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      <span className="material-symbols-outlined">error</span>
                      <span>{pinError}</span>
                    </div>
                  )}

                  {pinMessage && (
                    <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
                      <span className="material-symbols-outlined">check_circle</span>
                      <span>{pinMessage}</span>
                    </div>
                  )}

                  <button
                    onClick={handleChangePin}
                    disabled={isUpdatingPin}
                    className={`w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md transition-colors ${
                      isUpdatingPin
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <span className="material-symbols-outlined">lock_reset</span>
                    <span>{isUpdatingPin ? 'Updating PIN...' : 'Update PIN'}</span>
                  </button>
                </div>
              )}

              {/* Company Settings Tab */}
              {activeTab === 'company' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Customize how your company name appears in the application header.
                  </p>
                  
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      value={tempCompanyName}
                      onChange={(e) => setTempCompanyName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Acme Rentals"
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Leave blank to hide the company name
                    </p>
                  </div>

                  {tempCompanyName && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
                      <p className="text-xs text-gray-600 mb-2">Preview:</p>
                      <p className="text-lg font-bold">
                        <span className="text-blue-600">{tempCompanyName} </span>
                        <span className="text-gray-900">Rental Management</span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={handleSaveSettings}
                disabled={isUpdatingFleet}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md transition-colors ${
                  isUpdatingFleet 
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <span className="material-symbols-outlined">save</span>
                <span>{isUpdatingFleet ? 'Saving...' : 'Save Changes'}</span>
              </button>
              <button
                onClick={() => setShowSettings(false)}
                disabled={isUpdatingFleet}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-md transition-colors ${
                  isUpdatingFleet
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                <span className="material-symbols-outlined">close</span>
                <span>Cancel</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
