// src/app/layout.tsx
import type { Metadata } from 'next'
import { Noto_Sans_Thai } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-sans',
})

export const metadata: Metadata = {
  title: 'Mando House — ระบบหลังบ้าน',
  description: 'ระบบบริหารจัดการสถาบันสอนภาษาจีน Mando House',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${notoSansThai.variable} font-sans bg-surface text-gray-900 antialiased`}>
        {children}
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      </body>
    </html>
  )
}
