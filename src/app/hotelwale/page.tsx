
'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Sparkles, Building2, MapPin, Star, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * @fileOverview Placeholder page for "Hotelवाले" section.
 */
export default function HotelWalePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-32 animate-in fade-in duration-500">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-xl py-4 px-6 sticky top-0 z-[100] flex items-center gap-4 border-b border-gray-100">
        <button 
          onClick={() => router.back()} 
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 active:scale-90 transition-all"
        >
          <ChevronLeft className="h-5 w-5 text-gray-800" />
        </button>
        <div className="flex-1">
           <h1 className="text-sm font-black uppercase italic tracking-widest text-gray-900 leading-none">Hotelवाले</h1>
           <p className="text-[8px] font-bold text-primary uppercase mt-1">Premium Accommodations</p>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center px-8 py-20 text-center space-y-10">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="relative bg-white h-40 w-40 rounded-[3rem] shadow-2xl border-4 border-primary/5 flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent" />
             <Building2 className="h-20 w-20 text-primary animate-bounce" style={{ animationDuration: '4s' }} />
          </div>
          <div className="absolute -top-4 -right-4 bg-amber-400 text-white p-3 rounded-2xl shadow-xl">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
            COMING<br /><span className="text-primary">SOON.</span>
          </h2>
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] leading-relaxed max-w-[280px] mx-auto">
            WE ARE PARTNERING WITH THE BEST LUXURY HOTELS IN YOUR AREA.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full pt-4">
           <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 text-left">
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-500">
                 <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                 <h4 className="text-xs font-black uppercase text-gray-800">Verified Stays</h4>
                 <p className="text-[9px] font-bold text-muted-foreground uppercase">Top-rated local properties</p>
              </div>
           </div>

           <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 text-left">
              <div className="bg-amber-50 p-3 rounded-2xl text-amber-500">
                 <Star className="h-6 w-6" />
              </div>
              <div>
                 <h4 className="text-xs font-black uppercase text-gray-800">Best Pricing</h4>
                 <p className="text-[9px] font-bold text-muted-foreground uppercase">Exclusive ShopyKart deals</p>
              </div>
           </div>
        </div>

        <Button 
          onClick={() => router.push('/')}
          className="w-full h-16 bg-[#0B0B0B] text-white rounded-[2rem] font-black uppercase italic shadow-2xl active:scale-95 transition-all"
        >
          NOTIFY ME ON LAUNCH
        </Button>
      </main>
    </div>
  );
}
