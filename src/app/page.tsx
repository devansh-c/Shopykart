
import HomeClient from '@/components/home/HomeClient';

/**
 * @fileOverview Optimized Entry Point for v1.4.
 * ZERO-SSR STRATEGY: Bypasses Firestore on Server-side in Dev mode 
 * to ensure instant startup and prevent build-manifest errors.
 */

export const revalidate = 3600;

async function getInitialData() {
  const emptyData = { banners: [], categories: [], stores: [], products: [], zones: [], coupons: [] };
  
  // IN DEV PREVIEW: Force kill server-side fetch to prevent startup "Hang"
  if (process.env.NODE_ENV !== 'production') return emptyData;

  try {
    const { initializeFirebase } = await import('@/firebase/init');
    const { collection, getDocs, limit, query } = await import('firebase/firestore');

    const { firestore } = initializeFirebase();
    if (!firestore) return emptyData;

    // Production Build Only: Pre-fetch data for mobile performance
    const [bannersSnap, categoriesSnap, vendorsSnap, productsSnap, zonesSnap, couponsSnap] = await Promise.all([
      getDocs(query(collection(firestore, 'banners'), limit(10))),
      getDocs(query(collection(firestore, 'categories'), limit(20))),
      getDocs(query(collection(firestore, 'vendors'), limit(20))),
      getDocs(query(collection(firestore, 'products'), limit(30))),
      getDocs(collection(firestore, 'zones')),
      getDocs(query(collection(firestore, 'coupons'), limit(5)))
    ]);

    return {
      banners: bannersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })),
      categories: categoriesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })),
      stores: vendorsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })),
      products: productsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })),
      zones: zonesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })),
      coupons: couponsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }))
    };
  } catch (error) {
    console.error("Initial data fetch skipped:", error);
    return emptyData;
  }
}

export default async function ShopyKartApp() {
  const initialData = await getInitialData();

  return (
    <HomeClient 
      initialBanners={initialData.banners}
      initialCategories={initialData.categories}
      initialStores={initialData.stores}
      initialProducts={initialData.products}
      initialZones={initialData.zones}
      initialCoupons={initialData.coupons}
    />
  );
}
