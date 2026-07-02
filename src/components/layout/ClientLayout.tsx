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
import React, { ReactNode, useState, useEffect, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';

const DynamicNotificationHandler = dynamic(() => import('@/components/shared/NotificationHandler').then(m => ({ default: m.NotificationHandler })), { ssr: false });
const DynamicAdOverlay = dynamic(() => import('@/components/shared/AdOverlay').then(m => ({ default: m.AdOverlay })), { ssr: false });
const DynamicWelcomeBonus = dynamic(() => import('@/components/auth/WelcomeBonusOverlay').then(m => ({ default: m.WelcomeBonusOverlay })), { ssr: false });
const DynamicLocationRequest = dynamic(() => import('@/components/shared/LocationRequest').then(m => ({ default: m.LocationRequest })), { ssr: false });
const DynamicFloatingCart = dynamic(() => import('@/components/shared/FloatingCart').then(m => ({ default: m.FloatingCart })), { ssr: false });
const DynamicBottomNav = dynamic(() => import('@/components/shared/BottomNav').then(m => ({ default: m.BottomNav })), { ssr: false });
const DynamicTawkChat = dynamic(() => import('@/components/shared/TawkChat').then(m => ({ default: m.TawkChat })), { ssr: false });

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

    // Fail-safe: Mark as ready after 500ms even if Firebase is slow
    const failSafeTimer = setTimeout(() => onReady(true), 500);

    if (!loading) {
      clearTimeout(failSafeTimer);
      onReady(true);
      if (!user && !hasActiveSession) {
        // Show auth only after a small delay to prevent flickering
        const authTimer = setTimeout(() => setShowAuthOverlay(true), 1000);
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

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <SplashScreen isAppReady={isAppFullyReady} />
      
      {/* Tawk.to correctly placed outside AuthGuard */}
      {!isExcludedPath && <DynamicTawkChat />}
      
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
