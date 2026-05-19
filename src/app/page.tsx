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
 * SYSTEM VERSION 100.0 - MEGA RESET
 * This is a forced deployment to clear all server and browser caches.
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
      {/* EMERGENCY SYSTEM STATUS BANNER - VERSION 100 */}
      <div className="bg-red-700 text-white text-[14px] font-black text-center py-4 uppercase tracking-tighter sticky top-0 z-[100] shadow-2xl border-b-4 border-yellow-400 animate-pulse">
        🚀 CRITICAL UPDATE: SYSTEM VERSION 100.0 IS DEPLOYED 🚀
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
      
      <div className="fixed bottom-24 right-4 z-50">
        <span className="text-[12px] font-black uppercase tracking-widest text-white bg-red-700 px-3 py-1.5 rounded-full border-2 border-white shadow-lg">
          V100.0 ACTIVE
        </span>
      </div>
    </div>
  );
}
