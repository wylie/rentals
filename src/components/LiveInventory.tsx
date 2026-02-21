'use client'

import { useState, useEffect } from 'react'
import { 
  getAssetsWithState, 
  updateAssetState, 
  createSession, 
  updateSession, 
  getAssetStates,
  createBikeReturnCheck,
  type AssetsWithState 
} from '@/lib/database'
import { getAssetSubcategoryName, getSubcategorySettings, type SubcategorySettings } from '@/lib/subcategories'
import { useApp } from '@/contexts/AppContext'

interface AssetButtonProps {
  asset: AssetsWithState
  onToggle: (assetId: number, currentlyInUse: boolean) => Promise<void>
  isLoading: boolean
}

function AssetButton({ asset, onToggle, isLoading }: AssetButtonProps) {
  const isInUse = asset.asset_state[0]?.in_use || false
  
  return (
    <button
      onClick={() => onToggle(asset.id, isInUse)}
      disabled={isLoading}
      className={`
        p-3 rounded-lg font-medium text-sm transition-all duration-200 min-h-[80px] flex flex-col justify-center items-center space-y-1
        ${isInUse 
          ? 'bg-red-100 border-2 border-red-300 text-red-800 hover:bg-red-200' 
          : 'bg-green-100 border-2 border-green-300 text-green-800 hover:bg-green-200'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
        ${asset.type === 'bike' ? 'col-span-1' : 'col-span-1'}
      `}
    >
      <span className={`material-symbols-outlined text-2xl ${
        asset.type === 'bike' ? '' : ''
      }`}>
        {asset.type === 'bike' ? 'pedal_bike' : 'sports_motorsports'}
      </span>
      <div className="font-semibold text-xs">{asset.label}</div>
      <div className={`flex items-center space-x-1 text-xs px-2 py-0.5 rounded ${
        isInUse ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'
      }`}>
        <span className="material-symbols-outlined text-sm">
          {isInUse ? 'lock' : 'check_circle'}
        </span>
        <span>{isInUse ? 'In Use' : 'Available'}</span>
      </div>
    </button>
  )
}

