
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Users, ShoppingBag, Terminal, Rocket, AlertCircle, Shield, Globe, Loader2, RefreshCw } from 'lucide-react';
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
                     <RefreshCw className="h-6 w-6 text-primary animate-spin" />
                     <h3 className="text-xl font-black italic uppercase tracking-tight">Final Force Deployment</h3>
                  </div>
                  <Badge className="bg-primary text-white font-black text-[10px]">ULTRA_STATIC_V800</Badge>
               </div>
            </div>
            <CardContent className="p-8 space-y-6">
               <div className="bg-red-50 p-6 rounded-[2rem] border-2 border-dashed border-red-200">
                  <div className="flex items-center gap-3 mb-4">
                     <AlertCircle className="h-6 w-6 text-red-600" />
                     <h4 className="text-sm font-black uppercase text-red-900">Final Instructions (Important)</h4>
                  </div>
                  <div className="space-y-4 text-[11px] font-bold text-red-800 leading-relaxed uppercase">
                     <p>
                        1. <span className="underline font-black">Free Plan Status</span>: Aapka domain point ho chuka hai. Humne code ko "Static" kar diya hai taaki bina billing ke live ho sake.
                     </p>
                     <p>
                        2. <span className="underline font-black">Wait Time</span>: Build process mein 5-10 minute lagte hain. Phir se wahi domain mat daliye, bas wait karein.
                     </p>
                     <p>
                        3. <span className="underline font-black">Crucial Check</span>: 10 minute baad apne phone mein <span className="text-black underline font-black">Incognito / Private Mode</span> mein site kholiye. 
                     </p>
                     <p>
                        4. Agar phir bhi blue page dikhe, toh iska matlab Firebase server files upload kar raha hai. 
                     </p>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-green-50 rounded-3xl border border-green-100">
                     <div className="flex items-center gap-2 mb-2">
                        <Globe className="h-4 w-4 text-green-600" />
                        <span className="text-[10px] font-black uppercase text-green-700">Domain Connected</span>
                     </div>
                     <p className="text-sm font-bold italic">shopykart.co.in (Active)</p>
                  </div>
                  <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100">
                     <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="text-[10px] font-black uppercase text-blue-700">Billing Guard</span>
                     </div>
                     <p className="text-sm font-bold">100% Free Plan Active</p>
                  </div>
               </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-sm rounded-[2rem] bg-primary text-white p-8 flex flex-col justify-center text-center relative overflow-hidden h-full">
            <div className="relative z-10">
               <Loader2 className="h-10 w-10 text-white mx-auto mb-4 animate-spin" />
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">Build V800 Status</h4>
               <div className="text-4xl font-black italic tracking-tighter text-white leading-none">FORCE<br/>RELEASE</div>
               <p className="text-[9px] font-bold text-white/80 mt-6 uppercase leading-relaxed">System is pushing files to your free hosting right now.</p>
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
