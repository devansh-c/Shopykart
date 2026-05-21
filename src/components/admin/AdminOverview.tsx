
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Users, ShoppingBag, Terminal, Rocket, AlertCircle, Shield, Globe, Loader2, RefreshCw, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AdminOverview() {
  const stats = [
    { label: 'Total Revenue', value: '₹0.00', icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Orders', value: '0', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Registered Users', value: '1', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Network Status', value: 'Ready', icon: Globe, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="col-span-1 md:col-span-2 border-primary/20 bg-white shadow-xl rounded-[2.5rem] overflow-hidden">
            <div className="bg-[#0B0B0B] p-6 text-white">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <CheckCircle2 className="h-6 w-6 text-green-500" />
                     <h3 className="text-xl font-black italic uppercase tracking-tight">System Status: OPERATIONAL</h3>
                  </div>
                  <Badge className="bg-primary text-white font-black text-[10px]">INTERNAL_PREVIEW</Badge>
               </div>
            </div>
            <CardContent className="p-8 space-y-6">
               <div className="bg-amber-50 p-6 rounded-[2rem] border-2 border-dashed border-amber-200">
                  <div className="flex items-center gap-3 mb-4">
                     <AlertCircle className="h-6 w-6 text-amber-600" />
                     <h4 className="text-sm font-black uppercase text-amber-900">Next Steps: Domain & Hosting</h4>
                  </div>
                  <div className="space-y-4 text-[11px] font-bold text-amber-800 leading-relaxed uppercase">
                     <p>
                        1. <span className="underline font-black text-black">Domain Connection</span>: Aapka domain abhi connect nahi hai. Website ko live karne ke liye Firebase Console mein DNS settings update karni hogi.
                     </p>
                     <p>
                        2. <span className="underline font-black text-black">Telegram Alerts</span>: Alerts tabhi trigger honge jab Admin Panel ya Customer App kisi browser tab mein khula ho.
                     </p>
                     <p>
                        3. <span className="underline font-black text-black">Instant Update</span>: Naye changes apply ho chuke hain. Browser refresh karke test order place karein.
                     </p>
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-blue-50 rounded-3xl border border-blue-100">
                     <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="text-[10px] font-black uppercase text-blue-700">Domain Status</span>
                     </div>
                     <p className="text-sm font-bold italic text-blue-800">Connection Pending...</p>
                  </div>
                  <div className="p-5 bg-green-50 rounded-3xl border border-green-100">
                     <div className="flex items-center gap-2 mb-2">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-[10px] font-black uppercase text-green-700">Database Status</span>
                     </div>
                     <p className="text-sm font-bold">Cloud Firestore Secured</p>
                  </div>
               </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-sm rounded-[2rem] bg-primary text-white p-8 flex flex-col justify-center text-center relative overflow-hidden h-full">
            <div className="relative z-10">
               <RefreshCw className="h-10 w-10 text-white mx-auto mb-4 animate-spin-slow" />
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">Business Console</h4>
               <div className="text-4xl font-black italic tracking-tighter text-white leading-none">SECURE<br/>PORTAL</div>
               <p className="text-[9px] font-bold text-white/80 mt-6 uppercase leading-relaxed">System is running on high-performance infrastructure.</p>
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
              <p className="text-[10px] text-green-500 font-bold mt-1">Status: Operational</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
