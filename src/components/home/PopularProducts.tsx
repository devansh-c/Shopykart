
"use client"

import React, { useMemo, useState } from "react"
import { Plus, Minus, Share2, Loader2, Store } from "lucide-react"
import { useCart } from "@/components/cart/CartProvider"
import { cn, slugify } from "@/lib/utils"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, limit } from "firebase/firestore"
import { ProductQuickView } from "@/components/product/ProductQuickView"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

export function isStoreScheduleOpen(vendor: any, currentMins?: number | null) {
  if (!vendor) return true;
  if (!vendor.openingTime || !vendor.closingTime) return true;
  
  const now = new Date();
  const mins = currentMins !== undefined && currentMins !== null 
    ? currentMins 
    : now.getHours() * 60 + now.getMinutes();

  const parseTime = (t: string) => {
    try {
      const [time, modifier] = t.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + (minutes || 0);
    } catch (e) { return 0; }
  };
  const start = parseTime(vendor.openingTime);
  const end = parseTime(vendor.closingTime);
  return start < end ? (mins >= start && mins <= end) : (mins >= start || mins <= end);
}

export function PopularProducts({ searchQuery = '', category = 'all', activeMode = 'Food' }: { searchQuery?: string, category?: string, activeMode?: string }) {
  const { cart, addToCart, removeFromCart } = useCart();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const activeZoneId = React.useMemo(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('active_zone_id');
    return null;
  }, []);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), limit(500));
  }, [firestore]);
  
  const { data: dbProducts, loading: productsLoading } = useCollection<any>(productsQuery, 'home_products_v4_instant');

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  
  const { data: vendors } = useCollection<any>(vendorsQuery, 'home_vendors_v4_instant');

  const productsToDisplay = useMemo(() => {
    const products = dbProducts || [];
    const vendorList = vendors || [];
    const vendorMap = new Map(vendorList.map(v => [v.id, v]));
    
    return products.filter(p => {
      const vendor = vendorMap.get(p.vendorId);
      if (activeZoneId && vendor && vendor.zoneId && vendor.zoneId !== activeZoneId) return false;
      
      const modeMatch = (p.serviceMode || 'Food').toLowerCase() === activeMode.toLowerCase();
      const searchMatch = !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const catMatch = category === 'all' || p.category?.toLowerCase() === category;
      const isDeleted = p.isDeleted === true;
      
      return modeMatch && searchMatch && catMatch && !isDeleted;
    }).sort((a, b) => {
      const vendorA = vendorMap.get(a.vendorId);
      const vendorB = vendorMap.get(b.vendorId);
      
      const isOnlineA = vendorA ? (vendorA.isOnline !== false && isStoreScheduleOpen(vendorA)) : true;
      const isOnlineB = vendorB ? (vendorB.isOnline !== false && isStoreScheduleOpen(vendorB)) : true;
      
      // 1. Move Online stores to top
      if (isOnlineA !== isOnlineB) return isOnlineA ? -1 : 1;
      
      // 2. Sort by Rating (High to Low)
      const ratingA = Number(vendorA?.rating) || 0;
      const ratingB = Number(vendorB?.rating) || 0;
      return ratingB - ratingA;
    });
  }, [dbProducts, vendors, searchQuery, category, activeMode, activeZoneId]);

  const handleShare = async (e: React.MouseEvent, product: any) => {
    e.stopPropagation();
    const productSlug = product.slug || slugify(product.name) || product.id;
    const shareUrl = `${window.location.origin}/product/${productSlug}`;
    try {
      if (navigator.share) await navigator.share({ title: product.name, url: shareUrl });
      else { await navigator.clipboard.writeText(shareUrl); toast({ title: "Link Copied!" }); }
    } catch (err) {}
  };

  return (
    <div className="px-4 py-6 min-h-[400px] transition-all">
      <div className="grid grid-cols-2 gap-4">
        {(!dbProducts && productsLoading) ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="aspect-[4/5] w-full rounded-[2rem]" />
          ))
        ) : productsToDisplay.map((product) => {
          const quantity = cart.find(c => c.id === product.id && !c.selectedOption)?.quantity || 0;
          const vendor = vendors?.find(v => v.id === product.vendorId);
          const isOffline = vendor ? (vendor.isOnline === false || !isStoreScheduleOpen(vendor)) : false;

          return (
            <div key={product.id} className={cn(
              "relative bg-[#0B0B0B] rounded-[2.5rem] p-3 border-2 border-[#C5A021]/30 flex flex-col shadow-2xl transition-all active:scale-[0.98] transform-gpu",
              isOffline && "opacity-80"
            )}>
              <div className="relative aspect-square w-full mb-3">
                <ProductQuickView product={product}>
                   <div className="relative w-full h-full cursor-pointer overflow-hidden rounded-[1.5rem] border-2 border-white/5">
                      <Image src={product.imageUrl} alt={product.name} fill className={cn("object-cover", isOffline && "grayscale")} unoptimized />
                      {isOffline && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-2 text-center z-10">
                          <Store className="h-5 w-5 text-white/70 mb-1" />
                          <span className="text-white font-black text-[9px] uppercase italic border border-white/30 px-2 py-0.5 rounded-lg backdrop-blur-sm">Closed Now</span>
                        </div>
                      )}
                   </div>
                </ProductQuickView>
                <button onClick={(e) => handleShare(e, product)} className="absolute top-2 right-2 h-7 w-7 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center border border-[#C5A021]/40 shadow-lg active:scale-75 transition-all z-30">
                  <Share2 className="h-3.5 w-3.5 text-[#C5A021]" />
                </button>
              </div>

              <div className="flex-1 flex flex-col px-1">
                <p className="text-[9px] font-black text-[#C5A021] uppercase tracking-[0.1em] italic truncate mb-1 opacity-90">
                  {product.restaurantName || 'ShopyKart Select'}
                </p>
                
                <div onClick={() => router.push(`/product/${product.slug || product.id}`)} className="cursor-pointer">
                  <h3 className="font-black text-[13px] text-white leading-tight italic uppercase tracking-tighter line-clamp-1 mb-1">{product.name}</h3>
                </div>
                
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-lg font-black text-white italic tracking-tighter">₹{product.price}</span>
                  {!isOffline ? (
                    quantity === 0 ? (
                      <ProductQuickView product={product}>
                        <button className="bg-[#D9C4A9] text-[#451A03] h-8 px-5 rounded-full font-black text-[10px] uppercase shadow-lg border border-white/20">ADD</button>
                      </ProductQuickView>
                    ) : (
                      <div className="flex items-center bg-[#C5A021] text-[#451A03] rounded-full h-8 px-1 shadow-lg">
                        <button onClick={() => removeFromCart(product.id)} className="w-6 h-full flex items-center justify-center"><Minus className="h-3 w-3 stroke-[3]" /></button>
                        <span className="text-[10px] font-black w-4 text-center">{quantity}</span>
                        <button onClick={() => addToCart({...product, quantity: 1})} className="w-6 h-full flex items-center justify-center"><Plus className="h-3 w-3 stroke-[3]" /></button>
                      </div>
                    )
                  ) : (
                    <div className="bg-gray-800 text-gray-500 h-8 px-3 rounded-full font-black text-[8px] uppercase flex items-center">OFFLINE</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
