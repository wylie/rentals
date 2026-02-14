'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Station = 'frontdesk' | 'bikepark'

interface AppContextType {
  isAuthenticated: boolean
  currentStation: Station
  setAuthenticated: (auth: boolean) => void
  setStation: (station: Station) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentStation, setCurrentStation] = useState<Station>('frontdesk')

  // Load station from localStorage on mount
  useEffect(() => {
    const savedStation = localStorage.getItem('currentStation') as Station
    if (savedStation && (savedStation === 'frontdesk' || savedStation === 'bikepark')) {
      setCurrentStation(savedStation)
    }
  }, [])

  const setAuthenticated = (auth: boolean) => {
    setIsAuthenticated(auth)
  }

  const setStation = (station: Station) => {
    setCurrentStation(station)
    localStorage.setItem('currentStation', station)
  }

  return (
    <AppContext.Provider value={{
      isAuthenticated,
      currentStation,
      setAuthenticated,
      setStation
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
