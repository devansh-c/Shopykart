
"use client"

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const categories = [
  { id: 'all', name: 'All', imageId: 'category-all' },
  { id: 'pizza', name: 'Pizza', imageId: 'category-pizza', badge: '🍕' },
  { id: 'burgers', name: 'Burgers', imageId: 'category-burger', badge: '🍔' },
  { id: 'pasta', name: 'Pasta', imageId: 'category-pasta', badge: '🍝' },
  { id: 'fries', name: 'Fries', imageId: 'category-fries', badge: '🍟' },
  { id: 'drinks', name: 'Drinks', imageId: 'category-drinks', badge: '🥤' },
];

export function CategoryList() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="py-6">
      <div className="flex items-center justify-between px-4 mb-5">
        <h2 className="text-2xl font-black tracking-tight">Categories</h2>
        <button className="text-primary text-sm font-black hover:underline">See all</button>
      </div>
      <div className="flex overflow-x-auto space-x-6 px-4 no-scrollbar">
        {categories.map((cat) => {
          const img = PlaceHolderImages.find(p => p.id === cat.imageId);
          const isActive = activeTab === cat.id;

          return (
            <button 
              key={cat.id} 
              onClick={() => setActiveTab(cat.id)}
              className="flex flex-col items-center space-y-2 min-w-[70px] relative group"
            >
              <div className={cn(
                "relative h-16 w-16 rounded-full overflow-hidden border-2 transition-all duration-300",
                isActive ? "border-primary ring-4 ring-primary/10 scale-105" : "border-transparent bg-muted/30"
              )}>
                <Image
                  src={img?.imageUrl || "https://picsum.photos/seed/cat/100/100"}
                  alt={cat.name}
                  fill
                  className="object-cover"
                />
                {cat.badge && (
                  <div className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-border/50 translate-x-1 translate-y-1">
                    <span className="text-xs leading-none">{cat.badge}</span>
                  </div>
                )}
              </div>
              <span className={cn(
                "text-[11px] font-black transition-colors uppercase tracking-tight",
                isActive ? "text-primary" : "text-muted-foreground"
              )}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
