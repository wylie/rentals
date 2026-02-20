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

export const getSubcategorySettings = (): SubcategorySettings => {
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
    console.error('Error parsing subcategory settings:', error)
    return defaultSettings
  }
}

export const saveSubcategorySettings = (settings: SubcategorySettings): void => {
  if (typeof window === 'undefined') {
    return
  }

  const sanitized = sanitizeSettings(settings)
  localStorage.setItem(SUBCATEGORY_SETTINGS_KEY, JSON.stringify(sanitized))
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

export const createSubcategory = (): Subcategory => ({
  id: crypto.randomUUID(),
  name: 'New Subcategory',
  fleetNumbers: []
})
