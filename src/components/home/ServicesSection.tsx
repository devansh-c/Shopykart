
"use client"

import { WashingMachine, Shirt, AirVent, Sparkles, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const services = [
  {
    id: 'laundry',
    label: 'Quick Laundry',
    icon: WashingMachine,
    gradient: 'from-blue-500 to-blue-700',
    shadow: 'shadow-blue-200'
  },
  {
    id: 'cloth',
    label: 'Cloth Care',
    icon: Shirt,
    gradient: 'from-indigo-500 to-purple-700',
    shadow: 'shadow-purple-200'
  },
  {
    id: 'ac',
    label: 'AC Care',
    icon: AirVent,
    gradient: 'from-cyan-500 to-teal-700',
    shadow: 'shadow-cyan-200'
  },
  {
    id: 'beauty',
    label: 'Beauty Care',
    icon: Sparkles,
    gradient: 'from-rose-500 to-pink-700',
    shadow: 'shadow-rose-200'
  }
];

export function ServicesSection() {
  return (
    <div className="py-6 px-4">
      <div className="flex items-center justify-between mb-5 px-2">
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-800">Premium Services</h2>
        <span className="text-[9px] font-black text-primary bg-primary/5 px-2 py-1 rounded-full uppercase tracking-widest">Available Soon</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <Link 
              key={service.id} 
              href="/services/coming-soon"
              className={cn(
                "relative group overflow-hidden rounded-[2rem] p-5 h-36 flex flex-col justify-between transition-all duration-300 active:scale-95 shadow-xl",
                service.shadow
              )}
            >
              {/* Background Gradient */}
              <div className={cn("absolute inset-0 bg-gradient-to-br transition-transform duration-500 group-hover:scale-110", service.gradient)} />
              
              {/* Glass Overlay Decoration */}
              <div className="absolute top-0 right-0 h-full w-24 bg-white/10 -skew-x-12 translate-x-10" />
              
              <div className="relative z-10">
                <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-inner">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>

              <div className="relative z-10 flex items-end justify-between">
                <span className="text-sm font-black text-white italic uppercase tracking-tighter leading-tight">
                  {service.label.split(' ')[0]}<br />{service.label.split(' ')[1]}
                </span>
                <div className="h-8 w-8 bg-black/20 rounded-full flex items-center justify-center text-white/80 group-hover:bg-white group-hover:text-primary transition-all">
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
