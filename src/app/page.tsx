import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';

/**
 * @fileOverview ShopyKart Ultra-Performance Entry.
 * Optimized with Parallel-Payload SSR and Plain-Object Serialization.
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
 * Critical to fix "Only plain objects can be passed to Client Components" error.
 */
function sanitizeDoc(doc: any) {
  const data = doc.data();
  // Deep clone and convert complex objects (like Timestamps) to plain values
  const plainData = JSON.parse(JSON.stringify(data));
  return { 
    id: doc.id, 
    ...plainData,
    price: Number(data.price) || 0,
    rating: Number(data.rating) || 0
  };
}

async function getInitialData() {
  const { firestore } = initializeFirebase();
  if (!firestore) return { banners: [], categories: [], stores: [], products: [] };

  // Strict timeout to prevent server-side hanging
  const fetchTimeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('SSR_TIMEOUT')), 2500)
  );

  try {
    const fetchPromise = Promise.all([
      getDocs(query(collection(firestore, 'banners'), limit(20))),
      getDocs(query(collection(firestore, 'categories'), limit(100))),
      getDocs(query(collection(firestore, 'vendors'), limit(500))),
      getDocs(query(collection(firestore, 'products'), limit(2000))) 
    ]);

    const [bannersSnap, categoriesSnap, storesSnap, productsSnap] = await Promise.race([
      fetchPromise,
      fetchTimeout
    ]) as any[];

    const banners = bannersSnap.docs.map(sanitizeDoc);
    const categories = categoriesSnap.docs.map(sanitizeDoc);
    const stores = storesSnap.docs.map(sanitizeDoc);
    const rawProducts = productsSnap.docs.map(sanitizeDoc);

    // SERVER-SIDE PRE-SORTING
    const vendorMap = new Map(stores.map((v: any) => [v.id, v]));
    
    const sortedProducts = rawProducts.sort((a: any, b: any) => {
      const vendorA = vendorMap.get(a.vendorId);
      const vendorB = vendorMap.get(b.vendorId);
      
      const isOnlineA = vendorA?.isOnline !== false ? 1 : 0;
      const isOnlineB = vendorB?.isOnline !== false ? 1 : 0;
      if (isOnlineA !== isOnlineB) return isOnlineB - isOnlineA;

      const ratingA = Number(vendorA?.rating) || 0;
      const ratingB = Number(vendorB?.rating) || 0;
      return ratingB - ratingA;
    });

    return {
      banners,
      categories,
      stores,
      products: sortedProducts,
    };
  } catch (e) {
    console.warn("SSR Data Fetch incomplete. Returning empty arrays for client hydration.");
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
