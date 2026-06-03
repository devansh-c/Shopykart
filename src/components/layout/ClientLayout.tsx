
'use client';

import { CartProvider } from '@/components/cart/CartProvider';
import { FloatingCart } from '@/components/shared/FloatingCart';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { usePathname } from 'next/navigation';
import { LocationRequest } from '@/components/shared/LocationRequest';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { NotificationHandler } from '@/components/shared/NotificationHandler';
import { SplashScreen } from '@/components/shared/SplashScreen';
import { BrandingLoader } from '@/components/shared/BrandingLoader';
import { TelegramNotifier } from '@/components/shared/TelegramNotifier';
import { EmailAuth } from '@/components/auth/EmailAuth';
import { AdOverlay } from '@/components/shared/AdOverlay';
import { ReactNode, useState, useEffect } from 'react';

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const pathname = usePathname();

  // Paths that don't require customer login
  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/vendor') || 
                         pathname?.startsWith('/delivery');

  if (loading) return null;

  // If no user and not an excluded path, force Email Auth
  if (!user && !isExcludedPath) {
    return <EmailAuth />;
  }

  return <>{children}</>;
}

function AppContent({ children }: { children: ReactNode }) {
  const { loading } = useUser();
  const pathname = usePathname();
  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/vendor') || 
                         pathname?.startsWith('/delivery');

  return (
    <div className="relative min-h-screen">
      <SplashScreen isAppReady={!loading} />
      <AuthGuard>
        <div>
          {!isExcludedPath && <LocationRequest />}
          <NotificationHandler />
          <TelegramNotifier />
          <AdOverlay />
          {children}
          {!isExcludedPath && <FloatingCart />}
        </div>
      </AuthGuard>
    </div>
  );
}

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
      <BrandingLoader />
      <FirebaseErrorListener />
      <CartProvider>
        <AppContent>{children}</AppContent>
      </CartProvider>
    </FirebaseClientProvider>
  );
}
