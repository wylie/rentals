'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { initializeUserData, signOut as dbSignOut } from '@/lib/database'

interface AppContextType {
  isAuthenticated: boolean
  sessionTimeoutHours: number
  user: User | null
  loading: boolean
  setSessionTimeout: (hours: number) => void
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signUp: (email: string, password: string) => Promise<{ error?: any }>
  logout: () => Promise<void>
}

// Session timeout storage
const SESSION_TIMEOUT_KEY = 'rental_session_timeout'

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState(4) // Default 4 hours

  const isAuthenticated = !!user

  // Load preferences and initialize auth on mount
  useEffect(() => {
    // Load session timeout setting
    if (typeof window !== 'undefined') {
      const savedTimeout = localStorage.getItem(SESSION_TIMEOUT_KEY)
      if (savedTimeout) {
        const timeoutHours = parseFloat(savedTimeout)
        if (timeoutHours > 0 && timeoutHours <= 168) { // Max 1 week
          setSessionTimeoutHours(timeoutHours)
        }
      }
    }

    // Only initialize Supabase auth if properly configured
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return () => {} // Return empty cleanup function
    }

    let subscription: any = null

    // Initialize Supabase auth
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user || null)
        setLoading(false)

        // Initialize user data if they're authenticated and it's their first time
        if (session?.user) {
          try {
            await initializeUserData()
          } catch (error) {
            console.error('Error initializing user data:', error)
          }
        }
      } catch (error) {
        console.error('Error getting session:', error)
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen to auth changes only if Supabase is configured
    try {
      const { data: authSubscription } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          setUser(session?.user || null)
          setLoading(false)

          // Initialize user data for new sign-ups
          if (event === 'SIGNED_IN' && session?.user) {
            try {
              await initializeUserData()
            } catch (error) {
              console.error('Error initializing user data:', error)
            }
          }
        }
      )
      subscription = authSubscription
    } catch (error) {
      console.error('Error setting up auth listener:', error)
    }

    return () => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe()
      }
    }
  }, [])

  const setSessionTimeout = (hours: number) => {
    if (hours > 0 && hours <= 168) { // Between 1 minute and 1 week
      setSessionTimeoutHours(hours)
      localStorage.setItem(SESSION_TIMEOUT_KEY, hours.toString())
    }
  }

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase is not configured') }
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase is not configured') }
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password
    })
    return { error }
  }

  const logout = async () => {
    if (isSupabaseConfigured()) {
      await dbSignOut()
    }
    setUser(null)
  }

  return (
    <AppContext.Provider value={{
      isAuthenticated,
      sessionTimeoutHours,
      user,
      loading,
      setSessionTimeout,
      signIn,
      signUp,
      logout
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
