"use client"

import { BottomNav } from '@/components/shared/BottomNav';
import { Gift, Star, Trophy, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function RewardsPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-12 pb-6">
        <h1 className="text-3xl font-black">Feast Points</h1>
      </div>

      <div className="px-4">
        {/* Points Card */}
        <div className="bg-primary premium-card p-6 text-primary-foreground relative overflow-hidden">
          <div className="absolute -top-10 -right-10 h-40 w-40 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="h-5 w-5 fill-white text-white" />
              <span className="text-sm font-bold opacity-90 uppercase tracking-widest">Available Balance</span>
            </div>
            <div className="text-5xl font-black">2,450</div>
            <p className="text-xs mt-4 opacity-80">You're only 550 points away from a FREE Pizza!</p>
            <Progress value={70} className="mt-4 h-2 bg-white/20" />
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="premium-card p-4 flex flex-col items-center text-center">
            <div className="h-12 w-12 bg-amber-100 rounded-2xl flex items-center justify-center mb-3">
              <Trophy className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="font-bold text-sm">Milestones</h3>
            <p className="text-[10px] text-muted-foreground">Earn extra points</p>
          </div>
          <div className="premium-card p-4 flex flex-col items-center text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-3">
              <Gift className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-sm">Coupons</h3>
            <p className="text-[10px] text-muted-foreground">Active vouchers</p>
          </div>
        </div>

        {/* Offers */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Featured Rewards</h2>
          <div className="space-y-4">
            {[
              { title: 'Free Large Pizza', cost: '3,000 pts', img: 'pizza-banner' },
              { title: 'BOGO Burger Meal', cost: '1,500 pts', img: 'burger-banner' },
            ].map((reward, i) => (
              <div key={i} className="premium-card p-3 flex items-center space-x-4">
                <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden">
                  <img src={`https://picsum.photos/seed/reward-${i}/100/100`} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">{reward.title}</h4>
                  <span className="text-xs text-primary font-bold">{reward.cost}</span>
                </div>
                <button className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary">
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}