
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

const DEFAULT_BANNERS = [
  {
    id: 'def-1',
    title: '50% OFF ON PIZZA',
    subtitle: 'FIRST ORDER SPECIAL',
    tag: 'Limited Time',
    imageUrl: 'https://picsum.photos/seed/piz-1/800/400'
  },
  {
    id: 'def-2',
    title: 'FREE DELIVERY',
    subtitle: 'ON ORDERS ABOVE ₹199',
    tag: 'Weekend Deal',
    imageUrl: 'https://picsum.photos/seed/burg-1/800/400'
  }
];

export function OfferSlider() {
  const firestore = useFirestore();
  const bannersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'banners');
  }, [firestore]);

  const { data: dbBanners } = useCollection<any>(bannersQuery);
  const banners = dbBanners && dbBanners.length > 0 ? dbBanners : DEFAULT_BANNERS;

  return (
    <div className="w-full px-4">
      <Carousel className="w-full" opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((banner: any, index: number) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[160px] w-full overflow-hidden shadow-sm rounded-2xl">
                <Image
                  src={banner.imageUrl || `https://picsum.photos/seed/${banner.id}/800/400`}
                  alt={banner.title || 'Offer'}
                  fill
                  className="object-cover"
                  priority={index === 0}
                  data-ai-hint="promotion banner"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                  <h3 className="text-white text-2xl font-black italic tracking-tighter leading-none mb-1">
                    {banner.title}
                  </h3>
                  <p className="text-primary font-black text-sm italic tracking-tight mb-2">
                    {banner.subtitle}
                  </p>
                  <div className="flex items-center">
                    <span className="bg-black/60 backdrop-blur-md text-[9px] text-white px-3 py-1 rounded-full border border-white/20 font-black flex items-center uppercase tracking-widest">
                      <span className="mr-1.5 h-1 w-1 bg-primary rounded-full animate-pulse" />
                      {banner.tag || 'Exclusive'}
                    </span>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
