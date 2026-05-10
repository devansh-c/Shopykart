
"use client"

import { useState, useMemo } from 'react';
import { BottomNav } from '@/components/shared/BottomNav';
import { Search, Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCart } from '@/components/cart/CartProvider';
import { cn } from '@/lib/utils';
import { allProducts } from '@/lib/mock-data';
import Link from 'next/link';

const categories = [
  { id: 'all', name: 'All', imageId: 'category-all' },
  { id: 'pizza', name: 'Pizza', imageId: 'category-pizza', badge: '🍕' },
  { id: 'burgers', name: 'Burgers', imageId: 'category-burger', badge: '🍔' },
  { id: 'pasta', name: 'Pasta', imageId: 'category-pasta', badge: '🍝' },
  { id: 'fries', name: 'Fries', imageId: 'category-fries', badge: '🍟' },
  { id: 'drinks', name: 'Drinks', imageId: 'category-drinks', badge: '🥤' },
];

export default function MenuPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { cart, addToCart, removeFromCart } = useCart();

  const filteredProducts = useMemo(() => {
    return allProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-[#F8F8F8] pb-24">
      <div className="px-6 pt-12 pb-4">
        <h1 className="text-4xl font-bold text-foreground">Menu</h1>
      </div>
      
      <div className="px-6 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search menu...' 
            className="pl-12 h-14 bg-[#F0F0F0] border-none rounded-2xl text-lg focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="flex overflow-x-auto space-x-6 px-6 no-scrollbar mb-8">
        {categories.map((cat) => {
          const img = PlaceHolderImages.find(p => p.id === cat.imageId);
          const isActive = activeCategory === cat.id;

          return (
            <button 
              key={cat.id} 
              onClick={() => setActiveCategory(cat.id)}
              className="flex flex-col items-center space-y-2 min-w-[70px] relative"
            >
              <div className={cn(
                "relative h-16 w-16 rounded-full overflow-hidden border-2 transition-all duration-300",
                isActive ? "border-transparent" : "border-transparent bg-white shadow-sm"
              )}>
                <img
                  src={img?.imageUrl || "https://picsum.photos/seed/cat/100/100"}
                  alt={cat.name}
                  className="w-full h-full object-cover"
                />
                {cat.badge && isActive && (
                   <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-sm translate-x-1 translate-y-1">
                    <span className="text-[10px]">{cat.badge}</span>
                  </div>
                )}
              </div>
              <span className={cn(
                "text-sm font-bold transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {cat.name}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 w-6 h-1 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="px-6 space-y-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const img = PlaceHolderImages.find(pi => pi.id === product.imageId);
            const cartItem = cart.find(item => item.id === product.id);
            const quantity = cartItem?.quantity || 0;
            const imageUrl = img?.imageUrl || "https://picsum.photos/400/300";

            return (
              <div 
                key={product.id}
                className="bg-white rounded-[2rem] p-5 flex justify-between items-center shadow-sm border border-black/5 active:bg-muted/10 transition-colors"
              >
                <Link href={`/product/${product.id}`} className="flex-1 pr-4">
                  <div className="mb-2">
                    <div className="h-4 w-4 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5">
                      <div className="h-full w-full bg-green-600 rounded-full" />
                    </div>
                  </div>
                  <h3 className="font-bold text-lg leading-tight mb-2 text-foreground">{product.name}</h3>
                  <div className="text-xl font-bold">₹{product.price.toFixed(2)}</div>
                </Link>
                
                <div className="relative w-32 h-32 flex-shrink-0">
                  <Link href={`/product/${product.id}`} className="block w-full h-full rounded-2xl overflow-hidden bg-muted">
                    <img 
                      src={imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </Link>
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full px-2">
                    {quantity === 0 ? (
                      <button 
                        onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, imageUrl })}
                        className="w-full h-10 bg-white text-primary border border-primary/20 shadow-lg font-bold text-xs rounded-xl active:scale-95 transition-all"
                      >
                        ADD +
                      </button>
                    ) : (
                      <div className="flex items-center justify-between w-full h-10 bg-primary text-primary-foreground rounded-xl shadow-lg overflow-hidden">
                        <button 
                          onClick={() => removeFromCart(product.id)}
                          className="flex-1 flex items-center justify-center hover:bg-white/10 h-full"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs font-bold min-w-[20px] text-center">{quantity}</span>
                        <button 
                          onClick={() => addToCart({ id: product.id, name: product.name, price: product.price, imageUrl })}
                          className="flex-1 flex items-center justify-center hover:bg-white/10 h-full"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No products found.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
