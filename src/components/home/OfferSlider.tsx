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
    <div className="px-4 py-1">
      <Carousel className="w-full" opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((banner, index) => {
            const img = PlaceHolderImages.find(p => p.id === banner.imageId);
            return (
              <CarouselItem key={banner.id}>
                <div className="relative h-[160px] rounded-[2rem] overflow-hidden shadow-sm">
                  <Image
                    src={img?.imageUrl || "https://picsum.photos/seed/default/800/400"}
                    alt={banner.title}
                    fill
                    className="object-cover"
                    data-ai-hint={img?.imageHint}
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                    <h3 className="text-white text-2xl font-black italic tracking-tighter leading-none mb-0.5">
                      {banner.title}
                    </h3>
                    <p className="text-primary font-black text-sm italic tracking-tight mb-2">
                      {banner.subtitle}
                    </p>
                    <div className="flex items-center">
                      <span className="bg-black/60 backdrop-blur-md text-[9px] text-white px-2.5 py-0.5 rounded-full border border-white/20 font-bold flex items-center">
                        <span className="mr-1.5 h-1 w-1 bg-primary rounded-full animate-pulse" />
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
