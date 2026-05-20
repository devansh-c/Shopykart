
"use client"

import { useState } from 'react';
import { LocationHeader } from '@/components/home/LocationHeader';
import { OfferSlider } from '@/components/home/OfferSlider';
import { CategoryList } from '@/components/home/CategoryList';
import { StoreSection } from '@/components/home/StoreSection';
import { PopularProducts } from '@/components/home/PopularProducts';
import { BottomNav } from '@/components/shared/BottomNav';
import { ScrollReveal } from '@/components/shared/ScrollReveal';

export default function ShopyKartApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeMode, setActiveMode] = useState('Food'); // 'Food' or 'Grocery'

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32">
      <div className="sticky top-0 z-50">
        <LocationHeader 
          searchValue={searchQuery} 
          onSearchChange={setSearchQuery} 
          activeMode={activeMode}
          onModeChange={setActiveMode}
        />
      </div>

      <main className="mt-12 space-y-2">
        {/* Banner Slider */}
        {!searchQuery && activeCategory === 'all' && (
          <ScrollReveal delay={100}>
            <OfferSlider />
          </ScrollReveal>
        )}

        {/* Stores Section - Filtered by Mode */}
        {!searchQuery && activeCategory === 'all' && (
          <ScrollReveal delay={200}>
            <StoreSection activeMode={activeMode} />
          </ScrollReveal>
        )}

        {/* Categories Section - Moved above products */}
        <ScrollReveal delay={300}>
          <CategoryList 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />
        </ScrollReveal>

        {/* All Products Section - Filtered by Mode */}
        <div className="px-1">
          <PopularProducts 
            searchQuery={searchQuery} 
            category={activeCategory} 
            activeMode={activeMode}
          />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
