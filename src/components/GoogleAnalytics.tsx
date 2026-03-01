'use client'

import { useEffect, useMemo, useState } from 'react'
import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { GA_MEASUREMENT_ID, pageview } from '@/lib/ga'

export default function GoogleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isGaReady, setIsGaReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleReady = () => {
      setIsGaReady(true)
    }

    if (window.__gaReady) {
      setIsGaReady(true)
      return
    }

    window.addEventListener('ga-ready', handleReady)
    return () => {
      window.removeEventListener('ga-ready', handleReady)
    }
  }, [])

  const query = useMemo(() => searchParams?.toString() || '', [searchParams])

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !pathname || !isGaReady) {
      return
    }

    const url = query ? `${pathname}?${query}` : pathname

    pageview(url)
  }, [pathname, query, isGaReady])

  if (!GA_MEASUREMENT_ID) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });
          window.__gaReady = true;
          window.dispatchEvent(new Event('ga-ready'));
        `}
      </Script>
    </>
  )
}