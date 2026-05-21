
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
import { PromoPopup } from '@/components/shared/PromoPopup';
import { TelegramNotifier } from '@/components/shared/TelegramNotifier';

function AppContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isExcludedPath = pathname?.startsWith('/admin') || pathname?.startsWith('/vendor') || pathname?.startsWith('/delivery');

  return (
    <div className="relative min-h-screen">
      <div>
        {!isExcludedPath && <LocationRequest />}
        {!isExcludedPath && <PromoPopup />}
        <NotificationHandler />
        <TelegramNotifier />
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
