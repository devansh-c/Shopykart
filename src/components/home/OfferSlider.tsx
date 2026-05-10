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

export function OfferSlider() {
  const firestore = useFirestore();
  const { data: banners, loading } = useCollection(firestore ? collection(firestore, 'banners') : null);

  if (loading) {
    return (
      <div className="w-full px-4 flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!banners || banners.length === 0) return null;

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
