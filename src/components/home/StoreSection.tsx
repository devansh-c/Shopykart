
"use client"

import { Star, MapPin, Clock, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, limit } from "firebase/firestore"
import React, { useMemo, useTransition, useState, useEffect } from "react"
import { cn, slugify } from "@/lib/utils"
import { useRouter } from "next/navigation"

export const StoreSection = React.memo(({ activeMode = 'Food' }: { activeMode?: string }) => {
  const firestore = useFirestore();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);

  useEffect(() => {
    const updateLoc = () => {
      setActiveZoneId(localStorage.getItem('active_zone_id'));
    };
    updateLoc();
    window.addEventListener('user-address-updated', updateLoc);
    return () => window.removeEventListener('user-address-updated', updateLoc);
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'), limit(100));
  }, [firestore]);

  const { data: dbVendors, loading } = useCollection<any>(vendorsQuery);

  const filteredVendors = useMemo(() => {
    if (!dbVendors) return [];
    
    return dbVendors.filter(v => {
      if (activeZoneId) {
        if (v.zoneId !== activeZoneId) {
          return false;
        }
      }
      return (v.category || 'Food').toLowerCase() === activeMode.toLowerCase();
    }).sort((a, b) => {
      const onlineA = a.isOnline !== false ? 1 : 0;
      const onlineB = b.isOnline !== false ? 1 : 0;
      if (onlineA !== onlineB) return onlineB - onlineA;
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [dbVendors, activeMode, activeZoneId]);

  const handleStoreClick = (store: any) => {
    const slug = store.slug || slugify(store.storeName);
    startTransition(() => {
      router.push(`/store/${slug}-${store.id}`);
    });
  };

  if (loading || filteredVendors.length === 0) return null;

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6 px-6">
        <h2 className="text-2xl font-black tracking-tighter uppercase italic text-gray-900 leading-none">
          Explore <span className="text-primary">Hub</span>
        </h2>
      </div>

      <div className={cn("flex overflow-x-auto space-x-5 px-6 no-scrollbar pb-4 transition-opacity", isPending && "opacity-50")}>
        {filteredVendors.map((store: any) => (
          <button 
            onClick={() => handleStoreClick(store)}
            key={store.id} 
            className="block text-left min-w-[240px] max-w-[240px] rounded-[2.5rem] overflow-hidden shadow-2xl shrink-0 transform-gpu group border border-white/10 relative"
          >
            {/* Background Gradient matching the image */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#8C7A63] via-[#B8A38B] to-[#D9C4A9] z-0" />
            
            <div className="relative h-40 w-full overflow-hidden z-10">
              <Image 
                src={store.imageUrl} 
                alt={store.storeName} 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-700" 
                unoptimized 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            <div className="p-5 relative z-20 text-white">
              <h3 className="text-lg font-black italic uppercase leading-tight mb-1 truncate drop-shadow-sm">
                {store.storeName}
              </h3>
              <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mb-3 truncate italic">
                {store.category || 'Premium Selection'} | Local Hub
              </p>
              
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 border border-white/20 shadow-sm">
                   <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                   <span className="text-[11px] font-black">{store.rating || '4.8'}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-black text-white/90 italic tracking-tight">
                   {store.deliveryTime || '35 mins'}
                </div>
              </div>
            </div>

            {/* Subtle Shine Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
          </button>
        ))}
      </div>
    </div>
  );
});

StoreSection.displayName = "StoreSection";
