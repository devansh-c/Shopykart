
"use client"

import { Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const stores = [
  { 
    id: 's1', 
    name: 'The Gourmet Kitchen', 
    rating: 4.8, 
    time: '20-25 min', 
    category: 'Italian • North Indian',
    imageUrl: 'https://picsum.photos/seed/store1/400/400' 
  },
  { 
    id: 's2', 
    name: 'Bun Burst Burgers', 
    rating: 4.5, 
    time: '15-20 min', 
    category: 'Fast Food • Beverages',
    imageUrl: 'https://picsum.photos/seed/store2/400/400' 
  },
  { 
    id: 's3', 
    name: 'Pizza Paradise', 
    rating: 4.3, 
    time: '25-30 min', 
    category: 'Pizzas • Continental',
    imageUrl: 'https://picsum.photos/seed/store3/400/400' 
  },
  { 
    id: 's4', 
    name: 'Sweet Tooth Hub', 
    rating: 4.9, 
    time: '10-15 min', 
    category: 'Desserts • Ice Cream',
    imageUrl: 'https://picsum.photos/seed/store4/400/400' 
  },
];

export function StoreSection() {
  return (
    <div className="py-6">
      <div className="flex items-center justify-between px-4 mb-5">
        <div className="flex items-center">
          <span className="text-xl mr-2">🏪</span>
          <h2 className="text-2xl font-black tracking-tight uppercase italic">Explore Stores</h2>
        </div>
        <Link href="/menu" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">
          View All
        </Link>
      </div>
      <div className="flex overflow-x-auto space-x-5 px-4 no-scrollbar">
        {stores.map((store) => (
          <Link 
            href={`/menu?vendor=${store.id}`}
            key={store.id} 
            className="min-w-[160px] max-w-[160px] flex flex-col group active:scale-95 transition-all"
          >
            <div className="relative h-40 w-full rounded-[2.5rem] overflow-hidden shadow-md border border-border/40 mb-3 bg-muted">
              <img 
                src={store.imageUrl} 
                alt={store.name} 
                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center shadow-sm">
                <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500 mr-1" />
                <span className="text-[10px] font-black">{store.rating}</span>
              </div>
            </div>
            <div className="px-1">
              <h3 className="font-black text-sm text-foreground line-clamp-1 italic">{store.name}</h3>
              <p className="text-muted-foreground text-[10px] font-bold truncate mt-0.5 uppercase tracking-tight">{store.category}</p>
              <div className="flex items-center mt-2 text-primary">
                <Clock className="h-3 w-3 mr-1" />
                <span className="text-[10px] font-black uppercase tracking-widest">{store.time}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
