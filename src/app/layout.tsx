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
  title: 'ShopyKart | Premium Food Delivery',
  description: 'Gourmet meals delivered to your doorstep. Best food in Ranipur and Mauranipur.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛒</text></svg>',
    apple: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛒</text></svg>',
  },
  alternates: {
    canonical: 'https://shopykart.co.in/',
  },
  openGraph: {
    type: 'website',
    url: 'https://shopykart.co.in/',
    title: 'ShopyKart | Premium Food Delivery',
    siteName: 'ShopyKart',
    description: 'Gourmet meals delivered to your doorstep. Best food in Ranipur and Mauranipur.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0B0B0B',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="antialiased bg-[#0B0B0B] text-foreground">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
