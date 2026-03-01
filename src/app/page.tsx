"use client"

import { useEffect } from 'react'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import AuthScreen from '@/components/AuthScreen'
import SupabaseConfigNotice from '@/components/SupabaseConfigNotice'
import { useApp } from '@/contexts/AppContext'
import { isSupabaseConfigured } from '@/lib/supabase'
import { event } from '@/lib/ga'

export default function Home() {
  const { isAuthenticated, loading } = useApp()
  const router = useRouter()
  const hasTrackedRedirect = useRef(false)

  useEffect(() => {
    if (isAuthenticated) {
      if (!hasTrackedRedirect.current) {
        event('redirected_from_home_to_front_desk')
        hasTrackedRedirect.current = true
      }
      router.replace('/front-desk')
    }
  }, [isAuthenticated, router])

  if (!isSupabaseConfigured()) {
    return <SupabaseConfigNotice />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthScreen />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-lg">Redirecting...</div>
    </div>
  )
}
