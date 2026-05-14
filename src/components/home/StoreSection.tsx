
"use client"

import { Star, Clock, Tag, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const stores = [
  { 
    id: 's1', 
    name: 'The Gourmet Kitchen', 
    rating: 4.8, 
    time: '20 min', 
    distance: '1.2 km',
    category: 'Italian • North Indian',
    offer: '50% OFF up to ₹100',
    imageId: 'store-1' 
  },
  { 
    id: 's2', 
    name: 'Bun Burst Burgers', 
    rating: 4.5, 
    time: '15 min', 
    distance: '0.8 km',
    category: 'Fast Food • Beverages',
    offer: 'Free Delivery',
    imageId: 'store-2' 
  },
  { 
    id: 's3', 
    name: 'Pizza Paradise', 
    rating: 4.3, 
    time: '25 min', 
    distance: '2.5 km',
    category: 'Pizzas • Continental',
    offer: 'BOGO Offer',
    imageId: 'store-3' 
  },
  { 
    id: 's4', 
    name: 'Sweet Tooth Hub', 
    rating: 4.9, 
    time: '10 min', 
    distance: '0.5 km',
    category: 'Desserts • Ice Cream',
    offer: '10% OFF',
    imageId: 'store-4' 
  },
];

export function StoreSection() {
  return (
    <div className="py-6">
      <div className="flex items-center justify-between px-6 mb-5">
        <div className="flex items-center">
          <span className="text-2xl mr-2">🏪</span>
          <h2 className="text-2xl font-black tracking-tighter uppercase italic text-foreground">Top Stores</h2>
        </div>
        <Link href="/menu" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-4">
          View All
        </Link>
      </div>

      <div className="flex overflow-x-auto space-x-5 px-6 no-scrollbar pb-4">
        {stores.map((store) => {
          const img = PlaceHolderImages.find(p => p.id === store.imageId);
          return (
            <Link 
              href={`/menu?vendor=${store.id}`}
              key={store.id} 
              className="min-w-[280px] max-w-[280px] flex flex-col group active:scale-[0.98] transition-all duration-300"
            >
              <div className="relative h-44 w-full rounded-[2rem] overflow-hidden shadow-lg border border-border/40 mb-3 bg-muted group-hover:shadow-xl transition-all">
                <Image 
                  src={img?.imageUrl || `https://picsum.photos/seed/${store.id}/600/400`} 
                  alt={store.name} 
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  data-ai-hint={img?.imageHint || "restaurant"}
                />
                
                {/* Rating Badge */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-2 py-1 rounded-xl flex items-center shadow-md border border-black/5">
                  <span className="text-[11px] font-black mr-1">{store.rating}</span>
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                </div>

                {/* Offer Overlay */}
                <div className="absolute bottom-4 left-4">
                  <div className="bg-primary px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 animate-in slide-in-from-left-4 duration-500">
                    <Tag className="h-3 w-3 text-white" />
                    <span className="text-[10px] font-black text-white uppercase tracking-tight">{store.offer}</span>
                  </div>
                </div>
              </div>

              <div className="px-1">
                <div className="flex justify-between items-start mb-0.5">
                  <h3 className="font-black text-lg text-foreground line-clamp-1 italic tracking-tight">{store.name}</h3>
                </div>
                
                <div className="flex items-center text-muted-foreground text-[11px] font-bold uppercase tracking-tight mb-2">
                  {store.category}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center text-primary font-black text-[10px] uppercase tracking-widest">
                    <Clock className="h-3 w-3 mr-1" />
                    {store.time}
                  </div>
                  <div className="flex items-center text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                    <MapPin className="h-3 w-3 mr-1" />
                    {store.distance}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
