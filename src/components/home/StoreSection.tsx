"use client"

import * as React from "react"
import { Star, Clock } from "lucide-react"
import Image from "next/image"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, limit } from "firebase/firestore"
import { cn, slugify } from "@/lib/utils"
import { useRouter } from "next/navigation"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { isStoreScheduleOpen } from "./PopularProducts"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * @fileOverview StoreSection - Lightning Rendering with Shimmer.
 */
export const StoreSection = React.memo(({ activeMode = 'Food' }: { activeMode?: string }) => {
  const firestore = useFirestore();
  const router = useRouter();
  
  // ATOMIC SYNC LOCATION ACCESS
  const activeZoneId = React.useMemo(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('active_zone_id');
    return null;
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'), limit(150));
  }, [firestore]);

  const { data: dbVendors, loading } = useCollection<any>(vendorsQuery, 'home_vendors_v4_instant');

  const filteredVendors = React.useMemo(() => {
    const list = dbVendors || [];
    return list.filter(v => {
      if (activeZoneId && v.zoneId && v.zoneId !== activeZoneId) return false;
      return (v.category || 'Food').toLowerCase() === activeMode.toLowerCase();
    }).sort((a, b) => {
      const onlineA = a.isOnline !== false && isStoreScheduleOpen(a) ? 1 : 0;
      const onlineB = b.isOnline !== false && isStoreScheduleOpen(b) ? 1 : 0;
      if (onlineA !== onlineB) return onlineB - onlineA;
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [dbVendors, activeMode, activeZoneId]);

  return (
    <div className="py-4 overflow-hidden bg-white min-h-[140px]">
      <div className="flex items-center justify-between mb-3 px-6">
        <h2 className="text-lg font-black tracking-tighter uppercase italic text-gray-900 leading-none">
          Explore <span className="text-primary">Hub</span>
        </h2>
      </div>

      <Carousel className="w-full" opts={{ loop: true, align: 'center' }}>
        <CarouselContent className="-ml-3">
          {(!dbVendors && loading) ? (
            [1, 2].map(i => (
              <CarouselItem key={i} className="pl-3 basis-[65%] sm:basis-[50%]">
                 <Skeleton className="w-full aspect-[16/10] rounded-[2.5rem]" />
              </CarouselItem>
            ))
          ) : filteredVendors.map((store: any) => (
            <CarouselItem key={store.id} className="pl-3 basis-[65%] sm:basis-[50%]">
              <button 
                onClick={() => router.push(`/store/${store.slug || slugify(store.storeName) || store.id}`)}
                className="block text-left w-full rounded-[2.5rem] overflow-hidden shadow-lg group border border-white/10 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#8C7A63] via-[#B8A38B] to-[#D9C4A9]" />
                <div className="relative h-24 w-full overflow-hidden z-10">
                  <Image src={store.imageUrl} alt={store.storeName} fill className="object-cover" unoptimized />
                </div>
                <div className="p-4 relative z-20 text-white">
                  <h3 className="text-sm font-black italic uppercase leading-tight mb-1 truncate">{store.storeName}</h3>
                  <div className="flex items-center justify-between">
                    <div className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1 border border-white/20">
                       <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                       <span className="text-[10px] font-black">{store.rating || '4.8'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-black text-white/90">
                       <Clock className="h-3 w-3" /> {store.deliveryTime || '25 min'}
                    </div>
                  </div>
                </div>
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
});

StoreSection.displayName = "StoreSection";
