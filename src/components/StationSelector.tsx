'use client'

import { useApp } from '@/contexts/AppContext'

export default function StationSelector() {
  const { currentStation, setStation } = useApp()

  return (
    <div className="flex items-center space-x-4 bg-white rounded-lg p-3 shadow-sm border">
      <span className="text-sm font-medium text-gray-700">Station:</span>
      <div className="flex space-x-2">
        <button
          onClick={() => setStation('frontdesk')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            currentStation === 'frontdesk'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Front Desk
        </button>
        <button
          onClick={() => setStation('bikepark')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            currentStation === 'bikepark'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Bike Park
        </button>
      </div>
    </div>
  )
}
