
'use client';

import { CartProvider } from '@/components/cart/CartProvider';
import { Toaster } from '@/components/ui/toaster';
import { FloatingCart } from '@/components/shared/FloatingCart';
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
import { HeatWaveOverlay } from '@/components/shared/HeatWaveOverlay';
import { ZoneGuard } from '@/components/shared/ZoneGuard';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const pathname = usePathname();

  // Paths that don't require customer login
  const isExcludedPath = pathname?.startsWith('/admin') || pathname?.startsWith('/vendor') || pathname?.startsWith('/delivery');

  if (loading) return null;

  // Use Email/Password login system for customers
  if (!user && !isExcludedPath) {
    return <EmailAuth />;
  }

  return <>{children}</>;
}

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isExcludedPath = pathname?.startsWith('/admin') || pathname?.startsWith('/vendor') || pathname?.startsWith('/delivery');

  return (
    <div className="relative min-h-screen">
      <AuthGuard>
        {/* GLOBAL COMPONENTS - Must be outside ZoneGuard to function when zone is blocked */}
        <LocationRequest />
        <NotificationHandler />
        <TelegramNotifier />
        
        <div>
          {/* Zone Guard blocks unserved areas for customers */}
          {!isExcludedPath ? (
            <ZoneGuard>
               <HeatWaveOverlay />
               <AdOverlay />
               {children}
               <FloatingCart />
            </ZoneGuard>
          ) : (
            <>
               {children}
            </>
          )}
        </div>
      </AuthGuard>
    </div>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <SplashScreen />
      <BrandingLoader />
      <FirebaseErrorListener />
      <CartProvider>
        <AppContent>{children}</AppContent>
        <Toaster />
      </CartProvider>
    </FirebaseClientProvider>
  );
}
