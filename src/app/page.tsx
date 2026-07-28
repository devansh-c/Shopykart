"use client"

import { useState, useEffect } from 'react';
import { LocationHeader } from '@/components/home/LocationHeader';
import { ShoppingBag, HeartPulse, Sparkles, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

import { OfferSlider } from '@/components/home/OfferSlider';
import { CategoryList } from '@/components/home/CategoryList';
import { StoreSection } from '@/components/home/StoreSection';
import { PopularProducts } from '@/components/home/PopularProducts';
import OffersSection from '@/components/home/OffersSection';

/**
 * @fileOverview ShopyKart Main Entrance - Zero Latency Atomic Shell.
 * Completely removed transitions and blocking logic for haal-ke-haal visibility.
 */
export default function ShopyKartApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeMode, setActiveMode] = useState('Food');
  const { user } = useUser();

  useEffect(() => {
    if (user) { setSearchQuery(''); }
  }, [user]);

  const handleBackToFood = () => {
    setActiveMode('Food');
    setActiveCategory('all');
  };

  const handleModeChange = (mode: string) => {
    setActiveMode(mode);
    setActiveCategory('all');
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
  };

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

      <main className="transition-none">
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
          <div className="content-visibility-auto">
            <div className="sticky top-0 z-[100] bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <button onClick={handleBackToFood} className="h-9 w-9 bg-gray-50 rounded-full flex items-center justify-center text-gray-800 border border-gray-100"><ArrowLeft className="h-4 w-4" /></button>
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
          <div className="content-visibility-auto">
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
