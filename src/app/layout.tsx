
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
import { NotificationHandler } from '@/components/shared/NotificationHandler';
import { SplashScreen } from '@/components/shared/SplashScreen';

// Note: Next.js metadata should ideally be in a server component. 
// Since this is a client-heavy layout, we keep the basic tags for now.
// For full SEO, you can move metadata to a separate metadata.ts or use it in page.tsx files.

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
        <NotificationHandler />
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
        {/* SEO TITLE & DESCRIPTION */}
        <title>ShopyKart | Premium Food Delivery in Ranipur & Mauranipur</title>
        <meta name="description" content="Get gourmet meals delivered to your doorstep within 20 minutes. ShopyKart offers the best selection of food in Ranipur and Mauranipur." />
        
        {/* VIEWPORT & THEME */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="theme-color" content="#EF4444" />

        {/* FAVICON: Put your favicon.ico in the /public folder */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.ico" />

        {/* FONTS */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-[#FAFAFA] text-foreground">
        <SplashScreen />
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
