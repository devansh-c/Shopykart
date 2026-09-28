import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
});

/**
 * @fileOverview Root Layout for ShopyKart with Advanced SEO.
 * Next.js 15 Server Component for optimal performance and metadata.
 */

export const viewport: Viewport = {
  themeColor: '#EF4444',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Shopykart – 10 Min Veg Food Delivery | Mauranipur, Ranipur | Order Now',
  description: 'Get lightning-fast 10-minute food delivery with Shopykart. Order fresh veg meals, artisanal pizzas, and gourmet burgers from top local restaurants in Mauranipur and Ranipur.',
  manifest: '/manifest.json',
  alternates: {
    canonical: 'https://shopykart.co.in',
  },
  openGraph: {
    type: 'website',
    url: 'https://shopykart.co.in',
    title: 'Shopykart – Premium 10-Min Veg Food Delivery',
    description: 'Lightning-fast delivery of gourmet meals and daily essentials in Mauranipur and Ranipur.',
    images: ['https://shopykart.co.in/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shopykart – Fast Food Delivery Hub',
    description: 'Order fresh meals in 10 minutes from Shopykart. Best prices, premium quality.',
    images: ['https://shopykart.co.in/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ShopyKart',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased bg-white text-foreground overflow-x-hidden" suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
