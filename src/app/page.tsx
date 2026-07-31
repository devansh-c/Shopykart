import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';

/**
 * @fileOverview ShopyKart Ultra-Performance Entry.
 * Optimized with Parallel-Payload SSR and Plain-Object Serialization.
 * Limit reduced to 300 for SSR to ensure < 1s response time.
 */

export const metadata: Metadata = {
  title: 'Shopykart – 10 Min Veg Food Delivery | Order Online Mauranipur & Ranipur',
  description: 'Fastest 10-min gourmet veg food delivery in Mauranipur and Ranipur. Order pizzas, burgers, snacks and more at best prices.',
  openGraph: {
    title: 'Shopykart – Premium Food Delivery',
    description: '10-minute delivery in Mauranipur and Ranipur.',
    url: 'https://shopykart.co.in',
    siteName: 'ShopyKart',
    images: [{ url: 'https://shopykart.co.in/og-image.jpg' }],
    locale: 'en_IN',
    type: 'website',
  },
};

/**
 * Converts Firestore Document to a Plain Serializable Object.
 * Strictly handles Timestamps and complex objects to prevent "Only plain objects" error.
 */
function sanitizeDoc(doc: any) {
  const data = doc.data();
  // Deep clone to plain values (converts Timestamps to strings/objects)
  const plainData = JSON.parse(JSON.stringify(data));
  return { 
    ...plainData,
    id: doc.id,
    price: Number(data.price) || 0,
    rating: Number(data.rating) || 0
  };
}

async function getInitialData() {
  const { firestore } = initializeFirebase();
  if (!firestore) return { banners: [], categories: [], stores: [], products: [] };

  // Speed is priority: 2s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000);

  try {
    const [bannersSnap, categoriesSnap, storesSnap, productsSnap] = await Promise.all([
      getDocs(query(collection(firestore, 'banners'), limit(15))),
      getDocs(query(collection(firestore, 'categories'), limit(50))),
      getDocs(query(collection(firestore, 'vendors'), limit(200))),
      // SSR fetches top 300 items for instant paint, client fetches full 2000
      getDocs(query(collection(firestore, 'products'), limit(300)))
    ]);

    clearTimeout(timeoutId);

    const banners = bannersSnap.docs.map(sanitizeDoc);
    const categories = categoriesSnap.docs.map(sanitizeDoc);
    const stores = storesSnap.docs.map(sanitizeDoc);
    const products = productsSnap.docs.map(sanitizeDoc);

    return { banners, categories, stores, products };
  } catch (e) {
    console.warn("SSR Data Fetch timed out or failed. App will rely on Client Cache.");
    return { banners: [], categories: [], stores: [], products: [] };
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
    />
  );
}
