'use client';

import './globals.css';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Inter } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
});

/**
 * @fileOverview Root Layout with Optimized Metadata for Google Indexing.
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
        
        {/* OpenGraph for Social Media */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Shopykart – Premium 10-Min Food Delivery" />
        <meta property="og:description" content="Official 10-Min Veg Food Delivery in Mauranipur & Ranipur. Freshly Prepared | Best Prices." />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:site_name" content="Shopykart" />
        <meta property="og:image" content={`${siteUrl}/og-image.jpg`} />

        {/* Twitter/X SEO */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Shopykart – Fast Gourmet Delivery" />
        <meta name="twitter:description" content="10-minute veg food delivery. Order now!" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ShopyKart" />
        
        {/* Google AdSense Integration */}
        <Script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3697085425178482" 
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="antialiased bg-white text-foreground overflow-x-hidden" suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
