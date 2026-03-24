import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Acasting - Referral Program',
  description: 'Bjud in vänner och få Premium gratis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="sv">
      <body>{children}</body>
    </html>
  )
}
