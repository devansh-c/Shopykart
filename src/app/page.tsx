import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, query, limit, doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview ShopyKart High-Performance Entry.
 * Optimized query limits for instant rendering.
 */

export const metadata: Metadata = {
  title: 'Shopykart – 10 Min Veg Food Delivery | Order Online Mauranipur & Ranipur',
  description: 'Fastest 10-min gourmet veg food delivery in Mauranipur and Ranipur. Order pizzas, burgers, snacks and more at best prices.',
};

function isStoreOpenOnServer(vendor: any) {
  if (!vendor) return true;
  if (!vendor.openingTime || !vendor.closingTime) return true;
  
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();

  const parseTime = (t: string) => {
    try {
      if (!t) return 0;
      const parts = t.trim().split(' ');
      if (parts.length < 2) return 0;
      const [time, modifier] = parts;
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + (minutes || 0);
    } catch (e) { return 0; }
  };

  const start = parseTime(vendor.openingTime);
  const end = parseTime(vendor.closingTime);

  return start < end ? (mins >= start && mins <= end) : (mins >= start || mins <= end);
}

function sanitizeDoc(doc: any) {
  if (!doc || !doc.exists()) return null;
  const data = doc.data();
  const plainData: any = {};

  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value && typeof value === 'object' && value.seconds !== undefined) {
      plainData[key] = new Date(value.seconds * 1000).toISOString();
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
    const [bannersSnap, categoriesSnap, announcementSnap, vendorsSnap, productsSnap] = await Promise.all([
      getDocs(query(collection(firestore, 'banners'), limit(10))),
      getDocs(query(collection(firestore, 'categories'), limit(20))),
      getDoc(doc(firestore, 'app_settings', 'announcement')),
      getDocs(query(collection(firestore, 'vendors'), limit(50))),
      getDocs(query(collection(firestore, 'products'), limit(200))) // Reduced limit for turbo speed
    ]);

    const vendors = vendorsSnap.docs.map(sanitizeDoc).filter(Boolean);
    const vendorMap = new Map(vendors.map(v => [v.id, v]));

    const sortedProducts = productsSnap.docs
      .map(sanitizeDoc)
      .filter(Boolean)
      .sort((a, b) => {
        const vA = vendorMap.get(a.vendorId);
        const vB = vendorMap.get(b.vendorId);
        const openA = vA ? (vA.isOnline !== false && isStoreOpenOnServer(vA)) : true;
        const openB = vB ? (vB.isOnline !== false && isStoreOpenOnServer(vB)) : true;
        if (openA !== openB) return openA ? -1 : 1;
        return (Number(b.rating) || 0) - (Number(a.rating) || 0);
      });

    return { 
      banners: bannersSnap.docs.map(sanitizeDoc).filter(Boolean), 
      categories: categoriesSnap.docs.map(sanitizeDoc).filter(Boolean),
      announcement: sanitizeDoc(announcementSnap),
      vendors: vendors,
      products: sortedProducts
    };
  } catch (e) {
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
