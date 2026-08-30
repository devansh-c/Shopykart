'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { ShieldCheck, Sparkles } from 'lucide-react';

/**
 * @fileOverview Premium Splash Screen for ShopyKart.
 * Features: Logo entrance animation, Gold running progress bar, Security branding.
 * Automatically fades out after 3 seconds.
 */
export function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const firestore = useFirestore();

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);

  const { data: branding } = useDoc<any>(brandingRef);

  useEffect(() => {
    // Phase 1: Keep visible for 2.5 seconds
    const timer = setTimeout(() => {
      setIsFading(true);
      // Phase 2: Fade out transition for 0.5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[2000000] bg-white flex flex-col items-center justify-center p-8 transition-opacity duration-500 transform-gpu",
        isFading ? "opacity-0 scale-105" : "opacity-100 scale-100"
      )}
    >
      {/* BACKGROUND DECORATION */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
        <div 
          className="absolute inset-0" 
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px'
          }} 
        />
      </div>

      <div className="relative flex flex-col items-center space-y-12 animate-in zoom-in-95 fade-in duration-1000 transform-gpu">
        
        {/* LOGO CONTAINER */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full animate-pulse scale-150" />
          <div className="relative h-40 w-40 rounded-[3rem] bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] border-4 border-primary/5 flex items-center justify-center overflow-hidden transform-gpu hover:scale-105 transition-transform duration-700">
            {branding?.logoUrl ? (
              <img src={branding.logoUrl} alt="ShopyKart Logo" className="h-24 w-auto object-contain" />
            ) : (
              <div className="flex flex-col items-center">
                <h1 className="text-3xl font-black italic tracking-tighter text-gray-900 leading-none">
                  SHOPY<span className="text-primary">KART</span>
                </h1>
                <div className="w-12 h-1 bg-primary mt-2 rounded-full" />
              </div>
            )}
            {/* Gloss shine effect */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent -translate-x-full animate-[shine_3s_infinite]" />
          </div>
          
          <div className="absolute -top-4 -right-4 bg-amber-400 text-white p-2.5 rounded-2xl shadow-xl animate-bounce">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        {/* LOADING TEXT & PROGRESS */}
        <div className="flex flex-col items-center text-center space-y-5">
           <div className="space-y-1">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
                PREMIUM <span className="text-primary">DELIVERY.</span>
              </h2>
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em] opacity-60">
                Quality First • Mauranipur
              </p>
           </div>
           
           <div className="w-44 h-1.5 bg-gray-100 rounded-full overflow-hidden relative border border-gray-50 shadow-inner">
              <div className="absolute h-full bg-gradient-to-r from-primary to-amber-500 animate-[running-line_1.5s_infinite] w-1/2 rounded-full" />
           </div>
        </div>
      </div>

      {/* FOOTER BRANDING */}
      <div className="absolute bottom-16 flex flex-col items-center gap-3 opacity-30 transform-gpu animate-in slide-in-from-bottom-2 duration-1000 delay-300">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-900">Encrypted Infrastructure</p>
        </div>
        <p className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">© 2024 ShopyKart Enterprise</p>
      </div>

      {/* VERSION TAG */}
      <div className="absolute top-8 right-8 opacity-20">
         <span className="text-[8px] font-black uppercase tracking-widest border border-black px-2 py-1 rounded-lg">v2.5.0-LUX</span>
      </div>
    </div>
  );
}
