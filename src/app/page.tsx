
"use client"

import { useState, useTransition } from 'react';
import { LocationHeader } from '@/components/home/LocationHeader';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { ShoppingBag, Rocket, Timer, HeartPulse, Sparkles, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// LAZY LOAD HOME SECTIONS: Prevents main thread blocking by loading components only when needed
const OfferSlider = dynamic(() => import('@/components/home/OfferSlider').then(m => m.OfferSlider));
const CategoryList = dynamic(() => import('@/components/home/CategoryList').then(m => m.CategoryList));
const StoreSection = dynamic(() => import('@/components/home/StoreSection').then(m => m.StoreSection));
const PopularProducts = dynamic(() => import('@/components/home/PopularProducts').then(m => m.PopularProducts));
const OffersSection = dynamic(() => import('@/components/home/OffersSection').then(m => m.OffersSection));
const TopTenProducts = dynamic(() => import('@/components/home/TopTenProducts').then(m => m.TopTenProducts));
const BeautySalonSection = dynamic(() => import('@/components/home/BeautySalonSection').then(m => m.BeautySalonSection));
const MedicalCareSection = dynamic(() => import('@/components/home/MedicalCareSection').then(m => m.MedicalCareSection));

export default function ShopyKartApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeMode, setActiveMode] = useState('Food'); // 'Food', 'Grocery', 'Medical', or 'Beauty'
  const [isPending, startTransition] = useTransition();

  const handleBackToFood = () => {
    startTransition(() => {
      setActiveMode('Food');
      setActiveCategory('all');
    });
  };

  const handleModeChange = (mode: string) => {
    startTransition(() => {
      setActiveMode(mode);
    });
  };

  const handleCategoryChange = (cat: string) => {
    startTransition(() => {
      setActiveCategory(cat);
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Hide main header in specialized modes for true Blinkit experience */}
      {activeMode !== 'Medical' && activeMode !== 'Beauty' && (
        <LocationHeader 
          searchValue={searchQuery} 
          onSearchChange={setSearchQuery} 
          activeMode={activeMode}
          onModeChange={handleModeChange}
        />
      )}

      <main className={cn("space-y-2 transition-opacity duration-300", isPending ? "opacity-70" : "opacity-100", (activeMode === 'Medical' || activeMode === 'Beauty') ? "mt-0" : "mt-2")}>
        {activeMode === 'Grocery' ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in duration-700">
             <div className="relative mb-8">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20" />
                <div className="relative bg-white h-28 w-28 rounded-[2.5rem] flex items-center justify-center shadow-2xl border-2 border-green-50">
                   <ShoppingBag className="h-12 w-12 text-green-600" />
                </div>
             </div>
             
             <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-800 leading-none">
                GROCERY HUB<br /><span className="text-green-600">LAUNCHING SOON</span>
             </h2>
             
             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-4 mb-10 max-w-[240px] leading-relaxed">
                WE ARE BRINGING FRESH ESSENTIALS TO YOUR DOORSTEP.
             </p>

             <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center gap-2">
                   <Rocket className="h-5 w-5 text-amber-500" />
                   <span className="text-[8px] font-black uppercase text-gray-400">Fast Delivery</span>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center gap-2">
                   <Timer className="h-5 w-5 text-blue-500" />
                   <span className="text-[8px] font-black uppercase text-gray-400">24/7 Access</span>
                </div>
             </div>
          </div>
        ) : (activeMode === 'Medical' || activeMode === 'Beauty') ? (
          <div className="animate-in fade-in duration-700">
            {/* Minimal Sticky Header for Specialized Hubs */}
            <div className="sticky top-0 z-[100] bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <button 
                    onClick={handleBackToFood}
                    className="h-9 w-9 bg-gray-50 rounded-full flex items-center justify-center text-gray-800 active:scale-90 transition-all border border-gray-100"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="flex flex-col">
                    <span className="text-[12px] font-black uppercase italic tracking-tighter text-gray-900 leading-none">
                      {activeMode === 'Medical' ? 'Medical Hub' : 'Beauty & Cosmetics'}
                    </span>
                    <span className="text-[8px] font-bold text-green-600 uppercase tracking-widest mt-0.5">10 Mins Delivery</span>
                  </div>
               </div>
               <div className={cn(
                 "h-9 w-9 rounded-xl flex items-center justify-center border",
                 activeMode === 'Medical' ? "bg-teal-50 text-teal-600 border-teal-100" : "bg-rose-50 text-rose-600 border-rose-100"
               )}>
                  {activeMode === 'Medical' ? <HeartPulse className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
               </div>
            </div>

            <div className="px-0">
              <PopularProducts 
                searchQuery={searchQuery} 
                category={activeCategory} 
                activeMode={activeMode}
              />
            </div>
          </div>
        ) : (
          <>
            {!searchQuery && activeCategory === 'all' && (
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-800">New Services</h2>
                  <span className="text-[9px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest border border-green-100 animate-pulse">Launched Successfully</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ScrollReveal delay={50}>
                    <BeautySalonSection onClick={() => handleModeChange('Beauty')} />
                  </ScrollReveal>
                  <ScrollReveal delay={100}>
                    <MedicalCareSection onClick={() => handleModeChange('Medical')} />
                  </ScrollReveal>
                </div>
              </div>
            )}

            {!searchQuery && activeCategory === 'all' && (
              <ScrollReveal delay={150}>
                <OfferSlider />
              </ScrollReveal>
            )}

            {!searchQuery && activeCategory === 'all' && (
              <ScrollReveal delay={200}>
                <TopTenProducts />
              </ScrollReveal>
            )}

            {!searchQuery && activeCategory === 'all' && (
              <ScrollReveal delay={250}>
                <StoreSection activeMode={activeMode} />
              </ScrollReveal>
            )}

            {!searchQuery && (
              <ScrollReveal delay={300}>
                <OffersSection />
              </ScrollReveal>
            )}

            <ScrollReveal delay={350}>
              <CategoryList 
                activeCategory={activeCategory} 
                onCategoryChange={handleCategoryChange}
                serviceMode="Food"
              />
            </ScrollReveal>

            <div className="px-1">
              <PopularProducts 
                searchQuery={searchQuery} 
                category={activeCategory} 
                activeMode={activeMode}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
