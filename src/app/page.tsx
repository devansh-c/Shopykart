"use client"

import { BottomNav } from '@/components/shared/BottomNav';
import { LocationHeader } from '@/components/home/LocationHeader';
import { SearchBar } from '@/components/home/SearchBar';
import { OfferSlider } from '@/components/home/OfferSlider';
import { CategoryList } from '@/components/home/CategoryList';
import { ProductCard } from '@/components/shared/ProductCard';
import { PersonalizedOffers } from '@/components/home/PersonalizedOffers';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const popularProducts = [
  { id: 'prod-1', name: 'Classic Margherita', price: 12.99, imageId: 'prod-1', isVeg: true, description: 'Thin crust pizza with fresh basil and mozzarella.' },
  { id: 'prod-2', name: 'Double Patty Melt', price: 15.49, imageId: 'prod-2', isVeg: false, description: 'Two juicy beef patties with caramelized onions and cheese.' },
  { id: 'prod-3', name: 'Gourmet Sushi Platter', price: 24.99, imageId: 'prod-3', isVeg: false, description: 'Chef\'s special selection of fresh sashimi and rolls.' },
  { id: 'prod-4', name: 'Power Avocado Toast', price: 9.99, imageId: 'prod-4', isVeg: true, description: 'Sourdough bread topped with avocado, chili flakes and egg.' },
];

const comboDeals = [
  { id: 'c1', name: 'Family Pizza Feast', price: 34.99, imageId: 'pizza-banner', isVeg: true },
  { id: 'c2', name: 'Office Burger Bundle', price: 49.99, imageId: 'burger-banner', isVeg: false },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top Header */}
      <LocationHeader />
      
      {/* Search Bar */}
      <SearchBar />

      {/* Hero Offer Banner */}
      <OfferSlider />

      {/* AI Personalized Offers */}
      <PersonalizedOffers />

      {/* Category Horizontal Scroll */}
      <CategoryList />

      {/* Combo Section */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Combo Deals</h2>
          <span className="text-xs bg-accent/20 text-accent font-bold px-2 py-0.5 rounded-md">HOT</span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {comboDeals.map((combo) => {
            const img = PlaceHolderImages.find(p => p.id === combo.imageId);
            return (
              <div key={combo.id} className="premium-card relative h-32 overflow-hidden flex items-center group cursor-pointer">
                <div className="relative h-full w-40">
                  <img 
                    src={img?.imageUrl} 
                    alt={combo.name} 
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 flex-1">
                  <h3 className="font-bold text-sm">{combo.name}</h3>
                  <p className="text-xs text-muted-foreground">Save up to 25% with this combo</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-primary font-bold text-lg">${combo.price}</span>
                    <button className="text-xs font-bold text-accent">CLAIM DEAL</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popular Products List */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Popular Products</h2>
          <button className="text-primary text-xs font-bold uppercase tracking-wider">View Menu</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {popularProducts.map((product) => {
            const img = PlaceHolderImages.find(p => p.id === product.imageId);
            return (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                isVeg={product.isVeg}
                description={product.description}
                imageUrl={img?.imageUrl || "https://picsum.photos/400/300"}
              />
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}