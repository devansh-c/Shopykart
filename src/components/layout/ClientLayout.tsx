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

// DYNAMIC IMPORTS
const DynamicBrandingLoader = dynamic(() => import('@/components/shared/BrandingLoader'), { ssr: false });
const DynamicTelegramNotifier = dynamic(() => import('@/components/shared/TelegramNotifier'), { ssr: false });
const DynamicNotificationHandler = dynamic(() => import('@/components/shared/NotificationHandler'), { ssr: false });
const DynamicWelcomeBonus = dynamic(() => import('@/components/auth/WelcomeBonusOverlay'), { ssr: false });
const DynamicLocationRequest = dynamic(() => import('@/components/shared/LocationRequest'), { ssr: false });
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
      // STRICT CHECK: Only open if not loading and definitely not logged in
      if (!loading && !user) setShowAuthOverlay(true);
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
    // If route requires auth and we are definitely NOT logged in after load
    if (isAuthRequiredRoute && !user && !loading && isClient) {
      setShowAuthOverlay(true);
    }
  }, [isAuthRequiredRoute, user, loading, isClient]);

  useEffect(() => {
    // Auto-close overlay if user becomes authenticated
    if (user) setShowAuthOverlay(false);
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

  return (
    <>
      {children}
      {!isExcludedPath && showAuthOverlay && !user && !loading && isClient && (
        <EmailAuth onClose={() => {
          setShowAuthOverlay(false);
          if (isAuthRequiredRoute) router.push('/');
        }} />
      )}
    </>
  );
});
AuthGuard.displayName = "AuthGuard";

/**
 * @fileOverview ClientLayout - Handles Global Google Maps API and smart Back Button logic.
 */
export function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [backTapCount, setBackTapCount] = useState(0);

  // Load Google Maps API globally
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script-global',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'geometry'],
  });

  // SMART BACK BUTTON HANDLER: Prevents accidental app exit
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (event: PopStateEvent) => {
      if (pathname === '/' || pathname === '') {
        // If at root, prevent accidental exit by forcing history push
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
          <DynamicBrandingLoader />
          <FirebaseErrorListener />
          
          <AuthGuard>
            <div className="relative min-h-screen flex flex-col">
              <main className={cn("flex-1", !isExcludedPath && "pb-44")}>
                {!isExcludedPath && <DynamicLocationRequest />}
                <DynamicNotificationHandler />
                <DynamicTelegramNotifier />
                <DynamicWelcomeBonus />
                
                {!isExcludedPath ? (
                  <ZoneGuard>{children}</ZoneGuard>
                ) : (
                  <>{children}</>
                )}
              </main>
              {!isExcludedPath && <DynamicBottomNav />}
              {!isExcludedPath && <DynamicTawkChat />}
            </div>
          </AuthGuard>
          <Toaster />
        </div>
      </CartProvider>
    </FirebaseClientProvider>
  );
}
