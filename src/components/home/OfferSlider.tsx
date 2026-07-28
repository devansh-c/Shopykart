
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

export function OfferSlider() {
  const firestore = useFirestore();
  const [activeZoneId] = React.useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('active_zone_id');
    return null;
  });

  const [api, setApi] = React.useState<any>();
  const [current, setCurrent] = React.useState(0);

  const bannersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'banners');
  }, [firestore]);

  const { data: dbBanners, loading } = useCollection<any>(bannersQuery, 'home_banners_v6_instant');
  
  const filteredBanners = React.useMemo(() => {
    if (!dbBanners) return [];
    if (activeZoneId) {
      return dbBanners.filter((b: any) => !b.zoneId || b.zoneId === activeZoneId);
    }
    return dbBanners;
  }, [dbBanners, activeZoneId]);

  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="w-full py-4 relative group overflow-hidden bg-white min-h-[160px]">
      {!dbBanners && loading ? (
        <div className="px-6">
           <div className="aspect-[18/9] w-full rounded-[2rem] bg-muted/20 animate-pulse border-4 border-white shadow-sm" />
        </div>
      ) : (filteredBanners.length > 0) ? (
        <>
          <Carousel 
            setApi={setApi}
            className="w-full" 
            opts={{ loop: true, align: 'center' }}
            plugins={[Autoplay({ delay: 3500, stopOnInteraction: false })]}
          >
            <CarouselContent className="-ml-1">
              {filteredBanners.map((banner: any) => (
                <CarouselItem key={banner.id} className="pl-1 basis-[88%] sm:basis-[85%] flex justify-center">
                  <div className="relative aspect-[18/9] w-full overflow-hidden rounded-[2rem] bg-muted border-4 border-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] transform-gpu transition-all duration-500">
                    <Image src={banner.imageUrl} alt="Offer" fill className="object-cover" unoptimized />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="flex justify-center gap-1.5 mt-4">
            {filteredBanners.map((_, i) => (
              <div key={i} className={cn("h-1 transition-all rounded-full", current === i ? "w-5 bg-amber-400" : "w-1 bg-gray-200")} />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
