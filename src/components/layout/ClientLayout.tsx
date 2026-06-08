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
 * @fileOverview AuthGuard with Synchronous Session Detection.
 * Optimized to prevent the "Login Screen Flicker" after Splash Screen.
 */
function AuthGuard({ children, onReady }: { children: ReactNode; onReady: (ready: boolean) => void }) {
  const { user, loading } = useUser();
  const pathname = usePathname();
  
  // 1. SYNCHRONOUS CHECK: Immediate detection before first render
  const [hasValidSession] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('shopykart_session_active') === 'true';
    }
    return false;
  });

  const [sessionSettled, setSessionSettled] = useState(false);

  useEffect(() => {
    // If Firebase loading finishes, session is fully settled
    if (!loading) {
      setSessionSettled(true);
      onReady(true);
    }
  }, [loading, onReady]);

  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/vendor') || 
                         pathname?.startsWith('/delivery') ||
                         pathname?.startsWith('/Medical') ||
                         pathname?.startsWith('/Beauty');

  if (isExcludedPath) return <>{children}</>;

  // CRITICAL: If we have a local session flag AND Firebase is still loading, 
  // we render NOTHING (Splash screen covers this) to prevent flicker.
  if (loading && hasValidSession) {
    return null;
  }

  // IF confirmed NO session (Local flag missing AND Firebase finished loading with no user)
  if (!loading && !user && !hasValidSession) {
    return <EmailAuth />;
  }

  // IF session was stale (Flag existed but Firebase says no user)
  if (!loading && !user && hasValidSession) {
    localStorage.removeItem('shopykart_session_active');
    return <EmailAuth />;
  }

  // IF user is confirmed OR we are still booting up with a session (Render behind splash)
  return <>{children}</>;
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
