import HomeClient from '@/components/home/HomeClient';

/**
 * @fileOverview Optimized Server-Side Entry Point.
 * Version 1.4 Stable: Faster startup and refined data baking.
 */

export const revalidate = 3600;

async function getInitialData() {
  const emptyData = { banners: [], categories: [], stores: [], products: [], zones: [], coupons: [] };
  
  // Dev mode always bypasses to prevent hydration locks in the editor
  if (process.env.NODE_ENV === 'development') return emptyData;

  try {
    const { initializeFirebase } = await import('@/firebase/init');
    const { collection, getDocs, limit, query } = await import('firebase/firestore');

    const { firestore } = initializeFirebase();
    if (!firestore) return emptyData;

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
  } catch (error) {
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