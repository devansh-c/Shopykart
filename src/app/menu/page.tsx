"use client"

import { BottomNav } from '@/components/shared/BottomNav';
import { SearchBar } from '@/components/home/SearchBar';
import { CategoryList } from '@/components/home/CategoryList';
import { ProductCard } from '@/components/shared/ProductCard';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function MenuPage() {
  const allProducts = [
    { id: 'm1', name: 'Spicy Ramen', price: 14.99, imageId: 'prod-3', isVeg: false },
    { id: 'm2', name: 'Garden Salad', price: 8.99, imageId: 'prod-4', isVeg: true },
    { id: 'm3', name: 'Truffle Pizza', price: 18.99, imageId: 'prod-1', isVeg: true },
    { id: 'm4', name: 'BBQ Wings', price: 11.49, imageId: 'prod-2', isVeg: false },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-8 pb-4">
        <h1 className="text-3xl font-black text-primary">Full Menu</h1>
        <p className="text-muted-foreground text-sm">Explore our delicious selection</p>
      </div>
      
      <SearchBar />
      <CategoryList />

      <div className="px-4 mt-6">
        <h2 className="text-xl font-bold mb-4">Chef's Specials</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {allProducts.map((p) => {
            const img = PlaceHolderImages.find(pi => pi.id === p.imageId);
            return (
              <ProductCard 
                key={p.id}
                id={p.id}
                name={p.name}
                price={p.price}
                isVeg={p.isVeg}
                imageUrl={img?.imageUrl || "https://picsum.photos/400/300"}
              />
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}