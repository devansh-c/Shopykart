
import HomeClient from '@/components/home/HomeClient';

/**
 * @fileOverview Optimized Entry Point for v1.4.
 * ZERO-SSR STRATEGY: Strictly bypasses Firestore on Server-side in Dev mode 
 * to prevent Turbopack manifest errors and startup freezes.
 */

export const revalidate = 3600;

async function getInitialData() {
  const emptyData = { banners: [], categories: [], stores: [], products: [], zones: [], coupons: [] };
  
  // IN DEV PREVIEW: Return empty immediately. 
  // This is the #1 fix for "Frozen Spinner" during development.
  if (process.env.NODE_ENV !== 'production') return emptyData;

  try {
    const { initializeFirebase } = await import('@/firebase/init');
    const { collection, getDocs, limit, query } = await import('firebase/firestore');

    const { firestore } = initializeFirebase();
    if (!firestore) return emptyData;

    // Production Build Only: Bake initial data for high-speed mobile experience
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
    console.error("Initial data bake failed:", error);
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
