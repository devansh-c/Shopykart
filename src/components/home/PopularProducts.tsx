
"use client"

import React, { useMemo, useState, useEffect, memo } from "react"
import { Plus, Minus, Share2, Loader2, Store, Star, AlertCircle } from "lucide-react"
import { useCart } from "@/components/cart/CartProvider"
import { cn, slugify } from "@/lib/utils"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, limit } from "firebase/firestore"
import { ProductQuickView } from "@/components/product/ProductQuickView"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

/**
 * Utility to check if a store is currently open based on its schedule.
 */
export function isStoreScheduleOpen(vendor: any, currentMins?: number | null) {
  if (!vendor) return true;
  if (!vendor.openingTime || !vendor.closingTime) return true;
  
  const mins = (currentMins !== undefined && currentMins !== null) 
    ? currentMins 
    : (new Date().getHours() * 60 + new Date().getMinutes());

  const parseTime = (t: string) => {
    try {
      const parts = t.trim().split(' ');
      if (parts.length < 2) return 0;
      const [time, modifier] = parts;
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + (isNaN(minutes) ? 0 : minutes);
    } catch (e) { return 0; }
  };

  const start = parseTime(vendor.openingTime);
  const end = parseTime(vendor.closingTime);

  if (start < end) {
    return mins >= start && mins <= end;
  } else {
    // Handles ranges crossing midnight (e.g., 10 PM to 2 AM)
    return mins >= start || mins <= end;
  }
}

/**
 * Memoized individual product card to prevent heavy re-renders during scroll.
 */
