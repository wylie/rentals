import { getAssetSubcategories, replaceAssetSubcategories } from './database'

export type AssetType = 'bike' | 'helmet'

export interface Subcategory {
  id: string
  name: string
  fleetNumbers: number[]
}

export interface SubcategorySettings {
  bike: Subcategory[]
  helmet: Subcategory[]
}

const SUBCATEGORY_SETTINGS_KEY = 'rental_subcategory_settings_v1'

const defaultSettings: SubcategorySettings = {
  bike: [],
  helmet: []
}

const normalizeFleetNumbers = (numbers: number[]): number[] => {
  const cleaned = numbers
    .filter((value) => Number.isFinite(value) && value > 0)
    .map((value) => Math.floor(value))

  return Array.from(new Set(cleaned)).sort((a, b) => a - b)
}

const sanitizeSubcategory = (subcategory: Subcategory): Subcategory => ({
  id: subcategory.id,
  name: subcategory.name.trim(),
  fleetNumbers: normalizeFleetNumbers(subcategory.fleetNumbers)
})

const sanitizeSettings = (settings: SubcategorySettings): SubcategorySettings => {
  const bike: Subcategory[] = settings.bike
    .map(sanitizeSubcategory)
    .filter((subcategory) => subcategory.name.length > 0)

  const helmet: Subcategory[] = settings.helmet
    .map(sanitizeSubcategory)
    .filter((subcategory) => subcategory.name.length > 0)

  return { bike, helmet }
}

const getLocalSubcategorySettings = (): SubcategorySettings => {
  if (typeof window === 'undefined') {
    return defaultSettings
  }

  const saved = localStorage.getItem(SUBCATEGORY_SETTINGS_KEY)
  if (!saved) {
    return defaultSettings
  }

  try {
    const parsed = JSON.parse(saved) as Partial<SubcategorySettings>
    return sanitizeSettings({
      bike: Array.isArray(parsed.bike) ? parsed.bike : [],
      helmet: Array.isArray(parsed.helmet) ? parsed.helmet : []
    })
  } catch (error) {
    console.error('Error parsing local subcategory settings:', error)
    return defaultSettings
  }
}

const saveLocalSubcategorySettings = (settings: SubcategorySettings): void => {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(SUBCATEGORY_SETTINGS_KEY, JSON.stringify(sanitizeSettings(settings)))
}

const hasAnySubcategories = (settings: SubcategorySettings): boolean =>
  settings.bike.length > 0 || settings.helmet.length > 0

const toDatabaseRows = (settings: SubcategorySettings) => [
  ...settings.bike.map((subcategory) => ({
    asset_type: 'bike' as const,
    name: subcategory.name,
    fleet_numbers: subcategory.fleetNumbers
  })),
  ...settings.helmet.map((subcategory) => ({
    asset_type: 'helmet' as const,
    name: subcategory.name,
    fleet_numbers: subcategory.fleetNumbers
  }))
]

const fromDatabaseRows = (
  rows: Array<{ asset_type: AssetType; name: string; fleet_numbers: number[] }>
): SubcategorySettings => {
  const grouped: SubcategorySettings = { bike: [], helmet: [] }

  rows.forEach((row) => {
    grouped[row.asset_type].push({
      id: crypto.randomUUID(),
      name: row.name,
      fleetNumbers: row.fleet_numbers || []
    })
  })

  return sanitizeSettings(grouped)
}

export const getSubcategorySettings = async (): Promise<SubcategorySettings> => {
  const localSettings = getLocalSubcategorySettings()

  try {
    const rows = await getAssetSubcategories()
    if (rows.length > 0) {
      const fromDb = fromDatabaseRows(rows)
      saveLocalSubcategorySettings(fromDb)
      return fromDb
    }

    if (hasAnySubcategories(localSettings)) {
      await replaceAssetSubcategories(toDatabaseRows(localSettings))
      return localSettings
    }

    return defaultSettings
  } catch (error) {
    console.error('Error loading subcategory settings from Supabase:', error)
    return localSettings
  }
}

export const saveSubcategorySettings = async (settings: SubcategorySettings): Promise<void> => {
  const sanitized = sanitizeSettings(settings)
  saveLocalSubcategorySettings(sanitized)
  await replaceAssetSubcategories(toDatabaseRows(sanitized))
}

export const parseFleetNumberFromLabel = (label: string): number | null => {
  const match = label.match(/\d+$/)
  if (!match) {
    return null
  }

  const value = parseInt(match[0], 10)
  return Number.isNaN(value) ? null : value
}

export const getAssetSubcategoryName = (
  asset: { type: AssetType; label: string },
  settings: SubcategorySettings
): string | null => {
  const fleetNumber = parseFleetNumberFromLabel(asset.label)
  if (!fleetNumber) {
    return null
  }

  const typeSubcategories = settings[asset.type] || []
  const match = typeSubcategories.find((subcategory) =>
    subcategory.fleetNumbers.includes(fleetNumber)
  )

  return match?.name || null
}

export const getDisplayLabel = (
  asset: { type: AssetType; label: string },
  settings: SubcategorySettings
): string => {
  const fleetNumber = parseFleetNumberFromLabel(asset.label)
  if (!fleetNumber) {
    return asset.label
  }

  const subcategoryName = getAssetSubcategoryName(asset, settings)
  if (!subcategoryName) {
    return asset.label
  }

  const typeSubcategories = settings[asset.type] || []
  const subcategory = typeSubcategories.find((sub) => sub.name === subcategoryName)
  
  if (!subcategory) {
    return asset.label
  }

  // Count how many fleet numbers in this subcategory are less than current fleet number
  const sortedFleetNumbers = [...subcategory.fleetNumbers].sort((a, b) => a - b)
  const positionInCategory = sortedFleetNumbers.indexOf(fleetNumber) + 1

  const assetTypeLabel = asset.type === 'bike' ? 'Bike' : 'Helmet'
  return `${assetTypeLabel} ${String(positionInCategory).padStart(2, '0')}`
}

export const createSubcategory = (): Subcategory => ({
  id: crypto.randomUUID(),
  name: 'New Subcategory',
  fleetNumbers: []
})
