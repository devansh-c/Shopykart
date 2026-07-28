
"use client"

import { useState, useTransition, Suspense, useEffect } from 'react';
import { LocationHeader } from '@/components/home/LocationHeader';
import { ShoppingBag, HeartPulse, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

// IMPORTING DIRECTLY FOR INSTANT RENDERING (NO DYNAMIC DELAY)
import { OfferSlider } from '@/components/home/OfferSlider';
import { CategoryList } from '@/components/home/CategoryList';
import { StoreSection } from '@/components/home/StoreSection';
import { PopularProducts } from '@/components/home/PopularProducts';
import OffersSection from '@/components/home/OffersSection';

/**
 * @fileOverview ShopyKart Main Entrance - Ultra Fast Edition.
 * Optimized for instant visibility of all components on load.
 */
export default function ShopyKartApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeMode, setActiveMode] = useState('Food');
  const [isPending, startTransition] = useTransition();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      setSearchQuery('');
    }
  }, [user]);

  const handleBackToFood = () => {
    startTransition(() => {
      setActiveMode('Food');
      setActiveCategory('all');
    });
  };

  const handleModeChange = (mode: string) => {
    startTransition(() => {
      setActiveMode(mode);
      setActiveCategory('all');
    });
  };

  const handleCategoryChange = (cat: string) => {
    startTransition(() => {
      setActiveCategory(cat);
    });
  };

  // JSON-LD for Google Rich Results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    "name": "Shopykart",
    "image": "https://shopykart.co.in/og-image.jpg",
    "url": "https://shopykart.co.in",
    "telephone": "7992090977",
    "priceRange": "$$",
    "servesCuisine": "Indian, Pizza, Burgers",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Main Road",
      "addressLocality": "Mauranipur",
      "addressRegion": "UP",
      "postalCode": "284204",
      "addressCountry": "IN"
    }
  };

  return (
    <div className="min-h-screen bg-white transform-gpu">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {activeMode !== 'Medical' && activeMode !== 'Beauty' && (
        <LocationHeader 
          searchValue={searchQuery} 
          onSearchChange={onSearchChange => setSearchQuery(onSearchChange)} 
          activeMode={activeMode}
          onModeChange={handleModeChange}
        />
      )}

      <main className={cn("transition-opacity duration-150 will-change-transform", isPending ? "opacity-95" : "opacity-100")}>
        {activeMode === 'Grocery' ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in duration-300">
             <div className="relative mb-8">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20" />
                <div className="relative bg-white h-28 w-28 rounded-[2.5rem] flex items-center justify-center shadow-2xl border-2 border-green-50">
                   <ShoppingBag className="h-12 w-12 text-green-600" />
                </div>
             </div>
             <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-800 leading-none">GROCERY HUB<br /><span className="text-green-600">LAUNCHING SOON</span></h2>
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-4 mb-10 max-w-[240px] leading-relaxed">WE ARE BRINGING FRESH ESSENTIALS TO YOUR DOORSTEP.</p>
          </div>
        ) : (activeMode === 'Medical' || activeMode === 'Beauty') ? (
          <div className="animate-in fade-in duration-200 content-visibility-auto">
            <div className="sticky top-0 z-[100] bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <button onClick={handleBackToFood} className="h-9 w-9 bg-gray-50 rounded-full flex items-center justify-center text-gray-800 active:scale-90 transition-all border border-gray-100"><ArrowLeft className="h-4 w-4" /></button>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black uppercase italic tracking-tighter text-gray-900 leading-none">{activeMode === 'Medical' ? 'Medical Hub' : 'Beauty & Cosmetics'}</span>
                    <span className="text-[8px] font-bold text-green-600 uppercase tracking-widest mt-0.5">10 Mins Delivery</span>
                  </div>
               </div>
               <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center border", activeMode === 'Medical' ? "bg-teal-50 text-teal-600 border-teal-100" : "bg-rose-50 text-rose-600 border-rose-100")}>{activeMode === 'Medical' ? <HeartPulse className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}</div>
            </div>
            <CategoryList activeCategory={activeCategory} onCategoryChange={handleCategoryChange} serviceMode={activeMode} />
            <PopularProducts searchQuery={searchQuery} category={activeCategory} activeMode={activeMode} />
          </div>
        ) : (
          <div className="content-visibility-auto space-y-0">
            {!searchQuery && activeCategory === 'all' && (
              <>
                <OfferSlider />
                <StoreSection activeMode={activeMode} />
                <OffersSection />
              </>
            )}
            
            <div className="bg-white">
              {!searchQuery && <CategoryList activeCategory={activeCategory} onCategoryChange={handleCategoryChange} serviceMode={activeMode} />}
              <PopularProducts searchQuery={searchQuery} category={activeCategory} activeMode={activeMode} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
