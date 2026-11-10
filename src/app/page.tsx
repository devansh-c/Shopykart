
import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, query, limit, orderBy } from 'firebase/firestore';

/**
 * @fileOverview SSR Enabled Home Page for ShopyKart.
 * Fetches initial data on the server to prevent blank screens and improve SEO.
 */
export default async function ShopyKartApp() {
  const { firestore } = initializeFirebase();
  
  let initialBanners: any[] = [];
  let initialCategories: any[] = [];
  let initialStores: any[] = [];
  let initialProducts: any[] = [];

  try {
    // Parallel fetching for performance
    const [bannersSnap, categoriesSnap, vendorsSnap, productsSnap] = await Promise.all([
      getDocs(query(collection(firestore, 'banners'), limit(5))),
      getDocs(collection(firestore, 'categories')),
      getDocs(query(collection(firestore, 'vendors'), limit(20))),
      getDocs(query(collection(firestore, 'products'), limit(20)))
    ]);

    initialBanners = bannersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    initialCategories = categoriesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    initialStores = vendorsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    initialProducts = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  } catch (error) {
    console.error("SSR Fetching Error:", error);
    // Fallback to empty if server fetch fails
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
