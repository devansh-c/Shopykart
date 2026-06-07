
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
 * @fileOverview AuthGuard with Ultra-Optimistic Session Support.
 * Prevents flicker by showing content immediately if persistent flag exists.
 */
function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const [isSessionOptimistic, setIsSessionOptimistic] = useState<boolean | null>(null);

  useEffect(() => {
    // Immediate check for session flag
    const active = localStorage.getItem('shopykart_session_active') === 'true';
    setIsSessionOptimistic(active);
  }, []);

  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/vendor') || 
                         pathname?.startsWith('/delivery') ||
                         pathname?.startsWith('/Medical') ||
                         pathname?.startsWith('/Beauty');

  if (isExcludedPath) return <>{children}</>;

  // While initializing session state (Micro-second)
  if (isSessionOptimistic === null) return null;

  // IF Firebase is still loading
  if (loading) {
    // If we have an optimistic flag, show children to avoid flicker
    if (isSessionOptimistic) return <>{children}</>;
    // If no flag, return null (Splash will be visible anyway)
    return null; 
  }

  // IF Firebase finished and confirmed NO USER
  if (!user && !isSessionOptimistic) {
    return <EmailAuth />;
  }

  return <>{children}</>;
}

function AppContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { loading, user } = useUser();
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  
  useEffect(() => {
    setIsSessionActive(localStorage.getItem('shopykart_session_active') === 'true');
  }, []);

  // Logic to determine if splash is done based on auth settled OR optimistic flag
  const [isSettled, setIsSettled] = useState(false);
  useEffect(() => {
    if (!loading || isSessionActive) {
      const timer = setTimeout(() => setIsSettled(true), 300); // Snappier exit
      return () => clearTimeout(timer);
    }
  }, [loading, isSessionActive]);

  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/vendor') || 
                         pathname?.startsWith('/delivery') ||
                         pathname?.startsWith('/Medical') ||
                         pathname?.startsWith('/Beauty');

  return (
    <div className="relative min-h-screen flex flex-col">
      <SplashScreen isAppReady={isSettled} />
      <AuthGuard>
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
