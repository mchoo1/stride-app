import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  title:       'Stride — Move. Eat. Connect.',
  description: 'Your personal fitness and nutrition companion. Track food, log workouts, and get AI-powered recommendations.',
  manifest:    '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico',          sizes: '32x32',   type: 'image/x-icon' },
      { url: '/icons/icon-32.png',    sizes: '32x32',   type: 'image/png' },
      { url: '/icons/icon-192.png',   sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png',   sizes: '512x512', type: 'image/png' },
      { url: '/icons/icon-1024.png',  sizes: '1024x1024', type: 'image/png' },
    ],
    apple:    [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: [{ url: '/favicon.ico' }],
  },
};

export const viewport: Viewport = {
  themeColor:   '#1E7F5C',
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen antialiased">
        <ErrorBoundary>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
