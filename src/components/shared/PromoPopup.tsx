'use client';

import { useState, useEffect } from 'react';
import { X, Volume2, Share2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-promo-popup', handleOpen);
    
    // Auto-show logic (optional, keep it once per session if needed)
    const lastShown = sessionStorage.getItem('last_promo_shown');
    if (!lastShown) {
      const timer = setTimeout(() => setIsOpen(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('open-promo-popup', handleOpen);
  }, []);

  const handleClose = () => {
    sessionStorage.setItem('last_promo_shown', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-sky-400/95 animate-in fade-in duration-300">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 p-4 opacity-40">
        <div className="w-32 h-32 text-green-800 rotate-[-15deg]">
           <svg viewBox="0 0 100 100" fill="currentColor"><path d="M10,90 Q40,10 90,90" fill="none" stroke="currentColor" strokeWidth="5" /><path d="M20,70 L40,40 L60,70" /></svg>
        </div>
      </div>
      <div className="absolute top-0 right-0 p-4 opacity-40">
        <div className="w-32 h-32 text-green-800 rotate-[15deg]">
           <svg viewBox="0 0 100 100" fill="currentColor"><path d="M10,90 Q40,10 90,90" fill="none" stroke="currentColor" strokeWidth="5" /><path d="M20,70 L40,40 L60,70" /></svg>
        </div>
      </div>

      <div className="relative w-full h-full flex flex-col items-center pt-10 px-6 max-w-lg mx-auto">
        
        {/* Top Navigation Row */}
        <div className="w-full flex justify-between items-center mb-4 px-2">
           <button onClick={handleClose} className="bg-white/20 p-2 rounded-full text-white backdrop-blur-md">
             <X className="h-5 w-5" />
           </button>
           <div className="flex gap-2">
              <button className="bg-white/20 p-2 rounded-full text-white backdrop-blur-md">
                <Volume2 className="h-5 w-5" />
              </button>
              <button className="bg-white/20 p-2 rounded-full text-white backdrop-blur-md">
                <Share2 className="h-5 w-5" />
              </button>
           </div>
        </div>

        {/* Main Banner Title */}
        <div className="relative mb-6">
           <div className="bg-white px-8 py-3 rounded-md shadow-[4px_4px_0px_rgba(0,0,0,0.1)] relative transform -rotate-1">
              <div className="absolute -left-10 top-1/2 -translate-y-1/2">
                 <img 
                  src="https://picsum.photos/seed/icecream-choc/200/400" 
                  alt="Ice Cream" 
                  className="h-24 w-auto object-contain drop-shadow-xl"
                  data-ai-hint="chocolate icecream"
                 />
              </div>
              <h2 className="text-center">
                <span className="block text-4xl font-black text-[#632D15] leading-none tracking-tighter">SCREAM</span>
                <span className="block text-sm font-black text-red-600 uppercase tracking-widest mt-1">FOR <span className="bg-red-600 text-white px-1">ICE-CREAM</span></span>
              </h2>
              {/* Jagged edge detail */}
              <div className="absolute right-[-10px] top-0 h-full flex flex-col justify-around py-1">
                 {[...Array(6)].map((_, i) => <div key={i} className="w-4 h-4 bg-sky-400 rounded-full -mr-2" />)}
              </div>
           </div>
        </div>

        {/* Powered By Section */}
        <div className="flex flex-col items-center gap-2 mb-6">
           <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-80">Powered By</span>
           <div className="flex items-center gap-3">
              <div className="bg-white p-1 rounded-md shadow-sm h-8 w-14 flex items-center justify-center">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Kwality_Wall%27s_Logo.svg" className="h-full object-contain" alt="Kwality Walls" />
              </div>
              <div className="bg-white p-1 rounded-md shadow-sm h-8 w-14 flex items-center justify-center">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Amul_Logo.svg" className="h-full object-contain" alt="Amul" />
              </div>
           </div>
        </div>

        {/* Play Game Green Text */}
        <div className="text-center mb-8">
           <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter drop-shadow-[0_2px_0_#15803d]">
              PLAY GAME & GET
           </h3>
           <h3 className="text-3xl font-black italic text-[#22c55e] uppercase tracking-tighter flex items-center justify-center gap-2 drop-shadow-[0_2px_0_rgba(255,255,255,1)]">
              ICECREAM FREE 🥳
           </h3>
        </div>

        {/* How It Works Card */}
        <div className="w-full bg-[#E0F2FE] rounded-3xl overflow-hidden border-4 border-white shadow-2xl mb-10 flex flex-col">
           <div className="bg-[#B9E6FE] py-2 text-center">
              <span className="text-xs font-black uppercase tracking-[0.2em] text-[#0369A1]">HOW IT WORKS</span>
           </div>
           <div className="bg-[#FEF08A] p-6 flex flex-col items-center relative min-h-[220px]">
              <div className="relative w-full flex justify-center mt-4">
                 {/* Cartoon Placeholder Animation */}
                 <div className="flex items-center gap-4">
                    <div className="relative">
                       <div className="bg-amber-800 h-28 w-28 rounded-full flex items-center justify-center overflow-hidden border-4 border-white">
                          <img src="https://picsum.photos/seed/scream-kid/300/300" alt="Boy Screaming" className="w-full h-full object-cover" />
                       </div>
                       <div className="absolute -right-4 top-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-md shadow-lg transform rotate-12">
                          <span className="text-[10px] font-black text-black">SCREAM!</span>
                       </div>
                    </div>
                    <div className="bg-sky-400 h-24 w-14 rounded-xl border-4 border-slate-800 shadow-xl flex flex-col items-center justify-center p-1">
                       <div className="w-full h-1/2 bg-amber-500 rounded-lg overflow-hidden flex items-center justify-center">
                          <img src="https://picsum.photos/seed/icecream-choc/100/200" className="h-full object-contain" alt="" />
                       </div>
                       <div className="mt-2 w-2 h-2 rounded-full bg-slate-800" />
                    </div>
                 </div>
              </div>
           </div>
           <div className="bg-white py-3 text-center border-t border-sky-100">
              <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center justify-center gap-2">
                 <Info className="h-3 w-3 text-sky-500" />
                 PRO TIP: <span className="opacity-70">Find an empty room</span>
              </p>
           </div>
        </div>

        {/* Bottom Play Now Button */}
        <div className="mt-auto w-full pb-10">
           <button 
            onClick={handleClose}
            className="w-full h-16 bg-white rounded-full shadow-[0_10px_40px_rgba(255,255,255,0.4)] flex items-center justify-center group active:scale-95 transition-all"
           >
             <span className="text-xl font-black text-[#451A03]">Play Now</span>
           </button>
        </div>

      </div>
    </div>
  );
}
