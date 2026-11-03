
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, updateDoc, orderBy, limit, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  ShoppingBag, 
  Plus, 
  LogOut,
  LayoutDashboard,
  Layers,
  CircleDollarSign,
  UserCircle2,
  Clock,
  Store,
  X,
  Loader2,
  User,
  ImageIcon,
  Trash2,
  Camera,
  History,
  Timer,
  ListTree,
  Megaphone,
  Tag,
  Ticket,
  BellRing,
  Edit,
  Globe,
  Wallet,
  Calendar,
  Zap,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Banknote,
  Wallet2,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Ban,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn, slugify } from '@/lib/utils';
import { useState, useEffect, useRef, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, differenceInSeconds, differenceInMinutes, startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';
import { compressImage } from '@/lib/image-utils';
import { scheduleTestNotification } from '@/components/shared/PermissionManager';

type MainTab = 'orders' | 'catalog' | 'payouts' | 'account';
type OrderFilter = 'NEW ORDERS' | 'DELIVERED' | 'CANCELLED';

export default function BeautyDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('NEW ORDERS');
  const [walletTab, setWalletTab] = useState<'request' | 'history' | 'transactions'>('request');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!isMounted || authLoading) return;
    const sessionActive = localStorage.getItem('shopykart_session_active') === 'true';
    if (!user && !authLoading) {
      if (!sessionActive) router.replace('/vendor/login?type=Beauty');
    }
  }, [user, authLoading, router, isMounted]);

  const vendorRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'vendors', user.uid) : null, [firestore, user]);
  const { data: vendorProfile, loading: profileLoading } = useDoc<any>(vendorRef);

  const ordersQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'orders'), orderBy('createdAt', 'desc')) : null, [firestore, user]);
  const { data: rawOrders } = useCollection<any>(ordersQuery);

  const filteredOrders = useMemo(() => {
    if (!rawOrders || !user) return [];
    const vId = String(user.uid);
    return rawOrders.filter((o: any) => {
      const isForMe = String(o.vendorId) === vId || (Array.isArray(o.vendorIds) && o.vendorIds.includes(vId)) || o.items?.some((it:any) => String(it.vendorId) === vId);
      if (!isForMe) return false;

      const status = (o.status || '').toUpperCase();
      if (orderFilter === 'NEW ORDERS') {
        return !['DELIVERED', 'CANCELLED'].includes(status);
      } else if (orderFilter === 'DELIVERED') {
        return status === 'DELIVERED';
      } else {
        return status === 'CANCELLED';
      }
    });
  }, [rawOrders, user, orderFilter]);

  const earnings = useMemo(() => {
    if (!rawOrders || !user) return { today: 0, week: 0, month: 0, totalDelivered: 0, totalCancelled: 0 };
    const now = new Date();
    const today = startOfDay(now);
    const week = startOfWeek(now);
    const month = startOfMonth(now);
    let t = 0, w = 0, m = 0, td = 0, tc = 0;
    rawOrders.forEach((o: any) => {
      const vId = String(user.uid);
      const isForMe = String(o.vendorId) === vId || (Array.isArray(o.vendorIds) && o.vendorIds.includes(vId)) || o.items?.some((it:any) => String(it.vendorId) === vId);
      if (!isForMe) return;
      const amt = Number(o.total) || 0;
      const status = (o.status || '').toUpperCase();
      if (status === 'DELIVERED') {
        td += amt;
        const orderDate = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : new Date(o.createdAt);
        if (isAfter(orderDate, today)) t += amt;
        if (isAfter(orderDate, week)) w += amt;
        if (isAfter(orderDate, month)) m += amt;
      } else if (status === 'CANCELLED') {
        tc += amt;
      }
    });
    return { today: t, week: w, month: m, totalDelivered: td, totalCancelled: tc };
  }, [rawOrders, user]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!firestore) return;
    try {
      const updateData: any = { status: newStatus, updatedAt: serverTimestamp() };
      if (newStatus === 'Ready for Pickup') updateData.pickupOTP = Math.floor(1000 + Math.random() * 9000).toString();
      await updateDoc(doc(firestore, 'orders', orderId), updateData);
      toast({ title: `Order ${newStatus}!` });
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); }
  };

  if (!isMounted || authLoading || (profileLoading && !vendorProfile)) return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-rose-600" /></div>;

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative overflow-hidden">
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b shrink-0 z-50">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <Sparkles className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-sm font-black italic uppercase leading-none">{vendorProfile?.storeName}</h1>
              <div className="flex items-center gap-1.5 mt-1"><div className={cn("h-1.5 w-1.5 rounded-full", vendorProfile?.isOnline !== false ? "bg-green-500 animate-pulse" : "bg-red-500")} /><p className="text-[8px] font-bold text-muted-foreground uppercase">{vendorProfile?.isOnline !== false ? 'Accepting' : 'Closed'}</p></div>
            </div>
         </div>
         <div className="flex items-center gap-2"><Switch checked={vendorProfile?.isOnline !== false} onCheckedChange={async (o) => { await updateDoc(doc(firestore!, 'vendors', user!.uid), { isOnline: o }); }} className="scale-75 data-[state=checked]:bg-green-500" /></div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
         {activeMainTab === 'orders' && (
           <div className="p-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-rose-500 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-rose-200 relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10"><span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Today</span><div className="text-4xl font-black italic mt-1">₹ {earnings.today.toFixed(0)}</div></div>
                    <div className="bg-white/20 p-4 rounded-[1.5rem] backdrop-blur-md relative z-10"><Wallet className="h-10 w-10 text-white fill-white/20" /></div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-rose-500 p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden"><span className="text-[8px] font-black uppercase tracking-widest opacity-80">This Week</span><div className="text-lg font-black italic mt-1">₹ {earnings.week.toFixed(0)}</div></div>
                    <div className="bg-rose-500 p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden"><span className="text-[8px] font-black uppercase tracking-widest opacity-80">This Month</span><div className="text-lg font-black italic mt-1">₹ {earnings.month.toFixed(0)}</div></div>
                 </div>
              </div>

              <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-border/50">
                {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-rose-600 text-white" : "text-gray-400")}>{f}</button>
                ))}
              </div>

              {(orderFilter === 'DELIVERED' || orderFilter === 'CANCELLED') && (
                <div className="grid grid-cols-2 gap-4 px-2">
                   <div className="bg-white p-4 rounded-3xl border border-border/50 flex flex-col items-center">
                      <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Total Sales</span>
                      <span className="text-xl font-black text-green-600 italic">₹{earnings.totalDelivered.toFixed(0)}</span>
                   </div>
                   <div className="bg-white p-4 rounded-3xl border border-border/50 flex flex-col items-center">
                      <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest">Total Loss</span>
                      <span className="text-xl font-black text-red-600 italic">₹{earnings.totalCancelled.toFixed(0)}</span>
                   </div>
                </div>
              )}

              {filteredOrders.length > 0 ? filteredOrders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <div><span className="text-2xl font-black italic">#{o.customerOrderNumber}</span><p className="text-[8px] font-black text-gray-400 uppercase mt-1">{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'hh:mm a')}</p></div>
                      <Badge className={cn("border-none font-black text-[8px] uppercase", o.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-rose-50 text-rose-600')}>{o.status}</Badge>
                   </div>
                   <div className="bg-muted/30 rounded-3xl p-5 mb-4 space-y-3">
                      <div className="flex items-center gap-2 border-b border-white pb-2"><User className="h-3.5 w-3.5 text-rose-600" /><span className="text-xs font-black uppercase italic">{o.customerName}</span></div>
                      {o.items?.filter((it:any) => String(it.vendorId) === String(user?.uid)).map((item:any, i:number) => (
                        <div key={i} className="flex justify-between items-center text-[11px] font-black uppercase italic"><span className="text-gray-700">{item.quantity}x {item.name}</span><span className="text-rose-600">₹{(item.price * item.quantity).toFixed(0)}</span></div>
                      ))}
                      {o.pickupOTP && o.status === 'Ready for Pickup' && <div className="bg-black p-3 rounded-2xl text-center"><span className="text-[7px] font-black text-rose-500 uppercase tracking-widest">PICKUP OTP</span><h4 className="text-xl font-black text-white italic tracking-[0.4em]">{o.pickupOTP}</h4></div>}
                   </div>
                   <div className="flex flex-col gap-2">
                      {o.status === 'Placed' && <Button onClick={() => handleUpdateStatus(o.id, 'Accepted')} className="h-14 bg-green-600 text-white rounded-2xl font-black uppercase italic">ACCEPT SERVICE</Button>}
                      {o.status === 'Accepted' && <Button onClick={() => handleUpdateStatus(o.id, 'Preparing')} className="h-14 bg-rose-600 text-white rounded-2xl font-black uppercase italic">START PROCESS</Button>}
                      {o.status === 'Preparing' && <Button onClick={() => handleUpdateStatus(o.id, 'Ready for Pickup')} className="h-14 bg-black text-white rounded-2xl font-black uppercase italic">READY FOR PICKUP</Button>}
                   </div>
                </div>
              )) : <div className="text-center py-20 opacity-20 flex flex-col items-center"><ShoppingBag className="h-12 w-12 mb-2" /><p className="font-black uppercase text-xs">No active orders</p></div>}
           </div>
         )}

         {activeMainTab === 'payouts' && (
           <div className="p-4 space-y-6">
              <h2 className="text-xl font-black italic uppercase ml-2">Wallet</h2>
              <div className="bg-rose-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                 <div className="relative z-10 space-y-1"><span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Withdrawable Balance</span><div className="text-5xl font-black italic">₹ {vendorProfile?.walletBalance?.toFixed(2) || '0.00'}</div></div>
                 <div className="relative z-10 flex justify-end mt-4"><Button onClick={() => toast({ title: "Request Sent" })} className="bg-white text-rose-600 rounded-xl h-10 px-6 font-black uppercase text-[10px] italic">Withdraw</Button></div>
                 <Wallet2 className="absolute bottom-4 right-4 h-24 w-24 text-white opacity-10 -rotate-12" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex flex-col gap-2"><div className="h-8 w-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center"><ArrowDownLeft className="h-4 w-4" /></div><div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Cash in Hand</span><h4 className="text-lg font-black italic text-gray-900">₹ 0.00</h4></div></div>
                 <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex flex-col gap-2"><div className="h-8 w-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center"><Timer className="h-4 w-4" /></div><div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Pending Withdraw</span><h4 className="text-lg font-black italic text-gray-900">₹ 0.00</h4></div></div>
                 <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex flex-col gap-2"><div className="h-8 w-8 bg-green-50 text-green-500 rounded-lg flex items-center justify-center"><CheckCircle2 className="h-4 w-4" /></div><div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Already Withdrawn</span><h4 className="text-lg font-black italic text-gray-900">₹ 23,000.00</h4></div></div>
                 <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex flex-col gap-2"><div className="h-8 w-8 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center"><ArrowUpRight className="h-4 w-4" /></div><div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Total Earning</span><h4 className="text-lg font-black italic text-gray-900">₹ {earnings.totalDelivered.toFixed(2)}</h4></div></div>
              </div>
              <div className="space-y-4 pt-4">
                 <div className="flex border-b border-gray-100 gap-6 px-2">
                    {['Withdraw Request', 'Payment History', 'Transaction History'].map((t, idx) => (
                      <button key={t} onClick={() => setWalletTab(idx === 0 ? 'request' : idx === 1 ? 'history' : 'transactions')} className={cn("pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative", (idx === 0 && walletTab === 'request') || (idx === 1 && walletTab === 'history') || (idx === 2 && walletTab === 'transactions') ? "text-rose-600" : "text-gray-400")}>{t}{( (idx === 0 && walletTab === 'request') || (idx === 1 && walletTab === 'history') || (idx === 2 && walletTab === 'transactions') ) && <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-600 rounded-t-full" />}</button>
                    ))}
                 </div>
                 <div className="bg-white rounded-[2.5rem] p-8 border border-border/50 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center"><History className="h-10 w-10 text-gray-200 mb-4" /><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No records found</p></div>
              </div>
           </div>
         )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-50 rounded-t-[2.5rem] shadow-2xl transform-gpu">
        {[
          {id:'orders',label:'Queue',icon:ShoppingBag},
          {id:'catalog',label:'Menu',icon:Layers},
          {id:'payouts',label:'Wallet',icon:Wallet2},
          {id:'account',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => setActiveMainTab(item.id as MainTab)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-rose-500 scale-110" : "text-gray-500")} />
            <span className={cn("text-[8px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
