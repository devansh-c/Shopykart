'use client';

import React, { useMemo, useState, useEffect, memo } from 'react';
import { MapPin, Store, Star, Loader2, Award, Timer } from 'lucide-react';
import { cn, slugify } from '@/lib/utils';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

/**
 * @fileOverview Optimized VerticalStoreList - Instant Zone Recovery.
 * Eliminates the 4-5s delay by initializing state from storage before the first render cycle.
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

  // 1. INSTANT ZONE RECOVERY: Initialize state immediately from storage to avoid useEffect delay
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

  const { data: dbVendors, loading } = useCollection<any>(vendorsQuery, 'home_vertical_stores_v4', initialData);

  const filteredVendors = useMemo(() => {
    // Use cache or initial data immediately
    const list = (dbVendors && dbVendors.length > 0) ? dbVendors : initialData;
    if (!list || list.length === 0) return [];
    
    const searchLower = searchQuery.toLowerCase().trim();
    const currentMode = activeMode.toLowerCase();

    return list.filter(v => {
      // Zone Filtering
      if (activeZoneId) {
        if (v.zoneId && v.zoneId !== activeZoneId && v.zoneId !== 'global') {
          return false;
        }
      }

      // Category / Service Mode Check
      const storeCat = (v.category || 'Food').toLowerCase();
      const isFoodRequest = currentMode === 'food';
      const isStoreFood = storeCat === 'food' || storeCat === 'restaurant';

      if (isFoodRequest) {
        if (!isStoreFood) return false;
      } else {
        if (storeCat !== currentMode) return false;
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

  // Show data if we have it (from cache), even if still syncing (loading=true)
  const showSkeletons = loading && (!dbVendors || dbVendors.length === 0);

  return (
    <div className="px-4 py-8 bg-white min-h-[400px] content-visibility-auto">
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">
           Top <span className="text-primary">Hubs</span> Near You
        </h2>
        <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase text-[10px]">
          {filteredVendors.length} STORES
        </Badge>
      </div>

      <div className="space-y-10">
        {showSkeletons ? (
          <div className="space-y-8 animate-in fade-in duration-300">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-4">
                <div className="h-56 w-full bg-gray-50 rounded-[2.5rem] animate-pulse" />
                <div className="flex justify-between px-4">
                  <div className="h-6 w-1/3 bg-gray-50 rounded-full animate-pulse" />
                  <div className="h-6 w-12 bg-gray-50 rounded-full animate-pulse" />
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
                  "w-full text-left bg-white rounded-[2.5rem] transition-all active:scale-[0.98] group relative transform-gpu",
                  isOffline && "opacity-75 grayscale-[0.3]"
                )}
              >
                <div className="relative w-full aspect-[18/9] rounded-[2.5rem] overflow-hidden shadow-lg border border-black/[0.03]">
                  <Image src={displayImage} alt={store.storeName} fill className={cn("object-cover group-hover:scale-105 transition-transform duration-1000", isOffline && "grayscale")} unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

                  {isOffline && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-10">
                      <span className="text-white font-black text-xl uppercase italic border-2 border-white/40 px-6 py-2 rounded-2xl shadow-2xl">Closed Now</span>
                    </div>
                  )}

                  {!isOffline && isBestRated && (
                    <div className="absolute top-4 left-4 z-20">
                      <Badge className="bg-amber-400 text-black border-none font-black text-[8px] px-3 py-1 rounded-lg shadow-xl animate-pulse">
                        <Award className="h-2.5 w-2.5 mr-1 fill-black" /> BEST IN TOWN
                      </Badge>
                    </div>
                  )}

                  {!isOffline && (
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
                       <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xl border border-white/20">
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
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest italic">{store.category || 'Premium Store'}</p>
                        <span className="h-1 w-1 bg-gray-300 rounded-full" />
                        <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500 italic uppercase">
                          <MapPin className="h-3 w-3 text-primary" />
                          {store.town || 'Local'}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#15803d] text-white px-2.5 py-1.5 rounded-xl flex flex-col items-center gap-0 shadow-lg border border-green-600">
                      <div className="flex items-center gap-1">
                        <span className="text-base font-black italic">{Number(store.rating || 4.0).toFixed(1)}</span>
                        <Star className="h-3 w-3 fill-white stroke-none" />
                      </div>
                      <span className="text-[7px] font-black uppercase opacity-60 leading-none">Rating</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-dashed border-gray-100 flex items-center gap-3">
                     <div className="h-5 w-5 bg-blue-50 rounded-md flex items-center justify-center"><Badge variant="outline" className="border-none p-0 text-[8px] font-black text-blue-600 uppercase">PRO</Badge></div>
                     <p className="text-[10px] font-bold text-gray-400 uppercase italic tracking-wide">Free delivery above ₹199 on this hub</p>
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center py-24 opacity-30 flex flex-col items-center">
             <Store className="h-20 w-20 mb-4" />
             <p className="font-black italic uppercase text-sm tracking-widest text-center">
               No hubs matching your preference in {activeZoneId ? 'this zone' : 'your area'}
             </p>
             <button 
               onClick={() => window.dispatchEvent(new CustomEvent('open-location-picker'))}
               className="mt-6 text-[10px] font-black text-primary uppercase underline underline-offset-4"
             >
               Change Location
             </button>
          </div>
        )}
      </div>
    </div>
  );
});

VerticalStoreList.displayName = "VerticalStoreList";
