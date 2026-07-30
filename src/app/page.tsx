import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview ShopyKart Main Entrance - Optimized Server Component for SEO and SSR.
 * Improved with high-reliability data pre-fetching and quota-safety.
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
 * Server-side data fetcher for Firestore.
 * Ensures initial HTML is populated with real content.
 * Safe fallback added for quota exceeded scenarios.
 */
async function getInitialHomeData() {
  try {
    // Initialize Firebase on server for SSR
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(app);

    // Fetch essential datasets with safe limits
    const [bannersSnap, categoriesSnap, vendorsSnap] = await Promise.all([
      getDocs(query(collection(db, 'banners'), limit(6))),
      getDocs(query(collection(db, 'categories'), limit(15))),
      getDocs(query(collection(db, 'vendors'), limit(20)))
    ]);

    return {
      initialBanners: bannersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      initialCategories: categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      initialVendors: vendorsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    };
  } catch (e: any) {
    // SILENT FAIL: If quota exceeded on server, return empty to let client cache take over
    console.warn("SSR Data Fetch Status: Quota or connection unavailable.");
    return { initialBanners: [], initialCategories: [], initialVendors: [] };
  }
}

export default async function ShopyKartApp() {
  // Fetch real data BEFORE rendering anything
  const initialData = await getInitialHomeData();
  
  return (
    <HomeClient 
      initialBanners={initialData.initialBanners} 
      initialCategories={initialData.initialCategories}
      initialVendors={initialData.initialVendors}
    />
  );
}
