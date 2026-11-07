
import HomeClient from '@/components/home/HomeClient';

/**
 * @fileOverview Pure CSR Entry Point for v1.4.
 * SSR DISABLED: Removed server-side fetching to prevent crashes in dev and build.
 * App now relies 100% on client-side hooks for maximum stability.
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
