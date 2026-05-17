
"use client"

import { useMemo, useState, useEffect } from 'react';
import { Zap, Plus, Minus, Heart, SlidersHorizontal, Utensils } from 'lucide-react';
import { useCart } from '@/components/cart/CartProvider';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MOCK_PRODUCTS = [
  {
    id: 'prod-1',
    name: 'Supreme Margherita Pizza',
    price: 349,
    restaurantName: 'The Pizza Studio',
    imageUrl: 'https://picsum.photos/seed/pizza1/400/300',
    category: 'pizza',
    isVeg: true,
    vendorId: 'store-2'
  },
  {
    id: 'prod-2',
    name: 'Classic Veggie Crunch',
    price: 149,
    restaurantName: 'Bun Burst Burgers',
    imageUrl: 'https://picsum.photos/seed/burger1/400/300',
    category: 'burgers',
    isVeg: true,
    vendorId: 'store-1'
  },
  {
    id: 'prod-3',
    name: 'Spicy Paneer Tikka',
    price: 259,
    restaurantName: 'Indian Spices',
    imageUrl: 'https://picsum.photos/seed/paneer1/400/300',
    category: 'snacks',
    isVeg: true,
    vendorId: 'store-1'
  }
];

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
      const updateTown = () => {
        const savedTown = localStorage.getItem('user_town');
        setCurrentTown(savedTown);
      };
      updateTown();
      window.addEventListener('user-address-updated', updateTown);
      return () => window.removeEventListener('user-address-updated', updateTown);
    }
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Simplified query for better fallback performance
    return query(collection(firestore, 'products'), limit(50));
  }, [firestore]);
  const { data: dbProducts, loading } = useCollection<any>(productsQuery);

  const filteredAndSortedProducts = useMemo(() => {
    let result = dbProducts || [];
    
    // Fallback to mock products if DB is empty and not loading
    if (!loading && result.length === 0) {
      result = MOCK_PRODUCTS;
    }
    
    result = result.filter(product => {
      const name = (product.name || '').toLowerCase();
      const cat = (product.category || '').toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || cat.includes(searchQuery.toLowerCase());
      const matchesCategory = category === 'all' || product.category === category;
      return matchesSearch && matchesCategory;
    });

    if (currentTown && !searchQuery && category === 'all' && dbProducts?.length) {
      const townMatch = result.filter(p => p.town === currentTown);
      if (townMatch.length > 0) result = townMatch;
    }

    switch (sortBy) {
      case 'price-low': result = [...result].sort((a, b) => (a.price || 0) - (b.price || 0)); break;
      case 'price-high': result = [...result].sort((a, b) => (b.price || 0) - (a.price || 0)); break;
      case 'name': result = [...result].sort((a, b) => (a.name || '').localeCompare(b.name || '')); break;
      default: break;
    }

    return result;
  }, [searchQuery, category, sortBy, dbProducts, currentTown, loading]);

  if (filteredAndSortedProducts.length === 0 && loading) return null;

  return (
    <div className="px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-1.5">
          <Zap className="h-4 w-4 fill-amber-500 text-amber-500" />
          <h2 className="text-sm font-black tracking-tight text-[#1C1C1C] uppercase">
            {currentTown ? `Popular in ${currentTown}` : 'Trending Items'}
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

            return (
              <div key={product.id} className="premium-card p-6 flex justify-between items-start bg-white animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-hidden relative">
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
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
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
                        onClick={() => addToCart({ ...product, imageUrl: product.imageUrl })}
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
                        <button onClick={() => addToCart({ ...product, imageUrl: product.imageUrl })} className="flex-1 flex items-center justify-center hover:bg-black/10 h-full"><Plus className="h-4 w-4" /></button>
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
             <Utensils className="h-12 w-12 mx-auto mb-4" />
             <p className="font-black italic uppercase text-sm">No items found</p>
          </div>
        )}
      </div>
    </div>
  );
}
