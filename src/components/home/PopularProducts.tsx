"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { Zap, Plus, Minus, Heart, SlidersHorizontal, Utensils, ShoppingBag, Loader2 } from "lucide-react"
import { useCart } from "@/components/cart/CartProvider"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, limit, orderBy } from "firebase/firestore"
import { ProductQuickView } from "@/components/product/ProductQuickView"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function PopularProducts({ 
  searchQuery = '', 
  category = 'all',
  activeMode = 'Food'
}: { 
  searchQuery?: string, 
  category?: string,
  activeMode?: string
}) {
  const { cart, addToCart, removeFromCart, toggleWishlist, isInWishlist } = useCart();
  const [sortBy, setSortBy] = useState('recommended');
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string | null>(null);
  
  const firestore = useFirestore();

  useEffect(() => {
    const updateZone = () => {
      const zid = localStorage.getItem('active_zone_id');
      const city = localStorage.getItem('user_city');
      setActiveZoneId(zid);
      setActiveCity(city);
    };
    updateZone();
    window.addEventListener('user-address-updated', updateZone);
    return () => window.removeEventListener('user-address-updated', updateZone);
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), orderBy('createdAt', 'desc'), limit(1000));
  }, [firestore]);
  const { data: dbProducts, loading } = useCollection<any>(productsQuery);

  const vendorMap = useMemo(() => {
    const map = new Map();
    if (vendors) {
      vendors.forEach(v => map.set(v.id, v));
    }
    return map;
  }, [vendors]);

  const productsToDisplay = useMemo(() => {
    if (!dbProducts || !vendors) return [];
    
    const searchLower = searchQuery.toLowerCase().trim();
    const categoryLower = category.toLowerCase().trim();
    const modeLower = activeMode.toLowerCase().trim();
    const targetCityNormalized = (activeCity || '').toLowerCase().trim();

    let result = dbProducts.filter(product => {
      const vendor = vendorMap.get(product.vendorId);
      if (!vendor) return false;

      // STRICT ZONE FILTERING
      const productZoneId = product.zoneId || vendor.zoneId;
      const productTown = (product.town || vendor.town || '').toLowerCase().trim();

      if (activeZoneId || targetCityNormalized) {
        const matchesZoneId = activeZoneId && productZoneId === activeZoneId;
        const matchesTown = targetCityNormalized && productTown === targetCityNormalized;
        if (!matchesZoneId && !matchesTown) return false;
      }

      // Mode Filtering
      const vendorCat = (vendor.category || 'Food').toLowerCase().trim();
      if (vendorCat !== modeLower) return false;

      // Search & Category
      const matchesSearch = !searchLower || 
        (product.name || '').toLowerCase().includes(searchLower) || 
        (product.category || '').toLowerCase().includes(searchLower);
      const matchesCategory = category === 'all' || (product.category || '').toLowerCase().trim() === categoryLower;
      const isAvailable = product.isAvailable !== false;
      
      return matchesSearch && matchesCategory && isAvailable;
    });

    result.sort((a, b) => {
      const vA = vendorMap.get(a.vendorId);
      const vB = vendorMap.get(b.vendorId);
      const onlineA = (vA?.isOnline !== false && a.isAvailable !== false) ? 1 : 0;
      const onlineB = (vB?.isOnline !== false && b.isAvailable !== false) ? 1 : 0;
      if (onlineA !== onlineB) return onlineB - onlineA;
      if (sortBy === 'price-low') return (a.price || 0) - (b.price || 0);
      if (sortBy === 'price-high') return (b.price || 0) - (a.price || 0);
      return 0;
    });

    return result;
  }, [searchQuery, category, sortBy, dbProducts, vendorMap, vendors, activeMode, activeZoneId, activeCity]);

  if (loading && !dbProducts) {
    return (
      <div className="px-4 py-8 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-44 w-full bg-white rounded-[2rem] border animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-8 content-visibility-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-1.5">
          {/* Changed header label to include emoji and correct text */}
          <h2 className="text-sm font-black tracking-tight text-[#1C1C1C] uppercase italic">
            {searchQuery ? 'Results' : `⚡ ALL ${activeMode.toUpperCase()} ITEMS`}
          </h2>
        </div>
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[110px] h-8 rounded-xl bg-white border border-border/50 text-[8px] font-black uppercase">
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
        {productsToDisplay.length > 0 ? (
          productsToDisplay.map((product) => {
            const cartItem = cart?.find((item: any) => item.id === product.id);
            const quantity = cartItem?.quantity || 0;
            const vendor = vendorMap.get(product.vendorId);
            const isOffline = (vendor?.isOnline === false) || (product.isAvailable === false);
            const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`;
            const liked = isInWishlist(product.id);

            return (
              <div key={product.id} className={cn(
                "premium-card p-6 flex justify-between items-start bg-white overflow-hidden relative transition-all duration-75",
                isOffline ? "opacity-60 grayscale-[0.5]" : "opacity-100"
              )}>
                <div className="flex-1 pr-4 min-w-0">
                  <div className="h-3.5 w-3.5 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5 mb-2">
                    <div className="h-full w-full bg-green-600 rounded-full" />
                  </div>
                  <ProductQuickView product={product}>
                    <button className={cn("block group text-left w-full", isOffline && "pointer-events-none")}>
                      <h3 className="font-bold text-lg text-[#1C1C1C] mb-1.5 italic tracking-tight line-clamp-2 uppercase">{product.name}</h3>
                      <div className="text-xl font-black text-primary mb-2 italic">₹{(product.price || 0).toFixed(2)}</div>
                      <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60 truncate">from {product.restaurantName || vendor?.storeName}</p>
                    </button>
                  </ProductQuickView>
                </div>
                
                <div className="relative w-28 h-28 shrink-0">
                  <ProductQuickView product={product}>
                    <button className={cn("relative w-full h-full rounded-2xl overflow-hidden bg-muted", isOffline && "pointer-events-none")}>
                      <Image src={imageUrl} alt={product.name} fill className="object-cover" unoptimized />
                      {isOffline && (
                        <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center text-center">
                          <span className="text-white font-black text-[10px] uppercase italic tracking-tighter">Closed</span>
                        </div>
                      )}
                    </button>
                  </ProductQuickView>
                  
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full px-1.5 z-20">
                    {quantity === 0 ? (
                      <ProductQuickView product={product}>
                        <button disabled={isOffline} className={cn("w-full h-9 bg-white text-primary border-2 border-primary shadow-lg font-black text-[9px] uppercase rounded-xl transition-all active:scale-90", isOffline && "opacity-50 border-gray-300 text-gray-400 pointer-events-none")}>
                          {isOffline ? 'OFFLINE' : 'ADD TO BAG'}
                        </button>
                      </ProductQuickView>
                    ) : (
                      <div className="flex items-center justify-between w-full h-9 bg-primary text-white rounded-xl shadow-lg">
                        <button onClick={() => removeFromCart(product.id)} className="flex-1 flex items-center justify-center h-full"><Minus className="h-3 w-3" /></button>
                        <span className="text-xs font-black min-w-[20px] text-center">{quantity}</span>
                        <button onClick={() => addToCart({ ...product, imageUrl })} className="flex-1 flex items-center justify-center h-full"><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>
                  <button onClick={() => toggleWishlist(product.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 shadow-md z-20">
                    <Heart className={cn("h-3.5 w-3.5", liked ? "fill-primary text-primary" : "text-gray-300")} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-24 opacity-30 flex flex-col items-center">
            <Utensils className="h-16 w-16 mb-4" />
            <p className="text-sm font-black uppercase tracking-[0.2em] italic">No Items in {activeCity || 'Area'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
