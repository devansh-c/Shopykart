"use client"

import { useMemo, useState, memo } from "react"
import { Zap, Plus, Minus, Heart, SlidersHorizontal, Utensils, Loader2 } from "lucide-react"
import { useCart } from "@/components/cart/CartProvider"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, limit } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ProductItem = memo(({ product, cart, vendors, liked, onAdd, onRemove, onWishlist }: any) => {
  const cartItem = cart.find((item: any) => item.id === product.id);
  const quantity = cartItem?.quantity || 0;
  const vendor = vendors?.find((v: any) => v.id === product.vendorId);
  const isOffline = vendor?.isOnline === false;
  const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`;

  return (
    <div className="premium-card p-6 flex justify-between items-start bg-white overflow-hidden relative will-change-transform">
      <div className="flex-1 pr-4">
        <div className="h-4 w-4 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5 mb-2">
          <div className="h-full w-full bg-green-600 rounded-full" />
        </div>
        <Link href={`/product/${product.id}`} className={cn(isOffline && "pointer-events-none")}>
          <h3 className="font-bold text-xl text-[#1C1C1C] mb-2 italic tracking-tight">{product.name}</h3>
          <div className="text-xl font-black text-primary mb-2 italic">₹{(product.price || 0).toFixed(2)}</div>
          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">from {product.restaurantName || 'Unknown Store'}</p>
        </Link>
      </div>
      
      <div className="relative w-32 h-32 shrink-0">
        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-muted">
          <img 
            src={imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover" 
            loading="lazy"
            onError={(e) => { (e.target as any).src = 'https://placehold.co/400x300?text=No+Photo' }}
          />
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
              onClick={() => onAdd({ ...product, imageUrl })}
              className={cn(
                "w-full h-10 bg-white text-primary border-2 border-primary shadow-lg font-black text-[10px] uppercase rounded-xl transition-all",
                isOffline && "opacity-50 border-gray-300 text-gray-400 shadow-none"
              )}
            >
              {isOffline ? 'OFFLINE' : 'ADD TO BAG'}
            </button>
          ) : (
            <div className="flex items-center justify-between w-full h-10 bg-primary text-white rounded-xl shadow-lg overflow-hidden">
              <button onClick={() => onRemove(product.id)} className="flex-1 flex items-center justify-center hover:bg-black/10 h-full"><Minus className="h-3 w-3" /></button>
              <span className="text-xs font-black min-w-[24px] text-center">{quantity}</span>
              <button onClick={() => onAdd({ ...product, imageUrl })} className="flex-1 flex items-center justify-center hover:bg-black/10 h-full"><Plus className="h-4 w-4" /></button>
            </div>
          )}
        </div>
        <button onClick={() => onWishlist(product.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 backdrop-blur-sm shadow-md z-20">
          <Heart className={cn("h-4 w-4", liked ? "fill-primary text-primary" : "text-gray-300")} />
        </button>
      </div>
    </div>
  );
});

ProductItem.displayName = 'ProductItem';

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
    return query(collection(firestore, 'products'), limit(50)); // Reduced limit for better performance
  }, [firestore]);
  const { data: dbProducts, loading } = useCollection<any>(productsQuery);

  const productsToDisplay = useMemo(() => {
    if (!dbProducts) return [];
    
    let result = [...dbProducts];
    
    // Filter by Search & Category
    result = result.filter(product => {
      const name = (product.name || '').toLowerCase();
      const cat = (product.category || '').toLowerCase();
      const restaurant = (product.restaurantName || '').toLowerCase();
      
      const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || 
                          cat.includes(searchQuery.toLowerCase()) ||
                          restaurant.includes(searchQuery.toLowerCase());
                          
      const matchesCategory = category === 'all' || product.category?.toLowerCase() === category.toLowerCase();
      return matchesSearch && matchesCategory;
    });

    // Sorting
    if (sortBy === 'price-low') result.sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sortBy === 'price-high') result.sort((a, b) => (b.price || 0) - (a.price || 0));

    return result;
  }, [searchQuery, category, sortBy, dbProducts]);

  if (loading) {
    return (
      <div className="px-4 py-8 space-y-6">
        <Skeleton className="h-6 w-40 rounded-full" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 w-full bg-white rounded-3xl shadow-sm border animate-pulse" />
        ))}
      </div>
    );
  }

  if (productsToDisplay.length === 0 && !searchQuery && category === 'all') return null;

  return (
    <div className="px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-1.5">
          <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
          <h2 className="text-sm font-black tracking-tight text-[#1C1C1C] uppercase">
            {searchQuery ? 'Search Results' : 'All Products'}
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
        {productsToDisplay.map((product) => (
          <ProductItem 
            key={product.id}
            product={product}
            cart={cart}
            vendors={vendors}
            liked={isInWishlist(product.id)}
            onAdd={addToCart}
            onRemove={removeFromCart}
            onWishlist={toggleWishlist}
          />
        ))}
      </div>
      {productsToDisplay.length === 0 && searchQuery && (
        <div className="text-center py-20 opacity-30">
          <Utensils className="h-12 w-12 mx-auto mb-2" />
          <p className="text-xs font-black uppercase tracking-widest">No matching dishes found</p>
        </div>
      )}
    </div>
  );
}
