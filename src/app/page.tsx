import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';

/**
 * @fileOverview ShopyKart Main Entrance - Optimized for Zero-Latency Real Data.
 * Performs Server-Side Pre-fetching to eliminate initial render delays and mock data.
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

// Data fetching occurs on the server to ensure Zero-Delay HTML
async function getInitialData() {
  const { firestore } = initializeFirebase();
  if (!firestore) return { banners: [], categories: [], stores: [] };

  try {
    const bannersSnap = await getDocs(query(collection(firestore, 'banners'), limit(5)));
    const categoriesSnap = await getDocs(query(collection(firestore, 'categories'), limit(12)));
    const storesSnap = await getDocs(query(collection(firestore, 'vendors'), limit(10)));

    return {
      banners: bannersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      categories: categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      stores: storesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
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
