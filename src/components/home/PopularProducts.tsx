"use client"

import React, { useMemo, useState, useEffect } from "react"
import { Plus, Minus, Loader2 } from "lucide-react"
import { useCart } from "@/components/cart/CartProvider"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, limit } from "firebase/firestore"
import { ProductQuickView } from "@/components/product/ProductQuickView"

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
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  useEffect(() => {
    const updateLoc = () => setActiveZoneId(localStorage.getItem('active_zone_id'));
    updateLoc();
    window.addEventListener('user-address-updated', updateLoc);
    return () => window.removeEventListener('user-address-updated', updateLoc);
  }, []);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Increased limit to ensure no products are missed in production
    return query(collection(firestore, 'products'), limit(250));
  }, [firestore]);
  const { data: dbProducts, loading } = useCollection<any>(productsQuery);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  const productsToDisplay = useMemo(() => {
    if (!dbProducts || !vendors) return [];
    
    return dbProducts.filter(p => {
      const vendor = vendors.find(v => v.id === p.vendorId);
      
      // SMART ZONE FILTERING: 
      // Product dikhega agar: 
      // 1. Zone ID match ho
      // 2. Product Global ho (No zoneId)
      // 3. Vendor Global ho (No zoneId)
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
      
      // Online vendors first
      const isOnlineA = vendorA?.isOnline !== false && isStoreScheduleOpen(vendorA);
      const isOnlineB = vendorB?.isOnline !== false && isStoreScheduleOpen(vendorB);
      
      if (isOnlineA !== isOnlineB) return isOnlineA ? -1 : 1;
      return (vendorB?.rating || 0) - (vendorA?.rating || 0);
    });
  }, [dbProducts, vendors, searchQuery, category, activeMode, activeZoneId]);

  if (loading && !dbProducts) {
    return (
      <div className="px-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 w-full bg-muted/20 animate-pulse rounded-[2rem]" />
        ))}
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-sm font-black tracking-widest text-black/40 uppercase italic">
          ⚡ ALL SELECTION ({productsToDisplay.length})
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6">
        {productsToDisplay.map((product) => {
          const quantity = cart.find(c => c.id === product.id && !c.selectedOption)?.quantity || 0;
          return (
            <div key={product.id} className="relative bg-white rounded-[2.5rem] p-6 flex justify-between items-center shadow-xl shadow-black/[0.03] border border-border/40 transition-all hover:shadow-2xl">
              <div className="flex-1 pr-4 min-w-0">
                <ProductQuickView product={product}>
                  <button className="block text-left w-full cursor-pointer group">
                    <h3 className="font-black text-lg text-gray-900 leading-tight italic uppercase tracking-tighter mb-1 truncate group-hover:text-primary transition-colors">{product.name}</h3>
                    <div className="text-2xl font-black text-primary italic">₹{(product.price || 0).toFixed(0)}</div>
                    <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest mt-1 opacity-60">from {product.restaurantName}</p>
                  </button>
                </ProductQuickView>
              </div>
              <div className="relative w-28 h-28 shrink-0">
                <ProductQuickView product={product}>
                   <div className="relative w-full h-full cursor-pointer">
                    <Image src={product.imageUrl} alt={product.name} fill className="object-cover rounded-[1.5rem] bg-muted shadow-md" unoptimized />
                   </div>
                </ProductQuickView>
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-full px-2 z-20">
                  {quantity === 0 ? (
                    <button onClick={() => addToCart({...product, quantity: 1})} className="w-full h-10 bg-white border-2 border-primary shadow-xl font-black text-[10px] uppercase rounded-xl text-primary active:scale-95 transition-all">ADD</button>
                  ) : (
                    <div className="flex items-center justify-between w-full h-10 bg-primary text-white rounded-xl shadow-xl">
                      <button onClick={() => removeFromCart(product.id)} className="flex-1 flex items-center justify-center h-full"><Minus className="h-4 w-4" /></button>
                      <span className="text-[11px] font-black">{quantity}</span>
                      <button onClick={() => addToCart({...product, quantity: 1})} className="flex-1 flex items-center justify-center h-full"><Plus className="h-4 w-4" /></button>
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