"use client"

import React, { useMemo, useState, useEffect, memo, useTransition } from "react"
import { Zap, Plus, Minus, Heart, Star, Clock, ShoppingBag, Loader2 } from "lucide-react"
import { useCart } from "@/components/cart/CartProvider"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase"
import { collection, query, limit, doc, where } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { ProductQuickView } from "@/components/product/ProductQuickView"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Standardized Time Parser v5 - High Performance.
 */
export const parseTimeToMinutes = (t: string) => {
  if (!t) return 0;
  try {
    const clean = t.trim().toUpperCase();
    const match = clean.match(/(\d+)(?:[:.\s](\d+))?\s*(AM|PM)?/);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    let minutes = parseInt(match[2] || '0', 10);
    const mod = match[3];
    if (mod === 'PM' && hours < 12) hours += 12;
    if (mod === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  } catch (e) { return 0; }
};

export const isStoreScheduleOpen = (store: any, currentMinutesOverride?: number | null) => {
  if (!store) return true;
  if (store.isOnline === false) return false;
  if (!store.openingTime || !store.closingTime) return true;
  if (currentMinutesOverride === null || currentMinutesOverride === undefined) return true;
  const currentTime = currentMinutesOverride;
  const start = parseTimeToMinutes(store.openingTime);
  const end = parseTimeToMinutes(store.closingTime);
  return start < end ? (currentTime >= start && currentTime <= end) : (currentTime >= start || currentTime <= end);
};

const ProductItem = memo(({ product, vendor, quantity, onAdd, onRemove, onNavigate, globalOffer, currentMinutes }: any) => {
  const isScheduleOpen = isStoreScheduleOpen(vendor, currentMinutes);
  const isOffline = vendor ? (vendor.isOnline === false || !isScheduleOpen) : false;
  const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`;
  const basePrice = product.price || 0;
  const isSaleActive = globalOffer?.isActive;
  
  const showoffPrice = useMemo(() => {
    if (!isSaleActive) return basePrice;
    const val = Number(globalOffer.value) || 0;
    if (globalOffer.type === 'percentage') return basePrice * (1 - val / 100);
    return Math.max(0, basePrice - val);
  }, [basePrice, isSaleActive, globalOffer]);

  const handleQuickAdd = () => {
    if (isOffline) return;
    const isClosedMode = globalOffer?.isClosedAfterMilestone === true;
    const finalPrice = (isSaleActive && !isClosedMode) ? showoffPrice : basePrice;
    onAdd({ ...product, imageUrl, price: finalPrice, originalPrice: basePrice });
  };

  return (
    <div className={cn(
      "relative bg-white rounded-[2rem] p-5 flex justify-between items-start transition-all duration-300 will-change-transform transform-gpu shadow-[0_4px_20px_-2px_rgba(197,160,33,0.12)] border border-[#C5A021]/20",
      isOffline && "opacity-60 grayscale-[0.5] shadow-none border-gray-100"
    )}>
      <div className="flex-1 pr-4 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-3 w-3 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5"><div className="h-full w-full bg-green-600 rounded-full" /></div>
          {isSaleActive && <Badge className="bg-primary text-white text-[7px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse border-none">SALE LIVE</Badge>}
        </div>
        <div onClick={() => !isOffline && onNavigate(product.id)} className="block text-left w-full cursor-pointer">
          <h3 className="font-bold text-base text-[#1C1C1C] mb-1 italic tracking-tight line-clamp-2 uppercase leading-tight">{product.name}</h3>
          <div className="flex items-baseline gap-2 mb-1.5">
             <div className="text-xl font-black text-primary italic">₹{showoffPrice.toFixed(0)}</div>
             {isSaleActive && <div className="text-xs font-bold text-gray-400 line-through">₹{basePrice}</div>}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-60 truncate">from {product.restaurantName || 'Nearby'}</p>
          </div>
        </div>
      </div>
      <div className="relative w-24 h-24 shrink-0">
        <div onClick={() => !isOffline && onNavigate(product.id)} className="relative w-full h-full rounded-2xl overflow-hidden bg-muted shadow-inner cursor-pointer transform-gpu">
          <Image src={imageUrl} alt={product.name} fill className="object-cover" unoptimized loading="lazy" />
          {isOffline && <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-2 text-center animate-in fade-in duration-300"><span className="text-white font-black text-[9px] uppercase italic tracking-tighter border border-white/30 px-2 py-1 rounded backdrop-blur-sm">CLOSED</span></div>}
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full px-1.5 z-20">
          {quantity === 0 ? (
            <ProductQuickView product={product} globalOffer={globalOffer} vendorScheduleOpen={isScheduleOpen}>
              <button disabled={isOffline} className={cn("w-full h-8 bg-white shadow-md font-black text-[9px] uppercase rounded-xl transition-all active:scale-95", isOffline ? "text-gray-300 border-2 border-gray-100" : "text-primary border-2 border-primary")}>ADD</button>
            </ProductQuickView>
          ) : (
            <div className={cn("flex items-center justify-between w-full h-8 bg-primary text-white rounded-xl shadow-lg", isOffline && "opacity-50")}>
              <button onClick={() => onRemove(product.id)} className="flex-1 flex items-center justify-center h-full"><Minus className="h-3 w-3" /></button>
              <span className="text-[10px] font-black min-w-[15px] text-center">{quantity}</span>
              <button disabled={isOffline} onClick={() => !isOffline && handleQuickAdd()} className="flex-1 flex items-center justify-center h-full"><Plus className="h-3 w-3" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
ProductItem.displayName = "ProductItem";

const SkeletonLoader = () => (
  <div className="px-4 py-8 space-y-6">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="bg-white rounded-[2rem] p-5 flex justify-between items-start border border-zinc-50 shadow-sm animate-pulse">
        <div className="flex-1 space-y-3 pr-4">
          <div className="flex gap-2"><div className="h-3 w-3 rounded-sm bg-zinc-100" /><div className="h-3 w-20 rounded-full bg-zinc-50" /></div>
          <div className="h-6 w-full rounded-lg bg-zinc-100" />
          <div className="h-4 w-1/2 rounded-lg bg-zinc-50" />
        </div>
        <div className="h-24 w-24 rounded-2xl bg-zinc-100" />
      </div>
    ))}
  </div>
);

export function PopularProducts({ searchQuery = '', category = 'all', activeMode = 'Food' }: { searchQuery?: string, category?: string, activeMode?: string }) {
  const { cart, addToCart, removeFromCart } = useCart();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null); 
  const firestore = useFirestore();

  useEffect(() => {
    setActiveCity(localStorage.getItem('user_city'));
    const syncTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };
    syncTime();
    const interval = setInterval(syncTime, 60000); 
    return () => clearInterval(interval);
  }, []);

  // Performance Query: Limit products to 40 for initial scroll efficiency
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), limit(60));
  }, [firestore]);
  const { data: dbProducts, loading: productsLoading } = useCollection<any>(productsQuery);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  const offerRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'global_offer');
  }, [firestore]);
  const { data: globalOffer } = useDoc<any>(offerRef);

  const vendorMap = useMemo(() => {
    const map = new Map();
    if (vendors) vendors.forEach(v => map.set(v.id, v));
    return map;
  }, [vendors]);

  const cartMap = useMemo(() => {
    const map = new Map();
    if (cart) cart.forEach(item => map.set(item.id, item.quantity));
    return map;
  }, [cart]);

  const productsToDisplay = useMemo(() => {
    if (!dbProducts) return null;
    const searchLower = searchQuery.toLowerCase().trim();
    const categoryLower = category.toLowerCase().trim();
    const targetCityNormalized = (activeCity || '').toLowerCase().trim();
    const currentModeLower = activeMode.toLowerCase();

    return dbProducts.filter(product => {
      const vendor = vendorMap.get(product.vendorId);
      const rawMode = (product.serviceMode || vendor?.category || 'Food').toLowerCase();
      const productMode = (rawMode === 'restaurant' || rawMode === 'food') ? 'food' : rawMode;
      if (productMode !== currentModeLower) return false;

      const productTown = (product.town || vendor?.town || '').toLowerCase().trim();
      if (targetCityNormalized && productTown) {
        if (targetCityNormalized === 'ranipur' && productTown === 'mauranipur') return false;
        if (targetCityNormalized === 'mauranipur' && productTown === 'ranipur') return false;
      }

      return (!searchLower || product.name?.toLowerCase().includes(searchLower)) && (categoryLower === 'all' || product.category?.toLowerCase().trim() === categoryLower);
    }).sort((a, b) => {
      const vA = vendorMap.get(a.vendorId);
      const vB = vendorMap.get(b.vendorId);
      const onlineA = vA ? (vA.isOnline !== false && isStoreScheduleOpen(vA, currentMinutes) ? 1 : 0) : 1;
      const onlineB = vB ? (vB.isOnline !== false && isStoreScheduleOpen(vB, currentMinutes) ? 1 : 0) : 1;
      if (onlineA !== onlineB) return onlineB - onlineA;
      return (vB?.rating || 0) - (vA?.rating || 0);
    });
  }, [searchQuery, category, dbProducts, vendorMap, activeCity, activeMode, currentMinutes]);

  const navigateToProduct = (id: string) => {
    startTransition(() => {
      router.push(`/product/view?id=${id}`);
    });
  };

  if (productsToDisplay === null || (productsLoading && !dbProducts)) return <SkeletonLoader />;

  return (
    <div className="px-4 py-8 content-visibility-auto transform-gpu">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-sm font-black tracking-tight text-[#1C1C1C] uppercase italic">{searchQuery ? 'Results' : `⚡ ${activeMode.toUpperCase()} HUB`}</h2>
        <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">{productsToDisplay.length} ITEMS</span>
      </div>
      <div className={cn("grid grid-cols-1 gap-6 transition-opacity duration-300", isPending && "opacity-50")}>
        {productsToDisplay.map((product) => (
          <ProductItem key={product.id} product={product} vendor={vendorMap.get(product.vendorId)} quantity={cartMap.get(product.id) || 0} onAdd={addToCart} onRemove={removeFromCart} onNavigate={navigateToProduct} globalOffer={globalOffer} currentMinutes={currentMinutes} />
        ))}
        {productsToDisplay.length === 0 && (
          <div className="text-center py-20 opacity-30 animate-in fade-in duration-700">
            <ShoppingBag className="h-16 w-16 mx-auto mb-4" />
            <p className="font-black italic uppercase tracking-widest text-sm">No Items Found</p>
          </div>
        )}
      </div>
    </div>
  );
}
