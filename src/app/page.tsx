import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, query, limit } from 'firebase/firestore';

/**
 * @fileOverview ShopyKart Ultra-Performance Entry v9.
 * Optimized for 0-second loading by fetching only essentials on server.
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
 * Converts Firestore Document to a STRICT Plain Serializable Object.
 */
function sanitizeDoc(doc: any) {
  const data = doc.data();
  const plainData: any = {};

  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value && typeof value === 'object' && value.seconds !== undefined) {
      plainData[key] = new Date(value.seconds * 1000).toISOString();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      try {
        plainData[key] = JSON.parse(JSON.stringify(value));
      } catch (e) {
        plainData[key] = null;
      }
    } else {
      plainData[key] = value;
    }
  });

  return { 
    ...plainData,
    id: doc.id,
    price: Number(data.price) || 0,
    rating: Number(data.rating) || 0
  };
}

async function getInitialData() {
  const { firestore } = initializeFirebase();
  if (!firestore) return { banners: [], categories: [] };

  // Speed is priority: Only fetch small metadata on server
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);

  try {
    const [bannersSnap, categoriesSnap] = await Promise.all([
      getDocs(query(collection(firestore, 'banners'), limit(10))),
      getDocs(query(collection(firestore, 'categories'), limit(20)))
    ]);

    clearTimeout(timeoutId);

    return { 
      banners: bannersSnap.docs.map(sanitizeDoc), 
      categories: categoriesSnap.docs.map(sanitizeDoc)
    };
  } catch (e) {
    console.warn("SSR Data Fetch timed out. Relying on Client Cache.");
    return { banners: [], categories: [] };
  }
}

export default async function ShopyKartApp() {
  const initialData = await getInitialData();

  return (
    <HomeClient 
      initialBanners={initialData.banners}
      initialCategories={initialData.categories}
    />
  );
}
