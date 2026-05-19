
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, ShoppingBag, IndianRupee, MousePointerClick, CheckCircle2, Globe, ShieldCheck, AlertCircle, Info, Rocket, ShoppingCart, Clock, AlertTriangle, Zap, Server, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function AdminOverview() {
  const stats = [
    { label: 'Total Revenue', value: '₹0.00', icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Orders', value: '0', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Registered Users', value: '1', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Abandoned Carts', value: '0', icon: MousePointerClick, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Free Plan Launch Support Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="col-span-1 md:col-span-2 border-primary/20 bg-white shadow-xl rounded-[2.5rem] overflow-hidden">
            <div className="bg-primary p-6 text-white">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Shield className="h-6 w-6 animate-pulse" />
                     <h3 className="text-xl font-black italic uppercase">Free Plan Dashboard</h3>
                  </div>
                  <Badge className="bg-white text-primary font-black text-[10px]">SPARK PLAN ACTIVE</Badge>
               </div>
            </div>
            <CardContent className="p-8 space-y-6">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-green-50 rounded-3xl border border-green-100">
                     <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4 text-green-600" />
                        <span className="text-[10px] font-black uppercase text-green-700">Live Domain</span>
                     </div>
                     <p className="text-sm font-bold">shopykart.co.in</p>
                     <p className="text-[9px] font-bold text-green-600/70 mt-1 uppercase">Standard Hosting</p>
                  </div>
                  <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100">
                     <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="h-4 w-4 text-blue-600" />
                        <span className="text-[10px] font-black uppercase text-blue-700">Security</span>
                     </div>
                     <p className="text-sm font-bold">SSL (HTTPS) Active</p>
                     <p className="text-[9px] font-bold text-blue-600/70 mt-1 uppercase">Free Encryption</p>
                  </div>
               </div>

               <div className="bg-muted/50 p-6 rounded-[2rem] border-2 border-dashed border-muted-foreground/20">
                  <div className="flex items-center gap-3 mb-4">
                     <Info className="h-6 w-6 text-primary" />
                     <h4 className="text-sm font-black uppercase text-foreground tracking-tight">Free Plan Par Website Kaise Chalegi?</h4>
                  </div>
                  <div className="space-y-4 text-[10px] font-bold text-muted-foreground leading-relaxed uppercase">
                     <p>
                        1. <span className="text-primary underline">Static Export</span>: Maine app ko "Static Mode" mein convert kar diya hai. Ab ye bina kisi extra cost (Blaze Plan) ke **Standard Firebase Hosting** par chal jayegi.
                     </p>
                     <p>
                        2. <span className="text-primary underline">Wait for Build</span>: Domain connect hone ke baad, Firebase Studio ko 5-10 minute ka waqt dein files upload karne ke liye.
                     </p>
                     <p>
                        3. <span className="text-primary underline">Authorized Domains</span>: Agar Google Login nahi chal raha, toh **Firebase Console &gt; Auth &gt; Settings &gt; Authorized Domains** mein <span className="font-black text-foreground">shopykart.co.in</span> manually add kar dein. Ye kaam Spark plan par bhi free hota hai.
                     </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-muted">
                     <p className="text-[8px] text-muted-foreground text-center font-black tracking-widest italic">
                        SITE LIVE HONE MEIN MAX 24 GHANTE LAG SAKTE HAIN
                     </p>
                  </div>
               </div>
            </CardContent>
         </Card>

         <div className="space-y-6">
            <Card className="border-none shadow-sm rounded-[2rem] bg-black text-white p-8 flex flex-col justify-center text-center relative overflow-hidden h-full">
               <div className="relative z-10">
                  <Zap className="h-10 w-10 text-primary mx-auto mb-4 fill-primary" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2">Network Status</h4>
                  <div className="text-4xl font-black italic tracking-tighter text-white leading-none">FREE<br/><span className="text-primary">HOSTING</span></div>
                  <p className="text-[9px] font-bold text-gray-500 mt-6 uppercase leading-relaxed">Optimization complete for<br/>shopykart.co.in</p>
               </div>
               <div className="absolute inset-0 bg-primary/5 -skew-x-12 translate-x-1/2" />
            </Card>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden bg-white border border-border/40">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-xl`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{stat.value}</div>
              <p className="text-[10px] text-green-500 font-bold mt-1">Ready for business</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
