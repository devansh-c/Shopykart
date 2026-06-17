'use client';

import { CartProvider } from '@/components/cart/CartProvider';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { usePathname } from 'next/navigation';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { SplashScreen } from '@/components/shared/SplashScreen';
import { BrandingLoader } from '@/components/shared/BrandingLoader';
import { TelegramNotifier } from '@/components/shared/TelegramNotifier';
import { EmailAuth } from '@/components/auth/EmailAuth';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import React, { ReactNode, useState, useEffect, useMemo, memo, useTransition } from 'react';
import dynamic from 'next/dynamic';

const DynamicNotificationHandler = dynamic(() => import('@/components/shared/NotificationHandler').then(m => ({ default: m.NotificationHandler })), { ssr: false });
const DynamicAdOverlay = dynamic(() => import('@/components/shared/AdOverlay').then(m => ({ default: m.AdOverlay })), { ssr: false });
const DynamicWelcomeBonus = dynamic(() => import('@/components/auth/WelcomeBonusOverlay').then(m => ({ default: m.WelcomeBonusOverlay })), { ssr: false });
const DynamicLocationRequest = dynamic(() => import('@/components/shared/LocationRequest').then(m => ({ default: m.LocationRequest })), { ssr: false });
const DynamicFloatingCart = dynamic(() => import('@/components/shared/FloatingCart').then(m => ({ default: m.FloatingCart })), { ssr: false });
const DynamicBottomNav = dynamic(() => import('@/components/shared/BottomNav').then(m => ({ default: m.BottomNav })), { ssr: false });

/**
 * @fileOverview Refactored AuthGuard with improved "Ready" logic.
 * Ensures the app never hangs on the Splash screen, even on portal paths.
 */
const AuthGuard = memo(({ children, onReady }: { children: ReactNode; onReady: (ready: boolean) => void }) => {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);

  const isExcludedPath = useMemo(() => {
    return pathname?.startsWith('/admin') || 
           pathname?.startsWith('/vendor') || 
           pathname?.startsWith('/delivery') ||
           pathname?.startsWith('/Medical') ||
           pathname?.startsWith('/Beauty');
  }, [pathname]);

  const hasActiveSession = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('shopykart_session_active') === 'true';
  }, []);

  useEffect(() => {
    // ALWAYS call onReady(true) eventually to prevent Splash Screen hangs
    const timeout = setTimeout(() => {
      onReady(true);
    }, 2500);

    if (!loading) {
      // If it's a portal or specialized path, mark as ready immediately
      if (isExcludedPath) {
        onReady(true);
        clearTimeout(timeout);
        return;
      }

      // Customer path logic
      onReady(true);
      if (!user && !hasActiveSession) {
        const authTimer = setTimeout(() => setShowAuthOverlay(true), 1500);
        return () => {
          clearTimeout(authTimer);
          clearTimeout(timeout);
        };
      }
    }

    return () => clearTimeout(timeout);
  }, [user, loading, hasActiveSession, onReady, isExcludedPath]);

  return (
    <>
      {children}
      {!isExcludedPath && showAuthOverlay && !user && !hasActiveSession && <EmailAuth />}
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
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <SplashScreen isAppReady={isAppFullyReady} />
      
      <AuthGuard onReady={setIsAppFullyReady}>
        <div className="relative min-h-screen flex flex-col">
          <main className={cn("flex-1 pb-44", !isExcludedPath && "content-visibility-auto")}>
            {!isExcludedPath && <DynamicLocationRequest />}
            <DynamicNotificationHandler />
            <TelegramNotifier />
            <DynamicAdOverlay />
            <DynamicWelcomeBonus />
            {children}
          </main>
          
          {!isExcludedPath && <DynamicFloatingCart />}
          {!isExcludedPath && <DynamicBottomNav />}
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