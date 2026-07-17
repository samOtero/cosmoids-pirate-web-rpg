import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import DevTools from '@/components/dev/DevTools';
import AnimationProvider from '@/app/components/AnimationProvider';
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased w-screen h-screen bg-[#0d2b45] text-[#f4e4b]`}
      >
        {children}
        <AnimationProvider />
        <DevTools />
        <Analytics />
      </body>
    </html>
  );
}
