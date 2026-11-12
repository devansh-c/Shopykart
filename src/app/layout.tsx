
import './globals.css';
import OfflineScreen from "@/components/shared/OfflineScreen";
import type { Metadata, Viewport } from 'next';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
});

/**
 * @fileOverview Root Layout v1.2.1 - UI Hydration Fix.
 * CRITICAL: Strictly imports globals.css FIRST to prevent unstyled layout shifts.
 */

export const viewport: Viewport = {
  themeColor: '#EF4444',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Shopykart – 10 Min Veg Food Delivery',
  description: 'Fastest gourmet delivery in town.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased bg-white text-foreground overflow-x-hidden min-h-screen" suppressHydrationWarning>
        <OfflineScreen />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
