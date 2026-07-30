import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';

/**
 * @fileOverview ShopyKart Main Entrance - Optimized for Turbo-Hydration.
 * Fetches essential data on server, full catalog follows on client.
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
    const bannersSnap = await getDocs(query(collection(firestore, 'banners'), limit(10)));
    const categoriesSnap = await getDocs(query(collection(firestore, 'categories'), limit(20)));
    const storesSnap = await getDocs(query(collection(firestore, 'vendors'), limit(100)));
    
    // FETCH LIMIT REDUCED TO 500 FOR SSR SPEED: This ensures the initial HTML arrives in < 500ms
    // The client hook will then seamlessly load the full 2000 items in background.
    const productsSnap = await getDocs(query(collection(firestore, 'products'), limit(500)));

    return {
      banners: bannersSnap.docs.map(sanitizeDoc),
      categories: categoriesSnap.docs.map(sanitizeDoc),
      stores: storesSnap.docs.map(sanitizeDoc),
      products: productsSnap.docs.map(sanitizeDoc),
    };
  } catch (e) {
    console.error("SSR Fetch failed:", e);
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
