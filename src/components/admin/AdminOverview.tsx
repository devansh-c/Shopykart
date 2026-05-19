
"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, ShoppingBag, IndianRupee, MousePointerClick, CheckCircle2, Globe, ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AdminOverview() {
  const stats = [
    { label: 'Total Revenue', value: '₹48,250', icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Total Orders', value: '1,240', icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Registered Users', value: '850', icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Abandoned Carts', value: '45', icon: MousePointerClick, color: 'text-amber-600', bg: 'bg-amber-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Launch Status Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="col-span-1 md:col-span-2 border-primary/20 bg-primary/5 shadow-lg rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-2">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="bg-primary p-2 rounded-xl text-white">
                        <Globe className="h-5 w-5" />
                     </div>
                     <CardTitle className="text-lg font-black italic uppercase">Live Domain Status</CardTitle>
                  </div>
                  <Badge className="bg-green-500 text-white font-black text-[10px]">READY TO LAUNCH</Badge>
               </div>
            </CardHeader>
            <CardContent className="pt-4">
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-primary/10">
                     <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                     <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Domain Configured</p>
                        <p className="text-sm font-bold text-foreground">shopykart.co.in</p>
                     </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-primary/10">
                     <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                     <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Security Status</p>
                        <p className="text-sm font-bold text-foreground">SSL & Auth Active</p>
                     </div>
                  </div>
               </div>
               
               <div className="mt-6 space-y-4">
                 <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-blue-700 uppercase">Step 1: Domain Mapping (Site Not Found Error?)</p>
                      <p className="text-[9px] text-blue-600 mt-1 uppercase leading-relaxed">
                        Go to Firebase Console > <b>Build</b> > <b>App Hosting</b>. Click your backend name, then <b>Settings</b> tab. 
                        Add <b>shopykart.co.in</b> in "Custom domains" and update DNS A-records in your domain panel.
                      </p>
                    </div>
                 </div>

                 <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-amber-700 uppercase">Step 2: Google Login Fix</p>
                      <p className="text-[9px] text-amber-600 mt-1 uppercase leading-relaxed">
                        Go to Firebase Console > <b>Authentication</b> > <b>Settings</b> > <b>Authorized Domains</b>. 
                        Add <b>shopykart.co.in</b> to the list. This is 100% required for Google login.
                      </p>
                    </div>
                 </div>
               </div>
            </CardContent>
         </Card>

         <Card className="border-none shadow-sm rounded-[2rem] bg-black text-white p-8 flex flex-col justify-center text-center relative overflow-hidden">
            <div className="relative z-10">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-2">Current Activity</h4>
               <div className="text-5xl font-black italic tracking-tighter text-primary">LIVE</div>
               <p className="text-[10px] font-bold text-gray-400 mt-4 uppercase">System monitoring active for today's launch.</p>
            </div>
            <div className="absolute inset-0 bg-primary/5 -skew-x-12 translate-x-1/2" />
         </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2 rounded-xl`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black">{stat.value}</div>
              <p className="text-[10px] text-green-500 font-bold mt-1">+12% from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4">Quick Insights</h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-muted rounded-2xl bg-muted/20">
          <p className="text-muted-foreground text-sm font-medium">Sales chart and analytics data visualization will appear here.</p>
        </div>
      </Card>
    </div>
  );
}
