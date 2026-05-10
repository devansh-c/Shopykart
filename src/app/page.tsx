"use client"

import { useState } from 'react';
import { BottomNav } from '@/components/shared/BottomNav';
import { LocationHeader } from '@/components/home/LocationHeader';
import { SearchBar } from '@/components/home/SearchBar';
import { OfferSlider } from '@/components/home/OfferSlider';
import { CategoryList } from '@/components/home/CategoryList';
import { ComboSection } from '@/components/home/ComboSection';
import { OffersSection } from '@/components/home/OffersSection';
import { PopularProducts } from '@/components/home/PopularProducts';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen bg-[#fafafa] pb-24">
      {/* Top Header */}
      <LocationHeader />
      
      {/* Search Bar */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* Only show Hero content if not searching */}
      {!searchQuery ? (
        <>
          {/* Hero Offer Banner */}
          <OfferSlider />

          {/* Combos Section */}
          <ComboSection />

          {/* Offers & Coupons Section */}
          <OffersSection />
        </>
      ) : null}

      {/* Categories Horizontal Scroll */}
      <CategoryList />

      {/* Popular Products Vertical List - Filtered by search */}
      <PopularProducts searchQuery={searchQuery} />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
