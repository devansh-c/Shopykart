
'use client';

import { CartProvider } from '@/components/cart/CartProvider';
import { FloatingCart } from '@/components/shared/FloatingCart';
import { BottomNav } from '@/components/shared/BottomNav';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { usePathname } from 'next/navigation';
import { LocationRequest } from '@/components/shared/LocationRequest';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { NotificationHandler } from '@/components/shared/NotificationHandler';
import { SplashScreen } from '@/components/shared/SplashScreen';
import { BrandingLoader } from '@/components/shared/BrandingLoader';
import { TelegramNotifier } from '@/components/shared/TelegramNotifier';
import { EmailAuth } from '@/components/auth/EmailAuth';
import { AdOverlay } from '@/components/shared/AdOverlay';
import { WelcomeBonusOverlay } from '@/components/auth/WelcomeBonusOverlay';
import { Toaster } from '@/components/ui/toaster';
import { ReactNode, useState, useEffect, useMemo } from 'react';

/**
 * @fileOverview AuthGuard with Zero-Flicker Logic.
 * Optimized to ensure Home is visible first and login overlay only appears after determination.
 */
function AuthGuard({ children, onReady }: { children: ReactNode; onReady: (ready: boolean) => void }) {
  const { user, loading } = useUser();
  const pathname = usePathname();
  
  // 1. Initial State: Splash screen is the only thing rendered
  const [authResolved, setAuthResolved] = useState(false);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);

  // 2. Optimistic Session Check: Prevents overlay from ever appearing for repeat users
  const hasSessionHint = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('shopykart_session_active') === 'true';
  }, []);

  useEffect(() => {
    // A. Wait for Firebase initial state
    if (loading) return;

    // B. Loading finished: Mark as resolved to allow rendering Home content behind splash
    setAuthResolved(true);
    
    // C. Signal Splash to start fading out
    onReady(true);

    // D. Final Determination: User exists or is a guest
    if (!user) {
      // If user is null, we check our grace period logic
      // If we have a session hint, we wait longer to let Firebase retry or handle slow network
      const delay = hasSessionHint ? 6000 : 3000;
      
      const loginTimer = setTimeout(() => {
        // Only show if user is still null after the delay
        if (!user) setShowLoginOverlay(true);
      }, delay);

      return () => clearTimeout(loginTimer);
    } else {
      // User found: Store hint and ensure overlay is hidden
      localStorage.setItem('shopykart_session_active', 'true');
      setShowLoginOverlay(false);
    }
  }, [loading, user, onReady, hasSessionHint]);

  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/vendor') || 
                         pathname?.startsWith('/delivery') ||
                         pathname?.startsWith('/Medical') ||
                         pathname?.startsWith('/Beauty');

  if (isExcludedPath) return <>{children}</>;

  // WHILE BOOTING: Stay on blank/splash state
  if (!authResolved) {
    return null;
  }

  // AFTER BOOTING: Render Home immediately. Overlay only appears if required after delay.
  return (
    <>
      {children}
      {showLoginOverlay && !user && <EmailAuth />}
    </>
  );
}

function AppContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isAppFullyReady, setIsAppFullyReady] = useState(false);

  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/vendor') || 
                         pathname?.startsWith('/delivery') ||
                         pathname?.startsWith('/Medical') ||
                         pathname?.startsWith('/Beauty');

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Highest priority screen stays active until AuthGuard gives ready signal */}
      <SplashScreen isAppReady={isAppFullyReady} />
      
      <AuthGuard onReady={setIsAppFullyReady}>
        <div className="relative min-h-screen flex flex-col overflow-x-hidden">
          <main className="flex-1 pb-44">
            {!isExcludedPath && <LocationRequest />}
            <NotificationHandler />
            <TelegramNotifier />
            <AdOverlay />
            <WelcomeBonusOverlay />
            {children}
          </main>
          
          {!isExcludedPath && <FloatingCart />}
          {!isExcludedPath && <BottomNav />}
        </div>
      </AuthGuard>
      <Toaster />
    </div>
  );
}

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
