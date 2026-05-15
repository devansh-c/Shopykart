
"use client"

import { useState } from 'react';
import { BottomNav } from '@/components/shared/BottomNav';
import { LocationHeader } from '@/components/home/LocationHeader';
import { OfferSlider } from '@/components/home/OfferSlider';
import { CategoryList } from '@/components/home/CategoryList';
import { StoreSection } from '@/components/home/StoreSection';
import { OffersSection } from '@/components/home/OffersSection';
import { PopularProducts } from '@/components/home/PopularProducts';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32 overflow-x-hidden">
      {/* Top Header with Integrated Search */}
      <LocationHeader searchValue={searchQuery} onSearchChange={setSearchQuery} />
      
      {!searchQuery && (
        <div className="mt-6 space-y-6">
          <OfferSlider />
          <StoreSection />
          <OffersSection />
        </div>
      )}

      {!searchQuery && (
        <div className="mx-4 mt-6">
          <div className="bg-white py-2 rounded-[2rem] shadow-sm border border-border/40">
            <CategoryList activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>
        </div>
      )}

      <PopularProducts searchQuery={searchQuery} category={activeCategory} />

      <BottomNav />
    </div>
  );
}
