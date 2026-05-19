
"use client"

import { useState, useMemo, memo } from 'react';
import { BottomNav } from '@/components/shared/BottomNav';
import { LocationHeader } from '@/components/home/LocationHeader';
import { OfferSlider } from '@/components/home/OfferSlider';
import { CategoryList } from '@/components/home/CategoryList';
import { StoreSection } from '@/components/home/StoreSection';
import { OffersSection } from '@/components/home/OffersSection';
import { PopularProducts } from '@/components/home/PopularProducts';

/**
 * PRODUCTION_BUILD_ID: FINAL_FORCE_STATIC_V900_STRICT
 * This ID ensures the Firebase Studio triggers a clean build for shopykart.co.in
 */

const MemoOfferSlider = memo(OfferSlider);
const MemoStoreSection = memo(StoreSection);
const MemoOffersSection = memo(OffersSection);
const MemoCategoryList = memo(CategoryList);

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32 overflow-x-hidden will-change-scroll">
      <LocationHeader searchValue={searchQuery} onSearchChange={setSearchQuery} />
      
      {!searchQuery && (
        <div className="mt-6 space-y-6 animate-in fade-in duration-500">
          <MemoOfferSlider />
          <MemoStoreSection />
          <MemoOffersSection />
        </div>
      )}

      {!searchQuery && (
        <div className="mt-4">
          <MemoCategoryList activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        </div>
      )}

      <PopularProducts searchQuery={searchQuery} category={activeCategory} />

      <BottomNav />
      
      <div className="fixed bottom-24 right-4 opacity-10 pointer-events-none">
        <span className="text-[8px] font-black uppercase tracking-widest">LIVE_V9.0.0_ULTRA_STATIC_STABLE</span>
      </div>
    </div>
  );
}
