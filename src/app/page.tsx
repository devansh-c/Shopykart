
import HomeClient from '@/components/home/HomeClient';

/**
 * @fileOverview Optimized Server-Side Entry Point.
 * BAKES Firestore data into HTML at build time for 0.0ms instant loading.
 * Optimized for development: Strictly skips server-side fetches in dev mode to prevent Internal Server Errors.
 */

export const revalidate = 3600;

async function getInitialData() {
  const emptyData = { banners: [], categories: [], stores: [], products: [], zones: [], coupons: [] };
  
  // PREVIEW SPEED OPTIMIZATION: Strictly bypass server-side logic in development and non-export builds.
  // This prevents the manifest ENOENT errors and long compilation hangs.
  if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_STATIC_EXPORT !== 'true') {
    return emptyData;
  }

  try {
    const { initializeFirebase } = await import('@/firebase/init');
    const { collection, getDocs, limit, query } = await import('firebase/firestore');

    const { firestore } = initializeFirebase();
    if (!firestore) return emptyData;

    // Use a very light fetch for build time (Only for production export)
    const [bannersSnap, categoriesSnap, vendorsSnap, productsSnap, zonesSnap, couponsSnap] = await Promise.all([
      getDocs(query(collection(firestore, 'banners'), limit(5))),
      getDocs(query(collection(firestore, 'categories'), limit(10))),
      getDocs(query(collection(firestore, 'vendors'), limit(15))),
      getDocs(query(collection(firestore, 'products'), limit(15))),
      getDocs(collection(firestore, 'zones')),
      getDocs(query(collection(firestore, 'coupons'), limit(5)))
    ]);

    const banners = bannersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const categories = categoriesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const stores = vendorsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const products = productsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const zones = zonesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const coupons = couponsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));

    return JSON.parse(JSON.stringify({
      banners,
      categories,
      stores,
      products,
      zones,
      coupons
    }));
  } catch (error) {
    console.warn("Static data baking bypassed:", error);
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
