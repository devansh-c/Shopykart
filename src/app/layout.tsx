
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

export const metadata: Metadata = {
  title: 'Shopykart 10 Min Veg Food Delivery|Mauranipur,Ranipur| Order Now',
  description: 'Shopykart: Official 10-Min Veg Food Delivery! 🥗 Freshly Prepared | Best Prices | Open 10 AM - 8:15 PM. Verified Service by Shopykart.',
  manifest: '/manifest.json',
  metadataBase: new URL('https://shopykart.co.in'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: 'https://shopykart.co.in/',
    title: 'ShopyKart | Premium Food Delivery',
    siteName: 'ShopyKart',
    description: 'Gourmet meals delivered to your doorstep. Best food in Ranipur and Mauranipur.',
    images: [
      {
        url: 'https://picsum.photos/seed/shopy-og/1200/630',
        width: 1200,
        height: 630,
        alt: 'ShopyKart Premium Delivery',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Shopykart 10 Min Veg Food Delivery|Mauranipur,Ranipur| Order Now',
    description: 'Shopykart: Official 10-Min Veg Food Delivery! 🥗 Freshly Prepared | Best Prices | Open 10 AM - 8:15 PM. Verified Service by Shopykart',
    images: ['https://picsum.photos/seed/shopy-twitter/1200/600'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
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
