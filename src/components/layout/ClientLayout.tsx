'use client';

import { CartProvider } from '@/components/cart/CartProvider';
import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { EmailAuth } from '@/components/auth/EmailAuth';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import React, { ReactNode, useState, useEffect, useMemo, memo } from 'react';
import dynamic from 'next/dynamic';
import FirebaseClientProvider from '@/firebase/client-provider';
import { ZoneGuard } from '@/components/shared/ZoneGuard';

// DYNAMIC IMPORTS
const DynamicBrandingLoader = dynamic(() => import('@/components/shared/BrandingLoader'), { ssr: false });
const DynamicTelegramNotifier = dynamic(() => import('@/components/shared/TelegramNotifier'), { ssr: false });
const DynamicNotificationHandler = dynamic(() => import('@/components/shared/NotificationHandler'), { ssr: false });
const DynamicWelcomeBonus = dynamic(() => import('@/components/auth/WelcomeBonusOverlay'), { ssr: false });
const DynamicLocationRequest = dynamic(() => import('@/components/shared/LocationRequest'), { ssr: false });
const DynamicBottomNav = dynamic(() => import('@/components/shared/BottomNav'), { ssr: false });
const DynamicTawkChat = dynamic(() => import('@/components/shared/TawkChat').then(m => m.TawkChat), { ssr: false });
const DynamicSplashScreen = dynamic(() => import('@/components/shared/SplashScreen').then(m => ({ default: m.SplashScreen })), { ssr: false });

const AuthGuard = memo(({ children }: { children: ReactNode }) => {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const handleOpenAuth = () => {
      if (!user) setShowAuthOverlay(true);
    };
    window.addEventListener('open-auth-overlay', handleOpenAuth);
    return () => window.removeEventListener('open-auth-overlay', handleOpenAuth);
  }, [user]);

  const isAuthRequiredRoute = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/cart');
  }, [pathname]);

  useEffect(() => {
    if (isAuthRequiredRoute && !user && !loading && isClient) {
      setShowAuthOverlay(true);
    }
  }, [isAuthRequiredRoute, user, loading, isClient]);

  useEffect(() => {
    if (user) setShowAuthOverlay(false);
  }, [user]);

  const isExcludedPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || p.startsWith('/vendor') || p.startsWith('/delivery');
  }, [pathname]);

  return (
    <>
      {children}
      {!isExcludedPath && showAuthOverlay && !user && isClient && (
        <EmailAuth onClose={() => {
          setShowAuthOverlay(false);
          if (isAuthRequiredRoute) router.push('/');
        }} />
      )}
    </>
  );
});
AuthGuard.displayName = "AuthGuard";

export function ClientLayout({ children }: { children: ReactNode }) {
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
          <DynamicSplashScreen />
          <DynamicBrandingLoader />
          <FirebaseErrorListener />
          
          <AuthGuard>
            <div className="relative min-h-screen flex flex-col">
              <main className={cn("flex-1", !isExcludedPath && "pb-44")}>
                {!isExcludedPath && <DynamicLocationRequest />}
                <DynamicNotificationHandler />
                <DynamicTelegramNotifier />
                <DynamicWelcomeBonus />
                
                {/* Wrap Customer App with ZoneGuard */}
                {!isExcludedPath ? (
                  <ZoneGuard>{children}</ZoneGuard>
                ) : (
                  <>{children}</>
                )}
              </main>
              {!isExcludedPath && <DynamicBottomNav />}
              {/* Render globally, visibility handled inside TawkChat via Tawk_API */}
              {!isExcludedPath && <DynamicTawkChat />}
            </div>
          </AuthGuard>
          <Toaster />
        </div>
      </CartProvider>
    </FirebaseClientProvider>
  );
}
