import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: 'BioVal Analytics — Commercial Intelligence for Life Sciences',
  description:
    'Generate automated commercial intelligence reports for drug assets. Enter a drug name or ClinicalTrials.gov NCT ID to model risk-adjusted valuations, payer sentiment, and the competitive landscape.',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0b0f14',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="bg-background font-sans antialiased min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        
        {/* Added Footer */}
        <footer className="w-full py-6 text-center text-xs text-muted-foreground border-t border-border/40">
          <p>
            BioVal Analytics &mdash; Built with precision by <span className="font-semibold text-foreground">Roshan Puri</span>
          </p>
        </footer>

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
