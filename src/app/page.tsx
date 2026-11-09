import HomeClient from '@/components/home/HomeClient';

/**
 * @fileOverview Pure CSR Entry Point for v1.4.0.
 * SSR COMPLETELY REMOVED: 100% Client-Side load to prevent startup crashes and hydration locks.
 */

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
