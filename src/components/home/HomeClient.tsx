
"use client"

import { useState, useCallback, Suspense } from 'react';
import { LocationHeader } from '@/components/home/LocationHeader';
import { ShoppingBag, HeartPulse, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

import { OfferSlider } from '@/components/home/OfferSlider';
import { QuickActionGrid } from '@/components/home/QuickActionGrid';
import { CategoryList } from '@/components/home/CategoryList';
import { StoreSection } from '@/components/home/StoreSection';
import { VerticalStoreList } from '@/components/home/VerticalStoreList';
import OffersSection from '@/components/home/OffersSection';
import AnnouncementBanner from '@/components/home/AnnouncementBanner';
import { SmartBasketAI } from '@/components/home/SmartBasketAI';
import { IceCreamBanner } from '@/components/home/IceCreamBanner';

interface HomeClientProps {
  initialBanners?: any[];
  initialCategories?: any[];
  initialAnnouncement?: any;
  initialStores?: any[];
  initialProducts?: any[];
}

/**
 * @fileOverview Multi-App Router overhauled to show Banners, Coupons, and Zomato-style Vertical Stores.
 */
function HomeClientContent({ 
  initialBanners, 
  initialCategories, 
  initialAnnouncement, 
  initialStores, 
}: HomeClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [searchQuery, setSearchQuery] = useState('');

  const activeMode = searchParams.get('mode') || 'Food';
  const activeCategory = searchParams.get('cat') || 'all';

  const updateUrlParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all' || value === 'Food') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    
    if (key === 'mode') {
      params.delete('cat');
    }
    
    const query = params.toString() ? `?${params.toString()}` : '';
    router.push(`${pathname}${query}`);
  }, [router, searchParams, pathname]);

  const handleBackToFood = () => {
    updateUrlParam('mode', 'Food');
  };

  const handleModeChange = (mode: string) => {
    updateUrlParam('mode', mode);
  };

  const handleCategoryChange = (cat: string) => {
    updateUrlParam('cat', cat);
  };

  return (
    <div className="min-h-screen bg-white transform-gpu content-visibility-auto">
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
                  <button onClick={handleBackToFood} className="h-9 w-9 bg-gray-50 rounded-full flex items-center justify-center text-gray-800 border border-gray-100 active:scale-90 transition-transform"><ArrowLeft className="h-4 w-4" /></button>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black uppercase italic tracking-tighter text-gray-900 leading-none">{activeMode === 'Medical' ? 'Medical Hub' : 'Beauty & Cosmetics'}</span>
                  </div>
               </div>
               <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center border", activeMode === 'Medical' ? "bg-teal-50 text-teal-600 border-teal-100" : "bg-rose-50 text-rose-600 border-rose-100")}>{activeMode === 'Medical' ? <HeartPulse className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}</div>
            </div>
            <CategoryList 
              activeCategory={activeCategory} 
              onCategoryChange={handleCategoryChange} 
              serviceMode={activeMode}
              initialData={initialCategories}
            />
            <VerticalStoreList 
              searchQuery={searchQuery}
              initialData={initialStores}
              activeMode={activeMode}
            />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            {!searchQuery && activeCategory === 'all' && (
              <>
                <OfferSlider initialData={initialBanners} />
                <QuickActionGrid />
                
                {activeMode === 'Food' && (
                  <>
                    <AnnouncementBanner initialData={initialAnnouncement} />
                    <SmartBasketAI />
                    <IceCreamBanner />
                  </>
                )}
                
                <OffersSection />
                <StoreSection activeMode={activeMode} initialData={initialStores} />
              </>
            )}
            
            <div className="bg-white">
              {!searchQuery && (
                <CategoryList 
                  activeCategory={activeCategory} 
                  onCategoryChange={handleCategoryChange} 
                  serviceMode={activeMode}
                  initialData={initialCategories}
                />
              )}
              
              <VerticalStoreList 
                searchQuery={searchQuery}
                initialData={initialStores}
                activeMode={activeMode}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function HomeClient(props: HomeClientProps) {
  return (
    <Suspense fallback={
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Initializing Network...</p>
      </div>
    }>
      <HomeClientContent {...props} />
    </Suspense>
  );
}
