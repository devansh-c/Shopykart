"use client"

import React, { useMemo, useState, useEffect, memo, useCallback } from "react"
import { Plus, Minus, Share2, Loader2, Store, Star, AlertCircle } from "lucide-react"
import { useCart } from "@/components/cart/CartProvider"
import { cn, slugify } from "@/lib/utils"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase, useUser } from "@/firebase"
import { collection, query, limit } from "firebase/firestore"
import { ProductQuickView } from "@/components/product/ProductQuickView"
import { useToast } from "@/hooks/use-toast"

export function isStoreScheduleOpen(vendor: any, currentMins?: number | null) {
  if (!vendor) return true;
  if (!vendor.openingTime || !vendor.closingTime) return true;
  const mins = (currentMins !== undefined && currentMins !== null) ? currentMins : (new Date().getHours() * 60 + new Date().getMinutes());
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
  return start < end ? (mins >= start && mins <= end) : (mins >= start || mins <= end);
}

const ProductItem = memo(({ product, quantity, isOffline, onShare, onAdd, onRemove, isGuest }: any) => {
  // MARKETING GUEST PRICING: If not logged in, price is ₹10 lower
  const basePrice = Number(product.price) || 0;
  const displayPrice = isGuest ? Math.max(0, basePrice - 10) : basePrice;

  return (
    <div className={cn("relative bg-[#0B0B0B] rounded-[2.5rem] p-3 border-2 border-[#C5A021]/30 flex flex-col shadow-2xl transition-all transform-gpu", isOffline && "opacity-75 grayscale-[0.5]")}>
      <div className="relative aspect-square w-full mb-3">
        <ProductQuickView product={{...product, price: displayPrice}} vendorScheduleOpen={!isOffline}>
           <div className="relative w-full h-full cursor-pointer overflow-hidden rounded-[1.5rem] border-2 border-white/5">
              <Image src={product.imageUrl} alt={product.name} fill className="object-cover" unoptimized />
              {isOffline && <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-2 text-center z-10"><Store className="h-6 w-6 text-white/80 mb-1" /><span className="text-white font-black text-[9px] uppercase italic border-2 border-white/30 px-3 py-1 rounded-xl shadow-2xl">Closed</span></div>}
              {isGuest && !isOffline && (
                <div className="absolute top-2 left-2 bg-primary text-white text-[8px] font-black px-2 py-0.5 rounded-full animate-pulse shadow-lg border border-white/20">
                  ₹10 OFF
                </div>
              )}
           </div>
        </ProductQuickView>
        <button onClick={(e) => onShare(e, product)} className="absolute top-2.5 right-2.5 h-8 w-8 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-[#C5A021]/40 shadow-lg active:scale-75 z-30"><Share2 className="h-4 w-4 text-[#C5A021]" /></button>
      </div>
      <div className="flex-1 flex flex-col px-1">
        <p className="text-[9px] font-black text-[#C5A021] uppercase tracking-[0.1em] italic truncate mb-1 opacity-90">{product.restaurantName || 'ShopyKart Select'}</p>
        <h3 className="font-black text-[13px] text-white leading-[1.2] italic uppercase tracking-tighter line-clamp-2 mb-1 min-h-[2.2rem]">{product.name}</h3>
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-lg font-black text-white italic tracking-tighter leading-none">₹{displayPrice}</span>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <span className="text-[8px] font-bold text-gray-400">{(Number(product.rating) || 4.5).toFixed(1)}</span>
            </div>
          </div>
          {!isOffline ? (
            quantity === 0 ? (
              <ProductQuickView product={{...product, price: displayPrice}} vendorScheduleOpen={true}>
                <button className="bg-[#D9C4A9] text-[#451A03] h-9 px-6 rounded-full font-black text-[10px] uppercase shadow-lg active:scale-90">ADD</button>
              </ProductQuickView>
            ) : (
              <div className="flex items-center bg-[#C5A021] text-[#451A03] rounded-full h-9 px-1.5 shadow-xl border border-white/20">
                <button onClick={() => onRemove(product.id)} className="w-7 h-full flex items-center justify-center"><Minus className="h-4 w-4 stroke-[3]" /></button>
                <span className="text-[11px] font-black w-5 text-center">{quantity}</span>
                <button onClick={() => onAdd({...product, price: displayPrice, quantity: 1})} className="w-7 h-full flex items-center justify-center"><Plus className="h-4 w-4 stroke-[3]" /></button>
              </div>
            )
          ) : (
            <div className="bg-gray-800 text-gray-500 h-9 px-4 rounded-full font-black text-[8px] uppercase flex items-center border border-white/5">OFFLINE</div>
          )}
        </div>
      </div>
    </div>
  );
});
ProductItem.displayName = "ProductItem";

export function PopularProducts({ searchQuery = '', category = 'all', activeMode = 'Food', initialData = [], initialStores = [] }: { searchQuery?: string, category?: string, activeMode?: string, initialData?: any[], initialStores?: any[] }) {
  const { cart, addToCart, removeFromCart } = useCart();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(60); 

  useEffect(() => {
    const updateZone = () => setActiveZoneId(localStorage.getItem('active_zone_id'));
    updateZone(); window.addEventListener('user-address-updated', updateZone);
    const syncTime = () => { const d = new Date(); setCurrentTimeMinutes(d.getHours() * 60 + d.getMinutes()); };
    syncTime(); const interval = setInterval(syncTime, 60000);
    const handleScroll = () => { if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 1200) setVisibleCount(p => p + 60); };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => { window.removeEventListener('user-address-updated', updateZone); window.removeEventListener('scroll', handleScroll); clearInterval(interval); };
  }, []);

  // CACHE KEY v12: ENHANCED VISIBILITY FOR RANIPUR (LIMIT 2000)
  const productsQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'products'), limit(2000)) : null, [firestore]);
  const { data: dbProducts } = useCollection<any>(productsQuery, 'home_products_v2000_v12', initialData);
  const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery, 'home_vendors_v2000_v12', initialStores);

  const productsToDisplay = useMemo(() => {
    const list = (dbProducts && dbProducts.length > 0) ? dbProducts : initialData;
    if (!list) return [];
    const storeList = (vendors && vendors.length > 0) ? vendors : initialStores;
    const vendorMap = new Map(storeList.map(v => [v.id, v]));
    const q = searchQuery.toLowerCase().trim();
    const c = category.toLowerCase();
    
    return list.filter(p => {
      const v = vendorMap.get(p.vendorId);
      
      // RELAXED FILTERING: If zone is Ranipur, show Global and Ranipur items
      if (activeZoneId && v?.zoneId && v.zoneId !== activeZoneId) {
        const isGlobal = !v.zoneId || v.zoneId === 'global';
        const isTargetZone = activeZoneId.toLowerCase().includes('ranipur') && (v.zoneId?.toLowerCase().includes('ranipur') || v.town?.toLowerCase().includes('ranipur'));
        if (!isGlobal && !isTargetZone) return false;
      }

      if ((p.serviceMode || 'Food').toLowerCase() !== activeMode.toLowerCase()) return false;
      if (q && !p.name?.toLowerCase().includes(q) && !v?.storeName?.toLowerCase().includes(q)) return false;
      if (c !== 'all' && p.category?.toLowerCase() !== c) return false;
      return !p.isDeleted;
    }).sort((a, b) => {
      const vA = vendorMap.get(a.vendorId); 
      const vB = vendorMap.get(b.vendorId);
      const openA = vA ? (vA.isOnline !== false && isStoreScheduleOpen(vA, currentTimeMinutes)) : true;
      const openB = vB ? (vB.isOnline !== false && isStoreScheduleOpen(vB, currentTimeMinutes)) : true;
      if (openA !== openB) return openA ? -1 : 1;
      return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    });
  }, [dbProducts, initialData, vendors, initialStores, searchQuery, category, activeMode, activeZoneId, currentTimeMinutes]);

  const handleShare = useCallback((e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.slug || slugify(product.name)}`;
    if (navigator.share) navigator.share({ title: product.name, url }).catch(() => {});
    else { navigator.clipboard.writeText(url); toast({ title: "Link Copied! 🔗" }); }
  }, [toast]);

  return (
    <div className="px-4 py-6 bg-white min-h-[800px]">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">Premium <span className="text-primary">Selection</span></h2>
        <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase text-[10px]">
          {productsToDisplay.length} ITEMS
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {productsToDisplay.slice(0, visibleCount).map((product) => {
          const quantity = cart.find(c => c.id === product.id && !c.selectedOption)?.quantity || 0;
          const v = (vendors && vendors.length > 0 ? vendors : initialStores)?.find(s => s.id === product.vendorId);
          const isOffline = v ? (v.isOnline === false || !isStoreScheduleOpen(v, currentTimeMinutes)) : false;
          return <ProductItem key={product.id} product={{...product, restaurantName: v?.storeName}} quantity={quantity} isOffline={isOffline} onShare={handleShare} onAdd={addToCart} onRemove={removeFromCart} isGuest={!user} />;
        })}
      </div>
      {productsToDisplay.length === 0 && (
        <div className="text-center py-20 opacity-30">
          <Store className="h-16 w-16 mx-auto mb-4" />
          <p className="font-black uppercase text-xs italic">No items found in this area</p>
        </div>
      )}
    </div>
  );
}
