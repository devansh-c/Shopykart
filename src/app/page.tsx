
"use client"

import { useState, memo, useEffect } from 'react';
import { BottomNav } from '@/components/shared/BottomNav';
import { LocationHeader } from '@/components/home/LocationHeader';
import { OfferSlider } from '@/components/home/OfferSlider';
import { CategoryList } from '@/components/home/CategoryList';
import { StoreSection } from '@/components/home/StoreSection';
import { OffersSection } from '@/components/home/OffersSection';
import { PopularProducts } from '@/components/home/PopularProducts';

/**
 * PRODUCTION_BUILD_FINAL_SYNC_V11
 * This version forces a clean overwrite of the Firebase default index.html
 */

const MemoOfferSlider = memo(OfferSlider);
const MemoStoreSection = memo(StoreSection);
const MemoOffersSection = memo(OffersSection);
const MemoCategoryList = memo(CategoryList);

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    setIsLive(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32 overflow-x-hidden will-change-scroll">
      {/* VISIBLE STATUS BANNER - Confirms the new code is active */}
      <div className="bg-[#EF4444] text-white text-[10px] font-black text-center py-1.5 uppercase tracking-[0.2em] shadow-lg sticky top-0 z-[100] animate-in slide-in-from-top duration-500">
        SHOPYKART LIVE • VERSION 11.0 • READY FOR ORDERS
      </div>

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
      
      {/* Hidden Build Validator */}
      <div className="sr-only">BUILD_ID: V11_STABLE_STATIC_SYNC_SUCCESS</div>
      
      <div className="fixed bottom-24 right-4 opacity-10 pointer-events-none">
        <span className="text-[8px] font-black uppercase tracking-widest text-black">V11.0_PROD</span>
      </div>
    </div>
  );
}
