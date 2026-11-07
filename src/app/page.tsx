
import HomeClient from '@/components/home/HomeClient';

/**
 * @fileOverview Pure CSR Entry Point for v1.4.0.
 * SSR DISABLED: Removed all server-side logic to prevent Next.js 15 startup crashes.
 * App is now 100% Client-Side for maximum stability in APK/Web environments.
 */

export const dynamic = 'force-static';

export default function ShopyKartApp() {
  return (
    <HomeClient 
      initialBanners={[]}
      initialCategories={[]}
      initialStores={[]}
      initialProducts={[]}
      initialZones={[]}
      initialCoupons={[]}
    />
  );
}
