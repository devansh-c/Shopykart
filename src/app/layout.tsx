
"use client"

import './globals.css';
import { CartProvider } from '@/components/cart/CartProvider';
import { Toaster } from '@/components/ui/toaster';
import { FloatingCart } from '@/components/shared/FloatingCart';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { EmailAuth } from '@/components/auth/EmailAuth';
import { usePathname } from 'next/navigation';
import { LocationRequest } from '@/components/shared/LocationRequest';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const pathname = usePathname();

  // Paths that should NOT trigger the main customer auth gate
  const isExcludedPath = pathname?.startsWith('/admin') || pathname?.startsWith('/vendor') || pathname?.startsWith('/delivery');
  const showAuth = !authLoading && !user && !isExcludedPath;

  return (
    <div className="relative min-h-screen">
      {showAuth && <EmailAuth />}
      <div className={showAuth ? "hidden" : ""}>
        {!isExcludedPath && <LocationRequest />}
        {children}
        {!isExcludedPath && <FloatingCart />}
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>ShopyKart | Premium Food Delivery</title>
        <meta name="description" content="Gourmet meals delivered to your doorstep with ShopyKart." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-[#FAFAFA] text-foreground">
        <FirebaseClientProvider>
          <FirebaseErrorListener />
          <CartProvider>
            <AppContent>
              {children}
            </AppContent>
            <Toaster />
          </CartProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
