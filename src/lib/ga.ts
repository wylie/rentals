export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const GA_DEBUG_STORAGE_KEY = 'ga_debug_mode'

declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
    __gaReady?: boolean
    __gaDebug?: boolean
  }
}

const isGaDebugEnabled = () => {
  if (typeof window === 'undefined') {
    return false
  }

  if (typeof window.__gaDebug === 'boolean') {
    return window.__gaDebug
  }

  try {
    const stored = localStorage.getItem(GA_DEBUG_STORAGE_KEY)
    const enabled = stored === 'true'
    window.__gaDebug = enabled
    return enabled
  } catch {
    return false
  }
}

export const pageview = (url: string) => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) {
    return
  }

  const payload = {
    page_path: url,
    page_location: `${window.location.origin}${url}`,
    page_title: document.title,
  }

  if (isGaDebugEnabled()) {
    console.log('[GA DEBUG] page_view', payload)
  }

  window.gtag('event', 'page_view', payload)
}

export const event = (
  action: string,
  params?: Record<string, string | number | boolean>
) => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) {
    return
  }

  if (isGaDebugEnabled()) {
    console.log('[GA DEBUG] event', action, params || {})
  }

  window.gtag('event', action, params)
}