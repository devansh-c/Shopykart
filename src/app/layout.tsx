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
 * SEO Optimized: Using standard head tags for static export compatibility while ensuring metadata richness.
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
        <title>Shopykart – 10 Min Veg Food Delivery | Mauranipur, Ranipur | Order Now</title>
        <meta name="description" content="Get lightning-fast 10-minute food delivery with Shopykart. Order fresh veg meals, artisanal pizzas, and gourmet burgers from top local restaurants in Mauranipur and Ranipur." />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href={siteUrl} />
        
        {/* OPEN GRAPH / FACEBOOK */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:title" content="Shopykart – Premium 10-Min Veg Food Delivery" />
        <meta property="og:description" content="Lightning-fast delivery of gourmet meals and daily essentials in Mauranipur and Ranipur." />
        <meta property="og:image" content={`${siteUrl}/og-image.jpg`} />

        {/* TWITTER */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:url" content={siteUrl} />
        <meta name="twitter:title" content="Shopykart – Fast Food Delivery Hub" />
        <meta name="twitter:description" content="Order fresh meals in 10 minutes from Shopykart. Best prices, premium quality." />
        <meta name="twitter:image" content={`${siteUrl}/og-image.jpg`} />

        {/* CRAWLER DIRECTIVES */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ShopyKart" />
        <meta name="theme-color" content="#EF4444" />
      </head>
      <body className="antialiased bg-white text-foreground overflow-x-hidden" suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
