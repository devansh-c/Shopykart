
'use client';

import { Scissors, Sparkles, ChevronRight, Star } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Beauty & Salon compact card for grid layout.
 */
export function BeautySalonSection() {
  return (
    <Link 
      href="/services/coming-soon"
      className="relative block w-full group overflow-hidden rounded-[2rem] h-44 shadow-2xl shadow-orange-200/50 active:scale-[0.98] transition-all duration-300 border border-white/10"
    >
      {/* Main Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F97316] via-[#FB923C] to-[#EC4899] group-hover:scale-105 transition-transform duration-700" />
      
      {/* Glass Overlays */}
      <div className="absolute top-0 right-0 h-full w-24 bg-white/10 -skew-x-12 translate-x-12 group-hover:translate-x-5 transition-transform duration-700" />
      <div className="absolute -bottom-10 -left-10 h-24 w-24 bg-black/10 rounded-full blur-2xl" />

      <div className="relative h-full z-10 p-5 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner group-hover:rotate-6 transition-transform">
            <div className="relative">
              <Scissors className="h-6 w-6 text-white" />
              <Sparkles className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 text-white animate-pulse" />
            </div>
          </div>
          <div className="bg-black/20 backdrop-blur-md p-1.5 rounded-full border border-white/10">
             <Star className="h-2.5 w-2.5 fill-amber-300 text-amber-300" />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">
            Beauty & <span className="text-orange-100">Salon</span>
          </h3>
          <p className="text-[7px] font-black text-white/70 uppercase tracking-widest italic leading-none">
            Premium Grooming
          </p>
          <div className="mt-3 flex items-center justify-between">
             <span className="text-[8px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-full uppercase">Salon At Home</span>
             <ChevronRight className="h-4 w-4 text-white/60 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Shine Animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
    </Link>
  );
}
