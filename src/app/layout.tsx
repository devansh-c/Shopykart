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
 * @fileOverview Root Layout - UI Hydration Fix.
 * Strictly imports CSS first to prevent "unstyled" flicker.
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
      <body className="antialiased bg-white text-foreground overflow-x-hidden" suppressHydrationWarning>
        <OfflineScreen />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
