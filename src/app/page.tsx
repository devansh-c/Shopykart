
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
 * VERSION 14.0 - EMERGENCY RECOVERY
 * This version forces a complete refresh of the hosting edge cache.
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
      {/* EMERGENCY SYSTEM STATUS BANNER */}
      <div className="bg-blue-600 text-white text-[12px] font-black text-center py-3 uppercase tracking-tighter sticky top-0 z-[100] shadow-xl">
        ⚡ SYSTEM REBOOT: SHOPYKART VERSION 14.0 IS LIVE ⚡
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
      
      <div className="fixed bottom-24 right-4 opacity-30 pointer-events-none">
        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-white px-2 py-1 rounded border border-blue-600">VER. 14.0.0</span>
      </div>
    </div>
  );
}
