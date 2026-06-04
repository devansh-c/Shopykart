
"use client"

import { useState } from 'react';
import { LocationHeader } from '@/components/home/LocationHeader';
import { OfferSlider } from '@/components/home/OfferSlider';
import { CategoryList } from '@/components/home/CategoryList';
import { StoreSection } from '@/components/home/StoreSection';
import { PopularProducts } from '@/components/home/PopularProducts';
import { OffersSection } from '@/components/home/OffersSection';
import { TopTenProducts } from '@/components/home/TopTenProducts';
import { BeautySalonSection } from '@/components/home/BeautySalonSection';
import { MedicalCareSection } from '@/components/home/MedicalCareSection';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { ShoppingBag, Rocket, Timer, HeartPulse, Stethoscope, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ShopyKartApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeMode, setActiveMode] = useState('Food'); // 'Food', 'Grocery', or 'Medical'

  const handleBackToFood = () => {
    setActiveMode('Food');
    setActiveCategory('all');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <LocationHeader 
        searchValue={searchQuery} 
        onSearchChange={setSearchQuery} 
        activeMode={activeMode}
        onModeChange={setActiveMode}
      />

      <main className="mt-2 space-y-2">
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
        ) : activeMode === 'Medical' ? (
          <div className="animate-in fade-in duration-700">
            <div className="px-6 py-4 flex items-center gap-4">
              <Button onClick={handleBackToFood} variant="ghost" size="icon" className="rounded-xl bg-white shadow-sm border">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-800 flex items-center gap-2">
                  <HeartPulse className="h-6 w-6 text-primary" />
                  Medical Hub
                </h2>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Premium Healthcare Marketplace</p>
              </div>
            </div>

            <ScrollReveal delay={100}>
              <CategoryList 
                activeCategory={activeCategory} 
                onCategoryChange={setActiveCategory}
                serviceMode="Medical"
              />
            </ScrollReveal>

            {/* STORES SECTION HIDDEN IN MEDICAL AS REQUESTED */}
            
            <div className="px-1">
              <PopularProducts 
                searchQuery={searchQuery} 
                category={activeCategory} 
                activeMode="Medical"
              />
            </div>
          </div>
        ) : (
          <>
            {!searchQuery && activeCategory === 'all' && (
              <div className="px-4 py-4">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-800">New Services</h2>
                  <span className="text-[9px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full uppercase tracking-widest border border-primary/10 animate-pulse">Launching 5 June</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <ScrollReveal delay={50}>
                    <BeautySalonSection />
                  </ScrollReveal>
                  <ScrollReveal delay={100}>
                    <MedicalCareSection onClick={() => { setActiveMode('Medical'); setActiveCategory('all'); }} />
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
                onCategoryChange={setActiveCategory}
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
