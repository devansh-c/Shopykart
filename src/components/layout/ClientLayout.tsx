'use client';

import { CartProvider } from '@/components/cart/CartProvider';
import { useUser } from '@/firebase';
import { usePathname } from 'next/navigation';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { EmailAuth } from '@/components/auth/EmailAuth';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import React, { ReactNode, useState, useEffect, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import FirebaseClientProvider from '@/firebase/client-provider';
import { SplashScreen } from '@/components/shared/SplashScreen';

// DYNAMIC IMPORTS
const DynamicBrandingLoader = dynamic(() => import('@/components/shared/BrandingLoader'), { ssr: false });
const DynamicTelegramNotifier = dynamic(() => import('@/components/shared/TelegramNotifier'), { ssr: false });
const DynamicNotificationHandler = dynamic(() => import('@/components/shared/NotificationHandler'), { ssr: false });
const DynamicAdOverlay = dynamic(() => import('@/components/shared/AdOverlay'), { ssr: false });
const DynamicWelcomeBonus = dynamic(() => import('@/components/auth/WelcomeBonusOverlay'), { ssr: false });
const DynamicLocationRequest = dynamic(() => import('@/components/shared/LocationRequest'), { ssr: false });
const DynamicFloatingCart = dynamic(() => import('@/components/shared/FloatingCart'), { ssr: false });
const DynamicBottomNav = dynamic(() => import('@/components/shared/BottomNav'), { ssr: false });

const AuthGuard = memo(({ children, onReady }: { children: ReactNode; onReady: (ready: boolean) => void }) => {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Instant boot logic for session holders, but allow Splash screen to mount
    const hasSession = localStorage.getItem('shopykart_session_active') === 'true';
    if (hasSession) {
      const bootTimer = setTimeout(() => onReady(true), 100);
      return () => clearTimeout(bootTimer);
    }
    
    // Safety timer to prevent stuck loading
    const timer = setTimeout(() => onReady(true), 1500);
    return () => clearTimeout(timer);
  }, [onReady]);

  useEffect(() => {
    if (!loading) {
      onReady(true);
      if (!user && localStorage.getItem('shopykart_session_active') !== 'true') {
        const authTimer = setTimeout(() => setShowAuthOverlay(true), 400);
        return () => clearTimeout(authTimer);
      }
    }
  }, [user, loading, onReady]);

  const isExcludedPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || p.startsWith('/vendor') || p.startsWith('/delivery');
  }, [pathname]);

  return (
    <>
      {children}
      {!isExcludedPath && showAuthOverlay && !user && isClient && <EmailAuth />}
    </>
  );
});
AuthGuard.displayName = "AuthGuard";

export function ClientLayout({ children }: { children: ReactNode }) {
  const [isAppFullyReady, setIsAppFullyReady] = useState(false);
  const pathname = usePathname();

  const isExcludedPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || p.startsWith('/vendor') || p.startsWith('/delivery');
  }, [pathname]);

  return (
    <FirebaseClientProvider>
      <CartProvider>
        <div className="relative min-h-screen flex flex-col">
          <DynamicBrandingLoader />
          <FirebaseErrorListener />
          <SplashScreen isAppReady={isAppFullyReady} />
          
          <AuthGuard onReady={setIsAppFullyReady}>
            <div className={cn(
              "relative min-h-screen flex flex-col transition-opacity duration-700 delay-300",
              isAppFullyReady ? "opacity-100" : "opacity-0"
            )}>
              <main className={cn("flex-1", !isExcludedPath && "pb-44")}>
                {!isExcludedPath && <DynamicLocationRequest />}
                <DynamicNotificationHandler />
                <DynamicTelegramNotifier />
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
      </CartProvider>
    </FirebaseClientProvider>
  );
}
