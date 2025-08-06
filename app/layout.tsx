import { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Multi-Tenant CMS',
  description: 'A powerful website builder and content management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="font-inter">{children}</body>
    </html>
  )
}
