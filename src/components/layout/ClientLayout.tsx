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
 * @fileOverview AuthGuard with Ultra-Aggressive Zero-Flicker Logic.
 * This component acts as a high-security gatekeeper.
 */
function AuthGuard({ children, onReady }: { children: ReactNode; onReady: (ready: boolean) => void }) {
  const { user, loading } = useUser();
  const pathname = usePathname();
  
  // 1. Immediate hardware check (Directly from window object if available)
  const [sessionResolved, setSessionResolved] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);

  useEffect(() => {
    const isSessionActive = localStorage.getItem('shopykart_session_active') === 'true';
    setHasValidSession(isSessionActive);
    setSessionResolved(true);
  }, []);

  // Sync with main app readiness
  useEffect(() => {
    if (!loading && sessionResolved) {
      // If loading finished and we know the user state, we are ready
      onReady(true);
    }
  }, [loading, sessionResolved, onReady]);

  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/vendor') || 
                         pathname?.startsWith('/delivery') ||
                         pathname?.startsWith('/Medical') ||
                         pathname?.startsWith('/Beauty');

  if (isExcludedPath) return <>{children}</>;

  // While we don't know the session status, we show nothing (Splash covers this)
  if (!sessionResolved) return null;

  // IF confirmed NO session and Firebase is done loading
  if (!loading && !user && !hasValidSession) {
    return <EmailAuth />;
  }

  // IF session flag exists but Firebase is still verifying, show content behind splash
  // This prevents the "Login Flicker"
  if (loading && hasValidSession) {
    return <div className="opacity-0">{children}</div>;
  }

  // IF confirmed USER and loading finished
  if (!loading && user) {
    return <>{children}</>;
  }

  // IF session was stale (Flag true but user null)
  if (!loading && !user && hasValidSession) {
    localStorage.removeItem('shopykart_session_active');
    return <EmailAuth />;
  }

  return null;
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
      {/* SplashScreen stays until AuthGuard gives the Green Signal */}
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
