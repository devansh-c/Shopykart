
'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, ChevronRight, Sparkles, Map } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Premium Prompt to encourage users to pin their exact map location.
 * Disappears automatically once coordinates are found in localStorage.
 */
export function LocationPinPrompt() {
  const [shouldShow, setShouldShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkLocation = () => {
      const lat = localStorage.getItem('user_lat');
      const lng = localStorage.getItem('user_lng');
      // Show if coordinates are missing
      setShouldShow(!lat || !lng);
    };

    checkLocation();
    window.addEventListener('user-address-updated', checkLocation);
    return () => window.removeEventListener('user-address-updated', checkLocation);
  }, []);

  const handleOpenPicker = () => {
    window.dispatchEvent(new CustomEvent('open-location-picker'));
  };

  if (!mounted || !shouldShow) return null;

  return (
    <div className="px-4 py-2 animate-in slide-in-from-top-4 duration-500">
      <button 
        onClick={handleOpenPicker}
        className="w-full relative overflow-hidden rounded-[2.5rem] p-6 bg-[#0B0B0B] border border-primary/20 shadow-2xl shadow-primary/10 text-left group active:scale-[0.98] transition-all"
      >
        {/* Animated background glow */}
        <div className="absolute top-0 right-0 h-full w-32 bg-primary/5 -skew-x-12 translate-x-12 group-hover:translate-x-8 transition-transform duration-700" />
        <div className="absolute -bottom-4 -left-4 h-16 w-16 bg-primary/10 rounded-full blur-2xl animate-pulse" />

        <div className="relative z-10 flex items-center gap-5">
          <div className="h-14 w-14 bg-primary/10 rounded-[1.25rem] flex items-center justify-center border border-primary/20 shrink-0 shadow-inner group-hover:rotate-6 transition-transform">
             <div className="relative">
                <MapPin className="h-7 w-7 text-primary animate-bounce" />
                <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-primary animate-pulse" />
             </div>
          </div>
          
          <div className="flex-1 min-w-0 pr-4">
            <h4 className="text-[13px] font-black uppercase italic tracking-tight text-white leading-tight mb-1">
              Pin Your <span className="text-primary">Live Location</span>
            </h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
              For ultra-fast 10-min delivery & live map tracking experience.
            </p>
          </div>

          <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
             <ChevronRight className="h-5 w-5" />
          </div>
        </div>

        {/* Dynamic Scan Line */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-running-line opacity-50" />
      </button>
    </div>
  );
}
