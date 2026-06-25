"use client"

import { Star, MapPin, Clock, ChevronRight, TrendingUp, Sparkles } from "lucide-react"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import React, { useMemo, useState, useEffect, memo, useTransition } from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

/**
 * @fileOverview High-End Premium Store Section.
 * Redesigned with professional shadows, glassmorphism, and luxury typography.
 */
export const StoreSection = memo(({ activeMode = 'Food' }: { activeMode?: string }) => {
  const firestore = useFirestore();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [activeCity, setActiveCity] = useState<string | null>(null);

  useEffect(() => {
    const updateZone = () => {
      setActiveZoneId(localStorage.getItem('active_zone_id'));
      setActiveCity(localStorage.getItem('user_city'));
    };
    updateZone();
    window.addEventListener('user-address-updated', updateZone);
    return () => window.removeEventListener('user-address-updated', updateZone);
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);

  const { data: dbVendors, loading } = useCollection<any>(vendorsQuery);

  const filteredVendors = useMemo(() => {
    if (!dbVendors) return [];
    const targetCityNormalized = (activeCity || '').toLowerCase().trim();

    return dbVendors.filter(v => {
      const isApproved = v.status === 'approved' || !v.status;
      const matchesMode = (v.category || 'Food') === activeMode;
      
      if (activeZoneId || targetCityNormalized) {
        const matchesId = activeZoneId && v.zoneId === activeZoneId;
        const vTown = (v.town || '').toLowerCase().trim();
        
        const matchesTown = targetCityNormalized && (
          vTown === targetCityNormalized || 
          vTown.startsWith(targetCityNormalized) ||
          targetCityNormalized.startsWith(vTown)
        );

        if (targetCityNormalized === 'ranipur' && vTown === 'mauranipur') return false;
        if (targetCityNormalized === 'mauranipur' && vTown === 'ranipur') return false;

        if (!matchesId && !matchesTown) return false;
      }
      
      return isApproved && matchesMode;
    }).sort((a, b) => {
      const onlineA = a.isOnline !== false ? 1 : 0;
      const onlineB = b.isOnline !== false ? 1 : 0;
      return onlineB - onlineA;
    });
  }, [dbVendors, activeMode, activeZoneId, activeCity]);

  const handleStoreClick = (id: string) => {
    startTransition(() => {
      router.push(`/menu?vendor=${id}`);
    });
  };

  if (activeMode === 'Medical' || activeMode === 'Beauty') return null;

  if (loading && !dbVendors) {
    return (
      <div className="py-6 px-6 flex space-x-6 overflow-x-auto no-scrollbar">
        {[1, 2].map((i) => (
          <div key={i} className="min-w-[300px] h-72 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-4 animate-pulse">
            <div className="h-40 bg-gray-50 rounded-[1.75rem] mb-4" />
            <div className="h-6 bg-gray-50 rounded-md w-3/4 mb-2" />
            <div className="h-4 bg-gray-50 rounded-md w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (filteredVendors.length === 0 && !loading) return null;

  return (
    <div className="py-6 content-visibility-auto transform-gpu">
      <div className="flex items-center justify-between mb-6 px-6">
        <div className="space-y-0.5">
           <h2 className="text-2xl font-black tracking-tighter uppercase italic text-gray-900 leading-none">
             Partner <span className="text-primary">Gourmets</span>
           </h2>
           <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Curated City Selection</p>
        </div>
        <button 
          onClick={() => router.push('/stores')}
          className="bg-primary/5 text-primary px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest active:scale-90 transition-transform"
        >
          View All
        </button>
      </div>

      <div className={cn("flex overflow-x-auto space-x-5 px-6 no-scrollbar pb-6 transition-opacity", isPending && "opacity-50")}>
        {filteredVendors.map((store: any) => {
          const displayImage = store.bannerUrl || store.imageUrl || `https://picsum.photos/seed/${store.id}/800/400`;
          const isOffline = store.isOnline === false;
          
          return (
            <button 
              onClick={() => handleStoreClick(store.id)}
              key={store.id} 
              className={cn(
                "block text-left min-w-[310px] max-w-[310px] bg-white rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.06)] border border-gray-100 transition-all active:scale-[0.97] shrink-0 will-change-transform transform-gpu group",
                isOffline && "opacity-90 grayscale-[0.3]"
              )}
            >
              {/* IMAGE SECTION */}
              <div className="relative h-44 w-full bg-muted overflow-hidden">
                <Image 
                  src={displayImage} 
                  alt={store.storeName} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-1000" 
                  unoptimized 
                  loading="lazy" 
                />
                
                {/* GLASS OVERLAYS */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {isOffline && (
                  <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center backdrop-blur-[2px]">
                    <span className="text-white font-black text-2xl uppercase italic tracking-tighter px-6 py-2 border-2 border-white/30 rounded-2xl backdrop-blur-md shadow-2xl">
                      CLOSED NOW
                    </span>
                  </div>
                )}

                {/* TOP BADGES */}
                <div className="absolute top-4 left-4 flex gap-2">
                   <div className="bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-xl border border-white/50">
                      <span className="text-[10px] font-black text-gray-900">{store.rating || '4.4'}</span>
                      <Star className="h-3 w-3 fill-amber-500 text-amber-400" />
                   </div>
                   {!isOffline && (
                     <div className="bg-primary/90 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center gap-1.5 shadow-xl border border-white/20">
                        <TrendingUp className="h-3 w-3 text-white" />
                        <span className="text-[8px] font-black text-white uppercase tracking-tighter">Trending</span>
                     </div>
                   )}
                </div>

                {/* BOTTOM INFO OVERLAY */}
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-10">
                   <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-white/90 mb-1">
                        <MapPin className="h-3 w-3 text-primary" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] shadow-sm">{store.town || 'Nearby'}</span>
                      </div>
                      <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter truncate leading-none drop-shadow-lg">{store.storeName}</h3>
                   </div>
                   <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/20 group-hover:bg-primary transition-colors">
                      <ChevronRight className="h-5 w-5" />
                   </div>
                </div>
              </div>

              {/* DETAILS SECTION */}
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-5">
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Delivery</span>
                        <div className="flex items-center gap-1.5">
                           <Clock className="h-3 w-3 text-primary" />
                           <span className="text-[11px] font-black text-gray-700 uppercase italic">{store.deliveryTime || '20-25 MIN'}</span>
                        </div>
                     </div>
                     <div className="w-[1px] h-8 bg-gray-100" />
                     <div className="flex flex-col gap-0.5">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Pricing</span>
                        <div className="flex items-center gap-1">
                           <Sparkles className="h-3 w-3 text-amber-500" />
                           <span className="text-[11px] font-black text-gray-700 uppercase italic">BEST DEALS</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-1">
                     <div className={cn(
                       "flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-inner",
                       isOffline ? "bg-red-50 border-red-100 text-red-500" : "bg-green-50 border-green-100 text-green-600"
                     )}>
                        <div className={cn("h-1.5 w-1.5 rounded-full", isOffline ? "bg-red-500" : "bg-green-500 animate-pulse")} />
                        <span className="text-[9px] font-black uppercase tracking-widest">
                           {isOffline ? 'OFFLINE' : 'LIVE'}
                        </span>
                     </div>
                  </div>
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