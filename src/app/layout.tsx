import type { Metadata, Viewport } from 'next'
import { Barlow, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const barlow = Barlow({
  variable: '--font-barlow',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: 'Yurei Jam: Phantom Traffic Simulator',
  description:
    'An interactive 3D simulation of phantom traffic jams. Cars follow each other on a ring road and small slowdowns grow into stop-and-go waves that travel backward.',
}

export const viewport: Viewport = {
  themeColor: '#0b1026',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full">{children}</body>
    </html>
  )
}
