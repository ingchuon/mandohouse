// src/app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Thai } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from '@/components/ThemeProvider'
import './globals.css'

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Mando House — ระบบหลังบ้าน',
  description: 'ระบบบริหารจัดการสถาบันสอนภาษาจีน Mando House',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Mando House',
  },
}

export const viewport: Viewport = {
  themeColor: '#0F6E56',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mando House" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${notoSansThai.variable} font-sans bg-surface dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased`}>
        <ThemeProvider>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </ThemeProvider>
      </body>
    </html>
  )
}
