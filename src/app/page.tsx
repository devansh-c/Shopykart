"use client"

import { useState } from 'react';
import { LocationHeader } from '@/components/home/LocationHeader';
import { OfferSlider } from '@/components/home/OfferSlider';
import { CategoryList } from '@/components/home/CategoryList';
import { StoreSection } from '@/components/home/StoreSection';
import { PopularProducts } from '@/components/home/PopularProducts';
import { PersonalizedOffers } from '@/components/home/PersonalizedOffers';
import { BottomNav } from '@/components/shared/BottomNav';
import { ScrollReveal } from '@/components/shared/ScrollReveal';

/**
 * VERSION 2000.0 - FINAL PRODUCTION SYNC
 * This file handles the main homepage of ShopyKart with Premium Mobile UI.
 */
export default function ShopyKartApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32">
      {/* Emergency Cache Flush Banner */}
      <div className="bg-primary text-white text-[8px] font-black uppercase tracking-[0.3em] py-1 text-center italic">
        Syncing Final Release V2000.0 • Verified Live
      </div>

      <div className="sticky top-0 z-50">
        <LocationHeader 
          searchValue={searchQuery} 
          onSearchChange={setSearchQuery} 
        />
      </div>

      <main className="mt-8 space-y-2">
        {!searchQuery && activeCategory === 'all' && (
          <ScrollReveal>
            <PersonalizedOffers />
          </ScrollReveal>
        )}

        {!searchQuery && activeCategory === 'all' && (
          <ScrollReveal delay={100}>
            <OfferSlider />
          </ScrollReveal>
        )}

        <ScrollReveal delay={200}>
          <CategoryList 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />
        </ScrollReveal>

        {!searchQuery && activeCategory === 'all' && (
          <ScrollReveal delay={300}>
            <StoreSection />
          </ScrollReveal>
        )}

        <div className="px-1">
          <PopularProducts 
            searchQuery={searchQuery} 
            category={activeCategory} 
          />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
