
"use client"

import { useState } from 'react';
import { LocationHeader } from '@/components/home/LocationHeader';
import { OfferSlider } from '@/components/home/OfferSlider';
import { CategoryList } from '@/components/home/CategoryList';
import { StoreSection } from '@/components/home/StoreSection';
import { PopularProducts } from '@/components/home/PopularProducts';
import { PersonalizedOffers } from '@/components/home/PersonalizedOffers';
import { BottomNav } from '@/components/shared/BottomNav';
import { ScrollReveal } from '@/components/shared/ScrollReveal';

export default function ShopyKartApp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32">
      {/* --- TOP FIXED HEADER --- */}
      <div className="sticky top-0 z-50">
        <LocationHeader 
          searchValue={searchQuery} 
          onSearchChange={setSearchQuery} 
        />
      </div>

      <main className="mt-8 space-y-2">
        {/* --- AI DRIVEN PERSONALIZED OFFERS --- */}
        {!searchQuery && activeCategory === 'all' && (
          <ScrollReveal>
            <PersonalizedOffers />
          </ScrollReveal>
        )}

        {/* --- PROMOTIONAL SLIDER --- */}
        {!searchQuery && activeCategory === 'all' && (
          <ScrollReveal delay={100}>
            <OfferSlider />
          </ScrollReveal>
        )}

        {/* --- CATEGORY SELECTOR --- */}
        <ScrollReveal delay={200}>
          <CategoryList 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />
        </ScrollReveal>

        {/* --- FEATURED STORES --- */}
        {!searchQuery && activeCategory === 'all' && (
          <ScrollReveal delay={300}>
            <StoreSection />
          </ScrollReveal>
        )}

        {/* --- DYNAMIC PRODUCT GRID --- */}
        <div className="px-1">
          <PopularProducts 
            searchQuery={searchQuery} 
            category={activeCategory} 
          />
        </div>
      </main>

      {/* --- BOTTOM NAVIGATION --- */}
      <BottomNav />
    </div>
  );
}
