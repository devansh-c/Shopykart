'use client';

import React, { useMemo, useState, useEffect, memo } from 'react';
import { MapPin, Star, Award, Timer } from 'lucide-react';
import { cn, slugify } from '@/lib/utils';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

/**
 * @fileOverview Super-Optimized VerticalStoreList.
 * UI UPDATE: Reduced rounding to 1.5rem for professional look.
 */
export const VerticalStoreList = memo(({ 
  searchQuery = '', 
  activeMode = 'Food', 
  initialData = [] 
}: { 
  searchQuery?: string, 
  activeMode?: string, 
  initialData?: any[] 
}) => {
  const router = useRouter();
  const firestore = useFirestore();

  const [activeZoneId, setActiveZoneId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('active_zone_id');
    return null;
  });

  const [currentTimeMins, setCurrentTimeMins] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const now = new Date();
      return now.getHours() * 60 + now.getMinutes();
    }
    return null;
  });

  useEffect(() => {
    const updateZone = () => {
      setActiveZoneId(localStorage.getItem('active_zone_id'));
    };
    window.addEventListener('user-address-updated', updateZone);
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTimeMins(now.getHours() * 60 + now.getMinutes());
    }, 60000);

    return () => {
      window.removeEventListener('user-address-updated', updateZone);
      clearInterval(interval);
    };
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);

  const { data: dbVendors, loading } = useCollection<any>(vendorsQuery, 'home_vstores_v5', initialData);

  const filteredVendors = useMemo(() => {
    const list = (dbVendors && dbVendors.length > 0) ? dbVendors : (initialData.length > 0 ? initialData : []);
    if (!list || list.length === 0) return [];
    
    const searchLower = searchQuery.toLowerCase().trim();
    const currentMode = activeMode.toLowerCase();

    return list.filter(v => {
      if (activeZoneId) {
        if (v.zoneId && v.zoneId !== activeZoneId && v.zoneId !== 'global') {
          return false;
        }
      }

      const storeCat = (v.category || 'Food').toLowerCase();
      const isFoodRequest = currentMode === 'food';
      const isStoreFood = storeCat === 'food' || storeCat === 'restaurant' || storeCat === 'bakery';

      if (isFoodRequest) {
        if (!isStoreFood) return false;
      } else if (storeCat !== currentMode) {
        return false;
      }

      const matchesSearch = !searchLower || 
        v.storeName?.toLowerCase().includes(searchLower) || 
        v.category?.toLowerCase().includes(searchLower);
      
      const isApproved = v.status === 'approved' || !v.status;
      
      return matchesSearch && isApproved;
    }).sort((a, b) => {
      const isOpenA = a.isOnline !== false && isStoreScheduleOpen(a, currentTimeMins);
      const isOpenB = b.isOnline !== false && isStoreScheduleOpen(b, currentTimeMins);

      if (isOpenA !== isOpenB) return isOpenA ? -1 : 1;
      const ratingA = Number(a.rating) || 0;
      const ratingB = Number(b.rating) || 0;
      return ratingB - ratingA;
    });
  }, [dbVendors, initialData, activeZoneId, searchQuery, activeMode, currentTimeMins]);

  const showInitialSkeletons = loading && filteredVendors.length === 0;

  return (
    <div className="px-4 py-6 bg-white min-h-[400px]">
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
           Best <span className="text-primary">Hubs</span>
        </h2>
        <Badge variant="outline" className="rounded-full border-gray-200 text-gray-400 font-black uppercase text-[10px]">
          {filteredVendors.length} STORES
        </Badge>
      </div>

      <div className="space-y-12">
        {showInitialSkeletons ? (
          <div className="space-y-10">
            {[1, 2].map(i => (
              <div key={i} className="space-y-4">
                <div className="h-52 w-full bg-gray-50 rounded-[1.5rem]" />
                <div className="flex justify-between px-4">
                  <div className="h-6 w-1/3 bg-gray-50 rounded-full" />
                  <div className="h-6 w-12 bg-gray-50 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredVendors.length > 0 ? (
          filteredVendors.map((store: any) => {
            const displayImage = store.bannerUrl || store.imageUrl || `https://picsum.photos/seed/${store.id}/800/400`;
            const isOpen = isStoreScheduleOpen(store, currentTimeMins);
            const isOffline = store.isOnline === false || !isOpen;
            const storeSlug = store.slug || slugify(store.storeName) || store.id;
            const isBestRated = Number(store.rating) >= 4.5;

            return (
              <button 
                key={store.id}
                onClick={() => router.push(`/store/${storeSlug}/`)}
                className={cn(
                  "w-full text-left bg-white transition-all active:scale-[0.98] group relative",
                  isOffline && "opacity-75 grayscale-[0.3]"
                )}
              >
                <div className="relative w-full aspect-[18/9] rounded-[1.5rem] overflow-hidden border border-gray-100 bg-gray-50">
                  <Image 
                    src={displayImage} 
                    alt={store.storeName} 
                    fill 
                    className={cn("object-cover", isOffline && "grayscale")} 
                    unoptimized 
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60" />

                  {isOffline && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                      <span className="text-white font-black text-xl uppercase italic border-2 border-white/30 px-6 py-2 rounded-2xl shadow-xl">Closed Now</span>
                    </div>
                  )}

                  {!isOffline && isBestRated && (
                    <div className="absolute top-4 left-4 z-20">
                      <Badge className="bg-amber-400 text-black border-none font-black text-[7px] px-3 py-1 rounded-lg">
                        <Award className="h-2.5 w-2.5 mr-1 fill-black" /> BEST IN TOWN
                      </Badge>
                    </div>
                  )}

                  {!isOffline && (
                    <div className="absolute bottom-4 right-4 z-20">
                       <div className="bg-white px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm border border-gray-100">
                          <Timer className="h-3.5 w-3.5 text-primary" />
                          <span className="text-[11px] font-black text-gray-900 uppercase italic tracking-tighter">{store.deliveryTime || '20 min'}</span>
                       </div>
                    </div>
                  )}
                </div>

                <div className="pt-5 px-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-4">
                      <h3 className="font-black text-2xl italic uppercase tracking-tighter text-gray-900 leading-none mb-1.5 truncate group-hover:text-primary transition-colors">
                        {store.storeName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest italic">{store.category || 'Premium Store'}</p>
                        <span className="h-1 w-1 bg-gray-200 rounded-full" />
                        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 italic uppercase">
                          <MapPin className="h-3 w-3 text-primary" />
                          {store.town || 'Local'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#15803d] text-white px-2.5 py-1.5 rounded-xl flex flex-col items-center gap-0 border border-green-700">
                      <div className="flex items-center gap-1">
                        <span className="text-base font-black italic">{Number(store.rating || 4.0).toFixed(1)}</span>
                        <Star className="h-3 w-3 fill-white stroke-none" />
                      </div>
                      <span className="text-[7px] font-black uppercase opacity-60 leading-none">Rating</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center py-24 opacity-20 flex flex-col items-center">
             <MapPin className="h-16 w-16 mb-4" />
             <p className="font-black italic uppercase text-sm tracking-widest text-center">
               No stores found in your zone
             </p>
          </div>
        )}
      </div>
    </div>
  );
});

VerticalStoreList.displayName = "VerticalStoreList";