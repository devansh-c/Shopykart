"use client"

import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, where, limit } from "firebase/firestore"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Plus, Zap, Star } from "lucide-react"
import { cn, slugify } from "@/lib/utils"
import { useState, useEffect, useMemo } from "react"

/**
 * @fileOverview TopTenProducts with Strict Zone Filtering.
 */
export function TopTenProducts() {
  const firestore = useFirestore();
  const router = useRouter();
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  useEffect(() => {
    const updateZone = () => setActiveZoneId(localStorage.getItem('active_zone_id'));
    updateZone();
    window.addEventListener('user-address-updated', updateZone);
    return () => window.removeEventListener('user-address-updated', updateZone);
  }, []);

  const topTenQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'products'), where('isTopTen', '==', true), limit(50));
  }, [firestore]);

  const { data: allTopProducts, loading } = useCollection<any>(topTenQuery);
  const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  const filteredTopProducts = useMemo(() => {
    if (!allTopProducts || !vendors) return [];
    return allTopProducts.filter(p => {
      // STRICT ZONE FILTERING: Product or Vendor must match active zone or be global
      if (activeZoneId) {
        const vendor = vendors.find(v => v.id === p.vendorId);
        const itemZoneId = p.zoneId || vendor?.zoneId;
        if (itemZoneId && itemZoneId !== activeZoneId && itemZoneId !== 'global') {
          return false;
        }
      }
      return !p.isDeleted;
    });
  }, [allTopProducts, vendors, activeZoneId]);

  if (loading && !allTopProducts) return null;
  if (filteredTopProducts.length === 0) return null;

  return (
    <div className="py-6 overflow-hidden">
      <div className="px-6 mb-5 flex items-center justify-between">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
          Flash <span className="text-primary">Loot</span>
        </h2>
        <Zap className="h-5 w-5 text-primary animate-pulse" />
      </div>

      <div className="flex overflow-x-auto space-x-4 px-6 no-scrollbar pb-6">
        {filteredTopProducts.map((p) => (
          <div 
            key={p.id} 
            onClick={() => router.push(`/product/${p.slug || slugify(p.name)}-${p.id}`)}
            className="relative min-w-[180px] aspect-[4/5] rounded-[2.5rem] bg-[#0B0B0B] p-5 flex flex-col justify-between shadow-2xl active:scale-95 transition-all cursor-pointer border border-white/5 overflow-hidden group transform-gpu"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Zap className="h-20 w-20 -rotate-12 text-white" /></div>
            <div className="relative h-28 w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 shadow-inner">
               <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
            </div>
            <div className="space-y-1 relative z-10">
              <h4 className="text-white font-black text-sm uppercase italic truncate tracking-tight">{p.name}</h4>
              <div className="flex items-center gap-1.5">
                 <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                 <span className="text-[10px] font-black text-white/40 uppercase">Top Choice</span>
              </div>
            </div>
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xl font-black text-primary italic tracking-tighter">₹{p.price}</span>
              <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20"><Plus className="h-4 w-4 text-white stroke-[4]" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