export default function LiveInventory() {
  const [assets, setAssets] = useState<AssetsWithState[]>([])
  const [subcategorySettings, setSubcategorySettings] = useState<SubcategorySettings>({ bike: [], helmet: [] })
  const [loading, setLoading] = useState(true)
  const [toggleLoading, setToggleLoading] = useState<number | null>(null)
  const [loadStartTime] = useState(Date.now())
  const [showReturnModal, setShowReturnModal] = useState(false)
  const [pendingReturn, setPendingReturn] = useState<{
    assetId: number
    assetLabel: string
    sessionId: number
  } | null>(null)
  const [returnAnswers, setReturnAnswers] = useState<{
    cleaned: boolean | null
    needsMaintenance: boolean | null
  }>({ cleaned: null, needsMaintenance: null })
  const [returnError, setReturnError] = useState('')
  const [returnSubmitting, setReturnSubmitting] = useState(false)
  const { currentStation } = useApp()

  // Set global load start time for timeout detection
  useEffect(() => {
    ;(window as any).loadStartTime = loadStartTime
  }, [loadStartTime])

  // Load assets with their current state
  const loadAssets = async () => {
    try {
      const assetsData = await getAssetsWithState()
      
      // Debug: Check for duplicates
      const grouped = assetsData.reduce((acc, asset) => {
        const key = `${asset.type}-${asset.label}`
        if (!acc[key]) acc[key] = []
        acc[key].push(asset)
        return acc
      }, {} as Record<string, typeof assetsData>)
      
      const duplicates = Object.entries(grouped)
        .filter(([key, assets]) => assets.length > 1)
      
      if (duplicates.length > 0) {
        console.log('🚨 DUPLICATE ASSETS FOUND:', duplicates)
        duplicates.forEach(([key, dupeAssets]) => {
          console.log(`${key}: ${dupeAssets.length} copies`, dupeAssets.map(a => `ID:${a.id}`))
        })
      }
      
      console.log(`📊 Total assets loaded: ${assetsData.length}`)
      setAssets(assetsData)
      setSubcategorySettings(await getSubcategorySettings())
    } catch (error) {
      console.error('Error loading assets:', error)
    } finally {
      setLoading(false)
    }
  }

  // Toggle asset status
  const toggleAssetStatus = async (asset: AssetsWithState, currentlyInUse: boolean) => {
    setToggleLoading(asset.id)
    
    try {
      if (currentlyInUse) {
        // Asset is being returned
        const states = await getAssetStates()
        const currentState = states.find(state => state.asset_id === asset.id)

        if (currentState?.current_session_id && asset.type === 'bike' && currentStation === 'Bike Park') {
          setPendingReturn({
            assetId: asset.id,
            assetLabel: asset.label,
            sessionId: currentState.current_session_id
          })
          setReturnAnswers({ cleaned: null, needsMaintenance: null })
          setReturnError('')
          setShowReturnModal(true)
          setToggleLoading(null)
          return
        }

        if (currentState?.current_session_id) {
          await updateSession(currentState.current_session_id, {
            returned_at: new Date().toISOString(),
            returned_station: currentStation
          })
        }

        await updateAssetState(asset.id, {
          in_use: false,
          current_session_id: null
        })

      } else {
        // Asset is being checked out
        // First create a new session
        const newSession = await createSession({
          asset_id: asset.id,
          checked_out_at: new Date().toISOString(),
          checked_out_station: currentStation,
          checked_out_by: null
        })

        // Update asset state
        if (newSession) {
          await updateAssetState(asset.id, {
            in_use: true,
            current_session_id: newSession.id
          })
        }
      }

      // Refresh assets
      await loadAssets()
    } catch (error) {
      console.error('Error toggling asset status:', error)
    } finally {
      setToggleLoading(null)
    }
  }

  // Initialize data and set up polling for multi-device sync
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null
    
    const initializeAndLoad = async () => {
      try {
        await loadAssets()
        
        // Only start polling after successful load
        pollInterval = setInterval(() => {
          loadAssets()
        }, 3000)
        
      } catch (error) {
        console.error('❌ Error loading assets:', error)
        setLoading(false) // Make sure loading state is cleared even on error
      }
    }

    initializeAndLoad()
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval)
      }
    }
  }, [])

  if (loading) {
    const timeElapsed = Date.now() - loadStartTime
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Bikes</h2>
          {timeElapsed > 10000 ? (
            <div className="text-sm text-amber-600">Loading bikes is taking longer than expected...</div>
          ) : (
            <div className="text-sm text-gray-500">Loading bikes...</div>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Helmets</h2>
          {timeElapsed > 10000 ? (
            <div className="text-sm text-amber-600">Loading helmets is taking longer than expected...</div>
          ) : (
            <div className="text-sm text-gray-500">Loading helmets...</div>
          )}
        </div>
        {timeElapsed > 10000 && (
          <div className="text-left space-y-3">
            <button
              onClick={() => {
                console.log('🔄 Force refresh requested')
                window.location.reload()
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Force Refresh
            </button>
            <p className="text-xs text-gray-400">
              If this keeps happening, check your browser console (F12) for errors
            </p>
          </div>
        )}
      </div>
    )
  }

  const bikes = assets.filter(asset => asset.type === 'bike')
  const helmets = assets.filter(asset => asset.type === 'helmet')

  const renderGroupedAssets = (typeAssets: AssetsWithState[], typeLabel: string) => {
    const groups = typeAssets.reduce<Record<string, AssetsWithState[]>>((acc, asset) => {
      const subcategoryName = getAssetSubcategoryName(asset, subcategorySettings) || 'Uncategorized'
      if (!acc[subcategoryName]) {
        acc[subcategoryName] = []
      }
      acc[subcategoryName].push(asset)
      return acc
    }, {})

    const orderedGroupNames = [
      ...Object.keys(groups).filter((name) => name !== 'Uncategorized').sort((a, b) => a.localeCompare(b)),
      ...Object.keys(groups).filter((name) => name === 'Uncategorized')
    ]

    return (
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{typeLabel}</h2>
        <div className="space-y-4">
          {orderedGroupNames.map((groupName) => (
            <div key={groupName} className="space-y-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">{groupName}</h3>
              <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {groups[groupName].map((asset) => (
                  <AssetButton
                    key={asset.id}
                    asset={asset}
                    onToggle={(assetId, currentlyInUse) => toggleAssetStatus(asset, currentlyInUse)}
                    isLoading={toggleLoading === asset.id}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {renderGroupedAssets(bikes, 'Bikes')}
      {renderGroupedAssets(helmets, 'Helmets')}

      {showReturnModal && pendingReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-bold text-gray-900">Bike Park Return Checklist</h3>
              <p className="text-sm text-gray-600 mt-1">{pendingReturn.assetLabel}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Has the bike been cleaned?</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReturnAnswers((prev) => ({ ...prev, cleaned: true }))}
                    className={`px-3 py-1.5 rounded-md text-sm border ${
                      returnAnswers.cleaned === true
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setReturnAnswers((prev) => ({ ...prev, cleaned: false }))}
                    className={`px-3 py-1.5 rounded-md text-sm border ${
                      returnAnswers.cleaned === false
                        ? 'bg-gray-700 text-white border-gray-700'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Does it need further maintenance?</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setReturnAnswers((prev) => ({ ...prev, needsMaintenance: true }))}
                    className={`px-3 py-1.5 rounded-md text-sm border ${
                      returnAnswers.needsMaintenance === true
                        ? 'bg-red-600 text-white border-red-600'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setReturnAnswers((prev) => ({ ...prev, needsMaintenance: false }))}
                    className={`px-3 py-1.5 rounded-md text-sm border ${
                      returnAnswers.needsMaintenance === false
                        ? 'bg-gray-700 text-white border-gray-700'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>

              {returnError && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                  {returnError}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowReturnModal(false)
                  setPendingReturn(null)
                  setReturnError('')
                }}
                className="flex-1 px-4 py-2 rounded-md bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors"
                disabled={returnSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!pendingReturn) return
                  if (returnAnswers.cleaned === null || returnAnswers.needsMaintenance === null) {
                    setReturnError('Please answer both questions before completing the return.')
                    return
                  }

                  setReturnSubmitting(true)
                  setReturnError('')

                  try {
                    console.log('📋 Saving bike return with answers:', returnAnswers)
                    
                    await updateSession(pendingReturn.sessionId, {
                      returned_at: new Date().toISOString(),
                      returned_station: currentStation
                    })
                    console.log('✅ Session updated')

                    await createBikeReturnCheck({
                      session_id: pendingReturn.sessionId,
                      asset_id: pendingReturn.assetId,
                      cleaned: returnAnswers.cleaned,
                      needs_maintenance: returnAnswers.needsMaintenance
                    })
                    console.log('✅ Bike return check created')

                    await updateAssetState(pendingReturn.assetId, {
                      in_use: false,
                      current_session_id: null
                    })
                    console.log('✅ Asset state updated')

                    await loadAssets()
                    setShowReturnModal(false)
                    setPendingReturn(null)
                  } catch (error: any) {
                    console.error('❌ Error completing bike return:', error)
                    const errorMsg = error?.message || error?.details || JSON.stringify(error) || 'Unknown error'
                    setReturnError(`Failed to save: ${errorMsg}`)
                  } finally {
                    setReturnSubmitting(false)
                  }
                }}
                className="flex-1 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                disabled={returnSubmitting}
              >
                {returnSubmitting ? 'Saving...' : 'Complete Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}