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
 * @fileOverview AuthGuard - Verification-First Logic.
 * Stays in 'CHECKING' mode until Firebase confirms the user state.
 * Never shows the login screen to returning users.
 */
function AuthGuard({ children, onReady }: { children: ReactNode; onReady: (ready: boolean) => void }) {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);

  const hasActiveSession = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('shopykart_session_active') === 'true';
  }, []);

  useEffect(() => {
    // 1. STEP ONE: WAIT FOR SYSTEM VERIFICATION
    // If Firebase is still checking, do NOT hide the splash screen and do NOT show the login page.
    if (loading) {
      onReady(false); // Keep splash locked
      return;
    }

    // 2. STEP TWO: VERIFICATION COMPLETE
    // Now we know if the user is logged in or not.
    onReady(true); // App is ready to be seen

    if (user) {
      // User is confirmed. Ensure flag is set and hide any login UI.
      localStorage.setItem('shopykart_session_active', 'true');
      setShowAuthOverlay(false);
    } else {
      // No user found. If they have a session flag, they might be in a temporary logout state, 
      // but we still wait 3 seconds before prompting them to re-verify.
      if (!hasActiveSession) {
        const timer = setTimeout(() => {
          // Final check before showing login: if they logged in during these 3 seconds, abort.
          if (localStorage.getItem('shopykart_session_active') !== 'true') {
            setShowAuthOverlay(true);
          }
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, loading, hasActiveSession, onReady]);

  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/vendor') || 
                         pathname?.startsWith('/delivery') ||
                         pathname?.startsWith('/Medical') ||
                         pathname?.startsWith('/Beauty');

  if (isExcludedPath) return <>{children}</>;

  return (
    <>
      {children}
      {showAuthOverlay && !user && !hasActiveSession && <EmailAuth />}
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
