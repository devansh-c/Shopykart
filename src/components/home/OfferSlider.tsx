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

// INSTANT FALLBACK DATASET
const fallbackBanners = [
  { id: 'f1', title: '50% OFF', imageUrl: 'https://picsum.photos/seed/shopy-hero/800/400', tag: 'First Order' },
  { id: 'f2', title: 'Weekend Feast', imageUrl: 'https://picsum.photos/seed/shopy-weekend/800/400', tag: 'Special' },
  { id: 'f3', title: 'Midnight Deal', imageUrl: 'https://picsum.photos/seed/shopy-midnight/800/400', tag: 'Night Only' }
];

/**
 * @fileOverview OfferSlider with Instant-Load Fallback.
 * Renders local mock data instantly and syncs live data silently in background.
 */
export function OfferSlider() {
  const firestore = useFirestore();
  const [activeZoneId, setActiveZoneId] = React.useState<string | null>(null);
  const [api, setApi] = React.useState<any>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    const updateZone = () => {
      setActiveZoneId(localStorage.getItem('active_zone_id'));
    };
    updateZone();
    window.addEventListener('user-address-updated', updateZone);
    return () => window.removeEventListener('user-address-updated', updateZone);
  }, []);

  const bannersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'banners');
  }, [firestore]);

  const { data: dbBanners } = useCollection<any>(bannersQuery, 'home_banners_v4_instant');
  
  // LOGIC: Start with fallbackBanners (0ms), update when dbBanners arrives
  const displayBanners = React.useMemo(() => {
    const list = (dbBanners && dbBanners.length > 0) ? dbBanners : fallbackBanners;
    
    if (activeZoneId && list.length > 0) {
      const filtered = list.filter((b: any) => !b.zoneId || b.zoneId === activeZoneId);
      return filtered.length > 0 ? filtered : list;
    }
    return list;
  }, [dbBanners, activeZoneId]);

  React.useEffect(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="w-full py-4 relative group overflow-hidden bg-white">
      <Carousel 
        setApi={setApi}
        className="w-full" 
        opts={{ loop: true, align: 'center' }}
        plugins={[Autoplay({ delay: 3500, stopOnInteraction: false })]}
      >
        <CarouselContent className="-ml-1">
          {displayBanners.map((banner: any, idx: number) => (
            <CarouselItem key={banner.id || idx} className="pl-1 basis-[88%] sm:basis-[85%] flex justify-center">
              <div className="relative aspect-[18/9] w-full overflow-hidden rounded-[2.5rem] bg-muted border-4 border-white shadow-xl transform-gpu transition-all duration-500">
                <Image 
                  src={banner.imageUrl} 
                  alt={banner.title || "Offer"} 
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
          <div key={i} className={cn("h-1 transition-all rounded-full", current === i ? "w-5 bg-primary" : "w-1 bg-gray-200")} />
        ))}
      </div>
    </div>
  );
}
