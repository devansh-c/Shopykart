
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

// DYNAMIC IMPORTS TO PREVENT NODE.JS MODULES IN SSR
const DynamicFirebaseClientProvider = dynamic(() => import('@/firebase/client-provider'), { ssr: false });
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
  }, []);

  const isExcludedPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || 
           p.startsWith('/vendor') || 
           p.startsWith('/delivery') ||
           p.startsWith('/medical') || 
           p.startsWith('/beauty');
  }, [pathname]);

  const hasActiveSession = useMemo(() => {
    if (!isClient) return false;
    return localStorage.getItem('shopykart_session_active') === 'true';
  }, [isClient]);

  useEffect(() => {
    if (isExcludedPath) {
      onReady(true);
      return;
    }

    const failSafeTimer = setTimeout(() => onReady(true), 100);

    if (!loading) {
      clearTimeout(failSafeTimer);
      onReady(true);
      if (!user && !hasActiveSession) {
        const authTimer = setTimeout(() => setShowAuthOverlay(true), 500);
        return () => clearTimeout(authTimer);
      }
    }
    
    return () => clearTimeout(failSafeTimer);
  }, [user, loading, hasActiveSession, onReady, isExcludedPath]);

  return (
    <>
      {children}
      {!isExcludedPath && showAuthOverlay && !user && hasActiveSession === false && isClient && <EmailAuth />}
    </>
  );
});
AuthGuard.displayName = "AuthGuard";

const AppContent = memo(({ children }: { children: ReactNode }) => {
  const pathname = usePathname();
  const [isAppFullyReady, setIsAppFullyReady] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isExcludedPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || 
           p.startsWith('/vendor') || 
           p.startsWith('/delivery') ||
           p.startsWith('/medical') || 
           p.startsWith('/beauty');
  }, [pathname]);

  return (
    <div className={cn(
      "relative min-h-screen flex flex-col overflow-x-hidden transition-colors duration-300",
      isAppFullyReady ? "bg-[#FAFAFA]" : "bg-white"
    )}>
      {mounted && (
        <AuthGuard onReady={setIsAppFullyReady}>
          <div className="relative min-h-screen flex flex-col">
            <main className={cn("flex-1 pb-44", !isExcludedPath && "content-visibility-auto")}>
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
      )}
      <Toaster />
    </div>
  );
});
AppContent.displayName = "AppContent";

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <DynamicFirebaseClientProvider>
      <DynamicBrandingLoader />
      <FirebaseErrorListener />
      <CartProvider>
        <AppContent>{children}</AppContent>
      </CartProvider>
    </DynamicFirebaseClientProvider>
  );
}
