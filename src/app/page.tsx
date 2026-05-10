"use client"

import { useState } from 'react';
import { BottomNav } from '@/components/shared/BottomNav';
import { LocationHeader } from '@/components/home/LocationHeader';
import { OfferSlider } from '@/components/home/OfferSlider';
import { CategoryList } from '@/components/home/CategoryList';
import { ComboSection } from '@/components/home/ComboSection';
import { OffersSection } from '@/components/home/OffersSection';
import { PopularProducts } from '@/components/home/PopularProducts';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32">
      {/* Top Header with Integrated Search */}
      <LocationHeader searchValue={searchQuery} onSearchChange={setSearchQuery} />
      
      {!searchQuery && (
        <div className="mt-6 space-y-6">
          <OfferSlider />
          <ComboSection />
          <OffersSection />
        </div>
      )}

      {/* Category Selection */}
      <div className="bg-white my-8 py-2 rounded-[3rem] mx-4 shadow-sm border border-border/40">
        <CategoryList activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      </div>

      {/* Filtered Trending Products */}
      <PopularProducts searchQuery={searchQuery} category={activeCategory} />

      <BottomNav />
    </div>
  );
}
