
"use client"

import { useMemo, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee, Users, ShoppingBag, Terminal, Rocket, AlertCircle, Shield, Globe, Loader2, RefreshCw, CheckCircle2, Clock, TrendingUp, Crown, Check, X, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
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
import { addDays } from 'date-fns';

export default function AdminOverview() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch orders
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'orders');
  }, [firestore]);
  const { data: orders } = useCollection<any>(ordersQuery);

  // Fetch users
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);
  const { data: users } = useCollection<any>(usersQuery);

  // Fetch Pending Premium Requests
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

  const handleVerifyPremium = async (req: any) => {
    if (!firestore || processingId) return;
    setProcessingId(req.id);
    try {
      const expiryDate = addDays(new Date(), 60).toISOString();
      
      // 1. Update User Profile
      await updateDoc(doc(firestore, 'users', req.userId), {
        isPremium: true,
        premiumExpiry: expiryDate,
        updatedAt: serverTimestamp()
      });

      // 2. Update Subscription Status
      await updateDoc(doc(firestore, 'premium_subscriptions', req.id), {
        status: 'verified',
        verifiedAt: serverTimestamp()
      });

      toast({ title: "Premium Activated! 👑", description: `${req.customerName} is now an Elite member.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Verification Failed" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectPremium = async (reqId: string) => {
    if (!firestore || processingId) return;
    setProcessingId(reqId);
    try {
      await updateDoc(doc(firestore, 'premium_subscriptions', reqId), {
        status: 'failed',
        rejectedAt: serverTimestamp()
      });
      toast({ title: "Request Rejected", description: "Customer can try again." });
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setProcessingId(null);
    }
  };

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
    <div className="space-y-8 pb-20">
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

      {/* NEW UTR VERIFICATION SECTION */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 px-2">
          <div className="bg-amber-400 p-2 rounded-xl text-black shadow-lg"><Crown className="h-5 w-5" /></div>
          <h3 className="text-xl font-black italic uppercase tracking-tighter">Premium UTR Verification</h3>
          {premiumRequests && premiumRequests.length > 0 && (
            <Badge className="bg-red-500 text-white animate-pulse">{premiumRequests.length} PENDING</Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {premiumLoading ? (
             <div className="col-span-full h-32 bg-white rounded-3xl flex items-center justify-center border border-dashed"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
           ) : premiumRequests && premiumRequests.length > 0 ? (
             premiumRequests.map((req: any) => (
               <div key={req.id} className="bg-white p-6 rounded-[2rem] border-2 border-amber-100 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
                  <div className="flex items-start justify-between mb-4">
                     <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                           <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                           <h4 className="font-black text-sm uppercase italic">{req.customerName}</h4>
                           <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                             {req.createdAt?.seconds ? format(new Date(req.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Recently'}
                           </span>
                        </div>
                     </div>
                     <div className="text-right">
                        <span className="text-[10px] font-black text-gray-400 uppercase block mb-1">Payment</span>
                        <div className="text-lg font-black italic text-green-600 leading-none">₹{req.amount}</div>
                     </div>
                  </div>

                  <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 mb-6">
                     <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest mb-1 block">UTR Number (Transaction ID)</span>
                     <div className="text-lg font-black tracking-[0.2em] text-amber-900 italic">{req.utr}</div>
                  </div>

                  <div className="flex gap-3">
                     <button 
                      onClick={() => handleVerifyPremium(req)}
                      disabled={processingId === req.id}
                      className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-green-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                     >
                       {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                       VERIFY & ACTIVATE
                     </button>
                     <button 
                      onClick={() => handleRejectPremium(req.id)}
                      disabled={processingId === req.id}
                      className="h-12 w-12 bg-red-50 text-red-500 border border-red-100 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90"
                     >
                       <X className="h-5 w-5" />
                     </button>
                  </div>
               </div>
             ))
           ) : (
             <div className="col-span-full h-32 bg-white rounded-3xl border-2 border-dashed border-border flex flex-col items-center justify-center opacity-40">
                <Clock className="h-8 w-8 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-widest">No pending premium requests</p>
             </div>
           )}
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
              <p className="text-[10px] text-green-500 font-bold mt-1">Live from Firestore</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
