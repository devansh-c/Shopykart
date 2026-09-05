
"use client"

import { Trophy, Coins, UserPlus, Zap } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';

export default function RewardsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: profile } = useDoc<any>(profileRef);
  const currentCoins = profile?.coins || 0;

  const handleOpenAuth = () => {
    window.dispatchEvent(new CustomEvent('open-auth-overlay'));
  };

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">My Rewards</h1>
      </div>

      <div className="px-4 space-y-6">
        {!user ? (
          <div className="bg-[#0B0B0B] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5 animate-in fade-in zoom-in duration-500">
             <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                   <div className="h-14 w-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                      <Zap className="h-8 w-8 animate-pulse" />
                   </div>
                   <div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none text-primary">JOIN NOW</h2>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Get instant welcome reward</p>
                   </div>
                </div>

                <div className="bg-white/5 p-6 rounded-[1.5rem] border border-white/10 text-center">
                   <span className="text-[10px] font-black uppercase text-primary tracking-[0.3em] block mb-2">Welcome Bonus</span>
                   <div className="text-4xl font-black italic text-white tracking-tighter mb-1">20 FREE COINS</div>
                   <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed italic">Redeemable on your very first order at ShopyKart.</p>
                </div>

                <Button 
                  onClick={handleOpenAuth}
                  className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] font-black uppercase italic text-lg shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  <UserPlus className="h-5 w-5 mr-3" />
                  REGISTER & CLAIM
                </Button>
             </div>
             <div className="absolute top-0 right-0 h-full w-44 bg-white/5 -skew-x-12 translate-x-12 pointer-events-none" />
          </div>
        ) : (
          <div className="bg-primary rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
            <div className="relative z-10">
              <div className="flex items-center space-x-2 mb-2">
                <Coins className="h-5 w-5 fill-white text-white" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Available Points</span>
              </div>
              <div className="text-6xl font-black italic tracking-tighter leading-none mb-4">{currentCoins}</div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-wider opacity-80">
                  <span>Keep ordering to earn more</span>
                </div>
                <Progress value={Math.min(100, (currentCoins / 1000) * 100)} className="h-2 bg-white/30" />
              </div>
            </div>
            <div className="absolute top-0 right-0 h-full w-32 bg-white/10 -skew-x-12 translate-x-10" />
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border-2 border-dashed border-gray-100 text-center">
             <div className="bg-amber-50 h-20 w-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border-2 border-amber-100">
                <Trophy className="h-10 w-10 text-amber-500" />
             </div>
             <h2 className="text-2xl font-black italic uppercase tracking-tight text-gray-900">Reward Plan</h2>
             <div className="text-xs text-muted-foreground font-bold mt-6 leading-relaxed px-4 uppercase space-y-4">
               
               <div className="flex items-center gap-4 text-left p-4 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-lg">
                  <div className="h-12 w-12 bg-primary text-white rounded-xl flex items-center justify-center font-black italic shrink-0 shadow-lg">20</div>
                  <div>
                     <p className="text-gray-900 leading-none mb-1 font-black">1ST ORDER REWARD</p>
                     <p className="text-[8px] text-gray-400 tracking-widest font-black">Get 20 Coins on your debut</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-4 text-left p-4 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-lg">
                  <div className="h-12 w-12 bg-primary/20 text-primary rounded-xl flex items-center justify-center font-black italic shrink-0 border border-primary/20">10</div>
                  <div>
                     <p className="text-gray-900 leading-none mb-1 font-black">2ND ORDER REWARD</p>
                     <p className="text-[8px] text-gray-400 tracking-widest font-black">Get 10 Coins on next visit</p>
                  </div>
               </div>

               <div className="flex items-center gap-4 text-left p-4 bg-gray-50 rounded-2xl border border-gray-100 group transition-all hover:bg-white hover:shadow-lg">
                  <div className="h-12 w-12 bg-gray-200 text-gray-500 rounded-xl flex items-center justify-center font-black italic shrink-0">05</div>
                  <div>
                     <p className="text-gray-900 leading-none mb-1 font-black">LOYALTY REWARD</p>
                     <p className="text-[8px] text-gray-400 tracking-widest font-black">Get 5 Coins on every order</p>
                  </div>
               </div>

               <div className="pt-4 text-[9px] text-primary font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-amber-500 fill-amber-500 animate-pulse" />
                  Redeem at checkout for instant cash slash!
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
