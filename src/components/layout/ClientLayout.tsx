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

// LAZY LOAD HEAVY OVERLAYS: Reduces initial bundle size and speeds up first paint
const DynamicNotificationHandler = dynamic(() => import('@/components/shared/NotificationHandler').then(m => m.NotificationHandler), { ssr: false });
const DynamicAdOverlay = dynamic(() => import('@/components/shared/AdOverlay').then(m => m.AdOverlay), { ssr: false });
const DynamicWelcomeBonus = dynamic(() => import('@/components/auth/WelcomeBonusOverlay').then(m => m.WelcomeBonusOverlay), { ssr: false });
const DynamicLocationRequest = dynamic(() => import('@/components/shared/LocationRequest').then(m => m.LocationRequest), { ssr: false });
const DynamicFloatingCart = dynamic(() => import('@/components/shared/FloatingCart').then(m => m.FloatingCart), { ssr: false });
const DynamicBottomNav = dynamic(() => import('@/components/shared/BottomNav').then(m => m.BottomNav), { ssr: false });
const DynamicHeatWave = dynamic(() => import('@/components/shared/HeatWaveOverlay').then(m => m.HeatWaveOverlay), { ssr: false });

/**
 * @fileOverview Refactored AuthGuard with useTransition for fluid identity checking.
 */
const AuthGuard = memo(({ children, onReady }: { children: ReactNode; onReady: (ready: boolean) => void }) => {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasActiveSession = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('shopykart_session_active') === 'true';
  }, []);

  useEffect(() => {
    if (loading) {
      onReady(false);
      return;
    }

    // Mark app as ready in a transition to keep UI responsive
    startTransition(() => {
      onReady(true);
    });

    if (user) {
      localStorage.setItem('shopykart_session_active', 'true');
      setShowAuthOverlay(false);
    } else if (!hasActiveSession) {
      const timer = setTimeout(() => {
        if (localStorage.getItem('shopykart_session_active') !== 'true') {
          startTransition(() => {
            setShowAuthOverlay(true);
          });
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
            {!isExcludedPath && <DynamicLocationRequest />}
            <DynamicNotificationHandler />
            <TelegramNotifier />
            <DynamicAdOverlay />
            <DynamicWelcomeBonus />
            <DynamicHeatWave />
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
