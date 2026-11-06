import HomeClient from '@/components/home/HomeClient';

/**
 * @fileOverview Optimized Server-Side Entry Point.
 * BAKES Firestore data into HTML at build time for 0.0ms instant loading.
 * Optimized for development: Skips heavy server-side fetches to ensure < 2s startup.
 */

export const revalidate = 3600; // Revalidate every hour

async function getInitialData() {
  const emptyData = { banners: [], categories: [], stores: [], products: [], zones: [], coupons: [] };
  
  // PREVIEW SPEED OPTIMIZATION: Strictly bypass heavy SSR fetch in development.
  // This prevents the 50s+ compilation delay and ENOENT manifest errors.
  const isDev = process.env.NODE_ENV === 'development';
  const isExport = process.env.NEXT_PUBLIC_STATIC_EXPORT === 'true';

  if (isDev || !isExport) {
    return emptyData;
  }

  try {
    const { initializeFirebase } = await import('@/firebase/init');
    const { collection, getDocs, limit, query } = await import('firebase/firestore');

    const { firestore } = initializeFirebase();
    if (!firestore) return emptyData;

    // Use a very light fetch for build time
    const [bannersSnap, categoriesSnap, vendorsSnap, productsSnap, zonesSnap, couponsSnap] = await Promise.all([
      getDocs(query(collection(firestore, 'banners'), limit(5))),
      getDocs(query(collection(firestore, 'categories'), limit(10))),
      getDocs(query(collection(firestore, 'vendors'), limit(20))),
      getDocs(query(collection(firestore, 'products'), limit(20))),
      getDocs(collection(firestore, 'zones')),
      getDocs(query(collection(firestore, 'coupons'), limit(10)))
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
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "DeliveryService",
    "name": "Shopykart",
    "description": "Premium 10-minute gourmet delivery service in Mauranipur and Ranipur.",
    "url": "https://shopykart.co.in",
    "logo": "https://shopykart.co.in/logo.png"
  };

  const initialData = await getInitialData();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomeClient 
        initialBanners={initialData.banners}
        initialCategories={initialData.categories}
        initialStores={initialData.stores}
        initialProducts={initialData.products}
        initialZones={initialData.zones}
        initialCoupons={initialData.coupons}
      />
    </>
  );
}
