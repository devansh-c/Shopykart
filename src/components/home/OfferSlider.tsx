"use client"

import * as React from "react"
import Image from "next/image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import Autoplay from "embla-carousel-autoplay"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * @fileOverview OfferSlider with Server-Side Initial Data and Priority Loading.
 */
export function OfferSlider({ initialData }: { initialData?: any[] }) {
  const firestore = useFirestore();
  const [activeZoneId, setActiveZoneId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const updateZone = () => {
      setActiveZoneId(localStorage.getItem('active_zone_id'));
    };
    updateZone();
    window.addEventListener('user-address-updated', updateZone);
    return () => window.removeEventListener('user-address-updated', updateZone);
  }, []);

  const [api, setApi] = React.useState<any>();
  const [current, setCurrent] = React.useState(0);

  const bannersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'banners');
  }, [firestore]);

  const { data: dbBanners, loading } = useCollection<any>(bannersQuery, 'home_banners_v4_instant');
  
  const displayBanners = React.useMemo(() => {
    const list = dbBanners || initialData || [];
    if (activeZoneId) {
      return list.filter((b: any) => !b.zoneId || b.zoneId === activeZoneId);
    }
    return list;
  }, [dbBanners, initialData, activeZoneId]);

  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="w-full py-4 relative group overflow-hidden bg-white min-h-[180px]">
      {(displayBanners.length === 0 && loading) ? (
        <div className="px-6">
           <Skeleton className="aspect-[18/9] w-full rounded-[2.5rem] shadow-sm" />
        </div>
      ) : (displayBanners.length > 0) ? (
        <>
          <Carousel 
            setApi={setApi}
            className="w-full" 
            opts={{ loop: true, align: 'center' }}
            plugins={[Autoplay({ delay: 3500, stopOnInteraction: false })]}
          >
            <CarouselContent className="-ml-1">
              {displayBanners.map((banner: any, idx: number) => (
                <CarouselItem key={banner.id} className="pl-1 basis-[88%] sm:basis-[85%] flex justify-center">
                  <div className="relative aspect-[18/9] w-full overflow-hidden rounded-[2.5rem] bg-muted border-4 border-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] transform-gpu transition-all duration-500">
                    <Image 
                      src={banner.imageUrl} 
                      alt="Offer" 
                      fill 
                      className="object-cover" 
                      priority={idx === 0}
                      unoptimized 
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="flex justify-center gap-1.5 mt-4">
            {displayBanners.map((_, i) => (
              <div key={i} className={cn("h-1 transition-all rounded-full", current === i ? "w-5 bg-amber-400" : "w-1 bg-gray-200")} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}