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

// DYNAMIC IMPORTS
const DynamicBrandingLoader = dynamic(() => import('@/components/shared/BrandingLoader'), { ssr: false });
const DynamicTelegramNotifier = dynamic(() => import('@/components/shared/TelegramNotifier'), { ssr: false });
const DynamicNotificationHandler = dynamic(() => import('@/components/shared/NotificationHandler'), { ssr: false });
const DynamicWelcomeBonus = dynamic(() => import('@/components/auth/WelcomeBonusOverlay'), { ssr: false });
const DynamicLocationRequest = dynamic(() => import('@/components/shared/LocationRequest'), { ssr: false });
const DynamicFloatingCart = dynamic(() => import('@/components/shared/FloatingCart'), { ssr: false });
const DynamicBottomNav = dynamic(() => import('@/components/shared/BottomNav'), { ssr: false });
const DynamicTawkChat = dynamic(() => import('@/components/shared/TawkChat').then(m => m.TawkChat), { ssr: false });

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

  // Hide TawkChat on cart/checkout to prevent UI overlap with map
  const showChat = useMemo(() => {
    if (!pathname) return true;
    const p = pathname.toLowerCase();
    return !p.startsWith('/cart') && !isExcludedPath;
  }, [pathname, isExcludedPath]);

  return (
    <FirebaseClientProvider>
      <CartProvider>
        <div className="relative min-h-screen flex flex-col">
          <DynamicBrandingLoader />
          <FirebaseErrorListener />
          
          <AuthGuard>
            <div className="relative min-h-screen flex flex-col">
              <main className={cn("flex-1", !isExcludedPath && "pb-44")}>
                {!isExcludedPath && <DynamicLocationRequest />}
                <DynamicNotificationHandler />
                <DynamicTelegramNotifier />
                <DynamicWelcomeBonus />
                {children}
              </main>
              {!isExcludedPath && <DynamicFloatingCart />}
              {!isExcludedPath && <DynamicBottomNav />}
              {showChat && <DynamicTawkChat />}
            </div>
          </AuthGuard>
          <Toaster />
        </div>
      </CartProvider>
    </FirebaseClientProvider>
  );
}