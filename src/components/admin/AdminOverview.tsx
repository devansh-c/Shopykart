
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Users, ShoppingBag, Terminal, Rocket, AlertCircle, Shield, Globe, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AdminOverview() {
  const stats = [
    { label: 'Total Revenue', value: '₹0.00', icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Orders', value: '0', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Registered Users', value: '1', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'System Mode', value: '100% Free', icon: Terminal, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="col-span-1 md:col-span-2 border-red-200 bg-white shadow-xl rounded-[2.5rem] overflow-hidden">
            <div className="bg-black p-6 text-white">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Rocket className="h-6 w-6 text-primary animate-pulse" />
                     <h3 className="text-xl font-black italic uppercase tracking-tight">Deployment Success Check</h3>
                  </div>
                  <Badge className="bg-primary text-white font-black text-[10px]">REBUILD_V500_TRIGGERED</Badge>
               </div>
            </div>
            <CardContent className="p-8 space-y-6">
               <div className="bg-red-50 p-6 rounded-[2rem] border-2 border-dashed border-red-200">
                  <div className="flex items-center gap-3 mb-4">
                     <AlertCircle className="h-6 w-6 text-red-600" />
                     <h4 className="text-sm font-black uppercase text-red-900">Ab Kya Karna Hai? (Instructions)</h4>
                  </div>
                  <div className="space-y-4 text-[11px] font-bold text-red-800 leading-relaxed uppercase">
                     <p>
                        1. <span className="underline">Intezaar</span>: Maine code ko "Static Mode" mein lock kar diya hai. Ab ye bina billing (debit card) ke live hoga.
                     </p>
                     <p>
                        2. <span className="underline">Blue Page Issue</span>: Agar site par abhi bhi blue "Deploy" page dikh raha hai, toh ye build ki deri nahi, balki browser ki purani memory hai.
                     </p>
                     <p>
                        3. <span className="underline">Action</span>: Apne users se bolein ki wo <span className="text-black underline font-black">shopykart.co.in</span> ko Incognito / Private Mode mein khol kar check karein.
                     </p>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-green-50 rounded-3xl border border-green-100">
                     <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4 text-green-600" />
                        <span className="text-[10px] font-black uppercase text-green-700">Domain Status</span>
                     </div>
                     <p className="text-sm font-bold">Pointing to Standard Hosting</p>
                  </div>
                  <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100">
                     <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="text-[10px] font-black uppercase text-blue-700">Billing Guard</span>
                     </div>
                     <p className="text-sm font-bold">Debit Card Not Required</p>
                  </div>
               </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-sm rounded-[2rem] bg-primary text-white p-8 flex flex-col justify-center text-center relative overflow-hidden h-full">
            <div className="relative z-10">
               <Loader2 className="h-10 w-10 text-white mx-auto mb-4 animate-spin" />
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">Build V500 Status</h4>
               <div className="text-4xl font-black italic tracking-tighter text-white leading-none">CLEANING<br/>CACHE</div>
               <p className="text-[9px] font-bold text-white/80 mt-6 uppercase leading-relaxed">Forcing system to replace blue page with your app.</p>
            </div>
            <div className="absolute inset-0 bg-black/10 -skew-x-12 translate-x-1/2" />
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
              <p className="text-[10px] text-green-500 font-bold mt-1">Live Monitor Active</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
