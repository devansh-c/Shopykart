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
 * @fileOverview AuthGuard with Optimistic Session Support.
 * Prevents the login screen from flickering if a session flag exists.
 */
function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useUser();
  const pathname = usePathname();
  const [isSessionOptimistic, setIsSessionOptimistic] = useState(false);

  useEffect(() => {
    // Check local storage instantly to prevent UI flash
    const active = localStorage.getItem('shopykart_session_active') === 'true';
    setIsSessionOptimistic(active);
  }, []);

  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/vendor') || 
                         pathname?.startsWith('/delivery') ||
                         pathname?.startsWith('/Medical');

  if (isExcludedPath) return <>{children}</>;

  // If Firebase is still loading, but we have a persistent flag, show content (No flicker)
  if (loading) {
    if (isSessionOptimistic) return <>{children}</>;
    return null; // Let SplashScreen handle the coverage
  }

  // Final check: If loading is done and really no user
  if (!user) {
    return <EmailAuth />;
  }

  return <>{children}</>;
}

function AppContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { loading } = useUser();
  
  const isExcludedPath = pathname?.startsWith('/admin') || 
                         pathname?.startsWith('/vendor') || 
                         pathname?.startsWith('/delivery') ||
                         pathname?.startsWith('/Medical');

  return (
    <div className="relative min-h-screen flex flex-col">
      <SplashScreen isAppReady={!loading} />
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
