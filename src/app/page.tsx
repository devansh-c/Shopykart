'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import HomeClient from '@/components/home/HomeClient';
import { useFirestore } from '@/firebase';
import { collection, getDocs, query, limit, doc, getDoc, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import Loading from './loading';

// Global cache to prevent "Loading..." flash during back navigation
let globalDataCache: any = null;

/**
 * @fileOverview Multi-App Router for APK Builds with SEO Structured Data.
 * Optimized for Next.js 15 compilation stability and crawler accessibility.
 */
function ShopyKartAppContent() {
  const router = useRouter();
  const firestore = useFirestore();
  const [initialData, setInitialData] = useState<any>(globalDataCache);
  const [loading, setLoading] = useState(!globalDataCache);
  const [appType, setAppType] = useState<'customer' | 'admin' | 'biz' | 'tow'>('customer');

  useEffect(() => {
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
      if (!globalDataCache) {
        fetchData();
      }
    }
  }, [router]);

  async function fetchData() {
    if (!firestore) return;
    try {
      // Parallel fetch optimized for crawler speed (Priority 1 content first)
      const [bannersSnap, categoriesSnap, announcementSnap, vendorsSnap, productsSnap] = await Promise.all([
        getDocs(query(collection(firestore, 'banners'), limit(10))).catch(() => ({ docs: [] })),
        getDocs(query(collection(firestore, 'categories'), orderBy('name', 'asc'), limit(25))).catch(() => ({ docs: [] })),
        getDoc(doc(firestore, 'app_settings', 'announcement')).catch(() => null),
        getDocs(query(collection(firestore, 'vendors'), where('isOnline', '==', true), limit(20))).catch(() => ({ docs: [] })),
        getDocs(query(collection(firestore, 'products'), where('isAvailable', '==', true), limit(40))).catch(() => ({ docs: [] }))
      ]);

      const sanitize = (docs: any[]) => (docs || []).map(d => ({ 
        id: d.id, 
        ...d.data()
      }));

      const data = {
        banners: sanitize(bannersSnap.docs),
        categories: sanitize(categoriesSnap.docs),
        announcement: (announcementSnap && announcementSnap.exists()) ? { id: announcementSnap.id, ...announcementSnap.data() } : null,
        vendors: sanitize(vendorsSnap.docs),
        products: sanitize(productsSnap.docs)
      };

      globalDataCache = data;
      setInitialData(data);
    } catch (e) {
      setInitialData({ banners: [], categories: [], announcement: null, vendors: [], products: [] });
    } finally {
      setLoading(false);
    }
  }

  // SEO: Structured Data (JSON-LD) for better Google Rich Results
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "DeliveryService",
    "name": "Shopykart",
    "description": "Premium 10-minute veg food delivery service in Mauranipur and Ranipur.",
    "url": "https://shopykart.co.in",
    "logo": "https://shopykart.co.in/logo.png",
    "areaServed": [
      { "@type": "City", "name": "Mauranipur" },
      { "@type": "City", "name": "Ranipur" }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Shopykart Menu",
      "itemListElement": initialData?.categories?.map((c: any, i: number) => ({
        "@type": "Offer",
        "itemOffered": { "@type": "Service", "name": c.name },
        "position": i + 1
      })) || []
    }
  };

  if (appType === 'customer' && (loading || !initialData)) {
    return <Loading />;
  }

  if (appType !== 'customer') {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Launching Portal...</p>
      </div>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <HomeClient 
        initialBanners={initialData.banners}
        initialCategories={initialData.categories}
        initialAnnouncement={initialData.announcement}
        initialStores={initialData.vendors}
        initialProducts={initialData.products}
      />
    </>
  );
}

export default function ShopyKartApp() {
  return (
    <Suspense fallback={<Loading />}>
      <ShopyKartAppContent />
    </Suspense>
  );
}
