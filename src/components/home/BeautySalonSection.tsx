'use client';

import { Scissors, Sparkles, ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Beauty & Salon service section.
 * Visual style inspired by the orange-pink gradient logo provided by the user.
 */
export function BeautySalonSection() {
  return (
    <div className="px-4 py-4">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-800">New Services</h2>
        <span className="text-[9px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full uppercase tracking-widest border border-primary/10 animate-pulse">Launching 5 June</span>
      </div>

      <Link 
        href="/services/coming-soon"
        className="relative block w-full group overflow-hidden rounded-[2.5rem] h-48 shadow-2xl shadow-orange-200/50 active:scale-[0.98] transition-all duration-300"
      >
        {/* Main Gradient Background (matching the user's logo colors) */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F97316] via-[#FB923C] to-[#EC4899] group-hover:scale-105 transition-transform duration-700" />
        
        {/* Premium Glass Overlays */}
        <div className="absolute top-0 right-0 h-full w-40 bg-white/10 -skew-x-12 translate-x-20 group-hover:translate-x-10 transition-transform duration-700" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-black/10 rounded-full blur-2xl" />

        <div className="relative h-full z-10 p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border border-white/30 shadow-inner group-hover:rotate-6 transition-transform">
              <div className="relative">
                <Scissors className="h-8 w-8 text-white" />
                <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-white animate-pulse" />
              </div>
            </div>
            <div className="bg-black/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
               <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Expert Care</span>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">
                Beauty & <span className="text-orange-100">Salon</span>
              </h3>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em] italic">
                Premium grooming at your doorstep
              </p>
            </div>
            <div className="h-12 w-12 bg-white text-[#F97316] rounded-2xl flex items-center justify-center shadow-xl group-hover:bg-black group-hover:text-white transition-all">
              <ChevronRight className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Shine Animation */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </Link>
    </div>
  );
}
