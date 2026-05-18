
"use client"

import Image from "next/image"
import { PlaceHolderImages } from "@/lib/placeholder-images"
import { cn } from "@/lib/utils"

export function QuickActionGrid() {
  const actions = [
    { id: 'action-best-offer', label: 'Best Offer' },
    { id: 'action-services', label: 'Services' },
    { id: 'action-tickets', label: 'Tickets' },
    { id: 'action-gourmet', label: 'Gourmet' },
  ];

  return (
    <div className="py-2 px-6">
      <div className="flex overflow-x-auto space-x-4 no-scrollbar pb-2">
        {actions.map((action) => {
          const img = PlaceHolderImages.find(p => p.id === action.id);
          return (
            <div 
              key={action.id} 
              className="min-w-[100px] flex flex-col items-center gap-2 group active:scale-95 transition-all"
            >
              <div className="relative h-24 w-24 bg-white rounded-3xl shadow-sm border border-border/40 flex items-center justify-center p-4 overflow-hidden">
                {img && (
                  <Image 
                    src={img.imageUrl} 
                    alt={action.label} 
                    fill
                    className="object-contain p-3 group-hover:scale-110 transition-transform"
                    data-ai-hint={img.imageHint}
                  />
                )}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary">
                {action.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
