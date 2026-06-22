import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Portal Cliente · Ctrl',
  description: 'Portal de clientes de Skyline',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Portal Ctrl', statusBarStyle: 'black-translucent' },
  icons: { icon: '/ctrl-icon.svg', apple: '/ctrl-icon.svg' },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#0A0C11' },
    { media: '(prefers-color-scheme: light)', color: '#FAFAF8' },
  ],
}

const NO_FLASH = `(function(){try{
  var m=document.cookie.match(/(?:^|; )theme=([^;]+)/);
  var t=m?m[1]:(window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');
  document.documentElement.setAttribute('data-theme',t);
}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')?.value === 'light' ? 'light' : 'dark'
  return (
    <html lang="es" data-theme={theme} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  )
}
