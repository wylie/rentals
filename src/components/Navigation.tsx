'use client'

import { useState } from 'react'
import StationSelector from './StationSelector'

interface NavigationProps {
  currentView: 'inventory' | 'reports'
  onViewChange: (view: 'inventory' | 'reports') => void
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              Rentals Management
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="flex space-x-4">
            <button
              onClick={() => onViewChange('inventory')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'inventory'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Live Inventory
            </button>
            <button
              onClick={() => onViewChange('reports')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                currentView === 'reports'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Reports
            </button>
          </div>

          {/* Station Selector */}
          <StationSelector />
        </div>
      </div>
    </nav>
  )
}
