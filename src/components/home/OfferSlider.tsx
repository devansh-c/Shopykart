
"use client"

import * as React from "react"
import Image from "next/image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { PlaceHolderImages } from "@/lib/placeholder-images"

export function OfferSlider() {
  const banners = [
    { id: 'b1', imageId: 'hero-burger', title: 'BUY 1 GET 1', subtitle: 'BARBEQUE BURGER', tag: 'App Only Offer' },
    { id: 'b2', imageId: 'hero-burger', title: '50% OFF', subtitle: 'FIRST ORDER', tag: 'Limited Time' },
  ];

  return (
    <div className="px-4 py-2">
      <Carousel className="w-full" opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((banner) => {
            const img = PlaceHolderImages.find(p => p.id === banner.imageId);
            return (
              <CarouselItem key={banner.id}>
                <div className="relative h-[210px] rounded-[2.5rem] overflow-hidden shadow-md">
                  <Image
                    src={img?.imageUrl || "https://picsum.photos/seed/default/800/400"}
                    alt={banner.title}
                    fill
                    className="object-cover"
                    data-ai-hint={img?.imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                    <h3 className="text-white text-3xl font-black italic tracking-tighter leading-none mb-1">
                      {banner.title}
                    </h3>
                    <p className="text-primary font-black text-lg italic tracking-tight mb-4">
                      {banner.subtitle}
                    </p>
                    <div className="flex items-center">
                      <span className="bg-black/60 backdrop-blur-md text-[10px] text-white px-3 py-1 rounded-full border border-white/20 font-bold flex items-center">
                        <span className="mr-2 h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
                        {banner.tag}
                      </span>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
