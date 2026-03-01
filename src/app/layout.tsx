import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import { AppProvider } from '@/contexts/AppContext'
import GoogleAnalytics from '@/components/GoogleAnalytics'
import AnalyticsDebugToggle from '@/components/AnalyticsDebugToggle'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rental Management',
  description: 'Bike and Helmet Rental Inventory Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <AppProvider>
          {children}
        </AppProvider>
        <AnalyticsDebugToggle />
      </body>
    </html>
  )
}
