
'use client';

import { HeartPulse, Sparkles, ChevronRight, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Medical & Care compact card for grid layout.
 * Updated to handle mode switching.
 */
export function MedicalCareSection({ onClick }: { onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="relative block w-full group overflow-hidden rounded-[2rem] h-44 shadow-2xl shadow-blue-100/50 active:scale-[0.98] transition-all duration-300 border border-white/10 text-left"
    >
      {/* Main Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0D9488] via-[#0891B2] to-[#0284C7] group-hover:scale-105 transition-transform duration-700" />
      
      {/* Premium Overlays */}
      <div className="absolute top-0 right-0 h-full w-24 bg-white/10 -skew-x-12 translate-x-12 group-hover:translate-x-5 transition-transform duration-700" />
      <div className="absolute -top-10 -right-10 h-24 w-24 bg-white/5 rounded-full blur-2xl" />

      <div className="relative h-full z-10 p-5 flex flex-col justify-between">
        <div className="flex justify-between items-start">
          <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner group-hover:scale-110 transition-transform">
            <div className="relative">
              <HeartPulse className="h-6 w-6 text-white" />
              <Sparkles className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 text-white animate-pulse" />
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-md p-1.5 rounded-full border border-white/10">
             <ShieldCheck className="h-2.5 w-2.5 text-white" />
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">
            Medical & <span className="text-cyan-100">Care</span>
          </h3>
          <p className="text-[7px] font-black text-white/70 uppercase tracking-widest italic leading-none">
            24/7 Delivery
          </p>
          <div className="mt-3 flex items-center justify-between">
             <span className="text-[8px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-full uppercase">Medicines</span>
             <ChevronRight className="h-4 w-4 text-white/60 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* Scanline Animation */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10 blur-[0.5px] animate-pulse" />
    </button>
  );
}
