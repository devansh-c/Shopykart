
"use client"

import { useMemo, useState, useEffect } from 'react';
import { Zap, Plus, Minus, Heart, SlidersHorizontal, Utensils, Info } from 'lucide-react';
import { useCart } from '@/components/cart/CartProvider';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
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
  const [currentTown, setCurrentTown] = useState<string | null>(null);
  
  const firestore = useFirestore();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTown = localStorage.getItem('user_town');
      if (savedTown) setCurrentTown(savedTown);

      const handleUpdate = () => {
        const updatedTown = localStorage.getItem('user_town');
        if (updatedTown) setCurrentTown(updatedTown);
      };

      window.addEventListener('user-address-updated', handleUpdate);
      window.addEventListener('storage', handleUpdate);
      return () => {
        window.removeEventListener('user-address-updated', handleUpdate);
        window.removeEventListener('storage', handleUpdate);
      };
    }
  }, []);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Always fetch everything initially, we will filter locally for speed and persistence
    return collection(firestore, 'products');
  }, [firestore]);
  
  const { data: dbProducts } = useCollection<any>(productsQuery);

  const filteredAndSortedProducts = useMemo(() => {
    if (!dbProducts) return [];
    
    let result = dbProducts.filter(product => {
      const name = product.name || '';
      const cat = product.category || '';
      const prodTown = product.town || '';
      
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          cat.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = category === 'all' || cat === category;
      
      // If a town is selected, prioritize it, but if user hasn't selected a location, show everything
      const matchesTown = !currentTown || prodTown === currentTown;

      return matchesSearch && matchesCategory && matchesTown;
    });

    // Fallback: If no items found in specific town, show global items to avoid "empty" feel
    if (result.length === 0 && currentTown && !searchQuery && category === 'all') {
       result = dbProducts.slice(0, 10);
    }

    switch (sortBy) {
      case 'price-low': result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price-high': result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'name': result = [...result].sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
      default: break;
    }

    return result;
  }, [searchQuery, category, sortBy, dbProducts, currentTown]);

  return (
    <div className="px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-1.5 min-w-0">
          <div className="text-amber-500 shrink-0">
            <Zap className="h-4 w-4 fill-current" />
          </div>
          <h2 className="text-sm font-black tracking-tight text-[#1C1C1C] whitespace-nowrap uppercase">
            {currentTown ? `Popular in ${currentTown}` : 'Trending Items'}
          </h2>
        </div>
        
        <div className="shrink-0 ml-2 flex items-center gap-2">
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
          filteredAndSortedProducts.map((product) => {
            const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/400`;
            const cartItem = cart.find(item => item.id === product.id);
            const quantity = cartItem?.quantity || 0;
            const liked = isInWishlist(product.id);

            return (
              <div key={product.id} className="premium-card p-6 flex justify-between items-start bg-white animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex-1 pr-4">
                  <div className="mb-2">
                    <div className="h-4 w-4 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5">
                      <div className="h-full w-full bg-green-600 rounded-full" />
                    </div>
                  </div>
                  <Link href={`/product/${product.id}`}>
                    <h3 className="font-bold text-xl text-[#1C1C1C] mb-2 leading-tight italic tracking-tight">{product.name}</h3>
                    <div className="text-xl font-black text-primary mb-2 italic">₹{(product.price || 0).toFixed(2)}</div>
                    <p className="text-sm text-gray-500 line-clamp-2 font-medium leading-snug">{product.description || "Freshly prepared signature dish."}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-black mt-2 tracking-widest italic opacity-60">from {product.restaurantName || 'Local Kitchen'}</p>
                  </Link>
                </div>
                
                <div className="relative w-32 h-32 flex-shrink-0">
                  <Link href={`/product/${product.id}`} className="block w-full h-full rounded-2xl overflow-hidden bg-muted shadow-sm">
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
                        className="w-full h-10 bg-white text-primary border-2 border-primary shadow-lg font-black text-[10px] uppercase tracking-widest rounded-xl active:scale-95 hover:bg-red-50 transition-all flex items-center justify-center gap-1"
                      >
                        ADD TO BAG
                      </button>
                    ) : (
                      <div className="flex items-center justify-between w-full h-10 bg-primary text-white border-2 border-primary rounded-xl shadow-lg overflow-hidden">
                        <button onClick={() => removeFromCart(product.id)} className="flex-1 flex items-center justify-center hover:bg-black/10 h-full"><Minus className="h-3 w-3" /></button>
                        <span className="text-xs font-black min-w-[24px] text-center">{quantity}</span>
                        <button onClick={() => addToCart({ ...product, imageUrl })} className="flex-1 flex items-center justify-center hover:bg-black/10 h-full"><Plus className="h-4 w-4" /></button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => toggleWishlist(product.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-md active:scale-75 transition-all z-20">
                    <Heart className={cn("h-4 w-4", liked ? "fill-primary text-primary" : "text-gray-300")} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed opacity-40">
             <Utensils className="h-12 w-12 mx-auto mb-4" />
             <p className="font-black italic uppercase text-sm">No items found</p>
          </div>
        )}
      </div>
      
      {filteredAndSortedProducts.length > 0 && dbProducts && filteredAndSortedProducts.length < dbProducts.length && (
         <div className="mt-8 flex items-center justify-center gap-2 p-4 bg-muted/30 rounded-2xl border border-dashed">
            <Info className="h-3 w-3 text-muted-foreground" />
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Only showing items in {currentTown}</p>
         </div>
      )}
    </div>
  );
}
