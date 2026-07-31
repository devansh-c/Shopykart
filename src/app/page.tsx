import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';

/**
 * @fileOverview ShopyKart Ultra-Performance Entry.
 * Optimized with Parallel-Payload SSR and Strict Serialization.
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
 * Handles Timestamps by converting them to ISO strings to satisfy Next.js 15 requirements.
 */
function sanitizeDoc(doc: any) {
  const data = doc.data();
  const plainData: any = {};

  // Manually iterate to ensure no complex objects leak through
  Object.keys(data).forEach(key => {
    const value = data[key];
    
    if (value && typeof value === 'object' && value.seconds !== undefined) {
      // Firestore Timestamp detected - Convert to ISO string
      plainData[key] = new Date(value.seconds * 1000).toISOString();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Nested Object - Stringify and parse to strip class prototypes
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
  if (!firestore) return { banners: [], categories: [], stores: [], products: [] };

  // Speed is priority: 2.5s timeout for initial paint
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const [bannersSnap, categoriesSnap, storesSnap, productsSnap] = await Promise.all([
      getDocs(query(collection(firestore, 'banners'), limit(15))),
      getDocs(query(collection(firestore, 'categories'), limit(50))),
      getDocs(query(collection(firestore, 'vendors'), limit(200))),
      // SSR fetches top 300 items for instant paint, client fetches full 2000 in background
      getDocs(query(collection(firestore, 'products'), limit(300)))
    ]);

    clearTimeout(timeoutId);

    return { 
      banners: bannersSnap.docs.map(sanitizeDoc), 
      categories: categoriesSnap.docs.map(sanitizeDoc), 
      stores: storesSnap.docs.map(sanitizeDoc), 
      products: productsSnap.docs.map(sanitizeDoc) 
    };
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
