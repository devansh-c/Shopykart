"use client"

import { useState, useTransition, Suspense, useEffect, memo } from 'react';
import { LocationHeader } from '@/components/home/LocationHeader';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { ShoppingBag, Rocket, Timer, HeartPulse, Sparkles, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

/**
 * @fileOverview ShopyKart Main Entrance.
 * Optimized with Dynamic Imports to handle chunk loading robustly.
 * Removed Smart Basket AI to reduce system load.
 */

const OfferSlider = dynamic(() => import('@/components/home/OfferSlider').then(m => ({ default: m.OfferSlider })), { ssr: false });
const CategoryList = dynamic(() => import('@/components/home/CategoryList').then(m => ({ default: m.CategoryList })), { ssr: false });
const StoreSection = dynamic(() => import('@/components/home/StoreSection').then(m => ({ default: m.StoreSection })), { ssr: false });
const PopularProducts = dynamic(() => import('@/components/home/PopularProducts').then(m => ({ default: m.PopularProducts })), { ssr: false });
const OffersSection = dynamic(() => import('@/components/home/OffersSection'), { 
  ssr: false,
  loading: () => <div className="h-32 w-full bg-muted/20 animate-pulse rounded-2xl mx-4" />
});
const TopTenProducts = dynamic(() => import('@/components/home/TopTenProducts').then(m => ({ default: m.TopTenProducts })), { ssr: false });
const BeautySalonSection = dynamic(() => import('@/components/home/BeautySalonSection').then(m => ({ default: m.BeautySalonSection })), { ssr: false });
const MedicalCareSection = dynamic(() => import('@/components/home/MedicalCareSection').then(m => ({ default: m.MedicalCareSection })), { ssr: false });

export default function ShopyKartApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeMode, setActiveMode] = useState('Food');
  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleBackToFood = () => {
    startTransition(() => {
      setActiveMode('Food');
      setActiveCategory('all');
    });
  };

  const handleModeChange = (mode: string) => {
    startTransition(() => {
      setActiveMode(mode);
      setActiveCategory('all'); // Reset category when mode changes
    });
  };

  const handleCategoryChange = (cat: string) => {
    startTransition(() => {
      setActiveCategory(cat);
    });
  };

  if (!isMounted) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-white transform-gpu">
      {activeMode !== 'Medical' && activeMode !== 'Beauty' && (
        <LocationHeader 
          searchValue={searchQuery} 
          onSearchChange={setSearchQuery} 
          activeMode={activeMode}
          onModeChange={handleModeChange}
        />
      )}

      <main className={cn("space-y-2 transition-opacity duration-200 will-change-transform", isPending ? "opacity-70" : "opacity-100", (activeMode === 'Medical' || activeMode === 'Beauty') ? "mt-0" : "mt-2")}>
        {activeMode === 'Grocery' ? (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in duration-700">
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
          <div className="animate-in fade-in duration-700 content-visibility-auto">
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
            <ScrollReveal delay={100}><CategoryList activeCategory={activeCategory} onCategoryChange={handleCategoryChange} serviceMode={activeMode} /></ScrollReveal>
            <Suspense fallback={<div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>}><PopularProducts searchQuery={searchQuery} category={activeCategory} activeMode={activeMode} /></Suspense>
          </div>
        ) : (
          <div className="content-visibility-auto">
            {!searchQuery && activeCategory === 'all' && (
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-800">New Services</h2>
                  <span className="text-[9px] font-black text-green-600 bg-green-50 px-3 py-1 rounded-full uppercase tracking-widest border border-green-100 animate-pulse">Launched</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ScrollReveal delay={50}><BeautySalonSection onClick={() => handleModeChange('Beauty')} /></ScrollReveal>
                  <ScrollReveal delay={100}><MedicalCareSection onClick={() => handleModeChange('Medical')} /></ScrollReveal>
                </div>
              </div>
            )}
            {!searchQuery && activeCategory === 'all' && (
              <Suspense fallback={<div className="h-[160px] mx-4 bg-muted animate-pulse rounded-2xl" />}><OfferSlider /></Suspense>
            )}
            {!searchQuery && activeCategory === 'all' && (
              <Suspense fallback={<div className="h-[200px] mx-4 bg-muted/10 animate-pulse rounded-2xl" />}><TopTenProducts /></Suspense>
            )}
            {!searchQuery && activeCategory === 'all' && (
              <Suspense fallback={<div className="h-[240px] mx-4 bg-muted/5 animate-pulse rounded-2xl" />}><StoreSection activeMode={activeMode} /></Suspense>
            )}
            {!searchQuery && <Suspense fallback={null}><OffersSection /></Suspense>}
            <ScrollReveal delay={350}><CategoryList activeCategory={activeCategory} onCategoryChange={handleCategoryChange} serviceMode={activeMode} /></ScrollReveal>
            <Suspense fallback={<div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>}><PopularProducts searchQuery={searchQuery} category={activeCategory} activeMode={activeMode} /></Suspense>
          </div>
        )}
      </main>
    </div>
  );
}
