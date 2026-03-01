'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import { event } from '@/lib/ga'

export default function AuthScreen() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signInWithPin } = useApp()
  const pathname = usePathname()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const trimmedPin = pin.trim()
      event('login_attempt', {
        method: 'pin',
        page_path: pathname || '/'
      })

      if (trimmedPin.length < 4) {
        event('login_failed', {
          method: 'pin',
          reason: 'pin_too_short'
        })
        setError('PIN must be at least 4 digits')
        return
      }

      const { error } = await signInWithPin(trimmedPin)
      if (error) {
        event('login_failed', {
          method: 'pin',
          reason: 'invalid_pin'
        })
        setError('Invalid PIN')
        setPin('')
      } else {
        event('login', {
          method: 'pin'
        })
      }
    } catch (err) {
      event('login_failed', {
        method: 'pin',
        reason: 'unexpected_error'
      })
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <span className="material-symbols-outlined text-6xl text-indigo-600">lock</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Rental Management
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your PIN to continue
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="pin" className="sr-only">
                PIN
              </label>
              <input
                id="pin"
                name="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter PIN"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm text-center bg-red-50 p-3 rounded-md">
              <span className="material-symbols-outlined text-lg">error</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center items-center space-x-2 py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-lg">
                {loading ? 'hourglass_empty' : 'lock_open'}
              </span>
              <span>{loading ? 'Please wait...' : 'Unlock'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
