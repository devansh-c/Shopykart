import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';
import { initializeFirebase } from '@/firebase/init';
import { collection, getDocs, query, limit, doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview ShopyKart Ultra-Performance Entry v15.
 * Strictly sorts all products by Store Status then Rating on the Server.
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

function isStoreOpenOnServer(vendor: any) {
  if (!vendor) return true;
  if (!vendor.openingTime || !vendor.closingTime) return true;
  
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();

  const parseTime = (t: string) => {
    try {
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
  if (!firestore) return { banners: [], categories: [], announcement: null, vendors: [], products: [] };

  try {
    const [bannersSnap, categoriesSnap, announcementSnap, vendorsSnap, productsSnap] = await Promise.all([
      getDocs(query(collection(firestore, 'banners'), limit(15))),
      getDocs(query(collection(firestore, 'categories'), limit(40))),
      getDoc(doc(firestore, 'app_settings', 'announcement')),
      getDocs(query(collection(firestore, 'vendors'), limit(100))),
      getDocs(query(collection(firestore, 'products'), limit(500)))
    ]);

    const vendors = vendorsSnap.docs.map(sanitizeDoc);
    const vendorMap = new Map(vendors.map(v => [v.id, v]));

    const sortedProducts = productsSnap.docs
      .map(sanitizeDoc)
      .sort((a, b) => {
        const vA = vendorMap.get(a.vendorId);
        const vB = vendorMap.get(b.vendorId);
        
        const openA = vA ? (vA.isOnline !== false && isStoreOpenOnServer(vA)) : true;
        const openB = vB ? (vB.isOnline !== false && isStoreOpenOnServer(vB)) : true;
        
        if (openA !== openB) return openA ? -1 : 1;
        
        const ratingA = Number(a.rating) || Number(vA?.rating) || 0;
        const ratingB = Number(b.rating) || Number(vB?.rating) || 0;
        return ratingB - ratingA;
      });

    return { 
      banners: bannersSnap.docs.map(sanitizeDoc), 
      categories: categoriesSnap.docs.map(sanitizeDoc),
      announcement: announcementSnap.exists() ? { ...sanitizeDoc(announcementSnap), id: announcementSnap.id } : null,
      vendors: vendors,
      products: sortedProducts
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
