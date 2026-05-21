'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Volume2, Share2, Info, Mic, Trophy, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [gameState, setViewState] = useState<'info' | 'playing' | 'won'>('info');
  const [screamLevel, setScreamLevel] = useState(0);
  const [maxLevelReached, setMaxLevelReached] = useState(0);
  const { toast } = useToast();

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const handleOpen = () => {
      setViewState('info');
      setScreamLevel(0);
      setMaxLevelReached(0);
      setIsOpen(true);
    };
    window.addEventListener('open-promo-popup', handleOpen);
    
    const lastShown = sessionStorage.getItem('last_promo_shown');
    if (!lastShown) {
      const timer = setTimeout(() => setIsOpen(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('open-promo-popup', handleOpen);
      stopGame();
    };
  }, []);

  const startGame = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      setViewState('playing');
      detectVolume();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Mic Access Required",
        description: "Please allow microphone access to play the scream game!"
      });
    }
  };

  const detectVolume = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const update = () => {
      analyserRef.current!.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const normalized = Math.min(100, Math.floor((average / 128) * 100));
      
      setScreamLevel(normalized);
      
      // Update max level reached
      setMaxLevelReached(prev => {
        const next = Math.max(prev, normalized);
        if (next >= 100) {
          handleWin();
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(update);
    };
    
    update();
  };

  const handleWin = () => {
    stopGame();
    setViewState('won');
    // Play win sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    audio.play().catch(() => {});
  };

  const stopGame = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const handleClose = () => {
    stopGame();
    sessionStorage.setItem('last_promo_shown', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-sky-400/95 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
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

      <div className="relative w-full h-full min-h-screen flex flex-col items-center pt-10 px-6 max-w-lg mx-auto">
        
        {/* Top Navigation Row */}
        <div className="w-full flex justify-between items-center mb-4 px-2">
           <button onClick={handleClose} className="bg-white/20 p-2 rounded-full text-white backdrop-blur-md active:scale-90 transition-transform">
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

        {gameState === 'info' && (
          <div className="flex flex-col items-center w-full animate-in slide-in-from-bottom-4 duration-500">
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
                  <div className="absolute right-[-10px] top-0 h-full flex flex-col justify-around py-1">
                     {[...Array(6)].map((_, i) => <div key={i} className="w-4 h-4 bg-sky-400 rounded-full -mr-2" />)}
                  </div>
               </div>
            </div>

            {/* Powered By Section */}
            <div className="flex flex-col items-center gap-2 mb-6">
               <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-80">Powered By</span>
               <div className="flex items-center gap-3">
                  <div className="bg-white p-1 rounded-md shadow-sm h-8 w-14 flex items-center justify-center overflow-hidden">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Kwality_Wall%27s_Logo.svg" className="h-full object-contain" alt="Kwality Walls" />
                  </div>
                  <div className="bg-white p-1 rounded-md shadow-sm h-8 w-14 flex items-center justify-center overflow-hidden">
                     <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Amul_Logo.svg" className="h-full object-contain" alt="Amul" />
                  </div>
               </div>
            </div>

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
                     <div className="flex items-center gap-4">
                        <div className="relative">
                           <div className="bg-amber-800 h-28 w-28 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
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

            <div className="mt-auto w-full pb-10">
               <button 
                onClick={startGame}
                className="w-full h-16 bg-white rounded-full shadow-[0_10px_40px_rgba(255,255,255,0.4)] flex items-center justify-center group active:scale-95 transition-all"
               >
                 <span className="text-xl font-black text-[#451A03]">Play Now</span>
               </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="flex flex-col items-center w-full h-full animate-in zoom-in duration-500">
            <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter text-center mt-10 drop-shadow-2xl">
              SCREAM<br /><span className="text-red-600 bg-white px-2">NOW!</span>
            </h2>
            
            <p className="text-sm font-black text-white/80 uppercase tracking-widest mt-6 animate-pulse">
              Louder... LOUDER!
            </p>

            <div className="relative flex-1 w-full flex items-center justify-center my-10">
              {/* Scream Meter Container */}
              <div className="w-32 h-[400px] bg-black/40 rounded-full border-4 border-white/20 p-2 relative overflow-hidden shadow-2xl">
                {/* Active Level Bar */}
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-600 via-orange-400 to-yellow-300 transition-all duration-75"
                  style={{ height: `${screamLevel}%` }}
                >
                   <div className="absolute top-0 left-0 right-0 h-4 bg-white/40 blur-md" />
                </div>
                
                {/* Max Level Indicator */}
                <div 
                  className="absolute left-0 right-0 h-1 bg-white border-t border-black/20 z-10 transition-all duration-300"
                  style={{ bottom: `${maxLevelReached}%` }}
                />
              </div>

              {/* Character reacting */}
              <div className="absolute -right-4 bottom-20 flex flex-col items-center">
                 <div className={cn(
                   "bg-white p-3 rounded-2xl shadow-xl transition-transform duration-75",
                   screamLevel > 50 ? "scale-110 -rotate-6" : "scale-100 rotate-0"
                 )}>
                    <span className="text-3xl">😱</span>
                 </div>
              </div>
            </div>

            <div className="w-full bg-white/20 p-6 rounded-[2.5rem] backdrop-blur-md border border-white/30 mb-10">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Progress</span>
                 <span className="text-lg font-black text-white">{maxLevelReached}%</span>
               </div>
               <div className="w-full h-4 bg-black/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-300" 
                    style={{ width: `${maxLevelReached}%` }}
                  />
               </div>
            </div>

            <Button 
              variant="ghost" 
              onClick={() => { stopGame(); setViewState('info'); }}
              className="mb-10 text-white/50 font-black uppercase text-[10px] tracking-widest hover:text-white"
            >
              GIVE UP
            </Button>
          </div>
        )}

        {gameState === 'won' && (
          <div className="flex flex-col items-center justify-center w-full h-full animate-in zoom-in duration-700 text-center">
             <div className="relative mb-8">
                <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20" />
                <div className="relative bg-white h-32 w-32 rounded-full flex items-center justify-center shadow-2xl">
                   <Trophy className="h-16 w-16 text-yellow-500" />
                </div>
             </div>

             <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-tight drop-shadow-xl">
               YOU DID IT!<br /><span className="text-[#22c55e] drop-shadow-[0_2px_0_#FFF]">LEGENDARY.</span>
             </h2>

             <p className="text-sm font-bold text-white/80 uppercase tracking-widest mt-6 max-w-xs leading-relaxed">
               YOUR VOICE HAS UNLOCKED THE ULTIMATE PRIZE.
             </p>

             <div className="mt-12 bg-white p-8 rounded-[3rem] shadow-2xl w-full max-w-sm space-y-6">
                <div className="flex flex-col items-center">
                   <div className="h-24 w-24 bg-amber-50 rounded-3xl flex items-center justify-center mb-4">
                      <img src="https://picsum.photos/seed/icecream-choc/100/200" className="h-16 object-contain" alt="Free Prize" />
                   </div>
                   <h4 className="text-xl font-black italic uppercase text-gray-800">FREE CHOC-BAR</h4>
                   <p className="text-[10px] font-black text-primary uppercase tracking-widest">Added to your next order</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200">
                   <span className="text-xs font-black text-gray-400 uppercase">Coupon Code:</span>
                   <div className="text-2xl font-black italic tracking-widest text-black mt-1">SCREAMFREE</div>
                </div>

                <Button 
                  onClick={handleClose}
                  className="w-full h-14 rounded-2xl bg-black hover:bg-gray-800 text-white font-black uppercase italic shadow-xl"
                >
                  CLAIM PRIZE
                </Button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
