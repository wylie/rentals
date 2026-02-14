'use client'

import { useState } from 'react'
import { useApp } from '@/contexts/AppContext'

export default function AuthScreen() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const { setAuthenticated } = useApp()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const correctPin = process.env.NEXT_PUBLIC_APP_PIN || '1234'
    
    if (pin === correctPin) {
      setAuthenticated(true)
      setError('')
    } else {
      setError('Incorrect PIN')
      setPin('')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Rentals Management
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter PIN to access the system
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="pin" className="sr-only">
              PIN
            </label>
            <input
              id="pin"
              name="pin"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm text-center text-2xl tracking-widest"
              placeholder="Enter PIN"
              maxLength={6}
            />
          </div>
          {error && (
            <div className="text-red-600 text-sm text-center">
              {error}
            </div>
          )}
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Access System
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
