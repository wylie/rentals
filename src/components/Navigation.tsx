'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/contexts/AppContext'
import { getFleetCounts, addAssetsToFleet, removeAssetsFromFleet, forceFleetReset } from '@/lib/database'
import {
  type AssetType,
  type SubcategorySettings,
  createSubcategory,
  getSubcategorySettings,
  saveSubcategorySettings
} from '@/lib/subcategories'
import { event } from '@/lib/ga'

interface NavigationProps {
  currentArea: 'frontdesk' | 'bikepark'
  onClearReports?: () => Promise<void>
}

type SettingsTab = 'session' | 'fleet' | 'subcategories' | 'pin' | 'company' | 'reports' | 'logout'

export default function Navigation({ currentArea, onClearReports }: NavigationProps) {
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
    isAdmin,
    userRole,
    sessionTimeoutHours,
    companyName,
    currentStation,
    setSessionTimeout,
    setCompanyName,
    setCurrentStation,
    changePin,
    logout
  } = useApp()

  const visibleTabs: SettingsTab[] = isAdmin
    ? ['session', 'subcategories', 'pin', 'company', 'reports', 'logout']
    : ['pin', 'logout']

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
    // Placeholder function, no logic needed
    return;
  }

  const handleLogout = () => {
    event('button_clicked', {
      button_name: 'logout_now',
      section: currentArea
    })
    const confirmed = confirm('Are you sure you want to log out?')
    event('logout_confirmation', {
      confirmed
    })
    if (confirmed) {
      logout()
      event('logged_out', {
        source: 'settings'
      })
    }
  }

  const handleSettingsTabChange = (tab: SettingsTab) => {
    setActiveTab(tab)
    event('settings_tab_opened', {
      tab,
    })
  }

  const handleCloseSettings = () => {
    setShowSettings(false)
    setPinError('')
    setPinMessage('')
    setClearReportsChecked(false)
  }

  useEffect(() => {
    if (!showSettings) {
      return
    }

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        event('button_clicked', {
          button_name: 'close_settings_escape',
          settings_tab: activeTab,
        })
        handleCloseSettings()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showSettings, activeTab])

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
              <Link
                href="/front-desk"
                onClick={() => {
                  setCurrentStation('Main Location')
                  event('button_clicked', {
                    button_name: 'nav_front_desk',
                    section: 'frontdesk',
                    station: 'Main Location'
                  })
                }}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentArea === 'frontdesk'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-lg">storefront</span>
                <span>Front Desk</span>
              </Link>
              <Link
                href="/bike-park"
                onClick={() => {
                  setCurrentStation('Bike Park')
                  event('button_clicked', {
                    button_name: 'nav_bike_park',
                    section: 'bikepark',
                    station: 'Bike Park'
                  })
                }}
                className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentArea === 'bikepark'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-lg">pedal_bike</span>
                <span>Bike Park</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Settings Modal */}
      {showSettings && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            event('button_clicked', {
              button_name: 'close_settings_backdrop',
              settings_tab: activeTab,
            })
            handleCloseSettings()
          }}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(mouseEvent) => mouseEvent.stopPropagation()}
          >
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-gray-900">Settings</h2>
              <p className="text-xs text-gray-500 mt-1">
                Access level: {isAdmin ? 'Admin' : 'Staff'}
              </p>
            </div>
            {/* Tabs */}
            <div className="border-b bg-gray-50 overflow-x-auto">
              <div className="flex min-w-max">
                {visibleTabs.map((tab) => {
                  const isDangerTab = tab === 'logout'
                  const isActive = activeTab === tab
                  const iconByTab: Record<SettingsTab, string> = {
                    session: 'timer',
                    fleet: 'garage',
                    subcategories: 'category',
                    pin: 'lock',
                    company: 'business',
                    reports: 'summarize',
                    logout: 'logout',
                  }
                  const labelByTab: Record<SettingsTab, string> = {
                    session: 'Session',
                    fleet: 'Fleet',
                    subcategories: 'Subcategories',
                    pin: 'Access PIN',
                    company: 'Company',
                    reports: 'Reports',
                    logout: 'Logout',
                  }

                  return (
                    <button
                      key={tab}
                      onClick={() => handleSettingsTabChange(tab)}
                      className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? isDangerTab
                            ? 'border-b-2 border-red-600 text-red-600 bg-white'
                            : 'border-b-2 border-blue-600 text-blue-600 bg-white'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">{iconByTab[tab]}</span>
                      <span>{labelByTab[tab]}</span>
                    </button>
                  )
                })}
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
                      placeholder="8"
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
                                    <select
                                      value={subcategory.fleetNumbers.length}
                                      onChange={e => {
                                        const count = parseInt(e.target.value, 10)
                                        const numbers = Array.from({ length: count }, (_, i) => i + 1)
                                        setTempSubcategories(prev => ({
                                          ...prev,
                                          [type]: prev[type].map(s =>
                                            s.id === subcategory.id ? { ...s, fleetNumbers: numbers } : s
                                          )
                                        }))
                                      }}
                                      className="w-32 px-3 py-2 border border-blue-200 bg-blue-50 text-blue-800 font-semibold rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm transition-colors"
                                      disabled={isUpdatingFleet}
                                    >
                                      <option value={0}>Select count</option>
                                      {[...Array(25)].map((_, i) => (
                                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                                      ))}
                                    </select>
                                    <span className="text-xs text-gray-500">Set number of {heading.toLowerCase()}</span>
                                  </div>

                                  {subcategory.fleetNumbers.length > 0 ? (
                                    // Fleet number buttons removed; only select menu remains
                                  ) : null}
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
                    {isAdmin
                      ? 'Change the Admin PIN used to access admin features. The PIN must be at least 4 digits.'
                      : 'Change your Staff PIN. The PIN must be at least 4 digits.'}
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
                    event('button_clicked', {
                      button_name: 'cancel_settings',
                      settings_tab: activeTab
                    })
                    handleCloseSettings()
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
