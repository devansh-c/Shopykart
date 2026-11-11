
"use client";

import { CartProvider } from '@/components/cart/CartProvider';
import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { EmailAuth } from '@/components/auth/EmailAuth';
import { Toaster } from '@/components/ui/toaster';

import { cn } from '@/lib/utils';
import React, { ReactNode, useState, useEffect, useMemo, memo, Suspense } from 'react';
import FirebaseClientProvider from '@/firebase/client-provider';
import { ZoneGuard } from '@/components/shared/ZoneGuard';
import { useJsApiLoader } from '@react-google-maps/api';

import BrandingLoader from '@/components/shared/BrandingLoader';

import NotificationHandler from '@/components/shared/NotificationHandler';
import CustomerNotificationHandler from '@/components/shared/CustomerNotificationHandler';
import WelcomeBonusOverlay from '@/components/auth/WelcomeBonusOverlay';
import BottomNav from '@/components/shared/BottomNav';
import { TawkChat } from '@/components/shared/TawkChat';
import PermissionManager from '@/components/shared/PermissionManager';

const AuthGuard = memo(({ children }: { children: ReactNode }) => {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const handleOpenAuth = () => {
      if (!loading && !user) setShowAuthOverlay(true);
    };
    window.addEventListener('open-auth-overlay', handleOpenAuth);
    return () => window.removeEventListener('open-auth-overlay', handleOpenAuth);
  }, [user, loading]);

  const isAuthRequiredRoute = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/cart') || p.startsWith('/order');
  }, [pathname]);

  useEffect(() => {
    if (isAuthRequiredRoute && !user && !loading && isClient) setShowAuthOverlay(true);
  }, [isAuthRequiredRoute, user, loading, isClient]);

  useEffect(() => { if (user) setShowAuthOverlay(false); }, [user]);

  const isExcludedPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || p.startsWith('/vendor') || p.startsWith('/delivery');
  }, [pathname]);

  const hasPersistentSession = typeof window !== 'undefined' && localStorage.getItem('shopykart_session_active') === 'true';
  const shouldRenderAuth = !isExcludedPath && showAuthOverlay && !user && !loading && !hasPersistentSession && isClient;

  return (
    <>
      {children}
      {shouldRenderAuth && (
        <EmailAuth onClose={() => setShowAuthOverlay(false)} />
      )}
    </>
  );
});
AuthGuard.displayName = "AuthGuard";

export function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [loadBackgroundServices, setLoadBackgroundServices] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // DE-BLOCKING STRATEGY: Load heavy background services after 2 seconds of mount
    const timer = setTimeout(() => {
      setLoadBackgroundServices(true);
    }, 2000);

    const setupBackButton = async () => {
      try {
        const { App: CapacitorApp } = await import("@capacitor/app");
        await CapacitorApp.addListener("backButton", () => {
          if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            if (currentPath === "/" || currentPath === "") {
              console.log("Back on home");
            } else {
              window.history.back();
            }
          }
        });
      } catch (e) {
        console.debug("Capacitor App module not available");
      }
    };
    
    setupBackButton();
    return () => clearTimeout(timer);
  }, []);

  const isExcludedPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || p.startsWith('/vendor') || p.startsWith('/delivery');
  }, [pathname]);

  const isAdminApp = process.env.NEXT_PUBLIC_ADMIN_APP === 'true';
  const isStoreApp = process.env.NEXT_PUBLIC_BIZ_APP === 'true';
  const isFleetApp = process.env.NEXT_PUBLIC_TOW_APP === 'true';
  const isBusinessApp = isAdminApp || isStoreApp || isFleetApp;

  return (
    <FirebaseClientProvider>
      <CartProvider>
        <div className="relative min-h-screen bg-[#F3F4F6] md:bg-gray-100 overflow-x-hidden">
          {/* CRITICAL SERVICES */}
          <BrandingLoader />
          <FirebaseErrorListener />
          <Toaster />
          
          {/* DEFERRED BACKGROUND SERVICES (TO PREVENT STARTUP FREEZE) */}
          {loadBackgroundServices && (
            <>
              <PermissionManager />
              {isBusinessApp ? <NotificationHandler /> : <CustomerNotificationHandler />}
              <TawkChat />
            </>
          )}
          
          <AuthGuard>
            <div className={cn(
              "relative min-h-screen flex flex-col max-w-lg mx-auto w-full bg-white shadow-2xl border-x border-gray-100 overflow-y-auto no-scrollbar",
              mounted && !isExcludedPath && "pt-[2px]"
            )}>
              <main className={cn("flex-1", mounted && !isExcludedPath && "pb-32")}>
                <WelcomeBonusOverlay />
                {!isExcludedPath ? (
                  <ZoneGuard>{children}</ZoneGuard>
                ) : (
                  <>{children}</>
                )}
              </main>
              {mounted && !isExcludedPath && <BottomNav />}
            </div>
          </AuthGuard>
          
        </div>
      </CartProvider>
    </FirebaseClientProvider>
  );
}
