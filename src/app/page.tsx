import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';

/**
 * @fileOverview ShopyKart Main Entrance - Optimized for Instant Paint.
 * Fetches critical "above-the-fold" data on server for sub-100ms response.
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

function sanitizeDoc(doc: any) {
  const data = doc.data();
  const id = doc.id;
  const plain: any = { id, ...data };
  if (plain.createdAt && typeof plain.createdAt.toMillis === 'function') {
    plain.createdAt = { seconds: plain.createdAt.seconds, nanoseconds: plain.createdAt.nanoseconds };
  }
  if (plain.updatedAt && typeof plain.updatedAt.toMillis === 'function') {
    plain.updatedAt = { seconds: plain.updatedAt.seconds, nanoseconds: plain.updatedAt.nanoseconds };
  }
  return JSON.parse(JSON.stringify(plain));
}

async function getInitialData() {
  const { firestore } = initializeFirebase();
  if (!firestore) return { banners: [], categories: [], stores: [], products: [] };

  try {
    // LIGHTWEIGHT SSR ENGINE: Fetch only enough for first screen view
    // Reduced product limit to 60 for near-instant HTML delivery
    const [bannersSnap, categoriesSnap, storesSnap, productsSnap] = await Promise.all([
      getDocs(query(collection(firestore, 'banners'), limit(6))),
      getDocs(query(collection(firestore, 'categories'), limit(20))),
      getDocs(query(collection(firestore, 'vendors'), limit(30))),
      getDocs(query(collection(firestore, 'products'), limit(60))) 
    ]);

    return {
      banners: bannersSnap.docs.map(sanitizeDoc),
      categories: categoriesSnap.docs.map(sanitizeDoc),
      stores: storesSnap.docs.map(sanitizeDoc),
      products: productsSnap.docs.map(sanitizeDoc),
    };
  } catch (e) {
    console.error("SSR Speed Fetch failed:", e);
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
