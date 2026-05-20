'use client';

import { CartProvider } from '@/components/cart/CartProvider';
import { Toaster } from '@/components/ui/toaster';
import { FloatingCart } from '@/components/shared/FloatingCart';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { EmailAuth } from '@/components/auth/EmailAuth';
import { usePathname } from 'next/navigation';
import { LocationRequest } from '@/components/shared/LocationRequest';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { NotificationHandler } from '@/components/shared/NotificationHandler';
import { SplashScreen } from '@/components/shared/SplashScreen';
import { BrandingLoader } from '@/components/shared/BrandingLoader';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const pathname = usePathname();

  const isExcludedPath = pathname?.startsWith('/admin') || pathname?.startsWith('/vendor') || pathname?.startsWith('/delivery');
  const showAuth = !authLoading && !user && !isExcludedPath;

  return (
    <div className="relative min-h-screen">
      {showAuth && <EmailAuth />}
      <div className={showAuth ? 'hidden' : ''}>
        {!isExcludedPath && <LocationRequest />}
        <NotificationHandler />
        {children}
        {!isExcludedPath && <FloatingCart />}
      </div>
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
