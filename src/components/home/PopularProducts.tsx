
"use client"

import { useMemo, useState } from 'react';
import { Zap, Plus, Minus, Heart, SlidersHorizontal, Loader2 } from 'lucide-react';
import { useCart } from '@/components/cart/CartProvider';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ScrollReveal } from '@/components/shared/ScrollReveal';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { allProducts as fallbackProducts } from '@/lib/mock-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PopularProductsProps = {
  searchQuery?: string;
  category?: string;
};

export function PopularProducts({ searchQuery = '', category = 'all' }: PopularProductsProps) {
  const { cart, addToCart, removeFromCart, toggleWishlist, isInWishlist } = useCart();
  const [sortBy, setSortBy] = useState('recommended');
  
  const firestore = useFirestore();
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  
  const { data: dbProducts, loading } = useCollection<any>(productsQuery);

  const filteredAndSortedProducts = useMemo(() => {
    const baseProducts = (dbProducts && dbProducts.length > 0) ? dbProducts : fallbackProducts;
    
    let result = baseProducts.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (product.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = category === 'all' || product.category === category;
      return matchesSearch && matchesCategory;
    });

    switch (sortBy) {
      case 'price-low':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'name':
        result = [...result].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }

    return result;
  }, [searchQuery, category, sortBy, dbProducts]);

  return (
    <div className="px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-1.5 min-w-0">
          <div className="text-amber-500 shrink-0">
            <Zap className="h-4 w-4 fill-current" />
          </div>
          <h2 className="text-sm font-black tracking-tight text-[#1C1C1C] whitespace-nowrap uppercase">Popular Right Now</h2>
        </div>
        
        <div className="shrink-0 ml-2 flex items-center gap-2">
          {loading && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[100px] h-8 rounded-xl bg-white border border-border/50 shadow-sm font-black text-[8px] uppercase tracking-widest focus:ring-1 focus:ring-primary/20 transition-all active:scale-95">
              <SlidersHorizontal className="h-3 w-3 mr-1.5" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="recommended" className="text-[10px] font-black uppercase">Recommended</SelectItem>
              <SelectItem value="price-low" className="text-[10px] font-black uppercase">Price: Low-High</SelectItem>
              <SelectItem value="price-high" className="text-[10px] font-black uppercase">Price: High-Low</SelectItem>
              <SelectItem value="name" className="text-[10px] font-black uppercase">A-Z Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredAndSortedProducts.length > 0 ? (
          filteredAndSortedProducts.map((product, index) => {
            const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/300/300`;
            const cartItem = cart.find(item => item.id === product.id);
            const quantity = cartItem?.quantity || 0;
            const liked = isInWishlist(product.id);

            return (
              <ScrollReveal key={product.id} delay={index * 100} direction="up">
                <div className="premium-card p-6 flex justify-between items-start bg-white">
                  <div className="flex-1 pr-4">
                    <div className="mb-2">
                      <div className="h-4 w-4 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5">
                        <div className="h-full w-full bg-green-600 rounded-full" />
                      </div>
                    </div>
                    <Link href={`/product/${product.id}`}>
                      <h3 className="font-bold text-xl text-[#1C1C1C] mb-2 leading-tight">{product.name}</h3>
                      <div className="text-xl font-bold text-[#1C1C1C] mb-2">₹{product.price.toFixed(2)}</div>
                      <p className="text-sm text-gray-500 line-clamp-2 font-medium leading-snug">{product.description}</p>
                    </Link>
                  </div>
                  
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <Link href={`/product/${product.id}`} className="block w-full h-full rounded-2xl overflow-hidden bg-muted">
                      <img 
                        src={imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </Link>
                    
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[90%] z-20">
                      {quantity === 0 ? (
                        <button 
                          onClick={() => addToCart({ ...product, imageUrl })}
                          className="w-full h-10 bg-white text-primary border-[1.5px] border-primary shadow-md font-bold text-xs uppercase rounded-xl active:scale-95 hover:bg-red-50 transition-all flex items-center justify-center gap-1"
                        >
                          ADD <span className="text-lg font-light">+</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between w-full h-10 bg-white text-primary border-[1.5px] border-primary rounded-xl shadow-md overflow-hidden">
                          <button 
                            onClick={() => removeFromCart(product.id)}
                            className="flex-1 flex items-center justify-center hover:bg-red-50 h-full transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="text-sm font-bold min-w-[24px] text-center">{quantity}</span>
                          <button 
                            onClick={() => addToCart({ ...product, imageUrl })}
                            className="flex-1 flex items-center justify-center hover:bg-red-50 h-full transition-colors"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => toggleWishlist(product.id)}
                      className="absolute top-1 right-1 p-1.5 rounded-full bg-white/80 backdrop-blur-sm active:scale-75 transition-all z-20"
                    >
                      <Heart className={cn("h-3 w-3", liked ? "fill-primary text-primary" : "text-gray-300")} />
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            );
          })
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed border-muted">
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No culinary matches found</p>
          </div>
        )}
      </div>
    </div>
  );
}
