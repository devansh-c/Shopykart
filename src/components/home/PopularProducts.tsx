"use client"

import React, { useMemo, useState, useEffect, memo, useCallback } from "react"
import { Plus, Share2, Loader2, Store, Star, Clock, Award } from "lucide-react"
import { useCart } from "@/components/cart/CartProvider"
import { cn, slugify } from "@/lib/utils"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, limit, orderBy, where } from "firebase/firestore"
import { ProductQuickView } from "@/components/product/ProductQuickView"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export function isStoreScheduleOpen(vendor: any, currentMins?: number | null) {
  if (!vendor) return true;
  if (!vendor.openingTime || !vendor.closingTime) return true;
  if (currentMins === null || currentMins === undefined) return true;

  const parseTimeToMinutes = (t: any) => {
    try {
      if (typeof t !== 'string') return 0;
      const parts = t.trim().split(' ');
      if (parts.length < 2) return 0;
      const [time, modifier] = parts;
      let [hours, minutes] = time.split(':').map(Number);
      if (isNaN(hours)) return 0;
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + (isNaN(minutes) ? 0 : minutes);
    } catch (e) { return 0; }
  };

  const start = parseTimeToMinutes(vendor.openingTime);
  const end = parseTimeToMinutes(vendor.closingTime);
  return start < end ? (currentMins >= start && currentMins <= end) : (currentMins >= start || currentMins <= end);
}

