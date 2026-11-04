import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, limit, query } from 'firebase/firestore';

/**
 * @fileOverview Optimized Server-Side Entry Point.
 * BAKES Firestore data into HTML at build time for 0.0ms instant loading.
 * Always fetches data to ensure the app is never empty on first load.
 */

export const revalidate = 3600; // Revalidate every hour

async function getInitialData() {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return { banners: [], categories: [], stores: [], products: [], zones: [], coupons: [] };

    // Parallel fetching for performance
    const [bannersSnap, categoriesSnap, vendorsSnap, productsSnap, zonesSnap, couponsSnap] = await Promise.all([
      getDocs(collection(firestore, 'banners')),
      getDocs(collection(firestore, 'categories')),
      getDocs(query(collection(firestore, 'vendors'), limit(50))),
      getDocs(query(collection(firestore, 'products'), limit(100))),
      getDocs(collection(firestore, 'zones')),
      getDocs(collection(firestore, 'coupons'))
    ]);

    const banners = bannersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const categories = categoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const stores = vendorsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const products = productsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const zones = zonesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const coupons = couponsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    return JSON.parse(JSON.stringify({
      banners,
      categories,
      stores,
      products,
      zones,
      coupons
    }));
  } catch (error) {
    console.error("Server-side data fetch error:", error);
    return { banners: [], categories: [], stores: [], products: [], zones: [], coupons: [] };
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
