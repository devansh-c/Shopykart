
'use client';

import { CartProvider } from '@/components/cart/CartProvider';
import { FloatingCart } from '@/components/shared/FloatingCart';
import { BottomNav } from '@/components/shared/BottomNav';
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
import { WelcomeBonusOverlay } from '@/components/auth/WelcomeBonusOverlay';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import React, { ReactNode, useState, useEffect, useMemo, memo } from 'react';

/**
 * PERFORMANCE: AuthGuard - Memoized and optimized for zero-flicker entry.
 */
const AuthGuard = memo(({ children, onReady }: { children: ReactNode; onReady: (ready: boolean) => void }) => {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);

  const hasActiveSession = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('shopykart_session_active') === 'true';
  }, []);

  useEffect(() => {
    if (loading) {
      onReady(false);
      return;
    }

    onReady(true);

    if (user) {
      localStorage.setItem('shopykart_session_active', 'true');
      setShowAuthOverlay(false);
    } else if (!hasActiveSession) {
      // Graceful delay before showing login to allow app assets to pre-warm
      const timer = setTimeout(() => {
        if (localStorage.getItem('shopykart_session_active') !== 'true') {
          setShowAuthOverlay(true);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, loading, hasActiveSession, onReady]);

  const isExcludedPath = useMemo(() => {
    return pathname?.startsWith('/admin') || 
           pathname?.startsWith('/vendor') || 
           pathname?.startsWith('/delivery') ||
           pathname?.startsWith('/Medical') ||
           pathname?.startsWith('/Beauty');
  }, [pathname]);

  if (isExcludedPath) return <>{children}</>;

  return (
    <>
      {children}
      {showAuthOverlay && !user && !hasActiveSession && <EmailAuth />}
    </>
  );
});
AuthGuard.displayName = "AuthGuard";

const AppContent = memo(({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [isAppFullyReady, setIsAppFullyReady] = useState(false);

  const isExcludedPath = useMemo(() => {
    return pathname?.startsWith('/admin') || 
           pathname?.startsWith('/vendor') || 
           pathname?.startsWith('/delivery') ||
           pathname?.startsWith('/Medical') ||
           pathname?.startsWith('/Beauty');
  }, [pathname]);

  return (
    <div className="relative min-h-screen flex flex-col transform-gpu overflow-x-hidden">
      <SplashScreen isAppReady={isAppFullyReady} />
      
      <AuthGuard onReady={setIsAppFullyReady}>
        <div className="relative min-h-screen flex flex-col">
          <main className={cn("flex-1 pb-44", !isExcludedPath && "content-visibility-auto")}>
            {!isExcludedPath && <LocationRequest />}
            <NotificationHandler />
            <TelegramNotifier />
            <AdOverlay />
            <WelcomeBonusOverlay />
            {children}
          </main>
          
          {!isExcludedPath && <FloatingCart />}
          {!isExcludedPath && <BottomNav />}
        </div>
      </AuthGuard>
      <Toaster />
    </div>
  );
});
AppContent.displayName = "AppContent";

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
