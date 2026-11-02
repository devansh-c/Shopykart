
import HomeClient from '@/components/home/HomeClient';
import Loading from './loading';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, limit, query, orderBy } from 'firebase/firestore';

/**
 * @fileOverview Optimized Server-Side Entry Point.
 * BAKES Firestore data into HTML at build time for 0.0ms instant loading.
 * Next.js 15 Server Component with ISR (1 Day Revalidation).
 */

export const revalidate = 86400; // 24 Hours

async function getInitialData() {
  try {
    const { firestore } = initializeFirebase();
    if (!firestore) return { banners: [], categories: [], stores: [], products: [] };

    // Fetch Banners
    const bannersSnap = await getDocs(collection(firestore, 'banners'));
    const banners = bannersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch Categories
    const categoriesSnap = await getDocs(collection(firestore, 'categories'));
    const categories = categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch Top Stores
    const storesQuery = query(collection(firestore, 'vendors'), limit(40));
    const storesSnap = await getDocs(storesQuery);
    const stores = storesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Fetch Popular Products
    const productsQuery = query(collection(firestore, 'products'), where('isTopTen', '==', true), limit(30));
    const productsSnap = await getDocs(productsQuery);
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

// We need a small helper to handle SSR-safe query/where since top-level import is tricky
import { where } from 'firebase/firestore';

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
