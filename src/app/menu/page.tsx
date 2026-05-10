
"use client"

import { BottomNav } from '@/components/shared/BottomNav';
import { SearchBar } from '@/components/home/SearchBar';
import { CategoryList } from '@/components/home/CategoryList';
import { ProductCard } from '@/components/shared/ProductCard';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function MenuPage() {
  const allProducts = [
    { id: 'p1', name: 'Cheese Loaded Fries', price: 199.00, imageId: 'prod-fries', isVeg: true, category: 'fries' },
    { id: 'p2', name: 'Chilli Attack Pasta', price: 249.00, imageId: 'prod-pasta-red', isVeg: true, category: 'pasta' },
    { id: 'p3', name: 'Penne Arrabiata', price: 219.00, imageId: 'prod-pasta-white', isVeg: true, category: 'pasta' },
    { id: 'p4', name: 'Classic Veggie Burger', price: 149.00, imageId: 'prod-burger-classic', isVeg: true, category: 'burgers' },
    { id: 'p5', name: 'Double Cheese Margherita', price: 399.00, imageId: 'prod-pizza-margherita', isVeg: true, category: 'pizza' },
    { id: 'p6', name: 'Virgin Mojito', price: 129.00, imageId: 'prod-drink-mojito', isVeg: true, category: 'drinks' },
    { id: 'p7', name: 'BBQ Paneer Pizza', price: 449.00, imageId: 'prod-pizza-margherita', isVeg: true, category: 'pizza' },
    { id: 'p8', name: 'Peri Peri Fries', price: 179.00, imageId: 'prod-fries', isVeg: true, category: 'fries' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-4xl font-black text-primary italic leading-none">The Full</h1>
        <h1 className="text-4xl font-black italic leading-none">Collection</h1>
        <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-2">ShopyKart Premium Catalog</p>
      </div>
      
      <SearchBar />
      <CategoryList />

      <div className="px-4 mt-6">
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
