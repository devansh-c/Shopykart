"use client"

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const categories = [
  { id: '1', name: 'Pizza', imageId: 'category-pizza' },
  { id: '2', name: 'Burgers', imageId: 'category-burger' },
  { id: '3', name: 'Sushi', imageId: 'category-sushi' },
  { id: '4', name: 'Desserts', imageId: 'category-dessert' },
  { id: '5', name: 'Healthy', imageId: 'category-pizza' },
  { id: '6', name: 'Drinks', imageId: 'category-burger' },
];

export function CategoryList() {
  return (
    <div className="py-4 mb-4">
      <div className="flex items-center justify-between px-4 mb-3">
        <h2 className="text-lg font-bold">Categories</h2>
        <button className="text-primary text-[10px] font-black uppercase tracking-wider">See All</button>
      </div>
      <div className="flex overflow-x-auto space-x-3 px-4 no-scrollbar">
        {categories.map((cat) => {
          const img = PlaceHolderImages.find(p => p.id === cat.imageId);
          return (
            <div key={cat.id} className="flex flex-col items-center space-y-2 min-w-[64px]">
              <div className="h-14 w-14 rounded-2xl bg-white soft-shadow flex items-center justify-center p-2.5 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="relative h-8 w-8">
                  <Image
                    src={img?.imageUrl || "https://picsum.photos/seed/cat/100/100"}
                    alt={cat.name}
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
              <span className="text-[10px] font-bold text-gray-700">{cat.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
