
import HomeClient from '@/components/home/HomeClient';

/**
 * @fileOverview Optimized Server-Side Entry Point.
 * BAKES Firestore data into HTML at build time for 0.0ms instant loading.
 * Optimized for development: Uses a strict 1.5s timeout to prevent compiler hangs while attempting to provide baked data.
 */

export const revalidate = 3600;

async function getInitialData() {
  const emptyData = { banners: [], categories: [], stores: [], products: [], zones: [], coupons: [] };
  
  // PREVIEW SPEED OPTIMIZATION: Use a very aggressive timeout for SSR in dev mode
  const isDev = process.env.NODE_ENV === 'development';
  const timeoutMs = isDev ? 1500 : 8000;

  try {
    const { initializeFirebase } = await import('@/firebase/init');
    const { collection, getDocs, limit, query } = await import('firebase/firestore');

    const { firestore } = initializeFirebase();
    if (!firestore) return emptyData;

    // RACE CONDITION PROTECTION: Promise.race to ensure we don't hang the compiler
    const fetchData = async () => {
      const [bannersSnap, categoriesSnap, vendorsSnap, productsSnap, zonesSnap, couponsSnap] = await Promise.all([
        getDocs(query(collection(firestore, 'banners'), limit(5))),
        getDocs(query(collection(firestore, 'categories'), limit(15))),
        getDocs(query(collection(firestore, 'vendors'), limit(15))),
        getDocs(query(collection(firestore, 'products'), limit(15))),
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
    };

    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs));
    const result = await Promise.race([fetchData(), timeoutPromise]);

    if (!result) {
      console.warn(`SSR Fetch timed out after ${timeoutMs}ms. Falling back to client-side load.`);
      return emptyData;
    }

    return JSON.parse(JSON.stringify(result));
  } catch (error) {
    console.warn("Static data baking failed/bypassed:", error);
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
