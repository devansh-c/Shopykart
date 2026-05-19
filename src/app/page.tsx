
"use client"

import { useState, useMemo, memo } from 'react';
import { BottomNav } from '@/components/shared/BottomNav';
import { LocationHeader } from '@/components/home/LocationHeader';
import { OfferSlider } from '@/components/home/OfferSlider';
import { CategoryList } from '@/components/home/CategoryList';
import { StoreSection } from '@/components/home/StoreSection';
import { OffersSection } from '@/components/home/OffersSection';
import { PopularProducts } from '@/components/home/PopularProducts';

// PRODUCTION_REFRESH_ID: 2024-03-21-V4 (Triggering new build for App Hosting connection)

// Memoized components to prevent re-renders on search input changes
const MemoOfferSlider = memo(OfferSlider);
const MemoStoreSection = memo(StoreSection);
const MemoOffersSection = memo(OffersSection);
const MemoCategoryList = memo(CategoryList);

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32 overflow-x-hidden will-change-scroll">
      {/* Top Header with Integrated Search */}
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
      
      {/* Version Tag to confirm successful deployment */}
      <div className="fixed bottom-24 right-4 opacity-10 pointer-events-none">
        <span className="text-[8px] font-black uppercase tracking-widest">SHK v3.44.0</span>
      </div>
    </div>
  );
}
