import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Paymi - AI Web3 Invoice Platform',
  description: 'Intelligent blockchain invoicing with AI and Telegram integration',
  icons: {
    icon: [
      { url: '/invoice-bill-svgrepo-com.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png' }
    ],
    apple: [
      { url: '/apple-touch-icon.png' }
    ]
  },
  openGraph: {
    title: 'Paymi - AI Web3 Invoice Platform',
    description: 'Intelligent blockchain invoicing with AI and Telegram integration',
    images: ['/og-image.png']
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}