'use client';

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
 * @fileOverview Root Layout for ShopyKart.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteUrl = 'https://shopykart.co.in';

  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <title>Shopykart – 10 Min Veg Food Delivery|Mauranipur,Ranipur| Order Now</title>
        <meta name="description" content="Get lightning-fast food delivery with Shopykart. Order fresh meals, delicious fast food, and daily specials from top local restaurants directly to your doorstep." />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href={siteUrl} />
        
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Shopykart – 10 Min Veg Food Delivery|Mauranipur,Ranipur| Order Now" />
        <meta property="og:url" content={siteUrl} />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ShopyKart" />
      </head>
      <body className="antialiased bg-white text-foreground overflow-x-hidden" suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
