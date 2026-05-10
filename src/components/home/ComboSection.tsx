
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
    <div className="py-6">
      <div className="flex items-center px-4 mb-4">
        <span className="text-2xl mr-2">🎁</span>
        <h2 className="text-2xl font-black">Combos</h2>
      </div>
      <div className="flex overflow-x-auto space-x-4 px-4 no-scrollbar">
        {combos.map((combo) => {
          const img = PlaceHolderImages.find(p => p.id === combo.imageId);
          const imageUrl = img?.imageUrl || "https://picsum.photos/400/400";
          return (
            <div 
              key={combo.id} 
              className="min-w-[240px] bg-white rounded-[2rem] overflow-hidden shadow-sm border border-border/40"
            >
              <div className="relative h-44 w-full">
                <img 
                  src={imageUrl} 
                  alt={combo.name} 
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg text-foreground">{combo.name}</h3>
                <p className="text-muted-foreground text-sm truncate mb-4">{combo.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-foreground">₹{combo.price}</span>
                  <button 
                    onClick={() => addToCart({ id: combo.id, name: combo.name, price: combo.price, imageUrl })}
                    className="bg-primary text-white text-xs font-black px-4 py-2 rounded-xl flex items-center hover:bg-primary/90 active:scale-95 transition-all"
                  >
                    <Plus className="h-4 w-4 mr-1" />
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
