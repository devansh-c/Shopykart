"use client"

import { Star, MapPin, Clock, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, limit } from "firebase/firestore"
import React, { useMemo, useState, useEffect, memo, useTransition } from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import { isStoreScheduleOpen } from "./PopularProducts"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * @fileOverview High-Performance StoreSection.
 * Optimized: Robust filtering for visibility and service mode handling.
 */
export const StoreSection = memo(({ activeMode = 'Food' }: { activeMode?: string }) => {
  const firestore = useFirestore();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);

  useEffect(() => {
    const savedCity = localStorage.getItem('user_city');
    if (savedCity) setActiveCity(savedCity);

    const syncTime = () => {
      const now = new Date();
      setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
    };
    syncTime();
    
    const interval = setInterval(syncTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'), limit(150));
  }, [firestore]);

  const { data: dbVendors, loading } = useCollection<any>(vendorsQuery);

  const filteredVendors = useMemo(() => {
    if (!dbVendors) return null;
    const targetCityNormalized = (activeCity || '').toLowerCase().trim();
    const currentModeLower = activeMode.toLowerCase();
    const mins = currentMinutes ?? 720;

    return dbVendors.filter(v => {
      const isApproved = v.status === 'approved' || !v.status;
      const rawVMode = (v.category || 'Food').toLowerCase();
      const vMode = (rawVMode === 'restaurant' || rawVMode === 'food') ? 'food' : rawVMode;
      
      if (vMode !== currentModeLower) return false;
      
      const vTown = (v.town || '').toLowerCase().trim();
      if (targetCityNormalized && vTown && vTown !== 'local' && vTown !== 'all') {
        if (targetCityNormalized === 'ranipur' && vTown === 'mauranipur') return false;
        if (targetCityNormalized === 'mauranipur' && vTown === 'ranipur') return false;
      }
      return isApproved;
    }).sort((a, b) => {
      const onlineA = a.isOnline !== false && isStoreScheduleOpen(a, mins) ? 1 : 0;
      const onlineB = b.isOnline !== false && isStoreScheduleOpen(b, mins) ? 1 : 0;
      if (onlineA !== onlineB) return onlineB - onlineA;
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [dbVendors, activeMode, activeCity, currentMinutes]);

  const handleStoreClick = (id: string) => {
    startTransition(() => {
      router.push(`/menu?vendor=${id}`);
    });
  };

  if (activeMode === 'Medical' || activeMode === 'Beauty') return null;

  if (filteredVendors === null || (loading && (!dbVendors || dbVendors.length === 0))) {
    return (
      <div className="py-6 px-6 space-y-6">
        <div className="flex items-center justify-between">
           <Skeleton className="h-8 w-40 rounded-xl bg-zinc-100" />
           <Skeleton className="h-4 w-16 rounded-full bg-zinc-50" />
        </div>
        <div className="flex overflow-x-auto space-x-5 no-scrollbar">
           {[1, 2].map(i => (
             <div key={i} className="min-w-[280px] bg-white rounded-3xl overflow-hidden border border-zinc-50 shadow-sm">
               <Skeleton className="h-36 w-full bg-zinc-100" />
               <div className="p-4 space-y-3">
                 <Skeleton className="h-5 w-32 rounded-lg bg-zinc-100" />
                 <Skeleton className="h-3 w-20 rounded-full bg-zinc-50" />
               </div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 content-visibility-auto transform-gpu">
      <div className="flex items-center justify-between mb-6 px-6">
        <div className="space-y-0.5">
           <h2 className="text-2xl font-black tracking-tighter uppercase italic text-gray-900 leading-none">
             Explore <span className="text-primary">Hub</span>
           </h2>
           <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.3em]">Premium Stores Nearby</p>
        </div>
        <button 
          onClick={() => router.push('/stores')}
          className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 active:scale-95 transition-all"
        >
          View All <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className={cn("flex overflow-x-auto space-x-5 px-6 no-scrollbar pb-4 transition-opacity", isPending && "opacity-50")}>
        {filteredVendors.map((store: any) => {
          const displayImage = store.bannerUrl || store.imageUrl || `https://picsum.photos/seed/${store.id}/800/400`;
          const mins = currentMinutes ?? 720;
          const scheduleOpen = isStoreScheduleOpen(store, mins);
          const isOffline = store.isOnline === false || !scheduleOpen;
          
          return (
            <button 
              onClick={() => handleStoreClick(store.id)}
              key={store.id} 
              className={cn(
                "block text-left min-w-[280px] max-w-[280px] bg-white rounded-3xl overflow-hidden shadow-sm border border-border transition-all active:scale-[0.98] shrink-0 transform-gpu group",
                isOffline && "opacity-90 grayscale-[0.3]"
              )}
            >
              <div className="relative h-36 w-full bg-muted overflow-hidden">
                <Image src={displayImage} alt={store.storeName} fill className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" unoptimized />
                {isOffline && (
                  <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="text-white font-black text-lg uppercase italic tracking-tighter border-2 border-white/30 px-4 py-1.5 rounded-xl backdrop-blur-md">CLOSED</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-lg font-black text-gray-900 italic uppercase tracking-tighter truncate leading-tight flex-1 mr-2">{store.storeName}</h3>
                  <div className="bg-[#15803d] text-white px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm shrink-0">
                    <span className="text-[10px] font-black">{store.rating || '0.0'}</span>
                    <Star className="h-2.5 w-2.5 fill-white" />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-0.5 text-[9px] font-bold text-gray-500 uppercase">
                   <div className="flex items-center gap-1"><Clock className="h-3 w-3" /><span>{store.deliveryTime || '20 MIN'}</span></div>
                   <div className="h-2.5 w-[1px] bg-gray-200" />
                   <div className="flex items-center gap-1 max-w-[120px] truncate"><MapPin className="h-3 w-3" /><span>{store.town || 'Nearby'}</span></div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});

StoreSection.displayName = "StoreSection";
