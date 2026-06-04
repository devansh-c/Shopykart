'use client';

import { HeartPulse, Sparkles, ChevronRight, ShieldCheck, Stethoscope } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Medical & Care service section.
 * Professional teal/blue theme for healthcare services.
 */
export function MedicalCareSection() {
  return (
    <div className="px-4 py-2">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-gray-800">Healthcare</h2>
        <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">Live in Area</span>
      </div>

      <Link 
        href="/menu?category=medical"
        className="relative block w-full group overflow-hidden rounded-[2.5rem] h-48 shadow-2xl shadow-blue-100/50 active:scale-[0.98] transition-all duration-300"
      >
        {/* Main Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D9488] via-[#0891B2] to-[#0284C7] group-hover:scale-105 transition-transform duration-700" />
        
        {/* Premium Overlays */}
        <div className="absolute top-0 right-0 h-full w-48 bg-white/10 -skew-x-12 translate-x-24 group-hover:translate-x-15 transition-transform duration-700" />
        <div className="absolute -top-10 -right-10 h-32 w-32 bg-white/5 rounded-full blur-2xl" />

        <div className="relative h-full z-10 p-8 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border border-white/30 shadow-inner group-hover:scale-110 transition-transform">
              <div className="relative">
                <HeartPulse className="h-8 w-8 text-white" />
                <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-white animate-pulse" />
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center gap-1.5">
               <ShieldCheck className="h-3 w-3 text-white" />
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Verified Pharmacy</span>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none mb-1">
                Medical & <span className="text-cyan-100">Care</span>
              </h3>
              <p className="text-[10px] font-bold text-white/70 uppercase tracking-[0.2em] italic">
                Medicine & Essentials Delivered 24/7
              </p>
            </div>
            <div className="h-12 w-12 bg-white text-[#0D9488] rounded-2xl flex items-center justify-center shadow-xl group-hover:bg-black group-hover:text-white transition-all">
              <ChevronRight className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Scanline Animation */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-white/20 blur-sm animate-pulse" />
      </Link>
    </div>
  );
}
