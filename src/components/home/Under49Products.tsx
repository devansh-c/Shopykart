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
 * @fileOverview Under49Products - Budget section showing items under ₹49 from current zone.
 */
export function Under49Products() {
  const firestore = useFirestore();
  const router = useRouter();
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setActiveZoneId(localStorage.getItem('active_zone_id'));
    }
    const updateZone = () => setActiveZoneId(localStorage.getItem('active_zone_id'));
    window.addEventListener('user-address-updated', updateZone);
    return () => window.removeEventListener('user-address-updated', updateZone);
  }, []);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('price', '<=', 49), limit(20));
  }, [firestore]);

  const { data: allProducts, loading } = useCollection<any>(productsQuery, 'home_under_49_v1');
  
  const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery, 'under49_vendors_list');

  const filteredProducts = useMemo(() => {
    if (!allProducts || !vendors) return [];
    return allProducts.filter(p => {
      if (activeZoneId) {
        const vendor = vendors.find(v => v.id === p.vendorId);
        const itemZoneId = p.zoneId || vendor?.zoneId;
        if (itemZoneId && itemZoneId !== activeZoneId && itemZoneId !== 'global') {
          return false;
        }
      }
      return !p.isDeleted;
    }).sort((a, b) => (Number(a.price) - Number(b.price)));
  }, [allProducts, vendors, activeZoneId]);

  if (loading && !allProducts) return null;
  if (filteredProducts.length === 0) return null;

  return (
    <div className="py-6 overflow-hidden animate-in fade-in duration-700 bg-white">
      <div className="px-6 mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
          Under <span className="text-primary">₹49</span>
        </h2>
        <button onClick={() => router.push('/stores')} className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1 active:scale-95 transition-all">
          SEE ALL <ChevronRight className="h-3.5 w-3.5 text-primary" />
        </button>
      </div>

      <div className="flex overflow-x-auto space-x-5 px-6 no-scrollbar pb-6">
        {filteredProducts.map((p) => {
          const vendor = vendors?.find(v => v.id === p.vendorId);
          const storeName = vendor?.storeName || 'ShopyKart Select';
          
          return (
            <div 
              key={p.id} 
              className="relative min-w-[160px] flex flex-col group transition-all transform-gpu"
            >
              <div className="relative aspect-square w-full rounded-[1.5rem] overflow-hidden border border-gray-100 bg-gray-50 shadow-sm">
                 <Image 
                   src={p.imageUrl} 
                   alt={p.name} 
                   fill 
                   className="object-cover group-hover:scale-105 transition-transform duration-700" 
                   unoptimized 
                 />
                 
                 <div className="absolute top-3 left-3">
                    <Badge className="bg-white/95 text-[#16a34a] border-none font-black text-[8px] uppercase px-2 py-0.5 rounded-lg shadow-sm">Popular</Badge>
                 </div>

                 <ProductQuickView product={{...p, restaurantName: storeName}}>
                    <button className="absolute bottom-3 right-3 h-10 w-10 bg-white text-primary rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-transform border border-black/[0.03] z-20">
                       <Plus className="h-5 w-5 stroke-[4]" />
                    </button>
                 </ProductQuickView>
              </div>

              <div className="pt-3 px-1.5 space-y-1">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter truncate leading-none">{storeName}</p>
                 <div className="flex items-center gap-1.5">
                    <div className="h-2.5 w-2.5 border border-green-600 rounded-sm flex items-center justify-center p-0.5 shrink-0"><div className="h-full w-full bg-green-600 rounded-full" /></div>
                    <h4 className="text-[11px] font-black text-gray-800 uppercase italic truncate tracking-tight">{p.name}</h4>
                 </div>
                 
                 <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-[10px] font-bold text-gray-400 line-through leading-none">₹{p.mrp || p.price + 15}</span>
                    <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[12px] italic px-2.5 py-0.5 rounded-lg shadow-sm">₹{p.price}</Badge>
                 </div>
                 
                 <div className="pt-1">
                   <p className="text-[8px] font-black text-[#D946EF] uppercase italic tracking-tighter flex items-center gap-1 animate-pulse">
                      <Sparkles className="h-2.5 w-2.5 fill-[#D946EF]" /> Our app: 60% lower
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
