import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, query, limit, doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview ShopyKart Ultra-Performance Entry v13.
 * Optimized for Google Crawler and Incognito: Fetches ALL critical UI data on server
 * so the initial HTML is fully populated and renders instantly.
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
 * Prevents "Only plain objects can be passed to Client Components" error.
 */
function sanitizeDoc(doc: any) {
  const data = doc.data();
  const plainData: any = {};

  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value && typeof value === 'object' && value.seconds !== undefined) {
      // Convert Timestamp to ISO String
      plainData[key] = new Date(value.seconds * 1000).toISOString();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      try {
        // Deep clone to remove class methods/hidden props
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
  if (!firestore) return { banners: [], categories: [], announcement: null, vendors: [], products: [] };

  try {
    // Fetch ALL critical content in parallel on the server
    const [bannersSnap, categoriesSnap, announcementSnap, vendorsSnap, productsSnap] = await Promise.all([
      getDocs(query(collection(firestore, 'banners'), limit(15))),
      getDocs(query(collection(firestore, 'categories'), limit(40))),
      getDoc(doc(firestore, 'app_settings', 'announcement')),
      getDocs(query(collection(firestore, 'vendors'), limit(60))),
      getDocs(query(collection(firestore, 'products'), limit(200)))
    ]);

    return { 
      banners: bannersSnap.docs.map(sanitizeDoc), 
      categories: categoriesSnap.docs.map(sanitizeDoc),
      announcement: announcementSnap.exists() ? { ...sanitizeDoc(announcementSnap), id: announcementSnap.id } : null,
      vendors: vendorsSnap.docs.map(sanitizeDoc),
      products: productsSnap.docs.map(sanitizeDoc)
    };
  } catch (e) {
    console.error("SSR Data Fetch Error:", e);
    return { banners: [], categories: [], announcement: null, vendors: [], products: [] };
  }
}

export default async function ShopyKartApp() {
  const initialData = await getInitialData();

  return (
    <HomeClient 
      initialBanners={initialData.banners}
      initialCategories={initialData.categories}
      initialAnnouncement={initialData.announcement}
      initialStores={initialData.vendors}
      initialProducts={initialData.products}
    />
  );
}
