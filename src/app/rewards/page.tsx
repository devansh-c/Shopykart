"use client"

import { BottomNav } from '@/components/shared/BottomNav';
import { Gift, Star, Trophy, ArrowRight, Copy, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function RewardsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('points');

  const handleCopy = (code: string) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      toast({
        title: "Code Copied!",
        description: `${code} is ready to use at checkout.`,
      });
    }
  };

  const rewards = [
    { title: 'Free Large Pizza', cost: '3,000 pts', type: 'Food', progress: 80 },
    { title: 'BOGO Burger Meal', cost: '1,500 pts', type: 'Combo', progress: 100 },
    { title: 'Free Cold Drink', cost: '800 pts', type: 'Beverage', progress: 100 },
  ];

  const coupons = [
    { code: 'FIRST50', desc: '50% Off your first order', minOrder: '₹300', color: 'bg-red-500' },
    { code: 'WEEKEND20', desc: '20% Off every weekend', minOrder: '₹500', color: 'bg-amber-500' },
    { code: 'PARTY30', desc: '30% Off on party orders', minOrder: '₹1200', color: 'bg-indigo-500' },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-32">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">My Rewards</h1>
        <button className="h-10 w-10 bg-white rounded-full shadow-sm border border-border/50 flex items-center justify-center">
          <Info className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <div className="px-4 space-y-6">
        {/* Points Card */}
        <div className="bg-primary rounded-[2rem] p-8 text-primary-foreground relative overflow-hidden shadow-xl shadow-primary/20">
          <div className="absolute -top-10 -right-10 h-48 w-48 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-black/10 rounded-full blur-xl" />
          
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="h-5 w-5 fill-white text-white" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Available Points</span>
            </div>
            <div className="text-6xl font-black italic tracking-tighter leading-none mb-4">2,450</div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-wider opacity-80">
                <span>Silver Tier</span>
                <span>Next Tier: 3,000 pts</span>
              </div>
              <Progress value={81} className="h-2 bg-white/20" />
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-muted p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('points')}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'points' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
            )}
          >
            My Points
          </button>
          <button 
            onClick={() => setActiveTab('coupons')}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === 'coupons' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
            )}
          >
            Coupons
          </button>
        </div>

        {activeTab === 'points' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-black italic uppercase tracking-tight ml-2">Unlock Rewards</h2>
            {rewards.map((reward, i) => (
              <div key={i} className="bg-white rounded-3xl p-4 flex items-center gap-4 border border-border/40 shadow-sm relative overflow-hidden group">
                <div className="h-16 w-16 bg-muted rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                  <img src={`https://picsum.photos/seed/rew-${i}/100/100`} className="h-full w-full object-cover group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm leading-tight">{reward.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-primary uppercase">{reward.cost}</span>
                    <span className="text-[10px] text-muted-foreground">• {reward.type}</span>
                  </div>
                  <div className="mt-2 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${reward.progress}%` }} />
                  </div>
                </div>
                <button className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                  reward.progress === 100 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                )}>
                  {reward.progress === 100 ? <Gift className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-black italic uppercase tracking-tight ml-2">My Coupons</h2>
            {coupons.map((coupon, i) => (
              <div key={i} className="relative bg-white rounded-3xl p-6 border-2 border-dashed border-muted-foreground/20 flex flex-col gap-4 active:scale-[0.98] transition-all overflow-hidden group">
                <div className={cn("absolute top-0 right-0 h-2 w-full", coupon.color)} />
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-black italic italic uppercase tracking-tighter">{coupon.code}</h3>
                    <p className="text-xs text-muted-foreground font-medium">{coupon.desc}</p>
                  </div>
                  <button 
                    onClick={() => handleCopy(coupon.code)}
                    className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors"
                  >
                    <Copy className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-dashed border-border mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min Order: {coupon.minOrder}</span>
                  <span className="text-[10px] font-black text-primary uppercase italic">Details</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
