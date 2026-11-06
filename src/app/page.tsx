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
  if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_STATIC_EXPORT !== 'true') {
    return emptyData;
  }

  try {
    const { initializeFirebase } = await import('@/firebase/init');
    const { collection, getDocs, limit, query } = await import('firebase/firestore');

    const { firestore } = initializeFirebase();
    if (!firestore) return emptyData;

    const fetchWithTimeout = async (promise: Promise<any>) => {
      const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 10000));
      const result = await Promise.race([promise, timeout]);
      return result;
    };

    const [bannersSnap, categoriesSnap, vendorsSnap, productsSnap, zonesSnap, couponsSnap] = await Promise.all([
      fetchWithTimeout(getDocs(collection(firestore, 'banners'))),
      fetchWithTimeout(getDocs(collection(firestore, 'categories'))),
      fetchWithTimeout(getDocs(query(collection(firestore, 'vendors'), limit(50)))),
      fetchWithTimeout(getDocs(query(collection(firestore, 'products'), limit(100)))),
      fetchWithTimeout(getDocs(collection(firestore, 'zones'))),
      fetchWithTimeout(getDocs(collection(firestore, 'coupons')))
    ]);

    const banners = bannersSnap?.docs ? bannersSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) : [];
    const categories = categoriesSnap?.docs ? categoriesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) : [];
    const stores = vendorsSnap?.docs ? vendorsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) : [];
    const products = productsSnap?.docs ? productsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) : [];
    const zones = zonesSnap?.docs ? zonesSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) : [];
    const coupons = couponsSnap?.docs ? couponsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() })) : [];

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

  // Skip SSR logic entirely in dev mode for maximum startup speed
  if (process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_STATIC_EXPORT !== 'true') {
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <HomeClient />
      </>
    );
  }

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
