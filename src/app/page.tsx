import HomeClient from '@/components/home/HomeClient';

/**
 * @fileOverview Pure CSR Entry Point for v1.4.0.
 * SSR REMOVED: 100% Client-Side load to prevent startup crashes.
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
