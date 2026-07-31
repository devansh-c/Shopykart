import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, query, limit } from 'firebase/firestore';

/**
 * @fileOverview ShopyKart Main Entrance - Optimized for Instant Paint.
 * Added SSR Timeout Guard to prevent 10-second hangs on slow connectivity.
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
  const plain: any = { 
    id, 
    name: data.name || '',
    price: data.price || 0,
    imageUrl: data.imageUrl || '',
    category: data.category || '',
    vendorId: data.vendorId || '',
    restaurantName: data.restaurantName || '',
    serviceMode: data.serviceMode || 'Food',
    isVeg: data.isVeg !== false,
    isTopTen: data.isTopTen || false,
    isAvailable: data.isAvailable !== false,
    zoneId: data.zoneId || null,
    town: data.town || 'Local',
    slug: data.slug || ''
  };
  return plain;
}

async function getInitialData() {
  const { firestore } = initializeFirebase();
  if (!firestore) return { banners: [], categories: [], stores: [], products: [] };

  // TURBO SSR GUARD: Do not wait more than 2.5s for Firestore. 
  // If slow, return empty and let the client-side cache take over instantly.
  const fetchTimeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('SSR_TIMEOUT')), 2500)
  );

  try {
    const fetchPromise = Promise.all([
      getDocs(query(collection(firestore, 'banners'), limit(10))),
      getDocs(query(collection(firestore, 'categories'), limit(50))),
      getDocs(query(collection(firestore, 'vendors'), limit(100))),
      getDocs(query(collection(firestore, 'products'), limit(2000))) 
    ]);

    const [bannersSnap, categoriesSnap, storesSnap, productsSnap] = await Promise.race([
      fetchPromise,
      fetchTimeout
    ]) as any[];

    return {
      banners: bannersSnap.docs.map(sanitizeDoc),
      categories: categoriesSnap.docs.map(sanitizeDoc),
      stores: storesSnap.docs.map(sanitizeDoc),
      products: productsSnap.docs.map(sanitizeDoc),
    };
  } catch (e) {
    // Return empty results on timeout or error to allow immediate client paint
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
