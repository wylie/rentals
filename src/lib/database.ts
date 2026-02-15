// Supabase database utilities for data persistence across devices

import { supabase, isSupabaseConfigured } from './supabase'

export interface Asset {
  id: number
  type: 'bike' | 'helmet'
  label: string
  active: boolean
  created_at: string
  user_id: string
}

export interface AssetState {
  id: number
  asset_id: number
  in_use: boolean
  current_session_id: number | null
  updated_at: string
  user_id: string
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
  user_id: string
}

export type AssetsWithState = Asset & {
  asset_state: AssetState[]
}

// Check if Supabase is properly configured
const checkSupabaseConfig = () => {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured. Please check your environment variables.')
  }
}

// Get current user ID or throw error
const getCurrentUserId = async (): Promise<string> => {
  checkSupabaseConfig()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    throw new Error('Not authenticated')
  }
  return user.id
}

// Clean up duplicate assets for current user
export const cleanupDuplicateAssets = async (): Promise<void> => {
  try {
    const userId = await getCurrentUserId()
    
    console.log('🔍 Checking for duplicate assets...')
    
    // Get all assets for user
    const { data: allAssets, error: fetchError } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true) // Only check active assets
      .order('id')
    
    if (fetchError) {
      console.error('Error fetching assets for cleanup:', fetchError)
      throw fetchError
    }
    
    if (!allAssets || allAssets.length === 0) {
      console.log('📭 No assets found for cleanup')
      return
    }
    
    // Group by type and label to find duplicates
    const grouped = allAssets.reduce((acc, asset) => {
      const key = `${asset.type}-${asset.label}`
      if (!acc[key]) acc[key] = []
      acc[key].push(asset)
      return acc
    }, {} as Record<string, typeof allAssets>)
    
    // Find duplicates and keep only the first (oldest) one
    const assetsToDelete: number[] = []
    
    Object.entries(grouped).forEach(([key, assets]) => {
      if (assets.length > 1) {
        console.log(`🗑️  Found ${assets.length} duplicates for ${key}, keeping ID:${assets[0].id}`)
        // Keep the first one, mark the rest for deletion
        assetsToDelete.push(...assets.slice(1).map(a => a.id))
      }
    })
    
    if (assetsToDelete.length > 0) {
      console.log(`🗑️  Deleting ${assetsToDelete.length} duplicate assets...`)
      
      // Delete asset states first (foreign key constraint)
      const { error: statesDeleteError } = await supabase
        .from('asset_states')
        .delete()
        .in('asset_id', assetsToDelete)
      
      if (statesDeleteError) {
        console.error('Error deleting asset states:', statesDeleteError)
        throw statesDeleteError
      }
      
      // Delete the duplicate assets
      const { error: assetsDeleteError } = await supabase
        .from('assets')
        .delete()
        .in('id', assetsToDelete)
      
      if (assetsDeleteError) {
        console.error('Error deleting duplicate assets:', assetsDeleteError)
        throw assetsDeleteError
      }
      
      console.log(`✅ Cleaned up ${assetsToDelete.length} duplicate assets`)
    } else {
      console.log('✅ No duplicate assets found')
    }
    
    // Also clean up orphaned asset states (states without corresponding active assets)
    console.log('🧹 Cleaning up orphaned asset states...')
    
    if (allAssets.length > 0) {
      const activeAssetIds = allAssets.map(a => a.id)
      const { data: orphanedStates, error: orphanError } = await supabase
        .from('asset_states')
        .select('id, asset_id')
        .eq('user_id', userId)
        .not('asset_id', 'in', `(${activeAssetIds.join(',')})`)
      
      if (orphanError) {
        console.error('Error finding orphaned states:', orphanError)
        // Don't throw here, just log the error
      } else if (orphanedStates && orphanedStates.length > 0) {
        console.log(`🗑️  Found ${orphanedStates.length} orphaned asset states`)
        const { error: cleanupError } = await supabase
          .from('asset_states')
          .delete()
          .in('id', orphanedStates.map(s => s.id))
        
        if (cleanupError) {
          console.error('Error cleaning orphaned states:', cleanupError)
          // Don't throw here, just log the error
        } else {
          console.log(`✅ Cleaned up ${orphanedStates.length} orphaned asset states`)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error in cleanupDuplicateAssets:', error)
    throw error
  }
}

// Get fleet counts (total number of each asset type)
export const getFleetCounts = async (): Promise<{ bikes: number; helmets: number }> => {
  try {
    const userId = await getCurrentUserId()
    
    const { data, error } = await supabase
      .from('assets')
      .select('type')
      .eq('user_id', userId)
      .eq('active', true)
    
    if (error) throw error
    
    const bikes = data?.filter(asset => asset.type === 'bike').length || 0
    const helmets = data?.filter(asset => asset.type === 'helmet').length || 0
    
    return { bikes, helmets }
  } catch (error) {
    console.error('Error getting fleet counts:', error)
    return { bikes: 0, helmets: 0 }
  }
}

// Add new assets to fleet
export const addAssetsToFleet = async (type: 'bike' | 'helmet', count: number): Promise<void> => {
  try {
    const userId = await getCurrentUserId()
    
    // Get current highest number for this asset type
    const { data: existingAssets, error: fetchError } = await supabase
      .from('assets')
      .select('label')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('active', true)
      .order('label')
    
    if (fetchError) throw fetchError
    
    // Find the highest number
    let highestNumber = 0
    if (existingAssets) {
      const numbers = existingAssets.map(asset => {
        const match = asset.label.match(/\d+$/)
        return match ? parseInt(match[0], 10) : 0
      })
      highestNumber = Math.max(0, ...numbers)
    }
    
    // Create new assets starting from highestNumber + 1
    const newAssets = Array.from({ length: count }, (_, i) => ({
      type,
      label: `${type === 'bike' ? 'Bike' : 'Helmet'} ${String(highestNumber + i + 1).padStart(2, '0')}`,
      active: true,
      user_id: userId
    }))
    
    // Insert new assets
    const { data: insertedAssets, error: assetsError } = await supabase
      .from('assets')
      .insert(newAssets)
      .select()
    
    if (assetsError) throw assetsError
    
    // Create initial asset states
    const assetStates = insertedAssets.map(asset => ({
      asset_id: asset.id,
      in_use: false,
      current_session_id: null,
      user_id: userId
    }))
    
    const { error: statesError } = await supabase
      .from('asset_states')
      .insert(assetStates)
    
    if (statesError) throw statesError
    
    console.log(`✅ Added ${count} new ${type}s to fleet`)
  } catch (error) {
    console.error('Error adding assets to fleet:', error)
    throw error
  }
}

// Remove assets from fleet (marks as inactive)
export const removeAssetsFromFleet = async (type: 'bike' | 'helmet', count: number): Promise<void> => {
  try {
    const userId = await getCurrentUserId()
    
    // Get highest numbered assets of this type (LIFO - last in, first out)
    const { data: assetsToRemove, error: fetchError } = await supabase
      .from('assets')
      .select('id, label')
      .eq('user_id', userId)
      .eq('type', type)
      .eq('active', true)
      .order('label', { ascending: false })
      .limit(count)
    
    if (fetchError) throw fetchError
    if (!assetsToRemove || assetsToRemove.length === 0) {
      throw new Error(`No ${type}s available to remove`)
    }
    
    const assetIds = assetsToRemove.map(a => a.id)
    
    // Mark assets as inactive rather than deleting (preserves history)
    const { error: deactivateError } = await supabase
      .from('assets')
      .update({ active: false })
      .in('id', assetIds)
    
    if (deactivateError) throw deactivateError
    
    // Also remove their asset states (they won't appear in inventory)
    const { error: statesError } = await supabase
      .from('asset_states')
      .delete()
      .in('asset_id', assetIds)
    
    if (statesError) throw statesError
    
    console.log(`✅ Removed ${assetsToRemove.length} ${type}s from fleet (${assetsToRemove.map(a => a.label).join(', ')})`)
  } catch (error) {
    console.error('Error removing assets from fleet:', error)
    throw error
  }
}

// Initialize data for new user
export const initializeUserData = async (): Promise<void> => {
  try {
    const userId = await getCurrentUserId()
    
    // Check if user already has data
    const { data: existingAssets, error: checkError } = await supabase
      .from('assets')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    
    if (checkError) {
      console.error('Error checking existing assets:', checkError)
      throw checkError
    }
    
    console.log(`🔍 Checking existing assets for user ${userId}:`, existingAssets?.length || 0)
    
    if (existingAssets && existingAssets.length > 0) {
      console.log('✅ User already has data, skipping initialization')
      return // User already has data
    }
    
    console.log('🚀 Initializing data for new user...')
    
    // Create bikes (01-40)
    const bikes = Array.from({ length: 40 }, (_, i) => ({
      type: 'bike' as const,
      label: `Bike ${String(i + 1).padStart(2, '0')}`,
      active: true,
      user_id: userId
    }))
    
    // Create helmets (01-60)
    const helmets = Array.from({ length: 60 }, (_, i) => ({
      type: 'helmet' as const,
      label: `Helmet ${String(i + 1).padStart(2, '0')}`,
      active: true,
      user_id: userId
    }))
    
    const allAssets = [...bikes, ...helmets]
    
    console.log(`📦 Creating ${allAssets.length} assets...`)
    
    // Insert assets
    const { data: insertedAssets, error: assetsError } = await supabase
      .from('assets')
      .insert(allAssets)
      .select()
    
    if (assetsError) {
      console.error('Error inserting assets:', assetsError)
      throw assetsError
    }
    
    console.log(`✅ Created ${insertedAssets.length} assets`)
    
    // Create initial asset states
    const assetStates = insertedAssets.map(asset => ({
      asset_id: asset.id,
      in_use: false,
      current_session_id: null,
      user_id: userId
    }))
    
    const { error: statesError } = await supabase
      .from('asset_states')
      .insert(assetStates)
    
    if (statesError) {
      console.error('Error inserting asset states:', statesError)
      throw statesError
    }
    
    console.log(`✅ Created ${assetStates.length} asset states`)

  } catch (error) {
    console.error('Error initializing user data:', error)
    throw error
  }
}

// Assets CRUD
export const getAssets = async (): Promise<Asset[]> => {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .eq('user_id', userId)
      .order('id')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching assets:', error)
    return []
  }
}

export const getAssetsWithState = async (): Promise<AssetsWithState[]> => {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('assets')
      .select(`
        *,
        asset_state:asset_states(*)
      `)
      .eq('user_id', userId)
      .order('id')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching assets with state:', error)
    return []
  }
}

