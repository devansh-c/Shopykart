
import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, limit, query } from 'firebase/firestore';

/**
 * @fileOverview Optimized Server-Side Entry Point.
 * BAKES Firestore data into HTML at build time for 0.0ms instant loading.
 * Next.js 15 Server Component with ISR (1 Day Revalidation).
 * Parallelized fetching to prevent server startup hangs.
 */

export const revalidate = 86400; // 24 Hours

async function getInitialData() {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return { banners: [], categories: [], stores: [], products: [] };

    // Parallelize all fetches to reduce TTI (Time to Interactive)
    const [bannersSnap, categoriesSnap, storesSnap, productsSnap] = await Promise.all([
      getDocs(collection(firestore, 'banners')),
      getDocs(collection(firestore, 'categories')),
      getDocs(query(collection(firestore, 'vendors'), limit(50))),
      getDocs(query(collection(firestore, 'products'), limit(200))) // Optimized limit for faster build
    ]);

    const banners = bannersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const categories = categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const stores = storesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const products = productsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Stringify timestamps for serialization safety
    return JSON.parse(JSON.stringify({
      banners,
      categories,
      stores,
      products
    }));
  } catch (error) {
    console.error("Build-time data fetch failed:", error);
    return { banners: [], categories: [], stores: [], products: [] };
  }
}

export default async function ShopyKartApp() {
  const initialData = await getInitialData();

  // Structured Data for SEO
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
      />
    </>
  );
}
