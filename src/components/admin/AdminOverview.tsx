"use client"

import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Users, ShoppingBag, Terminal, Rocket, AlertCircle, Shield, Globe, Loader2, RefreshCw, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { 
  Bar, 
  BarChart, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  Tooltip as ReChartsTooltip,
  Cell
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export default function AdminOverview() {
  const firestore = useFirestore();

  // Fetch real data
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
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((acc, curr) => acc + (curr.total || 0), 0) || 0;
    const totalUsers = users?.length || 0;

    return [
      { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-100' },
      { label: 'Total Orders', value: totalOrders.toString(), icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
      { label: 'Registered Users', value: totalUsers.toString(), icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
      { label: 'Network Status', value: 'Live', icon: Globe, color: 'text-amber-600', bg: 'bg-amber-100' },
    ];
  }, [orders, users]);

  // Chart Data: Last 7 days
  const chartData = useMemo(() => {
    if (!orders) return [];
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
      if (order.createdAt?.seconds) {
        const orderDate = new Date(order.createdAt.seconds * 1000).toDateString();
        const dayMatch = last7Days.find(d => d.fullDate === orderDate);
        if (dayMatch) {
          dayMatch.amount += (order.total || 0);
        }
      }
    });

    return last7Days;
  }, [orders]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="col-span-1 md:col-span-2 border-primary/20 bg-white shadow-xl rounded-[2.5rem] overflow-hidden">
            <div className="bg-[#0B0B0B] p-6 text-white">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <TrendingUp className="h-6 w-6 text-primary" />
                     <h3 className="text-xl font-black italic uppercase tracking-tight">Weekly Sales Analytics</h3>
                  </div>
                  <Badge className="bg-primary text-white font-black text-[10px]">REAL_TIME</Badge>
               </div>
            </div>
            <CardContent className="p-8 h-[300px]">
               {orders ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        fontSize={10} 
                        fontWeight="bold"
                        tick={{ fill: '#94a3b8' }}
                      />
                      <YAxis hide />
                      <ReChartsTooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-black text-white p-3 rounded-2xl shadow-2xl border border-white/10">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-50">{payload[0].payload.fullDate}</p>
                                <p className="text-lg font-black italic">₹{payload[0].value}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="amount" radius={[10, 10, 10, 10]} barSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 6 ? '#EF4444' : '#f1f5f9'} 
                            className="transition-all hover:opacity-80"
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               ) : (
                 <div className="h-full w-full flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/20" />
                 </div>
               )}
            </CardContent>
         </Card>

         <Card className="border-none shadow-sm rounded-[2rem] bg-primary text-white p-8 flex flex-col justify-center text-center relative overflow-hidden h-full">
            <div className="relative z-10">
               <RefreshCw className="h-10 w-10 text-white mx-auto mb-4 animate-spin-slow" />
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">Business Console</h4>
               <div className="text-4xl font-black italic tracking-tighter text-white leading-none">REAL<br/>INSIGHTS</div>
               <p className="text-[9px] font-bold text-white/80 mt-6 uppercase leading-relaxed">Aapke saare stats ab live orders se connected hain.</p>
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
              <p className="text-[10px] text-green-500 font-bold mt-1">Live from Firestore</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
