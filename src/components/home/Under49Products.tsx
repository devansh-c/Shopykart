"use client"

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, limit } from "firebase/firestore"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Plus, Star, ChevronRight, Sparkles } from "lucide-react"
import { cn, slugify } from "@/lib/utils"
import { useState, useEffect, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { ProductQuickView } from "@/components/product/ProductQuickView"

/**
 * @fileOverview Under49Products - Budget section showing top 10 items under ₹49 from current zone.
 * Optimized for rapid rendering and strict regional isolation.
 */
export function Under49Products() {
  const firestore = useFirestore();
  const router = useRouter();
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [activeTown, setActiveTown] = useState<string | null>(null);

  useEffect(() => {
    const updateLocation = () => {
      if (typeof window !== 'undefined') {
        setActiveZoneId(localStorage.getItem('active_zone_id'));
        setActiveTown(localStorage.getItem('user_address'));
      }
    };
    updateLocation();
    window.addEventListener('user-address-updated', updateLocation);
    return () => window.removeEventListener('user-address-updated', updateLocation);
  }, []);

  // Fetch more items initially to ensure we have enough after zone filtering
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('price', '<=', 49), limit(50));
  }, [firestore]);

  const { data: allProducts, loading } = useCollection<any>(productsQuery, 'home_under_49_v2');
  
  const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery, 'under49_vendors_master_list');

  const filteredProducts = useMemo(() => {
    if (!allProducts || !vendors) return [];
    
    return allProducts.filter(p => {
      // 1. Basic check
      if (p.isDeleted) return false;

      // 2. Zone & Town filtering
      const vendor = vendors.find(v => String(v.id) === String(p.vendorId));
      if (activeZoneId) {
        const zoneMatch = p.zoneId === activeZoneId || vendor?.zoneId === activeZoneId || p.zoneId === 'global' || vendor?.zoneId === 'global';
        const townMatch = activeTown && vendor?.town?.toLowerCase().trim() === activeTown.toLowerCase().trim();
        
        // If it doesn't match the zone or town, skip it
        if (!zoneMatch && !townMatch && (p.zoneId || vendor?.zoneId)) {
          return false;
        }
      }
      
      // 3. Ensure it's available
      if (p.isAvailable === false || vendor?.isOnline === false) return false;

      return true;
    })
    .sort((a, b) => (Number(a.price) - Number(b.price))) // Show cheapest first
    .slice(0, 10); // Strictly show only top 10 products
  }, [allProducts, vendors, activeZoneId, activeTown]);

  if (loading && !allProducts) return null;
  if (filteredProducts.length === 0) return null;

  return (
    <div className="py-6 overflow-hidden animate-in fade-in duration-700 bg-white">
      <div className="px-6 mb-5 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
            Budget <span className="text-primary">Loot</span>
          </h2>
          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1">Items under ₹49 nearby</p>
        </div>
        <button onClick={() => router.push('/stores')} className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1 active:scale-95 transition-all">
          SEE ALL <ChevronRight className="h-3.5 w-3.5 text-primary" />
        </button>
      </div>

      <div className="flex overflow-x-auto space-x-5 px-6 no-scrollbar pb-6">
        {filteredProducts.map((p) => {
          const vendor = vendors?.find(v => String(v.id) === String(p.vendorId));
          const storeName = vendor?.storeName || 'ShopyKart Select';
          
          return (
            <div 
              key={p.id} 
              className="relative min-w-[160px] flex flex-col group transition-all transform-gpu"
            >
              <div className="relative aspect-square w-full rounded-[1.5rem] overflow-hidden border border-black/[0.03] bg-gray-50 shadow-sm">
                 <Image 
                   src={p.imageUrl} 
                   alt={p.name} 
                   fill 
                   className="object-cover group-hover:scale-105 transition-transform duration-700" 
                   unoptimized 
                 />
                 
                 <div className="absolute top-3 left-3">
                    <Badge className="bg-white/95 text-[#16a34a] border-none font-black text-[8px] px-2 py-0.5 rounded-lg shadow-sm uppercase">Loot</Badge>
                 </div>

                 <ProductQuickView product={{...p, restaurantName: storeName}}>
                    <button className="absolute bottom-3 right-3 h-10 w-10 bg-white text-primary rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform border border-black/[0.03] z-20">
                       <Plus className="h-5 w-5 stroke-[4]" />
                    </button>
                 </ProductQuickView>
              </div>

              <div className="pt-3 px-1.5 space-y-1">
                 <p className="text-[9px] font-black text-gray-400 uppercase tracking-tighter truncate leading-none italic">{storeName}</p>
                 <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 border border-green-600 rounded-sm flex items-center justify-center p-0.5 shrink-0"><div className="h-full w-full bg-green-600 rounded-full" /></div>
                    <h4 className="text-[11px] font-black text-gray-800 uppercase italic truncate tracking-tight">{p.name}</h4>
                 </div>
                 
                 <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[9px] font-bold text-gray-400 line-through leading-none">₹{p.mrp || Math.round(p.price * 1.5)}</span>
                    <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[12px] italic px-2.5 py-0.5 rounded-lg shadow-sm">₹{p.price}</Badge>
                 </div>
                 
                 <div className="pt-1">
                   <p className="text-[8px] font-black text-[#D946EF] uppercase italic tracking-tighter flex items-center gap-1 animate-pulse">
                      <Sparkles className="h-2.5 w-2.5 fill-[#D946EF]" /> Fast delivery
                   </p>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
