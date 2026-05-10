"use client"

import { Plus } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCart } from '@/components/cart/CartProvider';

const combos = [
  { 
    id: 'c1', 
    name: 'Starter Combo', 
    desc: 'Classic Veggie Crunch Bur...', 
    price: 199, 
    imageId: 'starter-combo' 
  },
  { 
    id: 'c2', 
    name: 'Couple Bite Combo', 
    desc: 'The Barbeque Burger + Pes...', 
    price: 499, 
    imageId: 'couple-combo' 
  },
  { 
    id: 'c3', 
    name: 'Family Feast', 
    desc: '4 Burgers + 2 Sides + 4 Drinks', 
    price: 899, 
    imageId: 'starter-combo' 
  },
];

export function ComboSection() {
  const { addToCart } = useCart();

  return (
    <div className="py-4">
      <div className="flex items-center px-4 mb-3">
        <span className="text-xl mr-2">🎁</span>
        <h2 className="text-xl font-black">Combos</h2>
      </div>
      <div className="flex overflow-x-auto space-x-4 px-4 no-scrollbar">
        {combos.map((combo) => {
          const img = PlaceHolderImages.find(p => p.id === combo.imageId);
          const imageUrl = img?.imageUrl || "https://picsum.photos/seed/combo/400/400";
          return (
            <div 
              key={combo.id} 
              className="min-w-[210px] max-w-[210px] bg-white rounded-[1.75rem] overflow-hidden shadow-sm border border-border/40"
            >
              <div className="relative h-36 w-full">
                <img 
                  src={imageUrl} 
                  alt={combo.name} 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm text-foreground line-clamp-1">{combo.name}</h3>
                <p className="text-muted-foreground text-[10px] truncate mb-3">{combo.desc}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-base font-black text-foreground">₹{combo.price}</span>
                  <button 
                    onClick={() => addToCart({ id: combo.id, name: combo.name, price: combo.price, imageUrl })}
                    className="bg-primary text-white text-[10px] font-black px-3 py-1.5 rounded-lg flex items-center hover:bg-primary/90 active:scale-95 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
