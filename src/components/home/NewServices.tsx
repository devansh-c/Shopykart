
'use client';

import { Pizza, ShoppingBag, Drumstick, Leaf, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const services = [
  {
    id: 'food',
    label: 'Food Delivery',
    icon: Pizza,
    bgColor: 'bg-[#5F634F]', // Olive Greenish
    textColor: 'text-white'
  },
  {
    id: 'groceries',
    label: 'Groceries',
    icon: ShoppingBag,
    bgColor: 'bg-[#D47B55]', // Burnt Orange
    textColor: 'text-white'
  },
  {
    id: 'meat',
    label: 'Meat & Fish',
    icon: Drumstick,
    bgColor: 'bg-[#7A8B99]', // Slate Grey/Blue
    textColor: 'text-white'
  },
  {
    id: 'paan',
    label: 'Paan Corner',
    icon: Leaf,
    bgColor: 'bg-[#2C3E50]', // Dark Navy
    textColor: 'text-white'
  }
];

export function NewServices() {
  return (
    <div className="py-6 px-4">
      <div className="flex overflow-x-auto space-x-3 no-scrollbar pb-2">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <button 
              key={service.id}
              className={cn(
                "min-w-[110px] aspect-square rounded-[2rem] flex flex-col items-center justify-center gap-3 shadow-xl active:scale-95 transition-all p-4",
                service.bgColor
              )}
            >
              <div className="bg-white/10 p-2 rounded-2xl border border-white/5">
                <Icon className="h-7 w-7 text-white" />
              </div>
              <span className="text-[10px] font-black text-white uppercase text-center leading-tight tracking-tighter">
                {service.label.split(' ')[0]}<br />{service.label.split(' ').slice(1).join(' ')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
