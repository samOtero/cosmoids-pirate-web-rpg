import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import DevTools from '@/components/dev/DevTools';
import AnimationProvider from '@/app/components/AnimationProvider';
import RotateDeviceOverlay from '@/app/components/RotateDeviceOverlay';
import { Analytics } from '@vercel/analytics/next';
import AnalyticsControls from './components/AnalyticsControls';
import FullscreenControl from './components/FullscreenControl';
import AuthProvider from './components/auth/AuthProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Cosmoids Pirate RPG',
  description: 'A creature collection RPG set in the Pirate era!',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cosmoids',
  },
  icons: {
    apple: '/icons/cosmoids-180.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0d2b45',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-dvh w-screen overflow-hidden bg-[#0d2b45] text-[#f4e4b] antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
        <AnimationProvider />
        <DevTools />
        <Analytics />
        <AnalyticsControls />
        <FullscreenControl />
        <RotateDeviceOverlay />
      </body>
    </html>
  );
}