const ProductItem = memo(({ product, quantity, isOffline, onShare }: any) => {
  const displayPrice = Number(product.price) || 0;

  return (
    <div className={cn(
      "relative bg-[#0B0B0B] rounded-[1.5rem] p-3 border border-white/5 flex flex-col shadow-2xl transition-all transform-gpu hover:scale-[1.02] will-change-transform", 
      isOffline && "opacity-75 grayscale-[0.5]"
    )}>
      <ProductQuickView product={product} vendorScheduleOpen={!isOffline}>
        <div className="flex flex-col h-full cursor-pointer">
          <div className="relative aspect-square w-full mb-3">
             <div className="relative w-full h-full overflow-hidden rounded-[1.25rem] border border-white/10 shadow-inner">
                <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized priority={false} />
                {isOffline && (
                  <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-2 text-center z-10">
                    <Store className="h-6 w-6 text-white/80 mb-1" />
                    <span className="text-white font-black text-[9px] uppercase italic border-2 border-white/30 px-3 py-1 rounded-xl shadow-2xl">Closed</span>
                  </div>
                )}
                {!isOffline && (
                  <div className="absolute bottom-2 left-2 flex flex-col gap-1 z-20">
                     <div className="bg-black/60 backdrop-blur-md text-white text-[7px] font-black px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1 shadow-xl">
                        <Clock className="h-2.5 w-2.5 text-primary" />
                        15-20 MIN
                     </div>
                  </div>
                )}
             </div>
             <button onClick={(e) => onShare(e, product)} className="absolute top-2.5 right-2.5 h-8 w-8 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 shadow-lg active:scale-75 z-30 transition-transform">
               <Share2 className="h-4 w-4 text-primary" />
             </button>
          </div>

          <div className="flex-1 flex flex-col px-1">
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.1em] italic truncate mb-1 opacity-90">{product.restaurantName || 'ShopyKart Select'}</p>
            <h3 className="font-black text-[13px] text-white leading-[1.2] italic uppercase tracking-tighter line-clamp-2 mb-1 min-h-[2.2rem]">{product.name}</h3>
            <div className="mt-auto flex items-center justify-between pt-2">
              <span className="text-lg font-black text-white italic tracking-tighter leading-none">₹{displayPrice}</span>
              <div className="flex-1 flex justify-end">
                {!isOffline && (
                  <div className={cn(
                    "flex items-center justify-center rounded-full h-9 transition-all duration-300 font-black text-[10px] uppercase shadow-xl bg-primary text-white",
                    quantity === 0 ? "px-6" : "px-4 border border-white/20"
                  )}>
                    {quantity === 0 ? 'ADD' : `${quantity} IN BAG`}
                  </div>
                )}
                {isOffline && (
                  <div className="bg-white/5 text-gray-500 h-9 px-4 rounded-full font-black text-[8px] uppercase flex items-center border border-white/10">OFFLINE</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </ProductQuickView>
    </div>
  );
});
ProductItem.displayName = "ProductItem";

export function PopularProducts({ searchQuery = '', category = 'all', activeMode = 'Food', initialData = [], initialStores = [] }: { searchQuery?: string, category?: string, activeMode?: string, initialData?: any[], initialStores?: any[] }) {
  const { cart } = useCart();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number | null>(null);
  
  useEffect(() => {
    const updateZone = () => setActiveZoneId(localStorage.getItem('active_zone_id'));
    updateZone(); 
    window.addEventListener('user-address-updated', updateZone);
    const syncTime = () => { const d = new Date(); setCurrentTimeMinutes(d.getHours() * 60 + d.getMinutes()); };
    syncTime(); 
    const interval = setInterval(syncTime, 60000);

    return () => { 
      window.removeEventListener('user-address-updated', updateZone); 
      clearInterval(interval); 
    };
  }, []);

  const productsQuery = useMemoFirebase(() => 
    firestore ? query(collection(firestore, 'products'), limit(1000)) : null, 
    [firestore]
  );
  
  const { data: dbProducts, loading: queryLoading } = useCollection<any>(productsQuery, 'home_products_full_v2');
  const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery, 'home_vendors_v6_stable', initialStores);

  const productsToDisplay = useMemo(() => {
    const list = (dbProducts && dbProducts.length > 0) ? dbProducts : initialData;
    if (!list) return [];
    const storeList = (vendors && vendors.length > 0) ? vendors : initialStores;
    const vendorMap = new Map(storeList.map(v => [String(v.id), v]));
    const q = searchQuery.toLowerCase().trim();
    const c = category.toLowerCase();
    
    return list.filter(p => {
      const v = vendorMap.get(String(p.vendorId));
      if (activeZoneId) {
        const itemZoneId = p.zoneId || v?.zoneId;
        if (itemZoneId && itemZoneId !== activeZoneId && itemZoneId !== 'global') return false;
      }
      if ((p.serviceMode || 'Food').toLowerCase() !== activeMode.toLowerCase()) return false;
      if (q && !p.name?.toLowerCase().includes(q) && !v?.storeName?.toLowerCase().includes(q)) return false;
      if (c !== 'all' && p.category?.toLowerCase() !== c) return false;
      return !p.isDeleted;
    }).sort((a, b) => {
      const vA = vendorMap.get(String(a.vendorId)); 
      const vB = vendorMap.get(String(b.vendorId));
      const openA = vA ? (vA.isOnline !== false && isStoreScheduleOpen(vA, currentTimeMinutes)) : true;
      const openB = vB ? (vB.isOnline !== false && isStoreScheduleOpen(vB, currentTimeMinutes)) : true;
      if (openA !== openB) return openA ? -1 : 1;
      const rankA = (Number(vA?.rating) || 0) + (Number(a.rating) || 0);
      const rankB = (Number(vB?.rating) || 0) + (Number(b.rating) || 0);
      return rankB - rankA;
    });
  }, [dbProducts, initialData, vendors, initialStores, searchQuery, category, activeMode, activeZoneId, currentTimeMinutes]);

  const handleShare = useCallback((e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.slug || slugify(product.name)}`;
    if (navigator.share) { navigator.share({ title: product.name, url }).catch(() => {}); }
    else { try { navigator.clipboard.writeText(url); toast({ title: "Link Copied! 🔗" }); } catch (err) { toast({ title: "Share link: " + url }); } }
  }, [toast]);

  return (
    <div className="px-4 py-6 bg-white min-h-[600px] content-visibility-auto">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">Premium <span className="text-primary">Selection</span></h2>
        <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase text-[10px]">
          {productsToDisplay.length} ITEMS
        </Badge>
      </div>
      
      {queryLoading && !dbProducts ? (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-500">
           {[1, 2, 3, 4].map(i => (
             <div key={i} className="h-48 w-full bg-gray-50 rounded-[1.5rem] border border-gray-100 animate-pulse" />
           ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {productsToDisplay.map((product) => {
            const quantity = cart.find(c => String(c.id) === String(product.id) && !c.selectedOption)?.quantity || 0;
            const v = (vendors && vendors.length > 0 ? vendors : initialStores)?.find(s => String(s.id) === String(product.vendorId));
            const isOffline = v ? (v.isOnline === false || !isStoreScheduleOpen(v, currentTimeMinutes)) : false;
            return <ProductItem key={product.id} product={{...product, restaurantName: v?.storeName}} quantity={quantity} isOffline={isOffline} onShare={handleShare} />;
          })}
        </div>
      )}
      
      {!queryLoading && productsToDisplay.length === 0 && (
        <div className="text-center py-20 opacity-30 flex flex-col items-center">
           <Store className="h-16 w-16 mb-4" />
           <p className="font-black italic uppercase text-xs">No items in this zone</p>
        </div>
      )}
    </div>
  );
}