// Asset States CRUD  
export const getAssetStates = async (): Promise<AssetState[]> => {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('asset_states')
      .select('*')
      .eq('user_id', userId)
      .order('asset_id')
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching asset states:', error)
    return []
  }
}

export const updateAssetState = async (assetId: number, updates: Partial<Omit<AssetState, 'id' | 'asset_id' | 'user_id'>>): Promise<void> => {
  try {
    const userId = await getCurrentUserId()
    const { error } = await supabase
      .from('asset_states')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('asset_id', assetId)
      .eq('user_id', userId)
    
    if (error) throw error
  } catch (error) {
    console.error('Error updating asset state:', error)
    throw error
  }
}

// Sessions CRUD
export const getSessions = async (): Promise<Session[]> => {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return []
  }
}

export const createSession = async (sessionData: {
  asset_id: number
  checked_out_at: string
  checked_out_station: string
  checked_out_by?: string | null
}): Promise<Session | null> => {
  try {
    const userId = await getCurrentUserId()
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        ...sessionData,
        user_id: userId
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating session:', error)
    return null
  }
}

export const updateSession = async (sessionId: number, updates: {
  returned_at?: string | null
  returned_station?: string | null
  returned_by?: string | null
}): Promise<void> => {
  try {
    const userId = await getCurrentUserId()
    const { error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', sessionId)
      .eq('user_id', userId)
    
    if (error) throw error
  } catch (error) {
    console.error('Error updating session:', error)
    throw error
  }
}

// Authentication helpers
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Real-time subscriptions
export const subscribeToAssetStateChanges = (callback: () => void) => {
  const subscription = supabase
    .channel('asset_states_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'asset_states' },
      callback
    )
    .subscribe()
  
  // Return unsubscribe function
  return () => {
    subscription.unsubscribe()
  }
}