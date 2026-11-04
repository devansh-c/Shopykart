import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, limit, query } from 'firebase/firestore';

/**
 * @fileOverview Optimized Server-Side Entry Point.
 * BAKES Firestore data into HTML at build time for 0.0ms instant loading.
 */

export const revalidate = 3600; // Revalidate every hour

async function getInitialData() {
  const emptyData = { banners: [], categories: [], stores: [], products: [], zones: [], coupons: [] };
  
  // Skip SSR fetch in development to prevent slow server starts and timeout errors.
  // The data will still be loaded client-side via Firestore hooks.
  if (process.env.NODE_ENV === 'development') {
    return emptyData;
  }

  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return emptyData;

    // RESILIENT FETCH: Attempt to bake data for static export
    const fetchWithTimeout = async (promise: Promise<any>) => {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 8000));
      return Promise.race([promise, timeout]);
    };

    const [bannersSnap, categoriesSnap, vendorsSnap, productsSnap, zonesSnap, couponsSnap] = await Promise.all([
      fetchWithTimeout(getDocs(collection(firestore, 'banners'))),
      fetchWithTimeout(getDocs(collection(firestore, 'categories'))),
      fetchWithTimeout(getDocs(query(collection(firestore, 'vendors'), limit(50)))),
      fetchWithTimeout(getDocs(query(collection(firestore, 'products'), limit(100)))),
      fetchWithTimeout(getDocs(collection(firestore, 'zones'))),
      fetchWithTimeout(getDocs(collection(firestore, 'coupons')))
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
    console.error("Server-side data fetch error (falling back to client load):", error);
    return emptyData;
  }
}

export default async function ShopyKartApp() {
  const initialData = await getInitialData();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "DeliveryService",
    "name": "Shopykart",
    "description": "Premium 10-minute gourmet delivery service in Mauranipur and Ranipur.",
    "url": "https://shopykart.co.in",
    "logo": "https://shopykart.co.in/logo.png"
  };

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
