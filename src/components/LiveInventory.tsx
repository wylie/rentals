'use client'

import { useState, useEffect } from 'react'
import { useApp } from '@/contexts/AppContext'
import { 
  initializeData, 
  getAssetsWithState, 
  updateAssetState, 
  createSession, 
  updateSession, 
  getAssetStates,
  subscribeToAssetStateChanges,
  type AssetsWithState 
} from '@/lib/localStorage'

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
        p-4 rounded-lg font-medium text-sm transition-all duration-200 min-h-[80px] flex flex-col justify-center items-center space-y-2
        ${isInUse 
          ? 'bg-red-100 border-2 border-red-300 text-red-800 hover:bg-red-200' 
          : 'bg-green-100 border-2 border-green-300 text-green-800 hover:bg-green-200'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
        ${asset.type === 'bike' ? 'col-span-1' : 'col-span-1'}
      `}
    >
      <div className="font-semibold">{asset.label}</div>
      <div className={`text-xs px-2 py-1 rounded ${
        isInUse ? 'bg-red-200 text-red-700' : 'bg-green-200 text-green-700'
      }`}>
        {isInUse ? 'In Use' : 'Available'}
      </div>
    </button>
  )
}

export default function LiveInventory() {
  const [assets, setAssets] = useState<AssetsWithState[]>([])
  const [loading, setLoading] = useState(true)
  const [toggleLoading, setToggleLoading] = useState<number | null>(null)
  const { currentStation } = useApp()

  // Load assets with their current state
  const loadAssets = () => {
    try {
      const assetsData = getAssetsWithState()
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
        const states = getAssetStates()
        const currentState = states.find(state => state.asset_id === assetId)

        if (currentState?.current_session_id) {
          // Update session with return information
          updateSession(currentState.current_session_id, {
            returned_at: new Date().toISOString(),
            returned_station: currentStation
          })
        }

        // Update asset state
        updateAssetState(assetId, {
          in_use: false,
          current_session_id: null
        })

      } else {
        // Asset is being checked out
        // First create a new session
        const newSession = createSession({
          asset_id: assetId,
          checked_out_at: new Date().toISOString(),
          returned_at: null,
          checked_out_station: currentStation,
          returned_station: null,
          checked_out_by: null,
          returned_by: null
        })

        // Update asset state
        updateAssetState(assetId, {
          in_use: true,
          current_session_id: newSession.id
        })
      }

      // Refresh assets
      loadAssets()
    } catch (error) {
      console.error('Error toggling asset status:', error)
    } finally {
      setToggleLoading(null)
    }
  }

  // Set up real-time subscription and initialize data
  useEffect(() => {
    initializeData()
    loadAssets()

    // Subscribe to asset state changes for cross-tab updates
    const unsubscribe = subscribeToAssetStateChanges(loadAssets)
    
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading inventory...</div>
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
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
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
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
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