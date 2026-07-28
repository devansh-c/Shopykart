
"use client"

import React, { useMemo, useState, useEffect } from "react"
import { Plus, Minus, Loader2, Crown } from "lucide-react"
import { useCart } from "@/components/cart/CartProvider"
import { cn, slugify } from "@/lib/utils"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, limit } from "firebase/firestore"
import { ProductQuickView } from "@/components/product/ProductQuickView"
import { useRouter } from "next/navigation"

/**
 * Utility to check if a store is currently open based on timing strings (e.g. "10:00 AM")
 */
export function isStoreScheduleOpen(vendor: any, currentMinutes?: number | null) {
  if (!vendor) return true;
  if (!vendor.openingTime || !vendor.closingTime) return true;

  const now = new Date();
  const mins = currentMinutes !== undefined && currentMinutes !== null 
    ? currentMinutes 
    : now.getHours() * 60 + now.getMinutes();

  const parseTime = (t: string) => {
    try {
      const [time, modifier] = t.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + (minutes || 0);
    } catch (e) {
      return 0;
    }
  };

  const start = parseTime(vendor.openingTime);
  const end = parseTime(vendor.closingTime);

  if (start < end) {
    return mins >= start && mins <= end;
  } else {
    // Handle overnight shifts
    return mins >= start || mins <= end;
  }
}

export function PopularProducts({ searchQuery = '', category = 'all', activeMode = 'Food' }: { searchQuery?: string, category?: string, activeMode?: string }) {
  const { cart, addToCart, removeFromCart } = useCart();
  const firestore = useFirestore();
  const router = useRouter();
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  useEffect(() => {
    const updateLoc = () => setActiveZoneId(localStorage.getItem('active_zone_id'));
    updateLoc();
    window.addEventListener('user-address-updated', updateLoc);
    return () => window.removeEventListener('user-address-updated', updateLoc);
  }, []);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), limit(1000));
  }, [firestore]);
  
  const { data: dbProducts, loading } = useCollection<any>(productsQuery, 'home_products_v2');

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery, 'home_vendors_v2');

  const productsToDisplay = useMemo(() => {
    if (!dbProducts || !vendors) return [];
    
    return dbProducts.filter(p => {
      const vendor = vendors.find(v => v.id === p.vendorId);
      
      if (activeZoneId) {
        const pZone = p.zoneId;
        const vZone = vendor?.zoneId;
        const matchesZone = (pZone === activeZoneId) || (vZone === activeZoneId);
        const isGlobal = !pZone && (!vendor || !vZone);
        
        if (!matchesZone && !isGlobal) {
          return false;
        }
      }

      const modeMatch = (p.serviceMode || 'Food').toLowerCase() === activeMode.toLowerCase();
      const searchMatch = !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const catMatch = category === 'all' || p.category?.toLowerCase() === category;
      
      return modeMatch && searchMatch && catMatch;
    }).sort((a, b) => {
      const vendorA = vendors.find(v => v.id === a.vendorId);
      const vendorB = vendors.find(v => v.id === b.vendorId);
      
      const isOnlineA = vendorA?.isOnline !== false && isStoreScheduleOpen(vendorA);
      const isOnlineB = vendorB?.isOnline !== false && isStoreScheduleOpen(vendorB);
      
      if (isOnlineA !== isOnlineB) return isOnlineA ? -1 : 1;
      return (vendorB?.rating || 0) - (vendorA?.rating || 0);
    });
  }, [dbProducts, vendors, searchQuery, category, activeMode, activeZoneId]);

  if (loading && !dbProducts) {
    return (
      <div className="px-4 grid grid-cols-2 gap-4 py-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="aspect-[4/5] w-full bg-muted/20 animate-pulse rounded-[2.5rem]" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-6 content-visibility-auto">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-sm font-black tracking-widest text-black/40 uppercase italic">
          ⚡ SELECTION ({productsToDisplay.length})
        </h2>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {productsToDisplay.map((product) => {
          const quantity = cart.find(c => c.id === product.id && !c.selectedOption)?.quantity || 0;
          const vendor = vendors?.find(v => v.id === product.vendorId);
          const isOffline = (vendor?.isOnline === false) || !isStoreScheduleOpen(vendor);
          const productSlug = product.slug || slugify(product.name) || product.id;

          return (
            <div key={product.id} className={cn(
              "relative bg-[#0B0B0B] rounded-[2rem] p-3 border-2 border-[#C5A021]/30 flex flex-col shadow-2xl transition-all active:scale-[0.98] transform-gpu overflow-hidden group",
              isOffline && "opacity-60 grayscale"
            )}>
              <div className="relative aspect-square w-full mb-3">
                <ProductQuickView product={product}>
                   <div className="relative w-full h-full cursor-pointer overflow-hidden rounded-[1.5rem] border-2 border-white/5">
                      <Image src={product.imageUrl} alt={product.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute top-2 right-2 h-5 w-5 bg-black/40 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10">
                        <Crown className="h-3 w-3 text-[#C5A021] fill-[#C5A021]" />
                      </div>
                   </div>
                </ProductQuickView>
              </div>

              <div className="flex-1 flex flex-col px-1">
                <div onClick={() => router.push(`/product/${productSlug}`)} className="cursor-pointer">
                  <h3 className="font-black text-[13px] text-white leading-tight italic uppercase tracking-tighter line-clamp-1 mb-1">{product.name}</h3>
                  <p className="text-[9px] text-white/40 uppercase font-black tracking-widest truncate mb-2">{product.restaurantName || 'Gourmet'}</p>
                </div>

                <div className="mt-auto flex items-center justify-between">
                  <span className="text-lg font-black text-white italic tracking-tighter">₹{product.price}</span>
                  
                  {quantity === 0 ? (
                    <ProductQuickView product={product}>
                      <button 
                        className="bg-gradient-to-r from-[#8C7A63] via-[#D9C4A9] to-[#8C7A63] text-[#451A03] h-8 px-5 rounded-full font-black text-[10px] uppercase shadow-lg active:scale-90 transition-all border border-white/20"
                      >
                        ADD
                      </button>
                    </ProductQuickView>
                  ) : (
                    <div className="flex items-center bg-[#C5A021] text-[#451A03] rounded-full h-8 px-1 shadow-lg">
                      <button onClick={() => removeFromCart(product.id)} className="w-6 h-full flex items-center justify-center"><Minus className="h-3 w-3 stroke-[3]" /></button>
                      <span className="text-[10px] font-black w-4 text-center">{quantity}</span>
                      <button onClick={() => addToCart({...product, quantity: 1})} className="w-6 h-full flex items-center justify-center"><Plus className="h-3 w-3 stroke-[3]" /></button>
                    </div>
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
