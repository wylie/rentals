'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase, getAppLoginEmail, isAppLoginEmailConfigured, isSupabaseConfigured } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { initializeUserData, signOut as dbSignOut, getAppSetting, setAppSetting } from '@/lib/database'

interface AppContextType {
  isAuthenticated: boolean
  sessionTimeoutHours: number
  companyName: string
  user: User | null
  loading: boolean
  setSessionTimeout: (hours: number) => void
  setCompanyName: (name: string) => void
  signInWithPin: (pin: string) => Promise<{ error?: any }>
  changePin: (currentPin: string, newPin: string) => Promise<{ error?: any }>
  logout: () => Promise<void>
}

// Storage keys
const SESSION_TIMEOUT_KEY = 'rental_session_timeout'
const COMPANY_NAME_KEY = 'rental_company_name'
const CLOUD_SESSION_TIMEOUT_KEY = 'session_timeout_hours'
const CLOUD_COMPANY_NAME_KEY = 'company_name'

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState(4) // Default 4 hours
  const [companyName, setCompanyNameState] = useState('')

  const isAuthenticated = !!user

  const syncPreferencesFromCloud = async () => {
    try {
      const cloudTimeout = await getAppSetting(CLOUD_SESSION_TIMEOUT_KEY)
      if (cloudTimeout) {
        const timeoutHours = parseFloat(cloudTimeout)
        if (timeoutHours > 0 && timeoutHours <= 168) {
          setSessionTimeoutHours(timeoutHours)
          localStorage.setItem(SESSION_TIMEOUT_KEY, timeoutHours.toString())
        }
      } else {
        const localTimeout = localStorage.getItem(SESSION_TIMEOUT_KEY)
        if (localTimeout) {
          const timeoutHours = parseFloat(localTimeout)
          if (timeoutHours > 0 && timeoutHours <= 168) {
            await setAppSetting(CLOUD_SESSION_TIMEOUT_KEY, timeoutHours.toString())
          }
        }
      }

      const cloudCompanyName = await getAppSetting(CLOUD_COMPANY_NAME_KEY)
      if (cloudCompanyName !== null) {
        setCompanyNameState(cloudCompanyName)
        localStorage.setItem(COMPANY_NAME_KEY, cloudCompanyName)
      } else {
        const localCompanyName = localStorage.getItem(COMPANY_NAME_KEY)
        if (localCompanyName) {
          await setAppSetting(CLOUD_COMPANY_NAME_KEY, localCompanyName)
        }
      }
    } catch (error) {
      console.error('Error syncing preferences from cloud:', error)
    }
  }

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

      // Load company name setting
      const savedCompanyName = localStorage.getItem(COMPANY_NAME_KEY)
      if (savedCompanyName) {
        setCompanyNameState(savedCompanyName)
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
            await syncPreferencesFromCloud()
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
              await syncPreferencesFromCloud()
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
      void setAppSetting(CLOUD_SESSION_TIMEOUT_KEY, hours.toString()).catch((error) => {
        console.error('Error saving session timeout to cloud:', error)
      })
    }
  }

  const setCompanyName = (name: string) => {
    setCompanyNameState(name)
    localStorage.setItem(COMPANY_NAME_KEY, name)
    void setAppSetting(CLOUD_COMPANY_NAME_KEY, name).catch((error) => {
      console.error('Error saving company name to cloud:', error)
    })
  }

  const signInWithPin = async (pin: string) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase is not configured') }
    }
    if (!isAppLoginEmailConfigured()) {
      return { error: new Error('App login email is not configured') }
    }

    const email = getAppLoginEmail()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pin
    })
    return { error }
  }

  const changePin = async (currentPin: string, newPin: string) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase is not configured') }
    }
    if (!isAppLoginEmailConfigured()) {
      return { error: new Error('App login email is not configured') }
    }

    const email = getAppLoginEmail()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPin
    })
    if (signInError) {
      return { error: new Error('Current PIN is incorrect') }
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPin
    })

    return { error: updateError }
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
      companyName,
      user,
      loading,
      setSessionTimeout,
      setCompanyName,
      signInWithPin,
      changePin,
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
