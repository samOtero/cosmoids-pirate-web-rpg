import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import DevTools from '@/components/dev/DevTools';
import AnimationProvider from '@/app/components/AnimationProvider';
import RotateDeviceOverlay from '@/app/components/RotateDeviceOverlay';
import { Analytics } from '@vercel/analytics/next';

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-screen w-screen bg-[#0d2b45] text-[#f4e4b] antialiased`}
      >
        {children}
        <AnimationProvider />
        <DevTools />
        <Analytics />
        <RotateDeviceOverlay />
      </body>
    </html>
  );
}
