import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title:       'Stride — Move. Eat. Connect.',
  description: 'Your personal fitness and nutrition companion. Track food, log workouts, and get AI-powered recommendations.',
  manifest:    '/manifest.json',
};

export const viewport: Viewport = {
  themeColor:   '#4CAF82',
  width:        'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
