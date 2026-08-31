"use client"

import * as React from "react"
import { Star, Clock, ArrowRight } from "lucide-react"
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

/**
 * @fileOverview StoreSection with Real-time Distance Matrix Delivery Time.
 */
export const StoreSection = React.memo(({ activeMode = 'Food', initialData = [] }: { activeMode?: string, initialData?: any[] }) => {
  const firestore = useFirestore();
  const router = useRouter();
  
  const [activeZoneId, setActiveZoneId] = React.useState<string | null>(null);
  const [currentTimeMins, setCurrentTimeMins] = React.useState<number | null>(null);
  const [deliveryTimes, setDeliveryTimes] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    const updateZone = () => {
      setActiveZoneId(localStorage.getItem('active_zone_id'));
    };
    updateZone();
    window.addEventListener('user-address-updated', updateZone);
    
    const syncTime = () => {
      const now = new Date();
      setCurrentTimeMins(now.getHours() * 60 + now.getMinutes());
    };
    syncTime();
    
    return () => {
      window.removeEventListener('user-address-updated', updateZone);
    };
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'), limit(100));
  }, [firestore]);

  const { data: dbVendors } = useCollection<any>(vendorsQuery, 'home_vendors_v4_instant', initialData);

  // REAL-TIME DISTANCE CALCULATION
  React.useEffect(() => {
    if (typeof window === 'undefined' || !dbVendors || dbVendors.length === 0) return;

    const userLat = localStorage.getItem('user_lat');
    const userLng = localStorage.getItem('user_lng');

    if (!userLat || !userLng) return;

    const calculateTimes = () => {
      if (typeof google === 'undefined' || !google.maps) return;

      const service = new google.maps.DistanceMatrixService();
      const origin = new google.maps.LatLng(parseFloat(userLat), parseFloat(userLng));
      const targets = dbVendors.filter(v => v.lat && v.lng);

      if (targets.length === 0) return;

      service.getDistanceMatrix({
        origins: [origin],
        destinations: targets.map(v => new google.maps.LatLng(v.lat, v.lng)),
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      }, (response, status) => {
        if (status === 'OK' && response && response.rows[0]) {
          const times: Record<string, string> = {};
          response.rows[0].elements.forEach((el, idx) => {
            if (el.status === 'OK') {
              const mins = Math.ceil(el.duration.value / 60) + 12; // 12 min prep time
              times[targets[idx].id] = `${mins} min`;
            }
          });
          setDeliveryTimes(times);
        }
      });
    };

    const timer = setTimeout(calculateTimes, 3500);
    return () => clearTimeout(timer);
  }, [dbVendors, activeZoneId]);

  const filteredVendors = React.useMemo(() => {
    const list = (dbVendors && dbVendors.length > 0) ? dbVendors : (initialData || []);
    return list.filter(v => {
      if (activeZoneId) {
        if (v.zoneId && v.zoneId !== activeZoneId && v.zoneId !== 'global') {
          return false;
        }
      }
      return (v.category || 'Food').toLowerCase() === activeMode.toLowerCase();
    }).sort((a, b) => {
      const onlineA = a.isOnline !== false && isStoreScheduleOpen(a, currentTimeMins) ? 1 : 0;
      const onlineB = b.isOnline !== false && isStoreScheduleOpen(b, currentTimeMins) ? 1 : 0;
      if (onlineA !== onlineB) return onlineB - onlineA;
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [dbVendors, initialData, activeMode, activeZoneId, currentTimeMins]);

  if (filteredVendors.length === 0) return null;

  return (
    <div className="py-4 overflow-hidden bg-white">
      <div className="flex items-center justify-between mb-4 px-6">
        <h2 className="text-xl font-black tracking-tighter uppercase italic text-gray-900 leading-none">
          Explore <span className="text-primary">Hub</span>
        </h2>
        <button onClick={() => router.push('/stores/')} className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1">VIEW ALL <ArrowRight className="h-3 w-3" /></button>
      </div>

      <Carousel className="w-full" opts={{ loop: true, align: 'center' }}>
        <CarouselContent className="-ml-3">
          {filteredVendors.map((store: any) => (
            <CarouselItem key={store.id} className="pl-3 basis-[65%] sm:basis-[50%]">
              <button 
                onClick={() => {
                  const storeSlug = store.slug || slugify(store.storeName) || store.id;
                  router.push(`/store/${storeSlug}/`);
                }}
                className="block text-left w-full rounded-[2.5rem] overflow-hidden shadow-xl group border border-white/10 relative transform-gpu active:scale-95 transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#8C7A63] via-[#B8A38B] to-[#D9C4A9]" />
                <div className="relative h-28 w-full overflow-hidden z-10">
                  <Image 
                    src={store.imageUrl || "https://picsum.photos/seed/store/400/300"} 
                    alt={store.storeName || "ShopyKart Store"} 
                    fill 
                    className="object-cover" 
                    unoptimized 
                  />
                </div>
                <div className="p-4 relative z-20 text-white">
                  <h3 className="text-sm font-black italic uppercase leading-tight mb-2 truncate">{store.storeName}</h3>
                  <div className="flex items-center justify-between">
                    <div className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1 border border-white/20 shadow-lg">
                       <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                       <span className="text-[10px] font-black">{store.rating || '4.8'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-black text-white/90 uppercase tracking-widest italic">
                       <Clock className="h-3 w-3" /> {deliveryTimes[store.id] || store.deliveryTime || '25 min'}
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
