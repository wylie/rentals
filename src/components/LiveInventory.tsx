'use client'

import { useState, useEffect } from 'react'
import { 
  getAssetsWithState, 
  updateAssetState, 
  createSession, 
  updateSession, 
  getAssetStates,
  type AssetsWithState 
} from '@/lib/database'

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
  const [loading, setLoading] = useState(true)
  const [toggleLoading, setToggleLoading] = useState<number | null>(null)
  const [loadStartTime] = useState(Date.now())

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
    } catch (error) {
      console.error('Error loading assets:', error)
    } finally {
      setLoading(false)
    }
  }

  // Toggle asset status
  const toggleAssetStatus = async (assetId: number, currentlyInUse: boolean) => {
    setToggleLoading(assetId)
    
    try {
      if (currentlyInUse) {
        // Asset is being returned
        const states = await getAssetStates()
        const currentState = states.find(state => state.asset_id === assetId)

        if (currentState?.current_session_id) {
          // Update session with return information
          await updateSession(currentState.current_session_id, {
            returned_at: new Date().toISOString(),
            returned_station: 'Main Location'
          })
        }

        // Update asset state
        await updateAssetState(assetId, {
          in_use: false,
          current_session_id: null
        })

      } else {
        // Asset is being checked out
        // First create a new session
        const newSession = await createSession({
          asset_id: assetId,
          checked_out_at: new Date().toISOString(),
          checked_out_station: 'Main Location',
          checked_out_by: null
        })

        // Update asset state
        if (newSession) {
          await updateAssetState(assetId, {
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
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        {timeElapsed > 10000 ? (
          <div className="text-center space-y-3">
            <p className="text-amber-600">Loading is taking longer than expected...</p>
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
        ) : (
          <p className="text-lg text-gray-600">Loading inventory...</p>
        )}
      </div>
    )
  }

  const bikes = assets.filter(asset => asset.type === 'bike')
  const helmets = assets.filter(asset => asset.type === 'helmet')

  return (
    <div className="space-y-8">
      {/* Bikes Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Bikes</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {bikes.map((asset) => (
            <AssetButton
              key={asset.id}
              asset={asset}
              onToggle={toggleAssetStatus}
              isLoading={toggleLoading === asset.id}
            />
          ))}
        </div>
      </div>

      {/* Helmets Section */}
      <div>
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Helmets</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
          {helmets.map((asset) => (
            <AssetButton
              key={asset.id}
              asset={asset}
              onToggle={toggleAssetStatus}
              isLoading={toggleLoading === asset.id}
            />
          ))}
        </div>
      </div>
    </div>
  )
}