'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Station = 'frontdesk' | 'bikepark'

interface AppContextType {
  isAuthenticated: boolean
  currentStation: Station
  sessionTimeoutHours: number
  setAuthenticated: (auth: boolean) => void
  setStation: (station: Station) => void
  setSessionTimeout: (hours: number) => void
  logout: () => void
}

// Authentication storage utilities
const AUTH_STORAGE_KEY = 'rental_auth'
const SESSION_TIMEOUT_KEY = 'rental_session_timeout'

interface AuthData {
  authenticated: boolean
  timestamp: number
}

function saveAuthData(authenticated: boolean): void {
  const authData: AuthData = {
    authenticated,
    timestamp: Date.now()
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData))
}

function getAuthData(): AuthData | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored) as AuthData
  } catch {
    return null
  }
}

function clearAuthData(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

function isAuthValid(authData: AuthData, timeoutHours: number): boolean {
  const now = Date.now()
  const timeoutMs = timeoutHours * 60 * 60 * 1000 // Convert hours to milliseconds
  return (now - authData.timestamp) < timeoutMs
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentStation, setCurrentStation] = useState<Station>('frontdesk')
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState(4) // Default 4 hours

  // Load station and auth from localStorage on mount
  useEffect(() => {
    // Load station preference
    const savedStation = localStorage.getItem('currentStation') as Station
    if (savedStation && (savedStation === 'frontdesk' || savedStation === 'bikepark')) {
      setCurrentStation(savedStation)
    }

    // Load session timeout setting
    const savedTimeout = localStorage.getItem(SESSION_TIMEOUT_KEY)
    if (savedTimeout) {
      const timeoutHours = parseFloat(savedTimeout)
      if (timeoutHours > 0 && timeoutHours <= 168) { // Max 1 week
        setSessionTimeoutHours(timeoutHours)
      }
    }

    // Check for valid authentication
    const authData = getAuthData()
    if (authData && authData.authenticated) {
      const timeoutHours = savedTimeout ? parseFloat(savedTimeout) : 4
      if (isAuthValid(authData, timeoutHours)) {
        setIsAuthenticated(true)
      } else {
        // Auth expired, clear it
        clearAuthData()
      }
    }
  }, [])

  const setAuthenticated = (auth: boolean) => {
    setIsAuthenticated(auth)
    if (auth) {
      saveAuthData(true)
    } else {
      clearAuthData()
    }
  }

  const setStation = (station: Station) => {
    setCurrentStation(station)
    localStorage.setItem('currentStation', station)
  }

  const setSessionTimeout = (hours: number) => {
    if (hours > 0 && hours <= 168) { // Between 1 minute and 1 week
      setSessionTimeoutHours(hours)
      localStorage.setItem(SESSION_TIMEOUT_KEY, hours.toString())
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    clearAuthData()
  }

  return (
    <AppContext.Provider value={{
      isAuthenticated,
      currentStation,
      sessionTimeoutHours,
      setAuthenticated,
      setStation,
      setSessionTimeout,
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
