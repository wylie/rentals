'use client'

import { useEffect, useState } from 'react'

const GA_DEBUG_STORAGE_KEY = 'ga_debug_mode'

export default function AnalyticsDebugToggle() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    try {
      const isEnabled = localStorage.getItem(GA_DEBUG_STORAGE_KEY) === 'true'
      setEnabled(isEnabled)
      window.__gaDebug = isEnabled
    } catch {
      setEnabled(false)
      window.__gaDebug = false
    }
  }, [])

  const toggle = () => {
    const next = !enabled
    setEnabled(next)
    window.__gaDebug = next
    localStorage.setItem(GA_DEBUG_STORAGE_KEY, String(next))
    console.log(`[GA DEBUG] ${next ? 'enabled' : 'disabled'}`)
  }

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed bottom-4 right-4 z-50 px-3 py-2 rounded-md bg-gray-900 text-white text-xs font-medium shadow-sm hover:bg-gray-800"
      title="Toggle GA debug logging"
    >
      GA Debug: {enabled ? 'On' : 'Off'}
    </button>
  )
}
