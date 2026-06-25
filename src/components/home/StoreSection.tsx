
"use client"

import { Star, MapPin, Clock, ChevronRight, TrendingUp, Sparkles, Utensils } from "lucide-react"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import React, { useMemo, useState, useEffect, memo, useTransition } from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

/**
 * @fileOverview High-End Premium Store Section (Gourmet Edition).
 * Redesigned with Cinema-ratio images, Glassmorphism, and Deep Shadows.
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
          <div key={i} className="min-w-[320px] h-[340px] bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-4 animate-pulse">
            <div className="h-48 bg-gray-50 rounded-[2rem] mb-6" />
            <div className="h-6 bg-gray-100 rounded-md w-3/4 mb-3" />
            <div className="h-4 bg-gray-50 rounded-md w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (filteredVendors.length === 0 && !loading) return null;

  return (
    <div className="py-8 content-visibility-auto transform-gpu">
      <div className="flex items-center justify-between mb-8 px-6">
        <div className="space-y-1">
           <h2 className="text-3xl font-black tracking-tighter uppercase italic text-[#1A1A1A] leading-none">
             Gourmet <span className="text-primary">Selection</span>
           </h2>
           <div className="flex items-center gap-2">
              <span className="h-[2px] w-8 bg-primary rounded-full" />
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">The City's Best Flavors</p>
           </div>
        </div>
        <button 
          onClick={() => router.push('/stores')}
          className="h-10 w-10 bg-white border border-gray-100 shadow-xl rounded-2xl flex items-center justify-center text-primary active:scale-90 transition-transform"
        >
          <Sparkles className="h-5 w-5" />
        </button>
      </div>

      <div className={cn("flex overflow-x-auto space-x-6 px-6 no-scrollbar pb-8 transition-opacity", isPending && "opacity-50")}>
        {filteredVendors.map((store: any) => {
          // Optimized high-res placeholder to prevent "image futna"
          const displayImage = store.bannerUrl || store.imageUrl || `https://picsum.photos/seed/${store.id}/1200/600`;
          const isOffline = store.isOnline === false;
          
          return (
            <button 
              onClick={() => handleStoreClick(store.id)}
              key={store.id} 
              className={cn(
                "block text-left min-w-[320px] max-w-[320px] bg-white rounded-[3rem] overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.08)] border border-gray-100/60 transition-all active:scale-[0.98] shrink-0 will-change-transform transform-gpu group",
                isOffline && "opacity-90 grayscale-[0.4]"
              )}
            >
              {/* MAGNIFICENT IMAGE CONTAINER */}
              <div className="relative h-56 w-full bg-muted overflow-hidden">
                <Image 
                  src={displayImage} 
                  alt={store.storeName} 
                  fill 
                  className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-premium" 
                  unoptimized 
                  loading="lazy"
                  sizes="320px"
                />
                
                {/* COMPLEX GRADIENT OVERLAYS */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {isOffline && (
                  <div className="absolute inset-0 bg-black/70 z-30 flex items-center justify-center backdrop-blur-[3px] animate-in fade-in duration-500">
                    <span className="text-white font-black text-2xl uppercase italic tracking-tighter px-8 py-3 border-2 border-white/20 rounded-[1.5rem] backdrop-blur-xl shadow-2xl">
                      CLOSED
                    </span>
                  </div>
                )}

                {/* TOP LUXURY BADGES */}
                <div className="absolute top-5 left-5 flex gap-2">
                   <div className="bg-white/95 backdrop-blur-xl px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-2xl border border-white/50">
                      <span className="text-[11px] font-black text-gray-900">{store.rating || '4.4'}</span>
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                   </div>
                </div>

                {/* FLOATING STORE IDENTITY (SCREENSHOT STYLE) */}
                <div className="absolute bottom-6 left-5 right-5 flex items-end justify-between z-20">
                   <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-2">
                         <div className="bg-primary px-2 py-0.5 rounded-md shadow-lg shadow-primary/20">
                            <span className="text-[8px] font-black text-white uppercase tracking-widest italic">PREMIUM</span>
                         </div>
                         <div className="flex items-center gap-1 text-white/90">
                            <MapPin className="h-3 w-3 text-primary" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">{store.town || 'Nearby'}</span>
                         </div>
                      </div>
                      <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter truncate leading-tight drop-shadow-2xl">
                        {store.storeName}
                      </h3>
                   </div>
                   <div className="h-11 w-11 bg-white/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center text-white border border-white/20 group-hover:bg-primary group-hover:border-primary group-hover:rotate-6 transition-all shadow-xl">
                      <ChevronRight className="h-5 w-5" />
                   </div>
                </div>
              </div>

              {/* REFINED DETAILS SECTION */}
              <div className="p-7">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-6">
                     <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Delivery Time</span>
                        <div className="flex items-center gap-1.5">
                           <div className="bg-primary/10 p-1 rounded-md">
                              <Clock className="h-3 w-3 text-primary" />
                           </div>
                           <span className="text-xs font-black text-gray-700 uppercase italic">{store.deliveryTime || '20-25 MIN'}</span>
                        </div>
                     </div>
                     <div className="w-[1px] h-10 bg-gray-100" />
                     <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Menu Type</span>
                        <div className="flex items-center gap-1.5">
                           <div className="bg-amber-100 p-1 rounded-md">
                              <Utensils className="h-3 w-3 text-amber-600" />
                           </div>
                           <span className="text-xs font-black text-gray-700 uppercase italic">GOURMET</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                     <div className={cn(
                       "flex items-center gap-2 px-3 py-1.5 rounded-2xl border transition-all",
                       isOffline ? "bg-red-50/50 border-red-100 text-red-500" : "bg-emerald-50/50 border-emerald-100 text-emerald-600"
                     )}>
                        <div className={cn("h-1.5 w-1.5 rounded-full", isOffline ? "bg-red-500" : "bg-emerald-500 animate-pulse")} />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                           {isOffline ? 'OFFLINE' : 'LIVE'}
                        </span>
                     </div>
                  </div>
                </div>
              </div>
              
              {/* INNER HIGHLIGHT SHINE */}
              <div className="absolute top-0 left-0 w-full h-[1px] bg-white/20 pointer-events-none" />
            </button>
          );
        })}
      </div>
    </div>
  );
});

StoreSection.displayName = "StoreSection";
