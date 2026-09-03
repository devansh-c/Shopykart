'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import HomeClient from '@/components/home/HomeClient';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, limit, doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Loading from './loading';

/**
 * @fileOverview Multi-App Router for APK Builds.
 * Restored Shimmer (Loading) for Customer App. Redirection for Portals.
 */
export default function ShopyKartApp() {
  const router = useRouter();
  const firestore = useFirestore();
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [appType, setAppType] = useState<'customer' | 'admin' | 'biz' | 'tow'>('customer');

  useEffect(() => {
    // Identify app variant from build flags
    const isAdmin = process.env.NEXT_PUBLIC_ADMIN_APP === 'true';
    const isBiz = process.env.NEXT_PUBLIC_BIZ_APP === 'true';
    const isTow = process.env.NEXT_PUBLIC_TOW_APP === 'true';

    if (isAdmin) {
      setAppType('admin');
      router.replace('/admin/login');
    } else if (isBiz) {
      setAppType('biz');
      router.replace('/vendor/login');
    } else if (isTow) {
      setAppType('tow');
      router.replace('/delivery/login');
    } else {
      setAppType('customer');
      fetchData();
    }
  }, [router]);

  async function fetchData() {
    if (!firestore) return;
    try {
      const [bannersSnap, categoriesSnap, announcementSnap, vendorsSnap, productsSnap] = await Promise.all([
        getDocs(query(collection(firestore, 'banners'), limit(15))),
        getDocs(query(collection(firestore, 'categories'), limit(40))),
        getDoc(doc(firestore, 'app_settings', 'announcement')),
        getDocs(query(collection(firestore, 'vendors'), limit(50))),
        getDocs(query(collection(firestore, 'products'), limit(100)))
      ]);

      const sanitize = (docs: any[]) => docs.map(d => ({ 
        id: d.id, 
        ...d.data()
      }));

      setInitialData({
        banners: sanitize(bannersSnap.docs),
        categories: sanitize(categoriesSnap.docs),
        announcement: announcementSnap.exists() ? { id: announcementSnap.id, ...announcementSnap.data() } : null,
        vendors: sanitize(vendorsSnap.docs),
        products: sanitize(productsSnap.docs)
      });
    } catch (e) {
      console.error("Initial data fetch error:", e);
      setInitialData({ banners: [], categories: [], announcement: null, vendors: [], products: [] });
    } finally {
      setLoading(false);
    }
  }

  // SHOW SHIMMER EFFECT FOR CUSTOMER APP
  if (appType === 'customer' && (loading || !initialData)) {
    return <Loading />;
  }

  // SHOW LOADER FOR PORTAL REDIRECTS
  if (appType !== 'customer') {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
          Launching {appType.toUpperCase()} Portal...
        </p>
      </div>
    );
  }

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
