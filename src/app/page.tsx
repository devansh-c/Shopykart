
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import HomeClient from '@/components/home/HomeClient';
import { Loader2 } from 'lucide-react';
import Loading from './loading';

/**
 * @fileOverview Optimized Home Router.
 * Removed blocking fetchData to allow components to render instantly from localStorage cache.
 */
function ShopyKartAppContent() {
  const router = useRouter();
  const [appType, setAppType] = useState<'customer' | 'admin' | 'biz' | 'tow' | null>(null);

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
    }
  }, [router]);

  // SEO: Structured Data (JSON-LD) for Google Rich Results
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "DeliveryService",
    "name": "Shopykart",
    "description": "Premium 10-minute gourmet delivery service in Mauranipur and Ranipur.",
    "url": "https://shopykart.co.in",
    "logo": "https://shopykart.co.in/logo.png",
    "areaServed": [
      { "@type": "City", "name": "Mauranipur" },
      { "@type": "City", "name": "Ranipur" }
    ]
  };

  if (!appType) return <Loading />;

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
      <HomeClient />
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
