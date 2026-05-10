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
    { id: 'b1', imageId: 'pizza-banner', title: '50% OFF', subtitle: 'On your first order' },
    { id: 'b2', imageId: 'burger-banner', title: 'Buy 1 Get 1', subtitle: 'Every Tuesday' },
    { id: 'b3', imageId: 'sushi-banner', title: 'Free Delivery', subtitle: 'On orders above $30' },
  ];

  return (
    <div className="px-4 py-2">
      <Carousel className="w-full" opts={{ loop: true }}>
        <CarouselContent>
          {banners.map((banner) => {
            const img = PlaceHolderImages.find(p => p.id === banner.imageId);
            return (
              <CarouselItem key={banner.id}>
                <div className="relative h-44 rounded-3xl overflow-hidden shadow-md">
                  <Image
                    src={img?.imageUrl || "https://picsum.photos/seed/default/800/400"}
                    alt={banner.title}
                    fill
                    className="object-cover"
                    data-ai-hint={img?.imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center px-6">
                    <span className="text-primary font-bold text-sm tracking-widest uppercase">Special Offer</span>
                    <h3 className="text-white text-3xl font-black mt-1 leading-tight">{banner.title}</h3>
                    <p className="text-white/80 text-sm font-medium">{banner.subtitle}</p>
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