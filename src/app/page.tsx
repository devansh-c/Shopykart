
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
    <div className="min-h-screen bg-[#fafafa] pb-24">
      {/* Top Header with Integrated Search */}
      <LocationHeader searchValue={searchQuery} onSearchChange={setSearchQuery} />
      
      {!searchQuery && (
        <div className="mt-4">
          <OfferSlider />
          <ComboSection />
          <OffersSection />
        </div>
      )}

      {/* Category Selection */}
      <CategoryList activeCategory={activeCategory} onCategoryChange={setActiveCategory} />

      {/* Filtered Trending Products */}
      <PopularProducts searchQuery={searchQuery} category={activeCategory} />

      <BottomNav />
    </div>
  );
}
