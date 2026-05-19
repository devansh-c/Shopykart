
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
 * VERSION 12.0 - REFRESHED CONTENT
 * AGAR AAPKO YE BANNER DIKH RAHA HAI, TO SITE UPDATE HO CHUKI HAI.
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

  if (!isLive) return null;

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32 overflow-x-hidden">
      {/* SUCCESS BANNER - This confirms the new code is active */}
      <div className="bg-green-600 text-white text-[11px] font-black text-center py-2 uppercase tracking-widest sticky top-0 z-[100]">
        ✓ SHOPYKART CONNECTED - SYSTEM ONLINE
      </div>

      <LocationHeader searchValue={searchQuery} onSearchChange={setSearchQuery} />
      
      {!searchQuery && (
        <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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

      <div className="animate-in fade-in duration-1000">
        <PopularProducts searchQuery={searchQuery} category={activeCategory} />
      </div>

      <BottomNav />
      
      {/* CACHE BUSTER ID: 123456789 */}
      <div className="fixed bottom-24 right-4 opacity-20 pointer-events-none">
        <span className="text-[8px] font-black uppercase tracking-widest text-black">V12.0_STABLE</span>
      </div>
    </div>
  );
}
