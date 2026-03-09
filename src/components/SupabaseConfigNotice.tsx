'use client'

import { isSupabaseConfigured } from '@/lib/supabase'

export default function SupabaseConfigNotice() {
  if (isSupabaseConfigured()) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full space-y-8 p-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Setup Required
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Supabase configuration is needed to sync data across devices
          </p>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 text-yellow-400">⚠️</div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Configuration Missing
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>To enable cross-device sync, you need to:</p>
                <ol className="mt-2 list-decimal list-inside space-y-1">
                  <li>Create a Supabase account at <a href="https://supabase.com" className="underline text-blue-600" target="_blank" rel="noopener noreferrer">supabase.com</a></li>
                  <li>Set up the database using the provided SQL schema</li>
                  <li>Set environment variables for your deployment (<code className="bg-yellow-100 px-1 rounded">.env.local</code> locally, Vercel Project Settings in production)</li>
                  <li>Set app login emails for PIN access (Admin required, Staff optional)</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Setup Instructions</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>📖 Check the <code className="bg-gray-100 px-1 rounded">SUPABASE_SETUP.md</code> file for detailed instructions</p>
            <p>🗄️ Run the SQL setup files in the project root (<code className="bg-gray-100 px-1 rounded">supabase-*.sql</code>)</p>
            <p>🔧 Set <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code>, <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> (or legacy <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>), <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_APP_ADMIN_LOGIN_EMAIL</code>, and optional <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_APP_STAFF_LOGIN_EMAIL</code> in your local env file and in your host environment settings</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            After configuration, restart your development server with <code className="bg-gray-100 px-1 rounded">npm run dev</code>
          </p>
        </div>
      </div>
    </div>
  )
}