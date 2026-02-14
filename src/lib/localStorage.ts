// Local storage utilities for data persistence

export interface Asset {
  id: number
  type: 'bike' | 'helmet'
  label: string
  active: boolean
  created_at: string
}

export interface AssetState {
  id: number
  asset_id: number
  in_use: boolean
  current_session_id: number | null
  updated_at: string
}

export interface Session {
  id: number
  asset_id: number
  checked_out_at: string
  returned_at: string | null
  checked_out_station: string
  returned_station: string | null
  checked_out_by: string | null
  returned_by: string | null
  created_at: string
}

export type AssetsWithState = Asset & {
  asset_state: AssetState[]
}

const STORAGE_KEYS = {
  ASSETS: 'rentals_assets',
  ASSET_STATES: 'rentals_asset_states', 
  SESSIONS: 'rentals_sessions',
  NEXT_ID: 'rentals_next_id'
}

// Initialize data if not exists
export const initializeData = () => {
  if (!localStorage.getItem(STORAGE_KEYS.ASSETS)) {
    // Create bikes (01-40)
    const bikes: Asset[] = Array.from({ length: 40 }, (_, i) => ({
      id: i + 1,
      type: 'bike' as const,
      label: `Bike ${String(i + 1).padStart(2, '0')}`,
      active: true,
      created_at: new Date().toISOString()
    }))
    
    // Create helmets (01-60)
    const helmets: Asset[] = Array.from({ length: 60 }, (_, i) => ({
      id: i + 41,
      type: 'helmet' as const,
      label: `Helmet ${String(i + 1).padStart(2, '0')}`,
      active: true,
      created_at: new Date().toISOString()
    }))
    
    const allAssets = [...bikes, ...helmets]
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(allAssets))
    
    // Create initial asset states
    const assetStates: AssetState[] = allAssets.map(asset => ({
      id: asset.id,
      asset_id: asset.id,
      in_use: false,
      current_session_id: null,
      updated_at: new Date().toISOString()
    }))
    
    localStorage.setItem(STORAGE_KEYS.ASSET_STATES, JSON.stringify(assetStates))
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify([]))
    localStorage.setItem(STORAGE_KEYS.NEXT_ID, '1001')
  }
}

// Get next available ID
const getNextId = (): number => {
  const nextId = parseInt(localStorage.getItem(STORAGE_KEYS.NEXT_ID) || '1001')
  localStorage.setItem(STORAGE_KEYS.NEXT_ID, String(nextId + 1))
  return nextId
}

// Trigger storage event for cross-tab updates
const triggerStorageUpdate = (key: string) => {
  window.dispatchEvent(new StorageEvent('storage', {
    key,
    newValue: localStorage.getItem(key),
    url: window.location.href
  }))
}

// Assets CRUD
export const getAssets = (): Asset[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ASSETS)
  return data ? JSON.parse(data) : []
}

export const getAssetsWithState = (): AssetsWithState[] => {
  const assets = getAssets()
  const states = getAssetStates()
  
  return assets.map(asset => ({
    ...asset,
    asset_state: states.filter(state => state.asset_id === asset.id)
  }))
}

// Asset States CRUD  
export const getAssetStates = (): AssetState[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ASSET_STATES)
  return data ? JSON.parse(data) : []
}

export const updateAssetState = (assetId: number, updates: Partial<AssetState>) => {
  const states = getAssetStates()
  const stateIndex = states.findIndex(state => state.asset_id === assetId)
  
  if (stateIndex >= 0) {
    states[stateIndex] = {
      ...states[stateIndex],
      ...updates,
      updated_at: new Date().toISOString()
    }
    localStorage.setItem(STORAGE_KEYS.ASSET_STATES, JSON.stringify(states))
    triggerStorageUpdate(STORAGE_KEYS.ASSET_STATES)
  }
}

// Sessions CRUD
export const getSessions = (): Session[] => {
  const data = localStorage.getItem(STORAGE_KEYS.SESSIONS)
  return data ? JSON.parse(data) : []
}

export const createSession = (sessionData: Omit<Session, 'id' | 'created_at'>): Session => {
  const sessions = getSessions()
  const newSession: Session = {
    ...sessionData,
    id: getNextId(),
    created_at: new Date().toISOString()
  }
  
  sessions.push(newSession)
  localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions))
  triggerStorageUpdate(STORAGE_KEYS.SESSIONS)
  
  return newSession
}

export const updateSession = (sessionId: number, updates: Partial<Session>) => {
  const sessions = getSessions()
  const sessionIndex = sessions.findIndex(session => session.id === sessionId)
  
  if (sessionIndex >= 0) {
    sessions[sessionIndex] = {
      ...sessions[sessionIndex],
      ...updates
    }
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions))
    triggerStorageUpdate(STORAGE_KEYS.SESSIONS)
  }
}

// Subscription simulation for real-time updates
export const subscribeToAssetStateChanges = (callback: () => void) => {
  const handleStorageChange = (e: StorageEvent) => {
    if (e.key === STORAGE_KEYS.ASSET_STATES) {
      callback()
    }
  }
  
  window.addEventListener('storage', handleStorageChange)
  
  // Return unsubscribe function
  return () => {
    window.removeEventListener('storage', handleStorageChange)
  }
}