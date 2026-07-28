
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

/**
 * @fileOverview StoreSection with Clean SEO Links (No IDs in URL).
 */
export const StoreSection = React.memo(({ activeMode = 'Food' }: { activeMode?: string }) => {
  const firestore = useFirestore();
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [activeZoneId, setActiveZoneId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const updateLoc = () => {
      setActiveZoneId(localStorage.getItem('active_zone_id'));
    };
    updateLoc();
    window.addEventListener('user-address-updated', updateLoc);
    return () => window.removeEventListener('user-address-updated', updateLoc);
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'), limit(150));
  }, [firestore]);

  const { data: dbVendors, loading } = useCollection<any>(vendorsQuery, 'home_stores_v2');

  const filteredVendors = React.useMemo(() => {
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
    // Prioritize Slug, Fallback to ID but keep it clean
    const cleanSlug = store.slug || slugify(store.storeName) || store.id;
    startTransition(() => {
      router.push(`/store/${cleanSlug}`);
    });
  };

  if (loading && !dbVendors) return null;

  return (
    <div className="py-4 overflow-hidden bg-white content-visibility-auto">
      <div className="flex items-center justify-between mb-3 px-6">
        <h2 className="text-lg font-black tracking-tighter uppercase italic text-gray-900 leading-none">
          Explore <span className="text-primary">Hub</span>
        </h2>
      </div>

      <Carousel 
        className="w-full" 
        opts={{ 
          loop: true, 
          align: 'center',
          skipSnaps: false
        }}
      >
        <CarouselContent className="-ml-3">
          {filteredVendors.map((store: any) => (
            <CarouselItem key={store.id} className="pl-3 basis-[65%] sm:basis-[50%]">
              <button 
                onClick={() => handleStoreClick(store)}
                className={cn(
                  "block text-left w-full rounded-[2rem] overflow-hidden shadow-lg transform-gpu group border border-white/10 relative transition-opacity duration-300",
                  isPending && "opacity-50"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#8C7A63] via-[#B8A38B] to-[#D9C4A9] z-0" />
                
                <div className="relative h-24 w-full overflow-hidden z-10">
                  <Image 
                    src={store.imageUrl} 
                    alt={store.storeName} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform duration-700" 
                    unoptimized 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                <div className="p-4 relative z-20 text-white">
                  <h3 className="text-sm font-black italic uppercase leading-tight mb-1 truncate drop-shadow-sm">
                    {store.storeName}
                  </h3>
                  <p className="text-[8px] font-bold text-white/80 uppercase tracking-widest mb-2 truncate italic">
                    {store.category || 'Premium Selection'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-lg flex items-center gap-1 border border-white/20 shadow-sm">
                       <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                       <span className="text-[10px] font-black">{store.rating || '4.8'}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[9px] font-black text-white/90 italic tracking-tight">
                       <Clock className="h-3 w-3" />
                       {store.deliveryTime || '25 min'}
                    </div>
                  </div>
                </div>

                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
});

StoreSection.displayName = "StoreSection";
