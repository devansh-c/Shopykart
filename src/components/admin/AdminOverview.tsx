
"use client"

import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Users, ShoppingBag, Globe, Loader2, RefreshCw, Trash2, TrendingUp, BellRing, Smartphone, Zap, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, serverTimestamp, getDocs, writeBatch } from 'firebase/firestore';
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip as ReChartsTooltip,
  Cell
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { scheduleTestNotification } from '@/components/shared/PermissionManager';
import { startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';

export default function AdminOverview() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'orders');
  }, [firestore]);
  const { data: orders } = useCollection<any>(ordersQuery);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users } = useCollection<any>(usersQuery);

  const stats = useMemo(() => {
    if (!orders) return [
      { label: 'Today', value: '₹0', icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
      { label: 'This Week', value: '₹0', icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-100' },
      { label: 'This Month', value: '₹0', icon: CalendarRange, color: 'text-indigo-600', bg: 'bg-indigo-100' },
      { label: 'Total Revenue', value: '₹0', icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100' },
    ];

    let todayRev = 0;
    let weekRev = 0;
    let monthRev = 0;
    let totalRev = 0;

    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Start from Monday
    const monthStart = startOfMonth(now);

    orders.forEach((o: any) => {
      if (o.status === 'Cancelled') return;
      
      const amt = Number(o.total) || 0;
      totalRev += amt;

      const orderDate = o.createdAt?.seconds 
        ? new Date(o.createdAt.seconds * 1000) 
        : new Date(o.createdAt);

      if (isAfter(orderDate, todayStart)) todayRev += amt;
      if (isAfter(orderDate, weekStart)) weekRev += amt;
      if (isAfter(orderDate, monthStart)) monthRev += amt;
    });

    return [
      { label: 'Today', value: `₹${todayRev.toLocaleString()}`, icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
      { label: 'This Week', value: `₹${weekRev.toLocaleString()}`, icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-100' },
      { label: 'This Month', value: `₹${monthRev.toLocaleString()}`, icon: CalendarRange, color: 'text-indigo-600', bg: 'bg-indigo-100' },
      { label: 'Total Revenue', value: `₹${totalRev.toLocaleString()}`, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100' },
    ];
  }, [orders]);

  const handleTestAlert = async () => {
    setIsTesting(true);
    toast({ 
      title: "Test Started! ⏱️", 
      description: "Close or minimize the app now. Alert will fire in 10 seconds." 
    });
    
    const success = await scheduleTestNotification();
    if (!success) {
      toast({ variant: "destructive", title: "Test Failed", description: "Capacitor is only supported in APK." });
    }
    setTimeout(() => setIsTesting(false), 5000);
  };

  const handleResetAllRewards = async () => {
    if (!firestore || isResetting) return;
    
    if (!confirm("🚨 WARNING: Are you sure you want to reset coins for ALL users to 0? This will prepare the system for the new 20/10/5 plan.")) return;

    setIsResetting(true);
    try {
      const snap = await getDocs(collection(firestore, 'users'));
      if (snap.empty) {
        toast({ title: "No users found" });
        setIsResetting(false);
        return;
      }

      const batchSize = 500;
      const docs = snap.docs;
      
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = writeBatch(firestore);
        const chunk = docs.slice(i, i + batchSize);
        chunk.forEach(uDoc => {
          batch.update(uDoc.ref, { 
            coins: 0, 
            updatedAt: serverTimestamp() 
          });
        });
        await batch.commit();
      }
      
      toast({ title: "Rewards Reset Successfully! ✅", description: `Wallet cleared for ${snap.size} users.` });
    } catch (err) {
      console.error("Reset Error:", err);
      toast({ variant: "destructive", title: "Reset Failed" });
    } finally {
      setIsResetting(false);
    }
  };

  const chartData = useMemo(() => {
    if (!orders || !isMounted) return [];
    
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        date: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        fullDate: d.toDateString(),
        amount: 0
      };
    });

    orders.forEach(order => {
      if (order.status === 'Cancelled') return;
      let orderDate: string | null = null;
      if (order.createdAt?.seconds) {
        orderDate = new Date(order.createdAt.seconds * 1000).toDateString();
      } else if (typeof order.createdAt === 'string') {
        orderDate = new Date(order.createdAt).toDateString();
      }
      if (orderDate) {
        const dayMatch = last7Days.find(d => d.fullDate === orderDate);
        if (dayMatch) dayMatch.amount += (Number(order.total) || 0);
      }
    });

    return last7Days;
  }, [orders, isMounted]);

  const hasData = useMemo(() => chartData.some(d => d.amount > 0), [chartData]);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      
      {/* 4 REVENUE ANALYTICS BOXES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border border-border/40 hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</CardTitle>
              <div className={`${stat.bg} ${stat.color} p-2.5 rounded-xl`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black italic tracking-tighter">{stat.value}</div>
              <p className="text-[7px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Real-time synced</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TEST BACKGROUND ALERTS CARD */}
      <div className="bg-[#0B0B0B] p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden text-white transform-gpu">
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
               <div className="h-16 w-16 bg-primary/20 rounded-[1.5rem] flex items-center justify-center text-primary border border-primary/20">
                  <BellRing className="h-8 w-8 animate-ring" />
               </div>
               <div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">Alert Debugger</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Test if phone rings when app is closed</p>
               </div>
            </div>
            
            <Button 
              onClick={handleTestAlert}
              disabled={isTesting}
              className="h-16 px-10 bg-primary hover:bg-white hover:text-black text-white rounded-2xl font-black uppercase italic text-sm shadow-xl active:scale-95 transition-all"
            >
              {isTesting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Zap className="h-5 w-5 mr-2" />}
              TEST LOUD ALERT (10s DELAY)
            </Button>
         </div>
         <div className="absolute top-0 right-0 h-full w-44 bg-primary/5 -skew-x-12 translate-x-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="col-span-1 md:col-span-2 border-primary/20 bg-white shadow-xl rounded-[2.5rem] overflow-hidden">
            <div className="bg-[#0B0B0B] p-6 text-white">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <TrendingUp className="h-6 w-6 text-primary" />
                     <h3 className="text-xl font-black italic uppercase tracking-tighter">Weekly Sales Trend</h3>
                  </div>
                  <Badge className="bg-primary text-white font-black text-[10px]">LIVE</Badge>
               </div>
            </div>
            <CardContent className="p-8 h-[320px]">
               {isMounted && orders ? (
                  hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10} fontWeight="black" tick={{ fill: '#64748b' }} />
                        <YAxis hide />
                        <ReChartsTooltip 
                          cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-black text-white p-3 rounded-2xl shadow-2xl border border-white/10">
                                  <p className="text-[10px] font-black uppercase opacity-50">{payload[0].payload.fullDate}</p>
                                  <p className="text-lg font-black italic">₹{payload[0].value}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="amount" radius={[12, 12, 12, 12]} barSize={35}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 6 ? '#EF4444' : '#E2E8F0'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-center opacity-30">
                       <TrendingUp className="h-12 w-12 mb-2" />
                       <p className="text-[10px] font-black uppercase tracking-widest">No sales records</p>
                    </div>
                  )
               ) : (
                 <div className="h-full w-full flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary/20" /></div>
               )}
            </CardContent>
         </Card>

         <Card className="border-none shadow-sm rounded-[2rem] bg-primary text-white p-8 flex flex-col justify-center text-center relative overflow-hidden h-full">
            <div className="relative z-10 space-y-6">
               <div>
                  <RefreshCw className="h-10 w-10 text-white mx-auto mb-4 animate-spin-slow" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">Rewards Control</h4>
                  <div className="text-4xl font-black italic tracking-tighter text-white leading-none uppercase">RESET<br/>WALLETS</div>
               </div>

               <Button 
                onClick={handleResetAllRewards}
                disabled={isResetting}
                className="w-full bg-black text-white hover:bg-red-600 rounded-xl h-14 font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95"
               >
                 {isResetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                 RESET ALL COINS
               </Button>
            </div>
            <div className="absolute inset-0 bg-black/10 -skew-x-12 translate-x-1/2 pointer-events-none" />
         </Card>
      </div>

      {/* SECONDARY STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="rounded-3xl border border-border shadow-sm p-6 flex items-center gap-5">
            <div className="h-12 w-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center"><Users className="h-6 w-6" /></div>
            <div><p className="text-[9px] font-black text-gray-400 uppercase">Registered Customers</p><h4 className="text-2xl font-black italic">{users?.length || 0}</h4></div>
         </Card>
         <Card className="rounded-3xl border border-border shadow-sm p-6 flex items-center gap-5">
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><ShoppingBag className="h-6 w-6" /></div>
            <div><p className="text-[9px] font-black text-gray-400 uppercase">Total Completed Tasks</p><h4 className="text-2xl font-black italic">{orders?.filter((o:any)=>o.status==='Delivered').length || 0}</h4></div>
         </Card>
         <Card className="rounded-3xl border border-border shadow-sm p-6 flex items-center gap-5">
            <div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center"><Globe className="h-6 w-6" /></div>
            <div><p className="text-[9px] font-black text-gray-400 uppercase">Network Status</p><h4 className="text-2xl font-black italic text-green-600">LIVE</h4></div>
         </Card>
      </div>
    </div>
  );
}
