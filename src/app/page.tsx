import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, query, limit } from 'firebase/firestore';

/**
 * @fileOverview ShopyKart Main Entrance - Optimized for Zero-Latency Real Data.
 * Performs Server-Side Pre-fetching to eliminate initial render delays and mock data.
 * Sanity Check: Converts complex Firestore objects into plain serializable JSON.
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
 * Helper to convert Firestore snapshots into plain, serializable objects.
 * This removes non-serializable methods like toJSON() which cause Next.js errors.
 */
function sanitizeDoc(doc: any) {
  const data = doc.data();
  const id = doc.id;
  
  // Create a plain object and convert complex types (like Timestamps) to simple values
  const plain: any = { id, ...data };
  
  // Recursively handle timestamps or just convert top-level common ones
  if (plain.createdAt && typeof plain.createdAt.toMillis === 'function') {
    plain.createdAt = { seconds: plain.createdAt.seconds, nanoseconds: plain.createdAt.nanoseconds };
  }
  if (plain.updatedAt && typeof plain.updatedAt.toMillis === 'function') {
    plain.updatedAt = { seconds: plain.updatedAt.seconds, nanoseconds: plain.updatedAt.nanoseconds };
  }
  
  // Ensuring everything is a plain value by doing a JSON round-trip for safety
  return JSON.parse(JSON.stringify(plain));
}

async function getInitialData() {
  const { firestore } = initializeFirebase();
  if (!firestore) return { banners: [], categories: [], stores: [] };

  try {
    const bannersSnap = await getDocs(query(collection(firestore, 'banners'), limit(5)));
    const categoriesSnap = await getDocs(query(collection(firestore, 'categories'), limit(12)));
    const storesSnap = await getDocs(query(collection(firestore, 'vendors'), limit(10)));

    return {
      banners: bannersSnap.docs.map(sanitizeDoc),
      categories: categoriesSnap.docs.map(sanitizeDoc),
      stores: storesSnap.docs.map(sanitizeDoc),
    };
  } catch (e) {
    console.error("SSR Fetch failed:", e);
    return { banners: [], categories: [], stores: [] };
  }
}

export default async function ShopyKartApp() {
  const initialData = await getInitialData();

  return (
    <HomeClient 
      initialBanners={initialData.banners}
      initialCategories={initialData.categories}
      initialStores={initialData.stores}
    />
  );
}
