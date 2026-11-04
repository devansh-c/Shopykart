import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, limit, query } from 'firebase/firestore';

/**
 * @fileOverview Optimized Server-Side Entry Point.
 * BAKES Firestore data into HTML at build time for 0.0ms instant loading.
 * Optimized with Development Bypass to prevent server compilation hangs.
 */

export const revalidate = 86400; // 24 Hours

async function getInitialData() {
  // ⚡ SPEED FIX: Skip SSR data fetching in development mode to make server start instantly.
  // Data will be fetched by Client Components via cache/hooks.
  if (process.env.NODE_ENV === 'development') {
    return { banners: [], categories: [], stores: [], products: [], zones: [], coupons: [] };
  }

  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return { banners: [], categories: [], stores: [], products: [], zones: [], coupons: [] };

    // Parallelize all fetches for production export
    const snaps = await Promise.all([
      getDocs(collection(firestore, 'banners')),
      getDocs(collection(firestore, 'categories')),
      getDocs(query(collection(firestore, 'vendors'), limit(50))),
      getDocs(query(collection(firestore, 'products'), limit(100))),
      getDocs(collection(firestore, 'zones')),
      getDocs(collection(firestore, 'coupons'))
    ]);

    const banners = snaps[0].docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const categories = snaps[1].docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const stores = snaps[2].docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const products = snaps[3].docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const zones = snaps[4].docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const coupons = snaps[5].docs.map((d: any) => ({ id: d.id, ...d.data() }));

    return JSON.parse(JSON.stringify({
      banners,
      categories,
      stores,
      products,
      zones,
      coupons
    }));
  } catch (error) {
    console.error("Server-side data fetch skipped:", error);
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
