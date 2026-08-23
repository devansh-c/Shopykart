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
 * @fileOverview Root Layout with Optimized Metadata for Google Indexing.
 * Ads components removed for a clean premium experience.
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
        <title>Shopykart – 10 Min Veg Food Delivery | Mauranipur, Ranipur | Order Online</title>
        <meta name="description" content="Shopykart: Official 10-Min Veg Food Delivery! 🥗 Order fresh gourmet food, artisanal pizzas, and local snacks. Best prices, premium quality, delivered instantly in Mauranipur and Ranipur." />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="canonical" href={siteUrl} />
        
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Shopykart – Premium 10-Min Food Delivery" />
        <meta property="og:description" content="Official 10-Min Veg Food Delivery in Mauranipur & Ranipur. Freshly Prepared | Best Prices." />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:site_name" content="Shopykart" />
        <meta property="og:image" content={`${siteUrl}/og-image.jpg`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Shopykart – Fast Gourmet Delivery" />
        <meta name="twitter:description" content="10-minute veg food delivery. Order now!" />

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
