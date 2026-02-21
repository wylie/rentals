'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { getFleetCounts, addAssetsToFleet, removeAssetsFromFleet, forceFleetReset } from '@/lib/database'
import {
  type AssetType,
  type SubcategorySettings,
  createSubcategory,
  getSubcategorySettings,
  saveSubcategorySettings
} from '@/lib/subcategories'

interface NavigationProps {
  currentArea: 'frontdesk' | 'bikepark'
  onAreaChange: (area: 'frontdesk' | 'bikepark') => void
  onClearReports?: () => Promise<void>
}

type SettingsTab = 'session' | 'fleet' | 'subcategories' | 'pin' | 'company' | 'reports' | 'logout'

export default function Navigation({ currentArea, onAreaChange, onClearReports }: NavigationProps) {
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
  const [tempCompanyName, setTempCompanyName] = useState('')
  const [clearReportsChecked, setClearReportsChecked] = useState(false)
  const [tempSubcategories, setTempSubcategories] = useState<SubcategorySettings>({ bike: [], helmet: [] })
  const [fleetNumberInputs, setFleetNumberInputs] = useState<Record<string, string>>({})
  const {
    sessionTimeoutHours,
    companyName,
    currentStation,
    setSessionTimeout,
    setCompanyName,
    setCurrentStation,
    changePin,
    logout
  } = useApp()

  const inputKey = (type: AssetType, subcategoryId: string) => `${type}-${subcategoryId}`

  const updateSubcategoryName = (type: AssetType, subcategoryId: string, name: string) => {
    setTempSubcategories((prev) => ({
      ...prev,
      [type]: prev[type].map((subcategory) =>
        subcategory.id === subcategoryId ? { ...subcategory, name } : subcategory
      )
    }))
  }

  const handleAddSubcategory = (type: AssetType) => {
    setTempSubcategories((prev) => ({
      ...prev,
      [type]: [...prev[type], createSubcategory()]
    }))
  }

  const handleRemoveSubcategory = (type: AssetType, subcategoryId: string) => {
    setTempSubcategories((prev) => ({
      ...prev,
      [type]: prev[type].filter((subcategory) => subcategory.id !== subcategoryId)
    }))

    setFleetNumberInputs((prev) => {
      const updated = { ...prev }
      delete updated[inputKey(type, subcategoryId)]
      return updated
    })
  }

  const handleAddFleetNumber = (type: AssetType, subcategoryId: string) => {
    const key = inputKey(type, subcategoryId)
    const rawValue = fleetNumberInputs[key] || ''
    const fleetNumber = parseInt(rawValue, 10)

    if (!Number.isFinite(fleetNumber) || fleetNumber <= 0) {
      return
    }

    setTempSubcategories((prev) => {
      const updatedTypeSubcategories = prev[type].map((subcategory) => {
        const withoutFleetNumber = subcategory.fleetNumbers.filter((number) => number !== fleetNumber)
        if (subcategory.id === subcategoryId) {
          return {
            ...subcategory,
            fleetNumbers: [...withoutFleetNumber, fleetNumber].sort((a, b) => a - b)
          }
        }

        return {
          ...subcategory,
          fleetNumbers: withoutFleetNumber
        }
      })

      return {
        ...prev,
        [type]: updatedTypeSubcategories
      }
    })

    setFleetNumberInputs((prev) => ({
      ...prev,
      [key]: ''
    }))
  }

  const handleRemoveFleetNumber = (type: AssetType, subcategoryId: string, fleetNumber: number) => {
    setTempSubcategories((prev) => ({
      ...prev,
      [type]: prev[type].map((subcategory) =>
        subcategory.id === subcategoryId
          ? { ...subcategory, fleetNumbers: subcategory.fleetNumbers.filter((number) => number !== fleetNumber) }
          : subcategory
      )
    }))
  }

  const handleOpenSettings = async () => {
    setTempTimeout(sessionTimeoutHours.toString())
    setTempCompanyName(companyName)
    
    // Reset PIN fields and error states
    setCurrentPin('')
    setNewPin('')
    setConfirmPin('')
    setPinError('')
    setPinMessage('')
    
    // Reset clear reports checkbox
    setClearReportsChecked(false)
    
    // Load current fleet counts
    try {
      const counts = await getFleetCounts()
      setFleetCounts(counts)
      setTempBikeCount(counts.bikes.toString())
      setTempHelmetCount(counts.helmets.toString())
    } catch (error) {
      console.error('Error loading fleet counts:', error)
    }

    setTempSubcategories(await getSubcategorySettings())
    setFleetNumberInputs({})
    
    setShowSettings(true)
  }

  const handleSaveSettings = async () => {
    setIsUpdatingFleet(true)
    setPinError('')
    setPinMessage('')
    
    try {
      // Update session timeout
      const hours = parseFloat(tempTimeout)
      if (hours > 0 && hours <= 168) {
        setSessionTimeout(hours)
      }

      // Update company name
      setCompanyName(tempCompanyName)

      await saveSubcategorySettings(tempSubcategories)
      
      // Update PIN if all fields are filled
      if (currentPin.trim() || newPin.trim() || confirmPin.trim()) {
        if (newPin.trim().length < 4) {
          setPinError('New PIN must be at least 4 digits')
          setIsUpdatingFleet(false)
          return
        }
        if (newPin !== confirmPin) {
          setPinError('New PIN and confirmation do not match')
          setIsUpdatingFleet(false)
          return
        }
        if (currentPin.trim() && newPin.trim()) {
          const { error } = await changePin(currentPin.trim(), newPin.trim())
          if (error) {
            setPinError(error.message || 'Failed to update PIN')
            setIsUpdatingFleet(false)
            return
          }
          setPinMessage('PIN updated successfully')
          setCurrentPin('')
          setNewPin('')
          setConfirmPin('')
        }
      }
      
      // Clear reports if checkbox is checked
      if (clearReportsChecked) {
        const confirmed = confirm('This will permanently delete all usage history. Continue?')
        if (confirmed && onClearReports) {
          await onClearReports()
          setClearReportsChecked(false)
        } else {
          setIsUpdatingFleet(false)
          return
        }
      }
      
      // Update fleet counts using force reset for accuracy
      const newBikeCount = parseInt(tempBikeCount, 10)
      const newHelmetCount = parseInt(tempHelmetCount, 10)
      
      let fleetChanged = false
      
      if (newBikeCount !== fleetCounts.bikes || newHelmetCount !== fleetCounts.helmets) {
        fleetChanged = true
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
      
      // Only reload if fleet counts changed
      if (fleetChanged) {
        // Small delay before reload to ensure database operations complete
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        setIsUpdatingFleet(false)
      }
      
    } catch (error: any) {
      console.error('Error saving settings:', error)
      alert(`Error updating settings: ${error.message}. Please try again.`)
      setIsUpdatingFleet(false) // Make sure to clear loading state
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
              
              <button
                onClick={handleOpenSettings}
                className="flex items-center px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Settings"
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>

            {/* Second Row: Navigation Links */}
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setCurrentStation('Main Location')
                  onAreaChange('frontdesk')
                }}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentArea === 'frontdesk'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-lg">storefront</span>
                <span>Front Desk</span>
              </button>
              <button
                onClick={() => {
                  setCurrentStation('Bike Park')
                  onAreaChange('bikepark')
                }}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentArea === 'bikepark'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-lg">pedal_bike</span>
                <span>Bike Park</span>
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
            <div className="border-b bg-gray-50 overflow-x-auto">
              <div className="flex min-w-max">
                <button
                  onClick={() => setActiveTab('session')}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
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
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'fleet'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">garage</span>
                  <span>Fleet</span>
                </button>
                <button
                  onClick={() => setActiveTab('subcategories')}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'subcategories'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">category</span>
                  <span>Subcategories</span>
                </button>
                <button
                  onClick={() => setActiveTab('pin')}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
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
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'company'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">business</span>
                  <span>Company</span>
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'reports'
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">summarize</span>
                  <span>Reports</span>
                </button>
                <button
                  onClick={() => setActiveTab('logout')}
                  className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === 'logout'
                      ? 'border-b-2 border-red-600 text-red-600 bg-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  <span>Logout</span>
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
                        <button onClick={() => setTempTimeout('1')} className="px-3 py-1.5 bg-gray-100 rounded text-sm text-gray-700 hover:bg-gray-200">1 hour</button>
                        <button onClick={() => setTempTimeout('4')} className="px-3 py-1.5 bg-gray-100 rounded text-sm text-gray-700 hover:bg-gray-200">4 hours</button>
                        <button onClick={() => setTempTimeout('8')} className="px-3 py-1.5 bg-gray-100 rounded text-sm text-gray-700 hover:bg-gray-200">8 hours</button>
                        <button onClick={() => setTempTimeout('24')} className="px-3 py-1.5 bg-gray-100 rounded text-sm text-gray-700 hover:bg-gray-200">1 day</button>
                        <button onClick={() => setTempTimeout('168')} className="px-3 py-1.5 bg-gray-100 rounded text-sm text-gray-700 hover:bg-gray-200">1 week</button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="currentStation" className="block text-sm font-medium text-gray-700 mb-2">
                      Current Station
                    </label>
                    <select
                      id="currentStation"
                      value={currentStation}
                      onChange={(e) => setCurrentStation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Main Location">Main Location</option>
                      <option value="Bike Park">Bike Park</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Used to determine when to show the Bike Park return checklist
                    </p>
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

              {activeTab === 'subcategories' && (
                <div className="space-y-6">
                  <p className="text-sm text-gray-600">
                    Create subcategories for Bikes and Helmets, rename them, and assign fleet numbers to each one.
                  </p>

                  {(['bike', 'helmet'] as AssetType[]).map((type) => {
                    const heading = type === 'bike' ? 'Bikes' : 'Helmets'
                    const icon = type === 'bike' ? 'pedal_bike' : 'sports_motorsports'

                    return (
                      <div key={type} className="border border-gray-200 rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="material-symbols-outlined text-blue-600">{icon}</span>
                            <h3 className="text-base font-semibold text-gray-900">{heading}</h3>
                          </div>
                          <button
                            onClick={() => handleAddSubcategory(type)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 transition-colors"
                            disabled={isUpdatingFleet}
                          >
                            <span className="material-symbols-outlined text-base">add</span>
                            <span>Add Subcategory</span>
                          </button>
                        </div>

                        {tempSubcategories[type].length === 0 ? (
                          <p className="text-sm text-gray-500">No subcategories yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {tempSubcategories[type].map((subcategory) => {
                              const key = inputKey(type, subcategory.id)
                              return (
                                <div key={subcategory.id} className="border border-gray-100 rounded-lg p-3 bg-gray-50 space-y-3">
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="text"
                                      value={subcategory.name}
                                      onChange={(e) => updateSubcategoryName(type, subcategory.id, e.target.value)}
                                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Subcategory name"
                                      disabled={isUpdatingFleet}
                                      maxLength={40}
                                    />
                                    <button
                                      onClick={() => handleRemoveSubcategory(type, subcategory.id)}
                                      className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                                      disabled={isUpdatingFleet}
                                      title="Remove subcategory"
                                    >
                                      <span className="material-symbols-outlined">delete</span>
                                    </button>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="1"
                                      value={fleetNumberInputs[key] || ''}
                                      onChange={(e) => setFleetNumberInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault()
                                          handleAddFleetNumber(type, subcategory.id)
                                        }
                                      }}
                                      className="w-28 px-3 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      placeholder="Fleet #"
                                      disabled={isUpdatingFleet}
                                    />
                                    <button
                                      onClick={() => handleAddFleetNumber(type, subcategory.id)}
                                      className="inline-flex items-center space-x-1 px-3 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                                      disabled={isUpdatingFleet}
                                    >
                                      <span className="material-symbols-outlined text-base">add</span>
                                      <span>Add Number</span>
                                    </button>
                                  </div>

                                  {subcategory.fleetNumbers.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                      {subcategory.fleetNumbers.map((fleetNumber) => (
                                        <button
                                          key={fleetNumber}
                                          onClick={() => handleRemoveFleetNumber(type, subcategory.id, fleetNumber)}
                                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors text-sm"
                                          disabled={isUpdatingFleet}
                                          title="Remove fleet number"
                                        >
                                          <span>#{fleetNumber}</span>
                                          <span className="material-symbols-outlined text-sm">close</span>
                                        </button>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs text-gray-500">No fleet numbers assigned.</p>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })}
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

              {/* Reports Tab */}
              {activeTab === 'reports' && (
                <div className="space-y-4">
                  <div className="py-8">
                    <div className="flex justify-center mb-4">
                      <span className="material-symbols-outlined text-red-600" style={{ fontSize: '48px' }}>delete_sweep</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Clear All Reports</h3>
                    <p className="text-sm text-gray-600 mb-6 text-center">
                      This will permanently delete all usage history and session data. This action cannot be undone.
                    </p>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={clearReportsChecked}
                          onChange={(e) => setClearReportsChecked(e.target.checked)}
                          className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-900">
                          <strong>I want to permanently delete all usage history and reports.</strong>
                          <br />
                          <span className="text-gray-600">Check this box and click Save Changes to clear all reports.</span>
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Logout Tab */}
              {activeTab === 'logout' && (
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <div className="flex justify-center mb-4">
                      <span className="material-symbols-outlined text-red-600" style={{ fontSize: '48px' }}>logout</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Logout</h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Are you sure you want to logout? You&apos;ll need to enter your PIN to access the system again.
                    </p>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
                    >
                      <span className="material-symbols-outlined">logout</span>
                      <span>Logout Now</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            {activeTab !== 'logout' && (
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
                  onClick={() => {
                    setShowSettings(false)
                    // Reset states when canceling
                    setPinError('')
                    setPinMessage('')
                    setClearReportsChecked(false)
                  }}
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
            )}
          </div>
        </div>
      )}
    </>
  )
}
