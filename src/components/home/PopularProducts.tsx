
"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import { Zap, Plus, Minus, Heart, SlidersHorizontal, Utensils, ShoppingBag, Loader2, Star, Clock, ShieldCheck, Check } from "lucide-react"
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
  const [selectedCat, setSelectedCat] = useState('all');
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

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: dbCategories } = useCollection<any>(categoriesQuery);

  const medicalCategories = useMemo(() => {
    return dbCategories?.filter(c => (c.serviceType || 'Food') === 'Medical') || [];
  }, [dbCategories]);

  const vendorMap = useMemo(() => {
    const map = new Map();
    if (vendors) {
      vendors.forEach(v => map.set(v.id, v));
    }
    return map;
  }, [vendors]);

  const productsToDisplay = useMemo(() => {
    if (!dbProducts) return [];
    
    const searchLower = searchQuery.toLowerCase().trim();
    const categoryLower = (selectedCat === 'all' ? category : selectedCat).toLowerCase().trim();
    const modeLower = activeMode.toLowerCase().trim();
    const targetCityNormalized = (activeCity || '').toLowerCase().trim();

    let result = dbProducts.filter(product => {
      const vendor = vendorMap.get(product.vendorId);
      
      // If vendor data is not yet loaded, we use the product's own category metadata
      // This ensures products don't "disappear" during initial loading
      const serviceType = (product.serviceMode || vendor?.category || 'Food').toLowerCase().trim();
      if (serviceType !== modeLower && modeLower !== 'food') {
         // Special handling for legacy food items or products without explicit mode
         if (activeMode === 'Food' && (serviceType === 'food' || !serviceType)) {
            // Keep it
         } else if (product.category === 'beauty' && activeMode === 'Beauty') {
            // Keep it
         } else if (product.category === 'medical' && activeMode === 'Medical') {
            // Keep it
         } else {
           return false;
         }
      }

      const productZoneId = product.zoneId || vendor?.zoneId;
      const productTown = (product.town || vendor?.town || '').toLowerCase().trim();

      if (activeZoneId || targetCityNormalized) {
        const matchesZoneId = activeZoneId && productZoneId === activeZoneId;
        const matchesTown = targetCityNormalized && productTown === targetCityNormalized;
        
        // Loosened filtering for prototyping: if no specific match, allow if no zone is set
        if (!matchesZoneId && !matchesTown && productZoneId) return false;
      }

      const matchesSearch = !searchLower || 
        (product.name || '').toLowerCase().includes(searchLower) || 
        (product.category || '').toLowerCase().includes(searchLower);
      
      const matchesCategory = categoryLower === 'all' || (product.category || '').toLowerCase().trim() === categoryLower;
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
  }, [searchQuery, category, selectedCat, sortBy, dbProducts, vendorMap, vendors, activeMode, activeZoneId, activeCity]);

  if (loading && !dbProducts) {
    return <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  const isMedical = activeMode === 'Medical';

  if (isMedical) {
    return (
      <div className="flex bg-[#F9FAFB] min-h-screen">
        <aside className="w-[85px] border-r border-gray-100 bg-white sticky top-0 h-screen overflow-y-auto no-scrollbar flex flex-col items-center py-6 gap-6 shrink-0">
          <button 
            onClick={() => setSelectedCat('all')}
            className={cn("flex flex-col items-center gap-1 group", selectedCat === 'all' ? "opacity-100" : "opacity-60")}
          >
            <div className={cn("h-14 w-14 rounded-full border-2 flex items-center justify-center bg-gray-50 transition-all", selectedCat === 'all' ? "border-green-600 ring-4 ring-green-50" : "border-transparent")}>
              <span className="text-[10px] font-black text-green-700">ALL</span>
            </div>
            <span className="text-[9px] font-black uppercase text-center leading-tight mt-1">View All</span>
          </button>

          {medicalCategories.map((cat) => (
            <button key={cat.id} onClick={() => setSelectedCat(cat.name)} className={cn("flex flex-col items-center gap-1 group", selectedCat === cat.name ? "opacity-100" : "opacity-60")}>
              <div className={cn("relative h-14 w-14 rounded-full border-2 overflow-hidden transition-all", selectedCat === cat.name ? "border-green-600 ring-4 ring-green-50 scale-105" : "border-transparent bg-gray-50")}>
                <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" unoptimized />
              </div>
              <span className="text-[9px] font-black uppercase text-center leading-tight mt-1 px-1 line-clamp-2">{cat.name}</span>
            </button>
          ))}
        </aside>

        <main className="flex-1 p-4 pb-40">
          <div className="flex items-center justify-between mb-6">
             <h2 className="text-sm font-black uppercase italic tracking-tight text-gray-800">{selectedCat === 'all' ? 'All Medicines' : selectedCat}</h2>
             <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{productsToDisplay.length} Items</span>
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-6">
            {productsToDisplay.map((product) => {
              const cartItem = cart?.find((item: any) => item.id === product.id);
              const quantity = cartItem?.quantity || 0;
              const isOffline = (vendorMap.get(product.vendorId)?.isOnline === false) || (product.isAvailable === false);
              const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`;
              const rating = (4 + (product.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % 11) / 10).toFixed(1);
              const discount = Math.floor(Math.random() * 20) + 5;
              const originalPrice = Math.floor(product.price * (1 + discount/100));

              return (
                <div key={product.id} className={cn("flex flex-col relative bg-white rounded-3xl border border-gray-100 p-2.5 shadow-sm active:scale-[0.98] transition-all", isOffline && "opacity-60 grayscale")}>
                  <div className="absolute top-0 left-2 z-10"><div className="bg-[#2563EB] text-white text-[8px] font-black px-1.5 py-2.5 rounded-b-md shadow-lg flex flex-col items-center leading-none"><span>{discount}%</span><span className="mt-0.5">OFF</span></div></div>
                  <ProductQuickView product={product} isMedical={true}>
                    <button className="relative aspect-square w-full rounded-2xl overflow-hidden mb-3"><Image src={imageUrl} alt={product.name} fill className="object-contain p-2" unoptimized /></button>
                  </ProductQuickView>
                  <div className="flex items-center gap-1 mb-2 bg-gray-50 w-fit px-1.5 py-0.5 rounded-md border border-gray-100"><Clock className="h-2.5 w-2.5 text-gray-800" /><span className="text-[8px] font-black text-gray-800 uppercase">10 MINS</span></div>
                  <ProductQuickView product={product} isMedical={true}>
                    <button className="text-left flex flex-col gap-0.5 mb-3 h-14">
                       <h3 className="font-bold text-[11px] text-gray-900 leading-tight line-clamp-2">{product.name}</h3>
                       <div className="flex items-center gap-1"><span className="text-[10px] font-black text-gray-800">{rating}</span><Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" /></div>
                    </button>
                  </ProductQuickView>
                  <div className="mt-auto flex items-center justify-between">
                     <div className="flex flex-col"><span className="text-[12px] font-black text-gray-900">₹{product.price}</span><span className="text-[9px] font-bold text-gray-300 line-through leading-none">₹{originalPrice}</span></div>
                     <div className="relative">
                        {quantity === 0 ? (<button disabled={isOffline} onClick={() => addToCart({ ...product, imageUrl })} className="px-6 py-1.5 border border-green-600 text-green-600 rounded-lg font-black text-[10px] uppercase hover:bg-green-50 transition-colors shadow-sm">ADD</button>) : (<div className="flex items-center bg-green-600 text-white rounded-lg h-8 px-1 shadow-md animate-in zoom-in-95 duration-200"><button onClick={() => removeFromCart(product.id)} className="w-6 h-full flex items-center justify-center font-bold text-lg">-</button><span className="w-5 text-center text-[11px] font-black">{quantity}</span><button onClick={() => addToCart({ ...product, imageUrl })} className="w-6 h-full flex items-center justify-center font-bold text-lg">+</button></div>)}
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 content-visibility-auto">
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-sm font-black tracking-tight text-[#1C1C1C] uppercase italic">{searchQuery ? 'Results' : `⚡ ${activeMode.toUpperCase()} HUB`}</h2>
        <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-[110px] h-8 rounded-xl bg-white border border-border/50 text-[8px] font-black uppercase"><SlidersHorizontal className="h-3 w-3 mr-1.5" /><SelectValue placeholder="Sort" /></SelectTrigger><SelectContent className="rounded-2xl border-none shadow-2xl"><SelectItem value="recommended" className="text-[10px] font-black uppercase">Recommended</SelectItem><SelectItem value="price-low" className="text-[10px] font-black uppercase">Low-High</SelectItem><SelectItem value="price-high" className="text-[10px] font-black uppercase">High-Low</SelectItem></SelectContent></Select>
      </div>
      <div className="grid grid-cols-1 gap-8">
        {productsToDisplay.map((product) => {
          const cartItem = cart?.find((item: any) => item.id === product.id);
          const quantity = cartItem?.quantity || 0;
          const isOffline = (vendorMap.get(product.vendorId)?.isOnline === false) || (product.isAvailable === false);
          const imageUrl = product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`;
          return (
            <div key={product.id} className={cn("premium-card p-6 flex justify-between items-start bg-white relative", isOffline && "opacity-60 grayscale-[0.5]")}>
              <div className="flex-1 pr-4 min-w-0">
                <div className="h-3.5 w-3.5 border-2 border-green-600 rounded-sm flex items-center justify-center p-0.5 mb-2"><div className="h-full w-full bg-green-600 rounded-full" /></div>
                <ProductQuickView product={product} isMedical={false}><button className={cn("block text-left w-full", isOffline && "pointer-events-none")}><h3 className="font-bold text-lg text-[#1C1C1C] mb-1.5 italic tracking-tight line-clamp-2 uppercase">{product.name}</h3><div className="text-xl font-black text-primary mb-2 italic">₹{(product.price || 0).toFixed(2)}</div><p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest opacity-60">from {product.restaurantName}</p></button></ProductQuickView>
              </div>
              <div className="relative w-28 h-28 shrink-0">
                <ProductQuickView product={product} isMedical={false}><button className="relative w-full h-full rounded-2xl overflow-hidden bg-muted"><Image src={imageUrl} alt={product.name} fill className="object-cover" unoptimized /></button></ProductQuickView>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-full px-1.5 z-20">
                  {quantity === 0 ? (<ProductQuickView product={product} isMedical={false}><button disabled={isOffline} className="w-full h-9 bg-white text-primary border-2 border-primary shadow-lg font-black text-[9px] uppercase rounded-xl">{isOffline ? 'OFFLINE' : 'ADD TO BAG'}</button></ProductQuickView>) : (<div className="flex items-center justify-between w-full h-9 bg-primary text-white rounded-xl shadow-lg"><button onClick={(e) => { e.stopPropagation(); removeFromCart(product.id); }} className="flex-1 flex items-center justify-center h-full"><Minus className="h-3 w-3" /></button><span className="text-xs font-black min-w-[20px] text-center">{quantity}</span><button onClick={(e) => { e.stopPropagation(); addToCart({ ...product, imageUrl }); }} className="flex-1 flex items-center justify-center h-full"><Plus className="h-3.5 w-3.5" /></button></div>)}
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleWishlist(product.id); }} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 shadow-md z-20"><Heart className={cn("h-3.5 w-3.5", isInWishlist(product.id) ? "fill-primary text-primary" : "text-gray-300")} /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
