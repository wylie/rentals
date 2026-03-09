import { NextResponse } from 'next/server'

const isValidSupabaseUrl = (value: string | undefined) =>
  !!value && value.startsWith('https://') && value.includes('.supabase.co')

const isNonEmpty = (value: string | undefined) => !!value && value.trim().length > 0

export async function GET() {
  const checks = {
    supabaseUrl: isValidSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabasePublishableKey: isNonEmpty(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    appAdminLoginEmail: isNonEmpty(process.env.NEXT_PUBLIC_APP_ADMIN_LOGIN_EMAIL),
  }

  const ok = Object.values(checks).every(Boolean)

  return NextResponse.json(
    {
      status: ok ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
      commitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || null,
    },
    { status: ok ? 200 : 503 }
  )
}
