import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview ShopyKart Main Entrance - Optimized Server Component for SEO and SSR.
 * Fetches critical initial data on the server to prevent blank frames and loading delays.
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
 */
async function getInitialHomeData() {
  try {
    // Initialize Firebase on server
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(app);

    // Fetch initial banners and categories for SSR
    const [bannersSnap, categoriesSnap] = await Promise.all([
      getDocs(query(collection(db, 'banners'), limit(5))),
      getDocs(query(collection(db, 'categories'), limit(15)))
    ]);

    return {
      initialBanners: bannersSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      initialCategories: categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
    };
  } catch (e) {
    console.error("SSR Data Fetch failed, falling back to empty:", e);
    return { initialBanners: [], initialCategories: [] };
  }
}

export default async function ShopyKartApp() {
  // Fetch data BEFORE rendering anything
  const initialData = await getInitialHomeData();
  
  return (
    <HomeClient 
      initialBanners={initialData.initialBanners} 
      initialCategories={initialData.initialCategories} 
    />
  );
}
