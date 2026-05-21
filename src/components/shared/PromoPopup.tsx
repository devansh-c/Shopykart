'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Volume2, Share2, Info, Mic, Trophy, Loader2, Timer, AlertCircle, User, Phone, MapPin, Building2, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

type GameState = 'checking' | 'registration' | 'info' | 'playing' | 'won' | 'lost' | 'already-played';

export function PromoPopup() {
  const { user, loading: authLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [gameState, setViewState] = useState<GameState>('checking');
  const [screamLevel, setScreamLevel] = useState(0);
  const [maxLevelReached, setMaxLevelReached] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  // Form State
  const [regData, setRegData] = useState({
    fullName: '',
    phone: '',
    address: '',
    pincode: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch user profile to check if already played
  const userRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile, loading: profileLoading } = useDoc<any>(userRef);

  useEffect(() => {
    const handleOpen = () => {
      if (profile?.hasPlayedScreamGame) {
        setViewState('already-played');
      } else if (!profile?.fullName || !profile?.phoneNumber) {
        setViewState('registration');
      } else {
        setViewState('info');
      }
      setIsOpen(true);
    };

    window.addEventListener('open-promo-popup', handleOpen);
    
    // Auto-show after delay
    const lastShown = sessionStorage.getItem('last_promo_shown');
    if (!lastShown && !authLoading && !profileLoading && profile !== undefined) {
      const timer = setTimeout(handleOpen, 4000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('open-promo-popup', handleOpen);
      stopGame();
    };
  }, [profile, authLoading, profileLoading]);

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

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;
    
    if (regData.phone.length !== 10 || regData.pincode.length !== 6) {
      toast({ 
        variant: "destructive", 
        title: "Invalid Details", 
        description: "Please enter correct 10-digit Phone and 6-digit Pincode." 
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await setDoc(doc(firestore, 'users', user.uid), {
        fullName: regData.fullName,
        phoneNumber: regData.phone,
        address: regData.address,
        pincode: regData.pincode,
        updatedAt: serverTimestamp(),
        createdAt: profile?.createdAt || serverTimestamp(),
        role: 'customer'
      }, { merge: true });
      
      setViewState('info');
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not save details." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const markAsPlayed = async () => {
    if (!firestore || !user) return;
    await setDoc(doc(firestore, 'users', user.uid), {
      hasPlayedScreamGame: true,
      playedAt: serverTimestamp()
    }, { merge: true });
  };

  const startGame = async () => {
    try {
      stopGame();
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
      toast({ 
        variant: "destructive", 
        title: "Mic Error", 
        description: "Please allow microphone access to participate." 
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
      
      const instantLevel = Math.min(100, Math.floor((peak / 255) * 100));
      setScreamLevel(instantLevel);
      
      setMaxLevelReached(prev => {
        let next = prev;
        const isPhaseOne = prev < 88;

        if (isPhaseOne) {
          // PHASE 1: Threshold 230 - High requirement
          if (peak > 230) {
            next = Math.min(88, prev + 1.2); 
          } else {
            next = Math.max(0, prev - 3.5); // INSTANT DROP
          }
        } else {
          // PHASE 2: Lock at 90%
          if (peak > 230) {
            next = Math.min(90, prev + 0.01); 
          } else {
            next = Math.max(0, prev - 6.5); // FASTER DROP
          }
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
    markAsPlayed();
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
      audio.play().catch(() => {});
    } catch (e) {}
  };

  const handleLost = () => {
    stopGame();
    setViewState('lost');
    markAsPlayed();
  };

  const stopGame = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') audioContextRef.current.close();
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
             <X className="h-5 v-5" />
           </button>
           <div className="flex gap-2">
              <button className="bg-white/20 p-2 rounded-full text-white backdrop-blur-md"><Volume2 className="h-5 v-5" /></button>
              <button className="bg-white/20 p-2 rounded-full text-white backdrop-blur-md"><Share2 className="h-5 v-5" /></button>
           </div>
        </div>

        {gameState === 'registration' && (
          <div className="flex flex-col items-center w-full animate-in slide-in-from-bottom-8 duration-500 py-10">
            <div className="bg-white p-8 rounded-[3rem] shadow-2xl w-full space-y-6">
              <div className="text-center space-y-2">
                <div className="bg-primary/10 h-16 w-16 rounded-[2rem] flex items-center justify-center text-primary mx-auto mb-4 border border-primary/20">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-800 leading-none">
                  ENTRY FORM
                </h2>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Register once to unlock challenge</p>
              </div>

              <form onSubmit={handleRegistration} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="FULL NAME" 
                    value={regData.fullName}
                    onChange={e => setRegData({...regData, fullName: e.target.value.toUpperCase()})}
                    className="pl-12 h-14 rounded-2xl bg-gray-50 border-none font-bold"
                    required
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    type="tel"
                    placeholder="PHONE NUMBER" 
                    value={regData.phone}
                    onChange={e => setRegData({...regData, phone: e.target.value.replace(/\D/g,'').slice(0, 10)})}
                    className="pl-12 h-14 rounded-2xl bg-gray-50 border-none font-bold"
                    required
                  />
                </div>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="FULL ADDRESS" 
                    value={regData.address}
                    onChange={e => setRegData({...regData, address: e.target.value.toUpperCase()})}
                    className="pl-12 h-14 rounded-2xl bg-gray-50 border-none font-bold"
                    required
                  />
                </div>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="PINCODE" 
                    value={regData.pincode}
                    onChange={e => setRegData({...regData, pincode: e.target.value.replace(/\D/g,'').slice(0, 6)})}
                    className="pl-12 h-14 rounded-2xl bg-gray-50 border-none font-bold text-center tracking-widest"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-16 bg-[#0B0B0B] hover:bg-black text-white rounded-[2rem] font-black uppercase italic shadow-xl"
                >
                  {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : "PROCEED TO GAME"}
                </Button>
              </form>
            </div>
          </div>
        )}

        {gameState === 'already-played' && (
          <div className="flex flex-col items-center justify-center h-full animate-in zoom-in duration-500 py-20 text-center">
            <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl space-y-6 w-full">
              <div className="bg-red-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto text-red-500">
                <AlertCircle className="h-12 w-12" />
              </div>
              <h2 className="text-3xl font-black italic uppercase text-gray-800 leading-tight">
                CHALLENGE<br />COMPLETED!
              </h2>
              <p className="text-xs font-bold text-muted-foreground uppercase leading-relaxed px-4">
                Aapne is challenge mein pehle hi participate kar liya hai. Har customer ko sirf ek mauka milta hai!
              </p>
              <Button onClick={handleClose} className="w-full h-14 rounded-2xl bg-black text-white font-black uppercase italic shadow-xl">
                EXPLORE MENU
              </Button>
            </div>
          </div>
        )}

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
               <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase">SHOPYKART</h1>
            </div>

            <div className="text-center mb-8">
               <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter drop-shadow-[0_2px_0_#15803d]">CHALLENGE ACTIVE!</h3>
               <h3 className="text-xl font-black italic text-[#FEF08A] uppercase tracking-tighter mt-2">SCREAM CONTINUOUSLY TO WIN 😱</h3>
            </div>

            <div className="w-full bg-[#E0F2FE] rounded-3xl overflow-hidden border-4 border-white shadow-2xl mb-10">
               <div className="bg-[#B9E6FE] py-2 text-center"><span className="text-xs font-black uppercase tracking-[0.2em] text-[#0369A1]">HOW TO PLAY</span></div>
               <div className="bg-[#FEF08A] p-8 flex flex-col items-center">
                  <div className="flex items-center gap-6">
                    <div className="text-center space-y-1">
                      <div className="bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-lg animate-pulse">LOUD SOUND</div>
                      <div className="h-20 w-20 rounded-full border-4 border-white bg-white overflow-hidden shadow-lg">
                        <img src="https://picsum.photos/seed/loud-mouth/200/200" alt="Loud" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div className="max-w-[150px] space-y-2 text-[10px] font-black text-[#451A03] uppercase leading-tight">
                      <p>1. Jitna zor se chillaoge meter utna bharega.</p>
                      <p>2. Chillaana band kiya toh meter turant gir jayega.</p>
                      <p>3. Peak 230+ chahiye progress ke liye!</p>
                    </div>
                  </div>
               </div>
               <div className="bg-white py-3 text-center border-t border-sky-100">
                  <p className="text-[9px] font-black text-red-600 uppercase tracking-widest flex items-center justify-center gap-2"><Info className="h-3 w-3" /> WARNING: DON'T SHOUT IN PUBLIC</p>
               </div>
            </div>

            <div className="mt-auto w-full pb-10">
               <button onClick={startGame} className="w-full h-16 bg-white rounded-full shadow-[0_10px_40px_rgba(255,255,255,0.4)] flex items-center justify-center active:scale-95 transition-all">
                 <span className="text-xl font-black text-[#451A03] uppercase italic">Start Screaming!</span>
               </button>
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="flex flex-col items-center w-full h-full animate-in zoom-in duration-500">
            <div className="flex flex-col items-center gap-1 mt-4">
              <div className={cn("flex items-center gap-2 px-6 py-2 rounded-full border-2 bg-black/40 backdrop-blur-md shadow-2xl text-white", timeLeft <= 5 && "border-red-500 text-red-500")}>
                 <Timer className={cn("h-5 w-5", timeLeft <= 5 && "animate-pulse")} />
                 <span className="text-3xl font-black tabular-nums italic tracking-tighter">{timeLeft}s</span>
              </div>
            </div>

            <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter text-center mt-6">SCREAM LOUDER!</h2>
            
            <div className="relative flex-1 w-full flex items-center justify-center my-6">
              <div className="w-32 h-[380px] bg-black/40 rounded-full border-4 border-white/20 p-2 relative overflow-hidden">
                <div className="absolute bottom-0 left-0 right-0 bg-yellow-400 opacity-20 transition-all duration-75" style={{ height: `${screamLevel}%` }} />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-red-600 via-orange-400 to-green-500 transition-all duration-100" style={{ height: `${maxLevelReached}%` }} />
              </div>
            </div>

            <div className="w-full bg-white/20 p-5 rounded-[2.5rem] backdrop-blur-md border border-white/30 mb-8">
               <div className="flex justify-between items-center mb-2">
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Progress</span>
                 <span className="text-xl font-black text-white italic">{Math.floor(maxLevelReached)}%</span>
               </div>
               <div className="w-full h-5 bg-black/20 rounded-full overflow-hidden border-2 border-white/10">
                  <div className={cn("h-full transition-all duration-100", maxLevelReached < 88 ? "bg-amber-400" : "bg-green-500")} style={{ width: `${maxLevelReached}%` }} />
               </div>
            </div>
          </div>
        )}

        {gameState === 'won' && (
          <div className="flex flex-col items-center justify-center w-full h-full animate-in zoom-in duration-700 text-center">
             <div className="relative mb-8">
                <div className="relative bg-white h-32 w-32 rounded-full flex items-center justify-center shadow-2xl"><Trophy className="h-16 w-16 text-yellow-500" /></div>
             </div>
             <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter leading-tight">YOU WON!</h2>
             <div className="mt-10 bg-white p-8 rounded-[3rem] shadow-2xl w-full max-w-sm space-y-6">
                <h4 className="text-xl font-black italic uppercase text-gray-800">FREE CHOC-BAR</h4>
                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200">
                   <span className="text-xs font-black text-gray-400 uppercase">COUPON:</span>
                   <div className="text-2xl font-black italic tracking-widest text-black mt-1">SCREAMFREE</div>
                </div>
                <Button onClick={handleClose} className="w-full h-14 rounded-2xl bg-black text-white font-black uppercase italic shadow-xl">START SHOPPING</Button>
             </div>
          </div>
        )}

        {gameState === 'lost' && (
          <div className="flex flex-col items-center justify-center w-full h-full animate-in zoom-in duration-700 text-center">
             <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter text-center">TIME OVER!</h2>
             <div className="mt-10 bg-white p-8 rounded-[3rem] shadow-2xl w-full max-w-sm space-y-6">
                <h4 className="text-xl font-black italic uppercase text-gray-800">10% OFF DISCOUNT</h4>
                <div className="bg-gray-50 p-4 rounded-2xl border-2 border-dashed border-gray-200">
                   <span className="text-xs font-black text-gray-400 uppercase">Use Code:</span>
                   <div className="text-2xl font-black italic tracking-widest text-black mt-1">ICECREAM10</div>
                </div>
                <Button onClick={handleClose} className="w-full h-14 rounded-2xl bg-primary text-white font-black uppercase italic shadow-xl">CLOSE & SHOP</Button>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}
