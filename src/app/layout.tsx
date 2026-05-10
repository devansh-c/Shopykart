import type {Metadata} from 'next';
import './globals.css';
import {CartProvider} from '@/components/cart/CartProvider';
import {Toaster} from '@/components/ui/toaster';
import {FloatingCart} from '@/components/shared/FloatingCart';

export const metadata: Metadata = {
  title: 'ShopyKart | Premium Food Delivery',
  description: 'Gourmet meals delivered to your doorstep with ShopyKart.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <CartProvider>
          <div className="relative min-h-screen">
            {children}
            <FloatingCart />
          </div>
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}
