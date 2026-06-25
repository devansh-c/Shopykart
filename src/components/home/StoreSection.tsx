
"use client"

import { Star, MapPin, Clock, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import React, { useMemo, useState, useEffect, memo, useTransition } from "react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

/**
 * @fileOverview Redesigned Compact Premium Store Section (Screenshot Style).
 * Updated: Reduced border-radius to "slightly rounded" as requested.
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

  const getRealisticRating = (id: string) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return (4.0 + (hash % 10) / 10).toFixed(1);
  };

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
      <div className="py-6 px-6 flex space-x-4 overflow-x-auto no-scrollbar">
        {[1, 2].map((i) => (
          <div key={i} className="min-w-[280px] h-[280px] bg-white rounded-2xl border border-gray-100 shadow-sm p-4 animate-pulse">
            <div className="h-36 bg-gray-50 rounded-xl mb-4" />
            <div className="h-5 bg-gray-100 rounded-md w-3/4 mb-2" />
            <div className="h-3 bg-gray-50 rounded-md w-1/2" />
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
          const isOffline = store.isOnline === false;
          const rating = getRealisticRating(store.id);
          
          return (
            <button 
              onClick={() => handleStoreClick(store.id)}
              key={store.id} 
              className={cn(
                "block text-left min-w-[280px] max-w-[280px] bg-white rounded-2xl overflow-hidden shadow-sm border border-border transition-all active:scale-[0.98] shrink-0 will-change-transform transform-gpu group",
                isOffline && "opacity-90 grayscale-[0.3]"
              )}
            >
              <div className="relative h-44 w-full bg-muted overflow-hidden">
                <Image 
                  src={displayImage} 
                  alt={store.storeName} 
                  fill 
                  className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                  unoptimized 
                  loading="lazy"
                />
                
                {isOffline && (
                  <div className="absolute inset-0 bg-black/60 z-30 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="text-white font-black text-lg uppercase italic tracking-tighter border-2 border-white/30 px-4 py-1.5 rounded-xl backdrop-blur-md">
                      CLOSED
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-xl font-black text-gray-900 italic uppercase tracking-tighter truncate leading-tight flex-1 mr-2">
                    {store.storeName}
                  </h3>
                  <div className="bg-[#15803d] text-white px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm shrink-0">
                    <span className="text-[10px] font-black">{rating}</span>
                    <Star className="h-2.5 w-2.5 fill-white" />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                   <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{store.deliveryTime || '20 MIN'}</span>
                   </div>
                   <div className="h-3 w-[1px] bg-gray-200" />
                   <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest truncate max-w-[120px]">{store.town || 'Nearby'}</span>
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
