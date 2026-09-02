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
import { useJsApiLoader } from '@react-google-maps/api';

// STATIC IMPORTS FOR STABILITY (Fixed chunk loading errors)
import BrandingLoader from '@/components/shared/BrandingLoader';
import TelegramNotifier from '@/components/shared/TelegramNotifier';
import NotificationHandler from '@/components/shared/NotificationHandler';
import WelcomeBonusOverlay from '@/components/auth/WelcomeBonusOverlay';
import LocationRequest from '@/components/shared/LocationRequest';
import BottomNav from '@/components/shared/BottomNav';
import { TawkChat } from '@/components/shared/TawkChat';

const AuthGuard = memo(({ children }: { children: ReactNode }) => {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const handleOpenAuth = () => {
      if (!loading && !user) {
        setShowAuthOverlay(true);
      }
    };
    window.addEventListener('open-auth-overlay', handleOpenAuth);
    return () => window.removeEventListener('open-auth-overlay', handleOpenAuth);
  }, [user, loading]);

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
    if (user) {
      setShowAuthOverlay(false);
    }
  }, [user]);

  const isExcludedPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || 
           p.startsWith('/vendor') || 
           p.startsWith('/delivery') ||
           p.startsWith('/medical') ||
           p.startsWith('/beauty') ||
           p.startsWith('/order/track');
  }, [pathname]);

  const hasPersistentSession = typeof window !== 'undefined' && localStorage.getItem('shopykart_session_active') === 'true';
  const shouldRenderAuth = !isExcludedPath && showAuthOverlay && !user && !loading && !hasPersistentSession && isClient;

  return (
    <>
      {children}
      {shouldRenderAuth && (
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
  const router = useRouter();
  const [backTapCount, setBackTapCount] = useState(0);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-global',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry'],
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (event: PopStateEvent) => {
      if (pathname === '/' || pathname === '') {
        window.history.pushState(null, '', window.location.href);
        setBackTapCount(prev => prev + 1);
      }
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    
    return () => window.removeEventListener('popstate', handlePopState);
  }, [pathname, backTapCount]);

  const isExcludedPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || 
           p.startsWith('/vendor') || 
           p.startsWith('/delivery') || 
           p.startsWith('/medical') || 
           p.startsWith('/beauty') || 
           p.startsWith('/order/track');
  }, [pathname]);

  return (
    <FirebaseClientProvider>
      <CartProvider>
        <div className="relative min-h-screen flex flex-col">
          <BrandingLoader />
          <FirebaseErrorListener />
          
          <AuthGuard>
            <div className="relative min-h-screen flex flex-col">
              <main className={cn("flex-1", !isExcludedPath && "pb-44")}>
                {!isExcludedPath && <LocationRequest />}
                <NotificationHandler />
                <TelegramNotifier />
                <WelcomeBonusOverlay />
                
                {!isExcludedPath ? (
                  <ZoneGuard>{children}</ZoneGuard>
                ) : (
                  <>{children}</>
                )}
              </main>
              {!isExcludedPath && <BottomNav />}
              {!isExcludedPath && <TawkChat />}
            </div>
          </AuthGuard>
          <Toaster />
        </div>
      </CartProvider>
    </FirebaseClientProvider>
  );
}
