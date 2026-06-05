"use client"

import { useRouter } from 'next/navigation';
import { ChevronLeft, Rocket, BellRing, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function ServicesComingSoon() {
  const router = useRouter();
  const { toast } = useToast();

  const handleNotify = () => {
    toast({
      title: "Notification Set! 🔔",
      description: "We will alert you as soon as this service goes live in your area.",
    });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32">
      {/* Header */}
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b border-gray-100">
        <button 
          onClick={() => router.back()} 
          className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-bold text-gray-800 italic uppercase">Service Preview</h1>
      </div>

      <main className="flex flex-col items-center justify-center p-8 mt-10 text-center space-y-10 max-w-md mx-auto">
        {/* Animated Illustration */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="relative bg-white h-40 w-40 rounded-[3rem] shadow-2xl border-4 border-primary/5 flex items-center justify-center overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent" />
             <Rocket className="h-20 w-20 text-primary animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          
          <div className="absolute -top-4 -right-4 bg-amber-400 text-white p-3 rounded-2xl shadow-xl animate-spin-slow">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
            SERVICE<br /><span className="text-primary">LAUNCHING SOON</span>
          </h2>
          <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] leading-relaxed max-w-[280px] mx-auto">
            WE ARE CURATING THE BEST LOCAL PARTNERS TO BRING PREMIUM CARE TO YOUR DOORSTEP.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 w-full pt-4">
           <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 text-left">
              <div className="bg-blue-50 p-3 rounded-2xl text-blue-500">
                 <Clock className="h-6 w-6" />
              </div>
              <div>
                 <h4 className="text-xs font-black uppercase text-gray-800">Fast Response</h4>
                 <p className="text-[9px] font-bold text-muted-foreground uppercase">Under 60 minutes service</p>
              </div>
           </div>

           <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4 text-left">
              <div className="bg-green-50 p-3 rounded-2xl text-green-500">
                 <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                 <h4 className="text-xs font-black uppercase text-gray-800">Verified Experts</h4>
                 <p className="text-[9px] font-bold text-muted-foreground uppercase">Trained & certified professionals</p>
              </div>
           </div>
        </div>

        <div className="w-full space-y-6">
           <Button 
            onClick={handleNotify}
            className="w-full h-16 rounded-[2rem] bg-[#0B0B0B] hover:bg-primary text-white font-black uppercase italic text-lg shadow-2xl transition-all active:scale-95"
           >
             <BellRing className="h-5 w-5 mr-3 animate-ring" />
             NOTIFY ME ON LAUNCH
           </Button>

           <div className="flex items-center justify-center gap-2 opacity-30">
              <div className="h-1 w-1 bg-gray-400 rounded-full" />
              <p className="text-[8px] font-black uppercase tracking-[0.5em]">ShopyKart Ecosystem</p>
              <div className="h-1 w-1 bg-gray-400 rounded-full" />
           </div>
        </div>
      </main>
    </div>
  );
}
