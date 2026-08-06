"use client"

import React, { useMemo, useState, useEffect, memo, useCallback } from "react"
import { Plus, Minus, Share2, Store, Star } from "lucide-react"
import { useCart } from "@/components/cart/CartProvider"
import { cn, slugify } from "@/lib/utils"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, limit } from "firebase/firestore"
import { ProductQuickView } from "@/components/product/ProductQuickView"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

export function isStoreScheduleOpen(vendor: any, currentMins?: number | null) {
  if (!vendor) return true;
  if (!vendor.openingTime || !vendor.closingTime) return true;
  
  const mins = (currentMins !== undefined && currentMins !== null) 
    ? currentMins 
    : (new Date().getHours() * 60 + new Date().getMinutes());

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

const ProductItem = memo(({ product, quantity, isOffline, onShare, onAdd, onRemove }: any) => {
  return (
    <div className={cn(
      "relative bg-[#0B0B0B] rounded-[2.5rem] p-3 border-2 border-[#C5A021]/30 flex flex-col shadow-2xl transition-all duration-300 transform-gpu",
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
                    Closed
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
          {product.restaurantName || 'ShopyKart'}
        </p>
        <h3 className="font-black text-[13px] text-white leading-[1.2] italic uppercase tracking-tighter line-clamp-2 mb-1 min-h-[2.2rem]">
          {product.name}
        </h3>
        
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex flex-col">
            <span className="text-lg font-black text-white italic tracking-tighter leading-none">₹{product.price}</span>
          </div>

          {!isOffline ? (
            quantity === 0 ? (
              <ProductQuickView product={product} vendorScheduleOpen={true}>
                <button className="bg-[#D9C4A9] text-[#451A03] h-9 px-6 rounded-full font-black text-[10px] uppercase active:scale-90 transition-all hover:bg-white">
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
            <div className="bg-gray-800 text-gray-500 h-9 px-4 rounded-full font-black text-[8px] uppercase flex items-center">OFFLINE</div>
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
  
  const [activeZone, setActiveZone] = useState<string | null>(null);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(40); 

  useEffect(() => {
    const updateZone = () => setActiveZone(localStorage.getItem('user_city'));
    updateZone();
    window.addEventListener('user-address-updated', updateZone);

    const syncTime = () => setCurrentTimeMinutes(new Date().getHours() * 60 + new Date().getMinutes());
    syncTime();
    const interval = setInterval(syncTime, 60000);

    const handleScroll = () => {
       if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500) setVisibleCount(prev => prev + 40);
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
    return query(collection(firestore, 'products'), limit(300));
  }, [firestore]);
  
  const { data: dbProducts, loading: productsLoading } = useCollection<any>(productsQuery, 'home_products_v8_turbo', initialData);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  
  const { data: vendors } = useCollection<any>(vendorsQuery, 'home_vendors_v8_turbo', initialStores);

  const productsToDisplay = useMemo(() => {
    const list = (dbProducts && dbProducts.length > 0) ? dbProducts : initialData;
    if (!list || list.length === 0) return [];

    const storeList = (vendors && vendors.length > 0) ? vendors : initialStores;
    const vendorMap = new Map(storeList.map(v => [v.id, v]));

    const q = searchQuery.toLowerCase().trim();
    const c = category.toLowerCase();
    const targetZone = (activeZone || '').toLowerCase().trim();

    return list.filter(p => {
      const v = vendorMap.get(p.vendorId);
      if (targetZone && targetZone !== 'local') {
        const vendorZone = (v?.town || p.town || '').toLowerCase().trim();
        if (vendorZone && vendorZone !== 'local' && vendorZone !== targetZone) return false;
      }
      if ((p.serviceMode || 'Food').toLowerCase() !== activeMode.toLowerCase()) return false;
      if (q && !p.name?.toLowerCase().includes(q) && !v?.storeName?.toLowerCase().includes(q)) return false;
      if (c !== 'all' && p.category?.toLowerCase() !== c) return false;
      return !p.isDeleted;
    }).sort((a, b) => {
      const isOpenA = vendorMap.get(a.vendorId)?.isOnline !== false && isStoreScheduleOpen(vendorMap.get(a.vendorId), currentTimeMinutes);
      const isOpenB = vendorMap.get(b.vendorId)?.isOnline !== false && isStoreScheduleOpen(vendorMap.get(b.vendorId), currentTimeMinutes);
      if (isOpenA !== isOpenB) return isOpenA ? -1 : 1;
      return (Number(b.rating) || 0) - (Number(a.rating) || 0);
    });
  }, [dbProducts, initialData, vendors, initialStores, searchQuery, category, activeMode, activeZone, currentTimeMinutes]);

  const handleShare = useCallback((e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/product/${product.slug || slugify(product.name) || product.id}`;
    if (navigator.share) navigator.share({ title: product.name, url: shareUrl }).catch(() => {});
    else { navigator.clipboard.writeText(shareUrl); toast({ title: "Link Copied! 🔗" }); }
  }, [toast]);

  return (
    <div className="px-4 py-6 transform-gpu min-h-[600px] bg-white">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">All <span className="text-primary">Products</span></h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {productsToDisplay.slice(0, visibleCount).map((product) => (
          <ProductItem 
            key={product.id} 
            product={product} 
            quantity={cart.find(c => c.id === product.id && !c.selectedOption)?.quantity || 0} 
            isOffline={vendors?.find(v => v.id === product.vendorId)?.isOnline === false || !isStoreScheduleOpen(vendors?.find(v => v.id === product.vendorId), currentTimeMinutes)} 
            onShare={handleShare}
            onAdd={addToCart}
            onRemove={removeFromCart}
          />
        ))}
      </div>
    </div>
  );
}
