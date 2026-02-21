'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import {
  clearSessions,
  getAssets,
  getSessions,
  getBikeReturnChecks,
  type Asset
} from '@/lib/database'
import { getAssetSubcategoryName, getSubcategorySettings, getDisplayLabel } from '@/lib/subcategories'

interface ReportData {
  asset: Asset
  displayLabel: string
  subcategoryName: string
  todayDuration: number
  weekDuration: number
  todaySessions: number
  weekSessions: number
}

interface BikeReturnRow {
  id: number
  assetLabel: string
  cleaned: boolean
  needsMaintenance: boolean
  maintenanceNotes: string | null
  createdAt: string
}

const Reports = forwardRef<{ clearReports: () => Promise<void> }>((_props, ref) => {
  const [reportData, setReportData] = useState<ReportData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAssetType, setSelectedAssetType] = useState<'bike' | 'helmet'>('bike')
  const [selectedSubcategory, setSelectedSubcategory] = useState('all')
  const [reportView, setReportView] = useState<'usage' | 'maintenance'>('usage')
  const [bikeReturnRows, setBikeReturnRows] = useState<BikeReturnRow[]>([])

  const loadReportData = async () => {
    try {
      // Get all assets first
      const allAssets = await getAssets()
      const activeAssets = allAssets.filter(asset => asset.active)
      const subcategorySettings = await getSubcategorySettings()
      
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
          displayLabel: getDisplayLabel(asset, subcategorySettings),
          subcategoryName: getAssetSubcategoryName(asset, subcategorySettings) || 'Uncategorized',
          todayDuration,
          weekDuration,
          todaySessions: todaySessions.length,
          weekSessions: weekSessions.length
        }
      })

      setReportData(processedData)

      const returnChecks = await getBikeReturnChecks()
      const bikesById = new Map(activeAssets.map((asset) => [asset.id, getDisplayLabel(asset, subcategorySettings)]))
      const returnRows: BikeReturnRow[] = returnChecks.map((check) => ({
        id: check.id,
        assetLabel: bikesById.get(check.asset_id) || `Bike ${check.asset_id}`,
        cleaned: check.cleaned,
        needsMaintenance: check.needs_maintenance,
        maintenanceNotes: check.maintenance_notes,
        createdAt: check.created_at
      }))

      setBikeReturnRows(returnRows)
    } catch (error) {
      console.error('Error loading report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (reportView === 'maintenance') {
      const headers = ['Bike', 'Returned At', 'Cleaned', 'Needs Maintenance', 'Maintenance Notes']
      const csvData = bikeReturnRows.map((row) => [
        row.assetLabel,
        new Date(row.createdAt).toLocaleString(),
        row.cleaned ? 'Yes' : 'No',
        row.needsMaintenance ? 'Yes' : 'No',
        row.maintenanceNotes || ''
      ])

      const csvContent = [headers, ...csvData]
        .map((row) => row.join(','))
        .join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `bike-park-maintenance-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      return
    }

    const headers = [
      selectedAssetType === 'bike' ? 'Bike' : 'Helmet',
      'Subcategory',
      'Today Sessions',
      'Today Duration (min)',
      'Today Avg (min)',
      'Week Sessions',
      'Week Duration (min)',
      'Week Avg (min)'
    ]

    const csvData = reportData
      .filter(item => item.asset.type === selectedAssetType)
      .filter(item => selectedSubcategory === 'all' || item.subcategoryName === selectedSubcategory)
      .map(data => [
      data.displayLabel,
      data.subcategoryName,
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
    const subcategorySuffix = selectedSubcategory === 'all'
      ? 'all-subcategories'
      : selectedSubcategory.toLowerCase().replace(/\s+/g, '-')
    link.download = `${selectedAssetType}-${subcategorySuffix}-usage-report-${new Date().toISOString().split('T')[0]}.csv`
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
    let interval: NodeJS.Timeout | null = null

    const initialize = async () => {
      await loadReportData()
      interval = setInterval(() => {
        loadReportData()
      }, 5000)
    }

    initialize()

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [])

  // Reset subcategory filter when asset type changes
  useEffect(() => {
    setSelectedSubcategory('all')
  }, [selectedAssetType])

  const SkeletonCard = () => (
    <div className="bg-white p-4 rounded-lg shadow animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
      <div className="h-8 bg-gray-200 rounded w-16"></div>
    </div>
  )

  const SkeletonTableRow = () => (
    <tr>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
    </tr>
  )

  const typeReportData = reportData.filter(item => item.asset.type === selectedAssetType)
  const availableSubcategories = [...new Set(typeReportData.map((item) => item.subcategoryName))].sort((a, b) => {
    if (a === 'Uncategorized') return 1
    if (b === 'Uncategorized') return -1
    return a.localeCompare(b)
  })

  const filteredReportData = typeReportData.filter((item) =>
    selectedSubcategory === 'all' || item.subcategoryName === selectedSubcategory
  )
  const totalTodaySessions = filteredReportData.reduce((sum, item) => sum + item.todaySessions, 0)
  const totalTodayDuration = filteredReportData.reduce((sum, item) => sum + item.todayDuration, 0)
  const totalWeekSessions = filteredReportData.reduce((sum, item) => sum + item.weekSessions, 0)
  const totalWeekDuration = filteredReportData.reduce((sum, item) => sum + item.weekDuration, 0)

  const bikeReturnSummary = bikeReturnRows.reduce(
    (acc, row) => ({
      total: acc.total + 1,
      cleaned: acc.cleaned + (row.cleaned ? 1 : 0),
      needsMaintenance: acc.needsMaintenance + (row.needsMaintenance ? 1 : 0)
    }),
    { total: 0, cleaned: 0, needsMaintenance: 0 }
  )

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      {reportView === 'usage' ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Total Returns</h3>
                <p className="text-2xl font-bold text-gray-900">{bikeReturnSummary.total}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Cleaned</h3>
                <p className="text-2xl font-bold text-gray-900">{bikeReturnSummary.cleaned}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-500">Needs Maintenance</h3>
                <p className="text-2xl font-bold text-gray-900">{bikeReturnSummary.needsMaintenance}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Header and Export */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              onClick={() => setReportView('usage')}
              className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium border rounded-l-md transition-colors ${
                reportView === 'usage'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="material-symbols-outlined text-lg">assessment</span>
              <span>Usage</span>
            </button>
            <button
              onClick={() => setReportView('maintenance')}
              className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium border rounded-r-md transition-colors ${
                reportView === 'maintenance'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="material-symbols-outlined text-lg">fact_check</span>
              <span>Maintenance Logs</span>
            </button>
          </div>

          {reportView === 'usage' && (
            <h2 className="text-2xl font-bold text-gray-800">Usage Report</h2>
          )}
          {reportView === 'maintenance' && (
            <h2 className="text-2xl font-bold text-gray-800">Bike Park Maintenance Logs</h2>
          )}
          {reportView === 'usage' && (
            <div className="flex items-center flex-wrap gap-2">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  onClick={() => setSelectedAssetType('bike')}
                  className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium border rounded-l-md transition-colors ${
                    selectedAssetType === 'bike'
                      ? 'bg-green-600 text-white border-green-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">pedal_bike</span>
                  <span>Bikes</span>
                </button>
                <button
                  onClick={() => setSelectedAssetType('helmet')}
                  className={`flex items-center space-x-1 px-3 py-2 text-sm font-medium border rounded-r-md transition-colors ${
                    selectedAssetType === 'helmet'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">sports_motorsports</span>
                  <span>Helmets</span>
                </button>
              </div>
              <label htmlFor="subcategoryFilter" className="text-sm font-medium text-gray-700">Subcategory</label>
              <select
                id="subcategoryFilter"
                value={selectedSubcategory}
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                {availableSubcategories.map((subcategoryName) => (
                  <option key={subcategoryName} value={subcategoryName}>
                    {subcategoryName}
                  </option>
                ))}
              </select>
            </div>
          )}
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

      {reportView === 'usage' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {selectedAssetType === 'bike' ? 'Bike' : 'Helmet'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subcategory
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
                {loading ? (
                  <>
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                    <SkeletonTableRow />
                  </>
                ) : (
                  filteredReportData.map((data) => {
                    const todayAvg = data.todaySessions > 0 ? Math.round(data.todayDuration / data.todaySessions) : 0
                    const weekAvg = data.weekSessions > 0 ? Math.round(data.weekDuration / data.weekSessions) : 0
                    
                    return (
                      <tr key={data.asset.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {data.displayLabel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {data.subcategoryName}
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bike
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Returned At
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cleaned
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Needs Maintenance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Maintenance Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <>
                    <tr>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                    </tr>
                  </>
                ) : (
                  bikeReturnRows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.assetLabel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {row.cleaned ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        {row.needsMaintenance ? 'Yes' : 'No'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {row.maintenanceNotes ? (
                          <div className="whitespace-pre-wrap break-words">{row.maintenanceNotes}</div>
                        ) : (
                          <span className="text-gray-400">–</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
})

Reports.displayName = 'Reports'

export default Reports