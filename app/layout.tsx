import type { Metadata } from 'next'
import './globals.css'
import Providers from '@/components/Providers'
import { ThemeProvider } from '@/components/providers/ThemeProvider'

export const metadata: Metadata = {
  title: 'Marksio — AI Pazarlama Otomasyonu',
  description: 'E-ticaret mağazanız için AI destekli pazarlama otomasyonu. Email ve WhatsApp kampanyalarını otomatik yönetin.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
}

// Applies the stored theme before first paint — prevents flash of wrong theme.
const antiFlashScript = `(function(){try{var m=localStorage.getItem('theme-mode');var d=m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" style={{ overflowX: 'hidden' }} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: antiFlashScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..800;1,300..800&family=Inter:ital,opsz,wght@0,14..32,300..900;1,14..32,300..900&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="/_next/static/media/material-symbols-outlined.502efa35.woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body style={{ overflowX: 'hidden' }}>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}
