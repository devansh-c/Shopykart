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
 * @fileOverview Root Layout with Updated Premium Logo and Favicon.
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
        <title>Shopykart – Premium Gourmet Delivery | Mauranipur, Ranipur</title>
        <meta name="description" content="Official 10-Min Veg Food Delivery! 🥗 Order fresh gourmet food instantly." />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/file_000000004d78821193714c20786ca8d1.png" sizes="any" />
        <link rel="apple-touch-icon" href="/file_000000004d78821193714c20786ca8d1.png" />
        <link rel="canonical" href={siteUrl} />
        
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Shopykart – Premium 10-Min Delivery" />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:image" content="/file_000000004d78821193714c20786ca8d1.png" />

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
