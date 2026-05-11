
"use client"

import './globals.css';
import { CartProvider } from '@/components/cart/CartProvider';
import { Toaster } from '@/components/ui/toaster';
import { FloatingCart } from '@/components/shared/FloatingCart';
import { SplashScreen } from '@/components/shared/SplashScreen';
import { FirebaseClientProvider, useUser } from '@/firebase';
import { OTPVerification } from '@/components/auth/OTPVerification';
import { usePathname } from 'next/navigation';

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useUser();
  const pathname = usePathname();

  // Don't show OTP on admin pages or during initial auth check
  const isAdminPage = pathname?.startsWith('/admin');
  const showOTP = !authLoading && !user && !isAdminPage;

  return (
    <div className="relative min-h-screen">
      {showOTP && <OTPVerification />}
      <div className={showOTP ? "hidden" : ""}>
        {children}
        <FloatingCart />
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>ShopyKart | Premium Food Delivery</title>
        <meta name="description" content="Gourmet meals delivered to your doorstep with ShopyKart." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-[#FAFAFA] text-foreground">
        <FirebaseClientProvider>
          <CartProvider>
            <SplashScreen />
            <AppContent>
              {children}
            </AppContent>
            <Toaster />
          </CartProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
