
"use client"

import { useMemo, useState } from 'react';
import { Zap, Plus, Minus, Heart, SlidersHorizontal, Utensils } from 'lucide-react';
import { useCart } from '@/components/cart/CartProvider';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PopularProducts({ searchQuery = '', category = 'all' }: { searchQuery?: string, category?: string }) {
  const { cart, addToCart, removeFromCart, toggleWishlist, isInWishlist } = useCart();
  const [sortBy, setSortBy] = useState('recommended');
  
  const firestore = useFirestore();

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), limit(50));
  }, [firestore]);
  const { data: dbProducts } = useCollection<any>(productsQuery);

  const filteredAndSortedProducts = useMemo(() => {
    if (!dbProducts) return [];
    
    let result = [...dbProducts];
    
    // Filter by Search & Category
    result = result.filter(product => {
      const name = (product.name || '').toLowerCase();
      const cat = (product.category || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || cat.includes(searchQuery.toLowerCase());
      const matchesCategory = category === 'all' || product.category === category;
      return matchesSearch && matchesCategory;
    });

    // Sorting
    switch (sortBy) {
      case 'price-low': result.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price-high': result.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'name': result.sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
      default: break;
    }

    return result;
  }, [searchQuery, category, sortBy, dbProducts]);

  if (!dbProducts) return null;

  return (
    <div className="px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-1.5">
          <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
          <h2 className="text-sm font-black tracking-tight text-[#1C1C1C] uppercase">
            All Products
          </h2>
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[100px] h-8 rounded-xl bg-white border border-border/50 text-[8px] font-black uppercase">
            <SlidersHorizontal className="h-3 w-3 mr-1.5" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-2xl">
            <SelectItem value="recommended" className="text-[10px] font-black uppercase">Recommended</SelectItem>
            <SelectItem value="price-low" className="text-[10px] font-black uppercase">Low-High</SelectItem>
            <SelectItem value="price-high" className="text-[10px] font-black uppercase">High-Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredAndSortedProducts.length > 0 ? (
          filteredAndSortedProducts.map((product) => {
            const cartItem = cart.find(item => item.id === product.id);
            const quantity = cartItem?.quantity || 0;
            const liked = isInWishlist(product.id);
            const vendor = vendors?.find(v => v.id === product.vendorId);
            const isOffline = vendor?.isOnline === false;
            const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`;

            return (
              <div key={product.id} className="premium-card p-6 flex justify-between items-start bg-white overflow-hidden relative">
                <div className="flex-1 pr-4">
                  <div className="h-4 w-4 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5 mb-2">
                    <div className="h-full w-full bg-green-600 rounded-full" />
                  </div>
                  <Link href={`/product/${product.id}`} className={cn(isOffline && "pointer-events-none")}>
                    <h3 className="font-bold text-xl text-[#1C1C1C] mb-2 italic tracking-tight">{product.name}</h3>
                    <div className="text-xl font-black text-primary mb-2 italic">₹{product.price?.toFixed(2)}</div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">from {product.restaurantName}</p>
                  </Link>
                </div>
                
                <div className="relative w-32 h-32 shrink-0">
                  <div className="relative w-full h-full rounded-2xl overflow-hidden bg-muted">
                    <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    {isOffline && (
                      <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center p-2 text-center">
                        <span className="text-white font-black text-[10px] uppercase italic tracking-tighter">Closed Now</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[90%] z-20">
                    {quantity === 0 ? (
                      <button 
                        disabled={isOffline}
                        onClick={() => addToCart({ ...product, imageUrl })}
                        className={cn(
                          "w-full h-10 bg-white text-primary border-2 border-primary shadow-lg font-black text-[10px] uppercase rounded-xl transition-all",
                          isOffline && "opacity-50 border-gray-300 text-gray-400 shadow-none"
                        )}
                      >
                        {isOffline ? 'OFFLINE' : 'ADD TO BAG'}
                      </button>
                    ) : (
                      <div className="flex items-center justify-between w-full h-10 bg-primary text-white rounded-xl shadow-lg overflow-hidden">
                        <button onClick={() => removeFromCart(product.id)} className="flex-1 flex items-center justify-center hover:bg-black/10 h-full"><Minus className="h-3 w-3" /></button>
                        <span className="text-xs font-black min-w-[24px] text-center">{quantity}</span>
                        <button onClick={() => addToCart({ ...product, imageUrl })} className="flex-1 flex items-center justify-center hover:bg-black/10 h-full"><Plus className="h-4 w-4" /></button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => toggleWishlist(product.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-md z-20">
                    <Heart className={cn("h-4 w-4", liked ? "fill-primary text-primary" : "text-gray-300")} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed opacity-40">
             <Utensils className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
             <p className="font-black italic uppercase text-sm">No live items in database</p>
          </div>
        )}
      </div>
    </div>
  );
}
