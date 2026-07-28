
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
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export function OfferSlider() {
  const firestore = useFirestore();
  const [activeZoneId, setActiveZoneId] = React.useState<string | null>(null);
  const [api, setApi] = React.useState<any>();
  const [current, setCurrent] = React.useState(0);

  React.useEffect(() => {
    const updateZone = () => setActiveZoneId(localStorage.getItem('active_zone_id'));
    updateZone();
    window.addEventListener('user-address-updated', updateZone);
    return () => window.removeEventListener('user-address-updated', updateZone);
  }, []);

  const bannersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'banners');
  }, [firestore]);

  // Added cacheKey for instant load from sessionStorage
  const { data: dbBanners } = useCollection<any>(bannersQuery, 'home_banners_v2');
  
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

  if (!filteredBanners || filteredBanners.length === 0) return null;

  return (
    <div className="w-full py-4 relative group overflow-hidden bg-white">
      <Carousel 
        setApi={setApi}
        className="w-full" 
        opts={{ 
          loop: true, 
          align: 'center',
          skipSnaps: false
        }}
        plugins={[Autoplay({ delay: 3500, stopOnInteraction: false })]}
      >
        <CarouselContent className="-ml-1">
          {filteredBanners.map((banner: any) => (
            <CarouselItem key={banner.id} className="pl-1 basis-[88%] sm:basis-[85%] flex justify-center">
              <div className="relative aspect-[18/9] w-full overflow-hidden rounded-[2rem] bg-muted border-4 border-white shadow-[0_10px_30px_rgba(0,0,0,0.08)] transform-gpu transition-all duration-500 hover:scale-[1.01] outline outline-1 outline-gray-100">
                <Image
                  src={banner.imageUrl}
                  alt="Special Offer"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 border-[6px] border-white/10 pointer-events-none rounded-[1.8rem]" />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      {/* Pagination Dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {filteredBanners.map((_, i) => (
          <div key={i} className={cn(
            "h-1 transition-all duration-500 rounded-full",
            current === i ? "w-5 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" : "w-1 bg-gray-200"
          )} />
        ))}
      </div>
    </div>
  );
}
