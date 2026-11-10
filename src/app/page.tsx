
import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';

/**
 * @fileOverview SSR Enabled Home Page for ShopyKart.
 * FIXED: Increased limits for products to ensure stores show a full horizontal strip.
 */
export default async function ShopyKartApp() {
  const { firestore } = initializeFirebase();
  
  let initialBanners: any[] = [];
  let initialCategories: any[] = [];
  let initialStores: any[] = [];
  let initialProducts: any[] = [];

  // Helper to convert Firestore Timestamps to serializable strings
  const sanitize = (docs: any[]) => docs.map(doc => {
    const data = { id: doc.id, ...doc.data() };
    return JSON.parse(JSON.stringify(data, (key, value) => 
      value && typeof value === 'object' && value.seconds !== undefined 
        ? new Date(value.seconds * 1000).toISOString() 
        : value
    ));
  });

  try {
    // Parallel fetching for performance
    const [bannersSnap, categoriesSnap, vendorsSnap, productsSnap] = await Promise.all([
      getDocs(query(collection(firestore, 'banners'), limit(10))),
      getDocs(collection(firestore, 'categories')),
      getDocs(query(collection(firestore, 'vendors'), limit(50))),
      getDocs(query(collection(firestore, 'products'), limit(200)))
    ]);

    initialBanners = sanitize(bannersSnap.docs);
    initialCategories = sanitize(categoriesSnap.docs);
    initialStores = sanitize(vendorsSnap.docs);
    initialProducts = sanitize(productsSnap.docs);

  } catch (error) {
    console.error("SSR Fetching Error:", error);
  }

  return (
    <HomeClient 
      initialBanners={initialBanners}
      initialCategories={initialCategories}
      initialStores={initialStores}
      initialProducts={initialProducts}
      initialZones={[]}
      initialCoupons={[]}
    />
  );
}
