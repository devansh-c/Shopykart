
"use client"

import * as React from "react"
import Image from "next/image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { useFirestore, useCollection } from "@/firebase"
import { collection } from "firebase/firestore"
import { Loader2 } from "lucide-react"

const MOCK_BANNERS = [
  {
    id: 'mock-1',
    title: '50% OFF',
    subtitle: 'ON YOUR FIRST ORDER',
    tag: 'Limited Offer',
    imageUrl: 'https://picsum.photos/seed/shopy-hero/800/400'
  },
  {
    id: 'mock-2',
    title: 'FREE DELIVERY',
    subtitle: 'ON ORDERS ABOVE ₹499',
    tag: 'Weekend Special',
    imageUrl: 'https://picsum.photos/seed/shopy-combo/800/400'
  }
];

export function OfferSlider() {
  const firestore = useFirestore();
  const { data: dbBanners, loading } = useCollection(firestore ? collection(firestore, 'banners') : null);

  // Use DB data if available, otherwise fallback to mock data for prototype visibility
  const banners = (dbBanners && dbBanners.length > 0) ? dbBanners : MOCK_BANNERS;

  if (loading && !dbBanners) {
    return (
      <div className="w-full px-4 flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="w-full px-4">
      <Carousel className="w-full" opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((banner: any, index: number) => (
            <CarouselItem key={banner.id}>
              <div className="relative h-[180px] w-full overflow-hidden shadow-sm rounded-[2rem]">
                <Image
                  src={banner.imageUrl}
                  alt={banner.title}
                  fill
                  className="object-cover"
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <h3 className="text-white text-3xl font-black italic tracking-tighter leading-none mb-1">
                    {banner.title}
                  </h3>
                  <p className="text-primary font-black text-base italic tracking-tight mb-3">
                    {banner.subtitle}
                  </p>
                  <div className="flex items-center">
                    <span className="bg-black/60 backdrop-blur-md text-[10px] text-white px-3 py-1 rounded-full border border-white/20 font-black flex items-center uppercase tracking-widest">
                      <span className="mr-2 h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                      {banner.tag}
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
