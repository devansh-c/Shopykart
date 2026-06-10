
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
import { ReactNode, useState, useEffect } from 'react';

/**
 * @fileOverview AuthGuard with Zero-Flicker Logic.
 * Ensures SplashScreen stays until Auth is confirmed.
 * Implements a 3-second delay for Login screen for non-logged in users.
 */
function AuthGuard({ children, onReady }: { children: ReactNode; onReady: (ready: boolean) => void }) {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const [authResolved, setAuthResolved] = useState(false);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);

  useEffect(() => {
    // 1. If Firebase is still checking, stay in loading state
    if (loading) return;

    // 2. Auth is resolved (either user found or not)
    setAuthResolved(true);
    
    // Give a tiny buffer for hydration before hiding splash
    const readyTimer = setTimeout(() => {
      onReady(true);
    }, 100);

    // 3. If NO user is found, wait 3 seconds before showing the login overlay
    if (!user) {
      const loginTimer = setTimeout(() => {
        setShowLoginOverlay(true);
      }, 3000);
      return () => {
        clearTimeout(readyTimer);
        clearTimeout(loginTimer);
      };
    } else {
      setShowLoginOverlay(false);
    }

    return () => clearTimeout(readyTimer);
  }, [loading, user, onReady]);

  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/vendor') || 
                         pathname?.startsWith('/delivery') ||
                         pathname?.startsWith('/Medical') ||
                         pathname?.startsWith('/Beauty');

  if (isExcludedPath) return <>{children}</>;

  // WHILE BOOTING: Return nothing so SplashScreen is the only thing visible
  if (!authResolved) {
    return null;
  }

  // AFTER BOOTING:
  // Render children (Home) always. If guest, show Login as an overlay after delay.
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
      {/* SplashScreen stays until AuthGuard gives the explicit ready signal */}
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
