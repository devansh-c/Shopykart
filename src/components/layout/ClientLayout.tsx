
'use client';

import { CartProvider } from '@/components/cart/CartProvider';
import { Toaster } from '@/components/ui/toaster';
import { FloatingCart } from '@/components/shared/FloatingCart';
import { FirebaseClientProvider, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
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
import { useEffect } from 'react';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview ProfileSync ensures that once a user is logged in, 
 * their Firestore profile data is always available in localStorage 
 * for a persistent, "one-time" setup experience.
 */
function ProfileSync() {
  const { user } = useUser();
  const firestore = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc<any>(profileRef);

  useEffect(() => {
    if (profile && typeof window !== 'undefined') {
      // Sync Firestore data to localStorage for instant UI access across refreshes
      if (profile.fullName) localStorage.setItem('user_name', profile.fullName);
      if (profile.phoneNumber) localStorage.setItem('user_phone', profile.phoneNumber);
      if (profile.address) localStorage.setItem('user_address_line', profile.address);
      if (profile.city) localStorage.setItem('user_city', profile.city);
      if (profile.pincode) localStorage.setItem('user_pincode', profile.pincode);
      if (profile.plusCode) localStorage.setItem('user_plus_code_string', profile.plusCode);
      
      // If profile exists, we consider location/identity set
      localStorage.setItem('user_location_set', 'true');
    }
  }, [profile]);

  return null;
}

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
        <ProfileSync />
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
