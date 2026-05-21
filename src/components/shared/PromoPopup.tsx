'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Volume2, Share2, Info, Mic, Trophy, Loader2, Timer, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

type GameState = 'info' | 'playing' | 'won' | 'lost';

export function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [gameState, setViewState] = useState<GameState>('info');
  const [screamLevel, setScreamLevel] = useState(0);
  const [maxLevelReached, setMaxLevelReached] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const { toast } = useToast();

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleOpen = () => {
      setViewState('info');
      setScreamLevel(0);
      setMaxLevelReached(0);
      setTimeLeft(30);
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

  // Timer Logic
  useEffect(() => {
    if (gameState === 'playing') {
      setTimeLeft(30);
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleLost();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [gameState]);

  const startGame = async () => {
    try {
      // 1. Force cleanup
      stopGame();

      // 2. Setup Audio
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.1;
      analyserRef.current = analyser;
      
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      setViewState('playing');
      setScreamLevel(0);
      setMaxLevelReached(0);
      detectVolume();
    } catch (err: any) {
      console.error("Mic Access Error:", err);
      toast({
        variant: "destructive",
        title: "Mic Access Denied",
        description: "Please allow microphone permissions to play the game."
      });
      setViewState('info');
    }
  };

  const detectVolume = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const update = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      let peak = 0;
      for (let i = 0; i < bufferLength; i++) {
        if (dataArray[i] > peak) peak = dataArray[i];
      }
      
      // Visual feedback wave
      const instantLevel = Math.min(100, Math.floor((peak / 255) * 100));
      setScreamLevel(instantLevel);
      
      // CUSTOM PROGRESSION LOGIC
      setMaxLevelReached(prev => {
        let next = prev;
        const isEasyPhase = prev < 88;

        if (isEasyPhase) {
          // PHASE 1: VERY VERY EASY (Threshold 30) - Rise to 88%
          if (peak > 30) {
            next = Math.min(88, prev + 5.0); // Super fast rise
          } else {
            next = Math.max(0, prev - 0.05); // Very slow drain
          }
        } else {
          // PHASE 2: THE LOCK (Threshold 240) - Rise to 90% then stop
          if (peak > 240) {
            next = Math.min(90, prev + 0.02); // Super slow rise to 90% cap
          } else {
            next = Math.max(88, prev - 0.3); // Quick drop back to 88 if they stop
          }
        }
        
        if (next >= 100) {
          setTimeout(handleWin, 100);
          return 100;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(update);
    };
    
    animationFrameRef.current = requestAnimationFrame(update);
  };

  const handleWin = () => {
    stopGame();
    setViewState('won');
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const handleLost = () => {
    stopGame();
    setViewState('lost');
  };

  const stopGame = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const handleClose = () => {
    stopGame();
    sessionStorage.setItem('last_promo_shown', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-sky-400/95 animate-in fade-in duration-300 overflow-y-auto no-scrollbar">
      <div className="relative w-full h-full min-h-screen flex flex-col items-center pt-10 px-6 max-w-lg mx-auto">
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
            <div className="relative mb-6">
               <div className="bg-white px-8 py-3 rounded-md shadow-[4px_4px_0px_rgba(0,0,0,0.1)] relative transform -rotate-1">
                  <h2 className="text-center">
                    <span className="block text-4xl font-black text-[#632D15] leading-none tracking-tighter">SCREAM</span>
                    <span className="block text-sm font-black text-red-600 uppercase tracking-widest mt-1">FOR <span className="bg-red-600 text-white px-1">ICE-CREAM</span></span>
                  </h2>
               </div>
            </div>

            <div className="flex flex-col items-center gap-1 mb-6">
               <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-80">Powered By</span>
               <h1 className="text-xl font-black italic tracking-tighter text-white">
                 SHOPY<span className="text-yellow-400">KART</span>
               </h1>
            </div>

            <div className="text-center mb-8">
               <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter drop-shadow-[0_2px_0_#15803d]">
                  CHALLENGE ACTIVE!
               </h3>
               <h3 className="text-xl font-black italic text-[#FEF08A] uppercase tracking-tighter mt-2">
                  SCREAM CONTINUOUSLY TO WIN 😱
               </h3>
               <p className="text-[10px] font-black text-white/60 uppercase mt-2 tracking-widest">Jeetne par milega Free Choc-Bar!</p>
            </div>

            <div className="w-full bg-[#E0F2FE] rounded-3xl overflow-hidden border-4 border-white shadow-2xl mb-10">
               <div className="bg-[#B9E6FE] py-2 text-center">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-[#0369A1]">HOW TO PLAY</span>
               </div>
               <div className="bg-[#FEF08A] p-8 flex flex-col items-center relative">
                  <div className="flex items-center gap-6">
                    <div className="text-center space-y-1">
                      <div className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-lg animate-pulse">LOUD SOUND</div>
                      <div className="h-20 w-20 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                        <img src="https://picsum.photos/seed/loud-mouth/200/200" alt="Loud" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="max-w-[150px] space-y-2">
                      <p className="text-[10px] font-black text-[#451A03] uppercase leading-tight">1. Jitna zor se chillaoge meter utna bharega.</p>
                      <p className="text-[10px] font-black text-[#451A03] uppercase leading-tight">2. 30 seconds ke andar 100% karna hai.</p>
                      <p className="text-[10px] font-black text-[#451A03] uppercase leading-tight">3. 88% ke baad extra power chahiye!</p>
                    </div>
                  </div>
               </div>
               <div className="bg-white py-3 text-center border-t border-sky-100">
                  <p className="text-[9px] font-black text-red-600 uppercase tracking-widest flex items-center justify-center gap-2">
                     <Info className="h-3 w-3" />
                     WARNING: PLEASE DON'T SHOUT IN PUBLIC
                  </p>
               </div>
            </div>

            <div className="mt-auto w-full pb-10">
               <button 
                onClick={startGame}
                className="w-full h-16 bg-white rounded-full shadow-[0_10px_40px_rgba(255,255,255,0.4)] flex items-center justify-center active:scale-95 transition-all"
               >
                 <span className="text-xl font-black text-[#451A03] uppercase italic">Start Screaming!</span>
               </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="flex flex-col items-center w-full h-full animate-in zoom-in duration-500">
            <div className="flex flex-col items-center gap-1 mt-4">
              <div className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-full border-2 bg-black/40 backdrop-blur-md shadow-2xl transition-colors",
                timeLeft <= 5 ? "border-red-500 text-red-500" : "border-white/20 text-white"
              )}>
                 <Timer className={cn("h-5 w-5", timeLeft <= 5 && "animate-pulse")} />
                 <span className="text-3xl font-black tabular-nums italic tracking-tighter">{timeLeft}s</span>
              </div>
              <span className="text-[8px] font-black uppercase text-white/40 tracking-[0.3em]">HURRY UP!</span>
            </div>

            <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter text-center mt-6 drop-shadow-2xl">
              {maxLevelReached < 88 ? "KEEP GOING!" : "ALMOST THERE!"}<br /><span className="text-red-600 bg-white px-2">SCREAM LOUDER!</span>
            </h2>
            
            <div className="relative flex-1 w-full flex items-center justify-center my-6">
              <div className="w-32 h-[380px] bg-black/40 rounded-full border-4 border-white/20 p-2 relative overflow-hidden shadow-2xl">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-yellow-400 opacity-20 transition-all duration-75"
                  style={{ height: `${screamLevel}%` }}
                />
                
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-600 via-orange-400 to-green-500 transition-all duration-100"
                  style={{ height: `${maxLevelReached}%` }}
                >
                   <div className="absolute top-0 left-0 right-0 h-4 bg-white/40 blur-md" />
                </div>
                
                <div className="absolute inset-0 flex flex-col justify-between py-10 items-center pointer-events-none opacity-20">
                   {[...Array(10)].map((_, i) => <div key={i} className="w-10 h-0.5 bg-white rounded-full" />)}
                </div>
              </div>

              <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex flex-col gap-8 text-2xl">
                 <div className={cn("bg-white p-2 rounded-xl shadow-lg transition-all", maxLevelReached > 30 ? "opacity-100 scale-110" : "opacity-20 scale-75")}>😐</div>
                 <div className={cn("bg-white p-2 rounded-xl shadow-lg transition-all", maxLevelReached > 60 ? "opacity-100 scale-110" : "opacity-20 scale-75")}>😮</div>
                 <div className={cn("bg-white p-2 rounded-xl shadow-lg transition-all", maxLevelReached >= 88 ? "opacity-100 scale-125 animate-bounce bg-red-100" : "opacity-20 scale-75")}>😫</div>
              </div>
            </div>

            <div className="w-full bg-white/20 p-5 rounded-[2.5rem] backdrop-blur-md border border-white/30 mb-8">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Progress Bar</span>
                 <span className="text-xl font-black text-white italic">{Math.floor(maxLevelReached)}%</span>
               </div>
               <div className="w-full h-5 bg-black/20 rounded-full overflow-hidden border-2 border-white/10">
                  <div 
                    className={cn(
                      "h-full transition-all duration-100",
                      maxLevelReached < 88 ? "bg-amber-400" : "bg-green-500"
                    )} 
                    style={{ width: `${maxLevelReached}%` }}
                  />
               </div>
            </div>

            <Button 
              variant="ghost" 
              onClick={() => { stopGame(); setViewState('info'); }}
              className="mb-8 text-white/40 font-black uppercase text-[10px] tracking-widest hover:text-white"
            >
              QUIT CHALLENGE
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
               YOU WON!<br /><span className="text-[#22c55e] drop-shadow-[0_2px_0_#FFF]">AMAZING!</span>
             </h2>

             <div className="mt-10 bg-white p-8 rounded-[3rem] shadow-2xl w-full max-w-sm space-y-6">
                <div className="flex flex-col items-center">
                   <div className="h-24 w-24 bg-amber-50 rounded-3xl flex items-center justify-center mb-4">
                      <img src="https://picsum.photos/seed/icecream-choc/100/200" className="h-16 object-contain" alt="Free Prize" />
                   </div>
                   <h4 className="text-xl font-black italic uppercase text-gray-800">FREE CHOC-BAR</h4>
                   <p className="text-[10px] font-black text-primary uppercase tracking-widest">COUPON: SCREAMFREE</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200">
                   <span className="text-xs font-black text-gray-400 uppercase">Use at checkout:</span>
                   <div className="text-2xl font-black italic tracking-widest text-black mt-1">SCREAMFREE</div>
                </div>

                <Button 
                  onClick={handleClose}
                  className="w-full h-14 rounded-2xl bg-black hover:bg-gray-800 text-white font-black uppercase italic shadow-xl"
                >
                  START SHOPPING
                </Button>
             </div>
          </div>
        )}

        {gameState === 'lost' && (
          <div className="flex flex-col items-center justify-center w-full h-full animate-in zoom-in duration-700 text-center">
             <div className="relative mb-8">
                <div className="bg-white/10 h-32 w-32 rounded-full flex items-center justify-center border-4 border-white/20">
                   <AlertCircle className="h-16 w-16 text-white" />
                </div>
             </div>

             <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-tight drop-shadow-xl">
               TIME OVER!<br /><span className="text-yellow-400 drop-shadow-[0_2px_0_#FFF]">GOOD TRY!</span>
             </h2>

             <p className="text-sm font-bold text-white/80 uppercase tracking-widest mt-6 max-w-xs leading-relaxed">
               Thoda aur zor se chillaana tha! But don't worry, here is your reward.
             </p>

             <div className="mt-10 bg-white p-8 rounded-[3rem] shadow-2xl w-full max-w-sm space-y-6">
                <div className="flex flex-col items-center">
                   <h4 className="text-xl font-black italic uppercase text-gray-800">10% OFF DISCOUNT</h4>
                   <p className="text-[10px] font-black text-primary uppercase tracking-widest">CONSOLATION PRIZE</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200">
                   <span className="text-xs font-black text-gray-400 uppercase">Use This Code:</span>
                   <div className="text-2xl font-black italic tracking-widest text-black mt-1">ICECREAM10</div>
                </div>

                <div className="flex flex-col gap-3">
                  <Button 
                    onClick={startGame}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase italic shadow-xl"
                  >
                    TRY AGAIN
                  </Button>
                  <Button 
                    onClick={handleClose}
                    variant="ghost"
                    className="w-full h-12 text-gray-400 font-bold uppercase text-[10px] tracking-widest"
                  >
                    CLOSE & SHOP
                  </Button>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
