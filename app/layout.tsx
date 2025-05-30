import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'HRPS Status Monitoring',
  description: 'Status monitoring interface for HRPS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          html {
            text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
