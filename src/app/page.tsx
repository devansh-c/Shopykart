
"use client"

import { useState } from 'react';
import { BottomNav } from '@/components/shared/BottomNav';
import { LocationHeader } from '@/components/home/LocationHeader';
import { OfferSlider } from '@/components/home/OfferSlider';
import { CategoryList } from '@/components/home/CategoryList';
import { ComboSection } from '@/components/home/ComboSection';
import { OffersSection } from '@/components/home/OffersSection';
import { PopularProducts } from '@/components/home/PopularProducts';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { LocationRequest } from '@/components/shared/LocationRequest';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-32 overflow-x-hidden">
      <LocationRequest />
      
      {/* Top Header with Integrated Search */}
      <LocationHeader searchValue={searchQuery} onSearchChange={setSearchQuery} />
      
      {!searchQuery && (
        <div className="mt-6 space-y-6">
          <ScrollReveal direction="up">
            <OfferSlider />
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={200}>
            <ComboSection />
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={300}>
            <OffersSection />
          </ScrollReveal>
        </div>
      )}

      {/* Categories moved to be right above Trending Now (PopularProducts) */}
      {!searchQuery && (
        <ScrollReveal direction="up" delay={400} className="mx-4 mt-6">
          <div className="bg-white py-2 rounded-[2rem] shadow-sm border border-border/40">
            <CategoryList activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>
        </ScrollReveal>
      )}

      {/* Filtered Trending Products */}
      <ScrollReveal direction="up" delay={500}>
        <PopularProducts searchQuery={searchQuery} category={activeCategory} />
      </ScrollReveal>

      <BottomNav />
    </div>
  );
}
