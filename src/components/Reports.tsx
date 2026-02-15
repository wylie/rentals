'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { clearSessions, getAssets, getSessions, type Asset, type Session } from '@/lib/database'

interface ReportData {
  asset: Asset
  todayDuration: number
  weekDuration: number
  todaySessions: number
  weekSessions: number
}

const Reports = forwardRef<{ clearReports: () => Promise<void> }>((_props, ref) => {
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [assetType, setAssetType] = useState<'bike' | 'helmet'>('bike')

  const loadReportData = async () => {
    try {
      // Get all assets first
      const allAssets = await getAssets()
      const activeAssets = allAssets.filter(asset => asset.active)
      
      // Calculate date ranges
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)

      // Get all sessions for the past week
      const allSessions = await getSessions()
      const filteredSessions = allSessions.filter(session => {
        const checkedOutDate = new Date(session.checked_out_at)
        return checkedOutDate >= weekStart && session.returned_at !== null
      })

      // Process data for each asset
      const processedData: ReportData[] = activeAssets.map((asset) => {
        const assetSessions = filteredSessions.filter(session => session.asset_id === asset.id)
        
        const todaySessions = assetSessions.filter(session => 
          new Date(session.checked_out_at) >= todayStart
        )
        
        const weekSessions = assetSessions

        // Calculate durations in minutes
        const todayDuration = todaySessions.reduce((total, session) => {
          if (session.returned_at && session.checked_out_at) {
            const duration = new Date(session.returned_at).getTime() - new Date(session.checked_out_at).getTime()
            return total + Math.round(duration / (1000 * 60)) // Convert to minutes
          }
          return total
        }, 0)

        const weekDuration = weekSessions.reduce((total, session) => {
          if (session.returned_at && session.checked_out_at) {
            const duration = new Date(session.returned_at).getTime() - new Date(session.checked_out_at).getTime()
            return total + Math.round(duration / (1000 * 60)) // Convert to minutes
          }
          return total
        }, 0)

        return {
          asset,
          todayDuration,
          weekDuration,
          todaySessions: todaySessions.length,
          weekSessions: weekSessions.length
        }
      })

      setReportData(processedData)
    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const headers = [
      assetType === 'bike' ? 'Bike' : 'Helmet',
      'Today Sessions',
      'Today Duration (min)',
      'Today Avg (min)',
      'Week Sessions',
      'Week Duration (min)',
      'Week Avg (min)'
    ]

    const csvData = reportData
      .filter(item => item.asset.type === assetType)
      .map(data => [
      data.asset.label,
      data.todaySessions,
      data.todayDuration,
      data.todaySessions > 0 ? Math.round(data.todayDuration / data.todaySessions) : 0,
      data.weekSessions,
      data.weekDuration,
      data.weekSessions > 0 ? Math.round(data.weekDuration / data.weekSessions) : 0
    ])

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${assetType}-usage-report-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleClearReports = async () => {
    setLoading(true)
    try {
      await clearSessions()
      await loadReportData()
    } catch (error) {
      console.error('Error clearing reports:', error)
      alert('Failed to clear reports. Please try again.')
    }
  }

  // Expose clearReports method to parent via ref
  useImperativeHandle(ref, () => ({
    clearReports: handleClearReports
  }))

  const formatDuration = (minutes: number): string => {
    if (minutes === 0) return '0m'
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  useEffect(() => {
    loadReportData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading reports...</div>
      </div>
    )
  }

  const filteredReportData = reportData.filter(item => item.asset.type === assetType)
  const totalTodaySessions = filteredReportData.reduce((sum, item) => sum + item.todaySessions, 0)
  const totalTodayDuration = filteredReportData.reduce((sum, item) => sum + item.todayDuration, 0)
  const totalWeekSessions = filteredReportData.reduce((sum, item) => sum + item.weekSessions, 0)
  const totalWeekDuration = filteredReportData.reduce((sum, item) => sum + item.weekDuration, 0)

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Today Sessions</h3>
          <p className="text-2xl font-bold text-gray-900">{totalTodaySessions}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Today Duration</h3>
          <p className="text-2xl font-bold text-gray-900">{formatDuration(totalTodayDuration)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Week Sessions</h3>
          <p className="text-2xl font-bold text-gray-900">{totalWeekSessions}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Week Duration</h3>
          <p className="text-2xl font-bold text-gray-900">{formatDuration(totalWeekDuration)}</p>
        </div>
      </div>

      {/* Header and Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold text-gray-800">Usage Report</h2>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => setAssetType('bike')}
              className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium border rounded-l-md transition-colors ${
                assetType === 'bike'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="material-symbols-outlined text-lg">pedal_bike</span>
              <span>Bikes</span>
            </button>
            <button
              onClick={() => setAssetType('helmet')}
              className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium border rounded-r-md transition-colors ${
                assetType === 'helmet'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="material-symbols-outlined text-lg">sports_motorsports</span>
              <span>Helmets</span>
            </button>
          </div>
        </div>
        <div>
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {assetType === 'bike' ? 'Bike' : 'Helmet'}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Today Sessions
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Today Duration
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Today Avg
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week Sessions
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week Duration
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Week Avg
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReportData.map((data) => {
                const todayAvg = data.todaySessions > 0 ? Math.round(data.todayDuration / data.todaySessions) : 0
                const weekAvg = data.weekSessions > 0 ? Math.round(data.weekDuration / data.weekSessions) : 0
                
                return (
                  <tr key={data.asset.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {data.asset.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {data.todaySessions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {formatDuration(data.todayDuration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {formatDuration(todayAvg)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {data.weekSessions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {formatDuration(data.weekDuration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {formatDuration(weekAvg)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
})

Reports.displayName = 'Reports'

export default Reports