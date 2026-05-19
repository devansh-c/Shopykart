
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, ShoppingBag, IndianRupee, MousePointerClick, CheckCircle2, Globe, ShieldCheck, AlertCircle, Info, Rocket, ShoppingCart, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AdminOverview() {
  const stats = [
    { label: 'Total Revenue', value: '₹0.00', icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Orders', value: '0', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Registered Users', value: '1', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Abandoned Carts', value: '0', icon: MousePointerClick, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Launch Success Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="col-span-1 md:col-span-2 border-green-200 bg-green-50/30 shadow-lg rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-2">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="bg-green-500 p-2 rounded-xl text-white">
                        <Rocket className="h-5 w-5" />
                     </div>
                     <CardTitle className="text-lg font-black italic uppercase">Site Status: CONNECTED</CardTitle>
                  </div>
                  <Badge className="bg-green-600 text-white font-black text-[10px] animate-pulse">LIVE AT SHOPYKART.CO.IN</Badge>
               </div>
            </CardHeader>
            <CardContent className="pt-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-green-100 shadow-sm">
                     <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                     <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Domain Verified</p>
                        <p className="text-sm font-bold text-foreground">shopykart.co.in</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-blue-100 shadow-sm">
                     <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                     <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Security Protocol</p>
                        <p className="text-sm font-bold text-foreground">HTTPS (SSL) Active</p>
                     </div>
                  </div>
               </div>
               
               <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold text-amber-700 uppercase">Emergency Checklist (If site not showing)</p>
                    <div className="text-[9px] text-amber-800 mt-1 uppercase leading-relaxed font-bold space-y-2">
                      <p>1. <span className="text-primary underline">App Hosting vs Hosting</span>: Make sure aapne domain <span className="font-black">"App Hosting"</span> section mein add kiya hai, normal "Hosting" mein nahi.</p>
                      <p>2. <span className="text-primary underline">Build Status</span>: Console mein check karein ki build "Success" dikha raha hai ya "Failed".</p>
                      <p>3. <span className="text-primary underline">Authorized Domains</span>: Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains mein <span className="font-black">shopykart.co.in</span> add karein.</p>
                    </div>
                  </div>
               </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-sm rounded-[2rem] bg-black text-white p-8 flex flex-col justify-center text-center relative overflow-hidden">
            <div className="relative z-10">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2">Network Hub</h4>
               <div className="text-5xl font-black italic tracking-tighter text-primary">ONLINE</div>
               <p className="text-[10px] font-bold text-gray-400 mt-4 uppercase">Shopykart Network is now accepting traffic</p>
            </div>
            <div className="absolute inset-0 bg-primary/5 -skew-x-12 translate-x-1/2" />
         </Card>
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
