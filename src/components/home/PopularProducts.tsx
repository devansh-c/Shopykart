"use client"

import React, { useMemo, useState, useEffect, memo, useTransition } from "react"
import { Zap, Plus, Minus, Loader2 } from "lucide-react"
import { useCart } from "@/components/cart/CartProvider"
import { cn, slugify } from "@/lib/utils"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, limit } from "firebase/firestore"
import { useRouter } from "next/navigation"

export const isStoreScheduleOpen = (vendor: any, currentMinutesOverride?: number | null) => {
  if (!vendor) return true;
  if (!vendor.openingTime || !vendor.closingTime) return true;

  const now = new Date();
  const currentMinutes = (currentMinutesOverride !== undefined && currentMinutesOverride !== null) 
    ? currentMinutesOverride 
    : now.getHours() * 60 + now.getMinutes();

  const parseTimeToMinutes = (timeStr: string) => {
    try {
      const parts = timeStr.trim().split(' ');
      if (parts.length < 2) return 0;
      const [time, modifier] = parts;
      let [hours, minutes] = time.split(':').map(Number);
      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      return hours * 60 + (minutes || 0);
    } catch (e) {
      return 0;
    }
  };

  const start = parseTimeToMinutes(vendor.openingTime);
  const end = parseTimeToMinutes(vendor.closingTime);

  if (start < end) {
    return currentMinutes >= start && currentMinutes <= end;
  } else {
    return currentMinutes >= start || currentMinutes <= end;
  }
};

const ProductItem = memo(({ product, vendor, quantity, onAdd, onRemove, onNavigate }: any) => {
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);

  useEffect(() => {
    const now = new Date();
    setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
  }, []);

  const scheduleOpen = isStoreScheduleOpen(vendor, currentMinutes);
  const isOffline = (vendor?.isOnline === false) || !scheduleOpen;
  const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`;
  
  return (
    <div className={cn(
      "relative bg-white rounded-[2rem] p-5 flex justify-between items-start transition-all shadow-[0_4px_20px_-2px_rgba(197,160,33,0.12)] border border-[#C5A021]/20",
      isOffline && "opacity-60 grayscale-[0.5]"
    )}>
      <div className="flex-1 pr-4 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-3 w-3 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5"><div className="h-full w-full bg-green-600 rounded-full" /></div>
          {isOffline && <span className="text-[7px] font-black text-red-600 uppercase bg-red-50 px-1.5 py-0.5 rounded border border-red-100 italic">Store Closed</span>}
        </div>
        <div onClick={() => !isOffline && onNavigate(product)} className="block text-left w-full cursor-pointer">
          <h3 className="font-bold text-base text-[#1C1C1C] mb-1 italic tracking-tight line-clamp-2 uppercase leading-tight">{product.name}</h3>
          <div className="text-xl font-black text-primary italic">₹{(product.price || 0).toFixed(0)}</div>
          <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-60 truncate mt-1">from {product.restaurantName || vendor?.storeName}</p>
        </div>
      </div>
      <div className="relative w-24 h-24 shrink-0">
        <div onClick={() => !isOffline && onNavigate(product)} className="relative w-full h-full rounded-2xl overflow-hidden bg-muted cursor-pointer">
          <Image src={imageUrl} alt={product.name} fill className="object-cover" unoptimized loading="lazy" />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full px-1.5 z-20">
          {quantity === 0 ? (
            <button onClick={() => !isOffline && onAdd({...product, quantity: 1, imageUrl})} className="w-full h-8 bg-white border-2 border-primary shadow-md font-black text-[9px] uppercase rounded-xl text-primary active:scale-95 transition-all">ADD</button>
          ) : (
            <div className="flex items-center justify-between w-full h-8 bg-primary text-white rounded-xl shadow-lg">
              <button onClick={() => onRemove(product.id)} className="flex-1 flex items-center justify-center h-full"><Minus className="h-3 w-3" /></button>
              <span className="text-[10px] font-black">{quantity}</span>
              <button onClick={() => onAdd({...product, quantity: 1, imageUrl})} className="flex-1 flex items-center justify-center h-full"><Plus className="h-3 w-3" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
ProductItem.displayName = "ProductItem";

export function PopularProducts({ searchQuery = '', category = 'all', activeMode = 'Food' }: { searchQuery?: string, category?: string, activeMode?: string }) {
  const { cart, addToCart, removeFromCart } = useCart();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const firestore = useFirestore();
  const [activeCity, setActiveCity] = useState<string | null>(null);

  useEffect(() => {
    const updateLoc = () => {
      setActiveCity(localStorage.getItem('user_city'));
    };
    updateLoc();
    window.addEventListener('user-address-updated', updateLoc);
    return () => window.removeEventListener('user-address-updated', updateLoc);
  }, []);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), limit(100));
  }, [firestore]);
  const { data: dbProducts, loading: productsLoading } = useCollection<any>(productsQuery);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  const productsToDisplay = useMemo(() => {
    if (!dbProducts || !vendors) return [];
    
    const targetCity = (activeCity || '').toLowerCase().trim();

    return dbProducts.filter(p => {
      const vendor = vendors.find(v => v.id === p.vendorId);
      const productTown = (p.town || vendor?.town || '').toLowerCase().trim();
      
      // HYBRID SMART FILTERING: 
      // 1. If no location set by user, show everything.
      // 2. If item has no town info, show it (fail-safe).
      // 3. If item town is 'local', show it.
      // 4. ONLY filter out if item town explicitly differs from user city.
      if (targetCity && targetCity !== 'local' && productTown && productTown !== 'local') {
        if (productTown !== targetCity) return false;
      }

      const modeMatch = (p.serviceMode || 'Food').toLowerCase() === activeMode.toLowerCase();
      const searchMatch = !searchQuery || p.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const catMatch = category === 'all' || p.category?.toLowerCase() === category;
      
      return modeMatch && searchMatch && catMatch;
    });
  }, [dbProducts, vendors, searchQuery, category, activeMode, activeCity]);

  const navigateToProduct = (product: any) => {
    const slug = product.slug || slugify(product.name);
    startTransition(() => {
      router.push(`/product/${slug}-${product.id}`);
    });
  };

  if (productsLoading || !dbProducts || !vendors) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="px-4 py-8">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-sm font-black tracking-tight text-[#1C1C1C] uppercase italic">⚡ {activeMode.toUpperCase()} HUB {activeCity ? `IN ${activeCity}` : ''}</h2>
      </div>
      <div className={cn("grid grid-cols-1 gap-6 transition-opacity", isPending && "opacity-50")}>
        {productsToDisplay.length > 0 ? productsToDisplay.map((product) => (
          <ProductItem 
            key={product.id} 
            product={product} 
            vendor={vendors?.find(v => v.id === product.vendorId)} 
            quantity={cart.find(c => c.id === product.id && !c.selectedOption)?.quantity || 0} 
            onAdd={addToCart} 
            onRemove={removeFromCart} 
            onNavigate={navigateToProduct} 
          />
        )) : (
          <div className="text-center py-20 opacity-20 font-black uppercase text-xs italic">No items found in {activeCity || 'this section'}</div>
        )}
      </div>
    </div>
  );
}