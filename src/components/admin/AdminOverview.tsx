
"use client"

import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Users, ShoppingBag, Terminal, Rocket, AlertCircle, Shield, Globe, Loader2, RefreshCw, CheckCircle2, Clock, TrendingUp, Crown, Check, X, ShieldCheck, Eraser, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, serverTimestamp, setDoc, getDocs, writeBatch } from 'firebase/firestore';
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
import { addDays, format } from 'date-fns';
import { Button } from '@/components/ui/button';

export default function AdminOverview() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

  const premiumQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'premium_subscriptions'), where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: premiumRequests, loading: premiumLoading } = useCollection<any>(premiumQuery);

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

  const handleResetAllRewards = async () => {
    if (!firestore || !users || isResetting) return;
    if (!confirm("🚨 WARNING: This will set ALL customer coins to 0. Continue?")) return;

    setIsResetting(true);
    try {
      const batch = writeBatch(firestore);
      users.forEach(user => {
        batch.update(doc(firestore, 'users', user.id), { coins: 0 });
      });
      await batch.commit();
      toast({ title: "Rewards Cleared! 🗑️", description: "All users now have 0 coins." });
    } catch (err) {
      toast({ variant: "destructive", title: "Reset Failed" });
    } finally {
      setIsResetting(false);
    }
  };

  const handleVerifyPremium = async (req: any) => {
    if (!firestore || processingId) return;
    setProcessingId(req.id);
    try {
      const expiryDate = addDays(new Date(), 60).toISOString();
      await updateDoc(doc(firestore, 'users', req.userId), {
        isPremium: true,
        premiumExpiry: expiryDate,
        updatedAt: serverTimestamp()
      });
      await updateDoc(doc(firestore, 'premium_subscriptions', req.id), {
        status: 'verified',
        verifiedAt: serverTimestamp()
      });
      toast({ title: "Premium Activated! 👑" });
    } catch (err) {
      toast({ variant: "destructive", title: "Verification Failed" });
    } finally {
      setProcessingId(null);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="col-span-1 md:col-span-2 border-primary/20 bg-white shadow-xl rounded-[2.5rem] overflow-hidden">
            <div className="bg-[#0B0B0B] p-6 text-white">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <TrendingUp className="h-6 w-6 text-primary" />
                     <h3 className="text-xl font-black italic uppercase tracking-tight">Weekly Sales</h3>
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
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2">Management</h4>
                  <div className="text-4xl font-black italic tracking-tighter text-white leading-none">SYSTEM<br/>HEALTH</div>
               </div>

               <Button 
                onClick={handleResetAllRewards}
                disabled={isResetting}
                className="w-full bg-black text-white hover:bg-red-600 rounded-xl h-12 font-black uppercase text-[10px] tracking-widest shadow-xl"
               >
                 {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                 RESET ALL REWARDS
               </Button>
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
