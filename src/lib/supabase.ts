import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const appLoginEmail = process.env.NEXT_PUBLIC_APP_LOGIN_EMAIL || ''

// Check if we have valid Supabase configuration
const hasValidConfig = supabaseUrl !== 'https://placeholder.supabase.co' && 
                      supabaseAnonKey !== 'placeholder-key' &&
                      supabaseUrl.includes('.supabase.co')

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
  },
})

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => hasValidConfig
export const isAppLoginEmailConfigured = () => appLoginEmail.includes('@')
export const getAppLoginEmail = () => appLoginEmail

// Database types
export interface Database {
  public: {
    Tables: {
      assets: {
        Row: {
          id: number
          type: 'bike' | 'helmet'
          label: string
          active: boolean
          created_at: string
          user_id: string
        }
        Insert: {
          type: 'bike' | 'helmet'
          label: string
          active?: boolean
          user_id: string
        }
        Update: {
          type?: 'bike' | 'helmet'
          label?: string
          active?: boolean
        }
      }
      asset_states: {
        Row: {
          id: number
          asset_id: number
          in_use: boolean
          current_session_id: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: number
          in_use?: boolean
          current_session_id?: number | null
          user_id: string
        }
        Update: {
          in_use?: boolean
          current_session_id?: number | null
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: number
          asset_id: number
          checked_out_at: string
          returned_at: string | null
          checked_out_station: string
          returned_station: string | null
          checked_out_by: string | null
          returned_by: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          asset_id: number
          checked_out_at: string
          checked_out_station: string
          checked_out_by?: string | null
          user_id: string
        }
        Update: {
          returned_at?: string | null
          returned_station?: string | null
          returned_by?: string | null
        }
      }
    }
  }
}