
"use client"

import { useState, useCallback, useEffect, Suspense } from 'react';
import { LocationHeader } from '@/components/home/LocationHeader';
import { ShoppingBag, HeartPulse, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import { OfferSlider } from '@/components/home/OfferSlider';
import { VerticalStoreList } from '@/components/home/VerticalStoreList';
import OffersSection from '@/components/home/OffersSection';
import AnnouncementBanner from '@/components/home/AnnouncementBanner';
import { Under49Products } from '@/components/home/Under49Products';

function HomeContent({ 
  initialBanners = [], 
  initialCategories = [], 
  initialStores = [], 
  initialProducts = [] 
}: { 
  initialBanners?: any[], 
  initialCategories?: any[], 
  initialStores?: any[], 
  initialProducts?: any[] 
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [appTypeResolved, setAppTypeResolved] = useState(false);

  // APP TYPE REDIRECTION (Client-side only)
  useEffect(() => {
    const isAdmin = process.env.NEXT_PUBLIC_ADMIN_APP === 'true';
    const isBiz = process.env.NEXT_PUBLIC_BIZ_APP === 'true';
    const isTow = process.env.NEXT_PUBLIC_TOW_APP === 'true';

    if (isAdmin) router.replace('/admin/dashboard');
    else if (isBiz) router.replace('/vendor/dashboard');
    else if (isTow) router.replace('/delivery/dashboard');
    else setAppTypeResolved(true);
  }, [router]);

  const activeMode = searchParams.get('mode') || 'Food';
  const activeCategory = searchParams.get('cat') || 'all';

  const updateUrlParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all' || value === 'Food') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    if (key === 'mode') params.delete('cat');
    
    const query = params.toString() ? `?${params.toString()}` : '';
    router.push(`${pathname}${query}`);
  }, [router, searchParams, pathname]);

  const handleModeChange = (mode: string) => {
    updateUrlParam('mode', mode);
  };

  if (!appTypeResolved) {
    return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-white transform-gpu">
      {activeMode !== 'Medical' && activeMode !== 'Beauty' && (
        <LocationHeader 
          searchValue={searchQuery} 
          onSearchChange={val => setSearchQuery(val)} 
          activeMode={activeMode}
          onModeChange={handleModeChange}
        />
      )}

      <main className="transition-all duration-300">
        {activeMode === 'Grocery' ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in duration-300">
             <div className="relative mb-8">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20" />
                <div className="relative bg-white h-28 w-28 rounded-[2.5rem] flex items-center justify-center shadow-2xl border-2 border-green-50">
                   <ShoppingBag className="h-12 w-12 text-green-600" />
                </div>
             </div>
             <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-800 leading-none">GROCERY HUB<br /><span className="text-green-600">LAUNCHING SOON</span></h2>
          </div>
        ) : (activeMode === 'Medical' || activeMode === 'Beauty') ? (
          <div className="animate-in slide-in-from-right-4 duration-500">
            <div className="sticky top-0 z-[100] bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <button onClick={() => updateUrlParam('mode', 'Food')} className="h-9 w-9 bg-gray-50 rounded-full flex items-center justify-center text-gray-800 border border-gray-100 active:scale-90 transition-transform"><ArrowLeft className="h-4 w-4" /></button>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black uppercase italic tracking-tighter text-gray-900 leading-none">{activeMode === 'Medical' ? 'Medical Hub' : 'Beauty & Cosmetics'}</span>
                  </div>
               </div>
               <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center border", activeMode === 'Medical' ? "bg-teal-50 text-teal-600 border-teal-100" : "bg-rose-50 text-rose-600 border-rose-100")}>{activeMode === 'Medical' ? <HeartPulse className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}</div>
            </div>
            <VerticalStoreList 
              searchQuery={searchQuery}
              activeMode={activeMode}
              initialData={initialStores}
              initialProducts={initialProducts}
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {!searchQuery && activeCategory === 'all' && (
              <div className="pt-2">
                <OfferSlider initialData={initialBanners} />
                <AnnouncementBanner />
                <Under49Products />
                <OffersSection />
              </div>
            )}
            
            <div className="bg-white">
              <VerticalStoreList 
                searchQuery={searchQuery}
                activeMode={activeMode}
                initialData={initialStores}
                initialProducts={initialProducts}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function HomeClient(props: any) {
  return (
    <Suspense fallback={<div className="h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <HomeContent {...props} />
    </Suspense>
  );
}
