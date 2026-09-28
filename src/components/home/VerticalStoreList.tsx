
'use client';

import React, { useMemo, useState, useEffect, memo } from 'react';
import { Search, MapPin, Store, Star, Clock, ChevronRight, Loader2, Award } from 'lucide-react';
import { cn, slugify } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, limit } from 'firebase/firestore';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

/**
 * @fileOverview VerticalStoreList - Replaces vertical product grid on home page.
 * Optimized for rapid scanning and makkhan-speed data loading.
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
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [currentTimeMins, setCurrentTimeMins] = useState<number | null>(null);

  useEffect(() => {
    const updateZone = () => {
      setActiveZoneId(typeof window !== 'undefined' ? localStorage.getItem('active_zone_id') : null);
    };
    updateZone();
    window.addEventListener('user-address-updated', updateZone);

    const syncTime = () => {
      const now = new Date();
      setCurrentTimeMins(now.getHours() * 60 + now.getMinutes());
    };
    syncTime();
    const interval = setInterval(syncTime, 60000);

    return () => {
      window.removeEventListener('user-address-updated', updateZone);
      clearInterval(interval);
    };
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);

  const { data: dbVendors, loading } = useCollection<any>(vendorsQuery, 'home_vertical_stores_v1', initialData);

  const filteredVendors = useMemo(() => {
    const list = (dbVendors && dbVendors.length > 0) ? dbVendors : initialData;
    if (!list) return [];
    
    const searchLower = searchQuery.toLowerCase().trim();

    return list.filter(v => {
      // 1. Zone Matching
      if (activeZoneId) {
        if (v.zoneId && v.zoneId !== activeZoneId && v.zoneId !== 'global') {
          return false;
        }
      }

      // 2. Mode Filter (Food/Medical/Beauty)
      if ((v.category || 'Food').toLowerCase() !== activeMode.toLowerCase()) return false;

      // 3. Search Matching
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

  return (
    <div className="px-4 py-8 bg-white min-h-[600px] content-visibility-auto">
      <div className="flex items-center justify-between mb-6 px-2">
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">
           Top <span className="text-primary">Hubs</span> Near You
        </h2>
        <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase text-[10px]">
          {filteredVendors.length} STORES
        </Badge>
      </div>

      <div className="space-y-6">
        {loading && !dbVendors ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-44 w-full bg-gray-50 rounded-[2.5rem] animate-pulse" />
            ))}
          </div>
        ) : filteredVendors.length > 0 ? (
          filteredVendors.map((store: any) => {
            const displayImage = store.bannerUrl || store.imageUrl || `https://picsum.photos/seed/${store.id}/800/400`;
            const isOpen = isStoreScheduleOpen(store, currentTimeMins);
            const isOffline = store.isOnline === false || !isOpen;
            const storeSlug = store.slug || slugify(store.storeName) || store.id;

            return (
              <button 
                key={store.id}
                onClick={() => router.push(`/store/${storeSlug}/`)}
                className={cn(
                  "w-full text-left bg-white rounded-[2.5rem] overflow-hidden border-2 transition-all active:scale-[0.98] group relative transform-gpu shadow-sm",
                  isOffline ? "border-gray-100 opacity-80" : "border-border/60 hover:shadow-xl hover:border-primary/20"
                )}
              >
                <div className="flex p-4 gap-4 items-center">
                  <div className="relative h-24 w-24 rounded-[1.75rem] overflow-hidden bg-muted border shrink-0">
                    <Image src={displayImage} alt={store.storeName} fill className={cn("object-cover group-hover:scale-110 transition-transform duration-700", isOffline && "grayscale")} unoptimized />
                    {isOffline && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                        <span className="text-white font-black text-[8px] uppercase tracking-widest border border-white/30 px-2 py-0.5 rounded-lg">Closed</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center gap-1.5 mb-1">
                       <h3 className="font-black text-xl italic uppercase tracking-tighter text-gray-900 truncate leading-none">{store.storeName}</h3>
                       {Number(store.rating) >= 4.5 && <Award className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />}
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                       <div className="bg-[#15803d] text-white px-2 py-0.5 rounded-lg flex items-center gap-1 shadow-sm">
                          <Star className="h-2.5 w-2.5 fill-white" />
                          <span className="text-[10px] font-black">{Number(store.rating || 4.0).toFixed(1)}</span>
                       </div>
                       <Badge className="bg-primary/5 text-primary border-none text-[8px] font-black uppercase px-2">{store.category || 'Gourmet'}</Badge>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                       <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-amber-500" /> {store.deliveryTime || '20 min'}</div>
                       <div className="flex items-center gap-1"><MapPin className="h-3 w-3 text-primary" /> {store.town}</div>
                    </div>
                  </div>

                  <div className="absolute right-6 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                     <ChevronRight className="h-6 w-6" />
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center py-24 opacity-30 flex flex-col items-center">
             <Store className="h-16 w-16 mb-4" />
             <p className="font-black italic uppercase text-xs">No stores matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
});

VerticalStoreList.displayName = "VerticalStoreList";
