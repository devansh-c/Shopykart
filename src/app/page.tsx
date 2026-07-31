import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';

/**
 * @fileOverview ShopyKart Ultra-Performance Entry.
 * Optimized with Parallel-Payload SSR and Server-Side Pre-Sorting by Rating.
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
  return { 
    id, 
    ...data,
    // Ensure numeric values for sorting safety
    price: Number(data.price) || 0,
    rating: Number(data.rating) || 0
  };
}

async function getInitialData() {
  const { firestore } = initializeFirebase();
  if (!firestore) return { banners: [], categories: [], stores: [], products: [] };

  const fetchTimeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('SSR_TIMEOUT')), 4000)
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

    // SERVER-SIDE PRE-SORTING BY RATING & STATUS
    // Pre-calculate a vendor rating map for high-speed product sorting
    const vendorMap = new Map(stores.map((v: any) => [v.id, v]));
    
    const sortedProducts = rawProducts.sort((a: any, b: any) => {
      const vendorA = vendorMap.get(a.vendorId);
      const vendorB = vendorMap.get(b.vendorId);
      
      // 1. Online stores first
      const isOnlineA = vendorA?.isOnline !== false ? 1 : 0;
      const isOnlineB = vendorB?.isOnline !== false ? 1 : 0;
      if (isOnlineA !== isOnlineB) return isOnlineB - isOnlineA;

      // 2. Rating (High to Low)
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
    console.warn("SSR Data Fetch Timeout or Error. Returning partial results.");
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