const ProductItem = memo(({ product, quantity, isOffline, onShare, onAdd, onRemove }: any) => {
  return (
    <div className={cn(
      "relative bg-[#0B0B0B] rounded-[2.5rem] p-3 border-2 border-[#C5A021]/30 flex flex-col shadow-2xl transition-all duration-300 transform-gpu content-visibility-auto",
      isOffline && "opacity-75 grayscale-[0.5]"
    )}>
      <div className="relative aspect-square w-full mb-3">
        <ProductQuickView product={product} vendorScheduleOpen={!isOffline}>
           <div className="relative w-full h-full cursor-pointer overflow-hidden rounded-[1.5rem] border-2 border-white/5">
              <Image 
                src={product.imageUrl} 
                alt={product.name} 
                fill 
                className="object-cover transition-transform duration-700 group-hover:scale-110" 
                unoptimized 
              />
              {isOffline && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-2 text-center z-10 backdrop-blur-[1px]">
                  <Store className="h-6 w-6 text-white/80 mb-1" />
                  <span className="text-white font-black text-[9px] uppercase italic border-2 border-white/30 px-3 py-1 rounded-xl shadow-2xl">
                    Closed Now
                  </span>
                </div>
              )}
           </div>
        </ProductQuickView>
        <button 
          onClick={(e) => onShare(e, product)} 
          className="absolute top-2.5 right-2.5 h-8 w-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-[#C5A021]/40 shadow-lg active:scale-75 z-30"
        >
          <Share2 className="h-4 w-4 text-[#C5A021]" />
        </button>
      </div>

      <div className="flex-1 flex flex-col px-1">
        <p className="text-[9px] font-black text-[#C5A021] uppercase tracking-[0.1em] italic truncate mb-1 opacity-90">
          {product.restaurantName || 'ShopyKart Select'}
        </p>
        <h3 className="font-black text-[13px] text-white leading-[1.2] italic uppercase tracking-tighter line-clamp-2 mb-1 min-h-[2.2rem]">
          {product.name}
        </h3>
        
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-lg font-black text-white italic tracking-tighter leading-none">₹{product.price}</span>
            <div className="flex items-center gap-1 mt-1">
               <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
               <span className="text-[8px] font-black text-gray-400">{(Number(product.rating) || 4.5).toFixed(1)}</span>
            </div>
          </div>

          {!isOffline ? (
            quantity === 0 ? (
              <ProductQuickView product={product} vendorScheduleOpen={true}>
                <button className="bg-[#D9C4A9] text-[#451A03] h-9 px-6 rounded-full font-black text-[10px] uppercase shadow-lg border border-white/20 active:scale-90 transition-all hover:bg-white">
                  ADD
                </button>
              </ProductQuickView>
            ) : (
              <div className="flex items-center bg-[#C5A021] text-[#451A03] rounded-full h-9 px-1.5 shadow-xl border border-white/20">
                <button onClick={() => onRemove(product.id)} className="w-7 h-full flex items-center justify-center active:scale-75"><Minus className="h-4 w-4 stroke-[3]" /></button>
                <span className="text-[11px] font-black w-5 text-center">{quantity}</span>
                <button onClick={() => onAdd({...product, quantity: 1})} className="w-7 h-full flex items-center justify-center active:scale-75"><Plus className="h-4 w-4 stroke-[3]" /></button>
              </div>
            )
          ) : (
            <div className="bg-gray-800 text-gray-500 h-9 px-4 rounded-full font-black text-[8px] uppercase flex items-center border border-white/5">
              OFFLINE
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
ProductItem.displayName = "ProductItem";

export function PopularProducts({ 
  searchQuery = '', 
  category = 'all', 
  activeMode = 'Food',
  initialData = [],
  initialStores = []
}: { 
  searchQuery?: string, 
  category?: string, 
  activeMode?: string,
  initialData?: any[],
  initialStores?: any[]
}) {
  const { cart, addToCart, removeFromCart } = useCart();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(40); 

  useEffect(() => {
    setActiveZoneId(localStorage.getItem('active_zone_id'));
    const updateZone = () => setActiveZoneId(localStorage.getItem('active_zone_id'));
    window.addEventListener('user-address-updated', updateZone);

    const now = new Date();
    setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes());
    
    // Sync time every minute for automatic status updates
    const interval = setInterval(() => {
      const d = new Date();
      setCurrentTimeMinutes(d.getHours() * 60 + d.getMinutes());
    }, 60000);

    // Infinite Scroll Logic
    const handleScroll = () => {
       if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 800) {
          setVisibleCount(prev => prev + 40);
       }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('user-address-updated', updateZone);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, []);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), limit(1500));
  }, [firestore]);
  
  const { data: dbProducts, loading: productsLoading } = useCollection<any>(productsQuery, 'home_products_v5_full', initialData);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  
  const { data: vendors } = useCollection<any>(vendorsQuery, 'home_vendors_v5_full', initialStores);

  /**
   * HIGH-PERFORMANCE DATA ENGINE
   * 1. Maps vendors for O(1) lookup.
   * 2. Filters by active mode, search, and zone.
   * 3. Sorts by: Status (Open > Closed) -> Rating (High > Low).
   */
  const productsToDisplay = useMemo(() => {
    const list = dbProducts || [];
    if (list.length === 0) return [];

    const vendorMap = new Map(vendors?.map(v => [v.id, v]) || []);
    const q = searchQuery.toLowerCase().trim();
    const c = category.toLowerCase();

    const filtered = list.filter(p => {
      const v = vendorMap.get(p.vendorId);
      
      // 1. Zone Check
      if (activeZoneId && v?.zoneId && v.zoneId !== activeZoneId) return false;
      
      // 2. Mode Check
      const modeMatch = (p.serviceMode || 'Food').toLowerCase() === activeMode.toLowerCase();
      if (!modeMatch) return false;

      // 3. Search Check
      const searchMatch = !q || p.name?.toLowerCase().includes(q) || v?.storeName?.toLowerCase().includes(q);
      if (!searchMatch) return false;

      // 4. Category Check
      const catMatch = c === 'all' || p.category?.toLowerCase() === c;
      if (!catMatch) return false;

      // 5. Deletion Check
      if (p.isDeleted) return false;
      
      return true;
    });

    return filtered.sort((a, b) => {
      const vA = vendorMap.get(a.vendorId);
      const vB = vendorMap.get(b.vendorId);
      
      const isOpenA = vA ? (vA.isOnline !== false && isStoreScheduleOpen(vA, currentTimeMinutes)) : true;
      const isOpenB = vB ? (vB.isOnline !== false && isStoreScheduleOpen(vB, currentTimeMinutes)) : true;

      // PRIORITY 1: Open stores first
      if (isOpenA !== isOpenB) return isOpenA ? -1 : 1;

      // PRIORITY 2: Rating (5.0 first)
      const rA = Number(a.rating) || Number(vA?.rating) || 0;
      const rB = Number(b.rating) || Number(vB?.rating) || 0;
      return rB - rA;
    });
  }, [dbProducts, vendors, searchQuery, category, activeMode, activeZoneId, currentTimeMinutes]);

  const handleShare = (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    const productSlug = product.slug || slugify(product.name) || product.id;
    const shareUrl = `${window.location.origin}/product/${productSlug}`;
    if (navigator.share) navigator.share({ title: product.name, url: shareUrl }).catch(() => {});
    else { navigator.clipboard.writeText(shareUrl); toast({ title: "Link Copied!" }); }
  };

  if (productsToDisplay.length === 0 && !productsLoading) return null;

  return (
    <div className="px-4 py-6 transform-gpu min-h-[600px]">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
          All <span className="text-primary">Products</span>
        </h2>
        {productsToDisplay.length > 0 && (
          <Badge className="bg-primary text-white border-none font-black text-[10px] px-4 py-1.5 rounded-full shadow-lg">
            {productsToDisplay.length} LIVE ITEMS
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {productsToDisplay.slice(0, visibleCount).map((product) => {
          const quantity = cart.find(c => c.id === product.id && !c.selectedOption)?.quantity || 0;
          const v = vendors?.find(store => store.id === product.vendorId);
          const isOffline = v ? (v.isOnline === false || !isStoreScheduleOpen(v, currentTimeMinutes)) : false;

          return (
            <ProductItem 
              key={product.id} 
              product={product} 
              quantity={quantity} 
              isOffline={isOffline} 
              onShare={handleShare}
              onAdd={addToCart}
              onRemove={removeFromCart}
            />
          );
        })}
      </div>
      
      {productsLoading && productsToDisplay.length === 0 && (
        <div className="grid grid-cols-2 gap-4">
           {[1, 2, 3, 4, 5, 6].map(i => (
             <div key={i} className="bg-gray-100 animate-pulse h-64 rounded-[2.5rem] border-2 border-gray-50" />
           ))}
        </div>
      )}
    </div>
  );
}
