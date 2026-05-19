
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
 * PRODUCTION_BUILD_FINAL_SYNC_V10
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
      {/* Hidden Build Validator */}
      <div className="sr-only">BUILD_ID: FINAL_STABLE_STATIC_EXPORT_SUCCESS</div>
      
      {/* Visual confirmation that the site is live and not the blue page */}
      <div className="bg-primary text-white text-[8px] font-bold text-center py-0.5 uppercase tracking-widest">
        Live Update Success • Ready for Orders
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
      
      <div className="fixed bottom-24 right-4 opacity-10 pointer-events-none">
        <span className="text-[8px] font-black uppercase tracking-widest">V9.0_STABLE_DEPLOY</span>
      </div>
    </div>
  );
}
