
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, updateDoc, orderBy, limit, addDoc, getDoc } from 'firebase/firestore';
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
  HeartPulse,
  CheckCircle2,
  QrCode
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

type MainTab = 'orders' | 'catalog' | 'payouts' | 'account';
type OrderFilter = 'NEW ORDERS' | 'DELIVERED' | 'CANCELLED';

export default function MedicalDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('NEW ORDERS');
  const [walletTab, setWalletTab] = useState<'request' | 'history' | 'transactions'>('request');
  const [isMounted, setIsMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);

  const [upiForm, setUpiForm] = useState({
    upiId: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });

  useEffect(() => { setIsMounted(true); }, []);

  // STICKY SESSION PROTECTION
  useEffect(() => {
    if (!isMounted || authLoading) return;
    const sessionActive = localStorage.getItem('shopykart_session_active') === 'true';
    if (!user && !authLoading) {
      if (!sessionActive) router.replace('/vendor/login?type=Medical');
    }
  }, [user, authLoading, router, isMounted]);

  const vendorRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'vendors', user.uid) : null, [firestore, user]);
  const { data: vendorProfile, loading: profileLoading } = useDoc<any>(vendorRef);

  const ordersQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'orders'), orderBy('createdAt', 'desc')) : null, [firestore, user]);
  const { data: rawOrders } = useCollection<any>(ordersQuery);

  const payoutHistoryQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'vendors', user.uid, 'payout_history'), orderBy('date', 'desc')) : null, [firestore, user]);
  const { data: payoutHistory } = useCollection<any>(payoutHistoryQuery);

  const pendingRequestsQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'payout_requests'), where('vendorId', '==', user.uid), where('status', '==', 'Pending')) : null, [firestore, user]);
  const { data: pendingRequests } = useCollection<any>(pendingRequestsQuery);

  const earnings = useMemo(() => {
    if (!rawOrders || !user) return { today: 0, totalDelivered: 0, totalCancelled: 0 };
    let t = 0, td = 0, tc = 0;
    const today = startOfDay(new Date());
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
      } else if (status === 'CANCELLED') tc += amt;
    });
    return { today: t, totalDelivered: td, totalCancelled: tc };
  }, [rawOrders, user]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!firestore) return;
    try {
      const updateData: any = { status: newStatus, updatedAt: serverTimestamp() };
      if (newStatus === 'Ready for Pickup') updateData.pickupOTP = Math.floor(1000 + Math.random() * 9000).toString();
      await updateDoc(doc(firestore, 'orders', orderId), updateData);
      toast({ title: `Medical Order ${newStatus}` });
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); }
  };

  const handleSaveUpi = async () => {
    if (!firestore || !user || !upiForm.upiId) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(firestore, 'vendors', user.uid), { ...upiForm, kycCompleted: true, updatedAt: serverTimestamp() });
      setIsUpiModalOpen(false);
      toast({ title: "Settings Updated" });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
    finally { setIsProcessing(false); }
  };

  const handleWithdrawRequest = async () => {
    if (!firestore || !user || !vendorProfile) return;
    if (!vendorProfile.upiId) { setIsUpiModalOpen(true); return; }
    if ((vendorProfile.walletBalance || 0) <= 0) return;
    if (pendingRequests && pendingRequests.length > 0) return;

    setIsWithdrawLoading(true);
    try {
      await addDoc(collection(firestore, 'payout_requests'), {
        vendorId: user.uid,
        storeName: vendorProfile.storeName,
        amount: vendorProfile.walletBalance,
        upiId: vendorProfile.upiId,
        status: 'Pending',
        createdAt: serverTimestamp()
      });
      toast({ title: "Withdraw Sent" });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
    finally { setIsWithdrawLoading(false); }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      localStorage.removeItem('shopykart_session_active');
      router.replace('/vendor/login?type=Medical');
    }
  };

  if (!isMounted || authLoading || (profileLoading && !vendorProfile)) return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-teal-600" /></div>;

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative overflow-hidden">
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b shrink-0 z-50">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <HeartPulse className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-sm font-black italic uppercase leading-none">{vendorProfile?.storeName}</h1>
              <div className="flex items-center gap-1.5 mt-1"><div className={cn("h-1.5 w-1.5 rounded-full", vendorProfile?.isOnline !== false ? "bg-green-500 animate-pulse" : "bg-red-500")} /><p className="text-[8px] font-bold text-muted-foreground uppercase">{vendorProfile?.isOnline !== false ? 'Accepting' : 'Closed'}</p></div>
            </div>
         </div>
         <div className="flex items-center gap-2">
           <Switch checked={vendorProfile?.isOnline !== false} onCheckedChange={async (o) => { await updateDoc(doc(firestore!, 'vendors', user!.uid), { isOnline: o }); }} className="scale-75 data-[state=checked]:bg-green-500" />
           <button onClick={handleLogout} className="h-8 w-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center active:scale-90 transition-transform"><LogOut className="h-4 w-4" /></button>
         </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
         {activeMainTab === 'orders' && (
           <div className="p-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-teal-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10"><span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Today</span><div className="text-4xl font-black italic mt-1">₹ {earnings.today.toFixed(0)}</div></div>
                    <div className="bg-white/20 p-4 rounded-[1.5rem] backdrop-blur-md relative z-10"><Wallet className="h-10 w-10 text-white fill-white/20" /></div>
                 </div>
              </div>

              <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-border/50">
                {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-teal-600 text-white" : "text-gray-400")}>{f}</button>
                ))}
              </div>

              {filteredOrders.length > 0 ? filteredOrders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <div><span className="text-2xl font-black italic">#{o.customerOrderNumber}</span><p className="text-[8px] font-black text-gray-400 uppercase mt-1">{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'hh:mm a')}</p></div>
                      <Badge className={cn("border-none font-black text-[8px] uppercase", o.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-600')}>{o.status}</Badge>
                   </div>
                   <div className="bg-muted/30 rounded-3xl p-5 mb-4 space-y-3">
                      <div className="flex items-center gap-2 border-b border-white pb-2 font-black uppercase text-xs text-gray-800"><User className="h-3.5 w-3.5 text-teal-600" />{o.customerName}</div>
                      {o.items?.filter((it:any) => String(it.vendorId) === String(user?.uid)).map((item:any, i:number) => (
                        <div key={i} className="flex justify-between items-center text-[11px] font-black uppercase italic"><span className="text-gray-700">{item.quantity}x {item.name}</span><span className="text-teal-600">₹{(item.price * item.quantity).toFixed(0)}</span></div>
                      ))}
                   </div>
                   <div className="flex flex-col gap-2">
                      {o.status === 'Placed' && <Button onClick={() => handleUpdateStatus(o.id, 'Accepted')} className="h-14 bg-green-600 text-white rounded-2xl font-black uppercase italic">ACCEPT PRESCRIPTION</Button>}
                      {o.status === 'Accepted' && <Button onClick={() => handleUpdateStatus(o.id, 'Preparing')} className="h-14 bg-teal-600 text-white rounded-2xl font-black uppercase italic">PACK MEDICINES</Button>}
                      {o.status === 'Preparing' && <Button onClick={() => handleUpdateStatus(o.id, 'Ready for Pickup')} className="h-14 bg-black text-white rounded-2xl font-black uppercase italic">READY FOR PICKUP</Button>}
                   </div>
                </div>
              )) : <div className="text-center py-20 opacity-20 flex flex-col items-center"><ShoppingBag className="h-12 w-12 mb-2" /><p className="font-black uppercase text-xs">Queue is empty</p></div>}
           </div>
         )}

         {activeMainTab === 'payouts' && (
           <div className="p-4 space-y-6">
              <h2 className="text-xl font-black italic uppercase ml-2">Wallet</h2>
              <div className="bg-teal-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                 <div className="relative z-10 space-y-1"><span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Payout Due</span><div className="text-5xl font-black italic">₹ {vendorProfile?.walletBalance?.toFixed(2) || '0.00'}</div></div>
                 <div className="relative z-10 flex justify-end mt-4">
                    <Button onClick={handleWithdrawRequest} disabled={isWithdrawLoading || (vendorProfile?.walletBalance || 0) <= 0} className="bg-white text-teal-600 rounded-xl h-10 px-6 font-black uppercase text-[10px] italic">
                      {isWithdrawLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Withdraw'}
                    </Button>
                 </div>
                 <Wallet2 className="absolute bottom-4 right-4 h-24 w-24 text-white opacity-10 -rotate-12" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex flex-col gap-2"><div className="h-8 w-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center"><ArrowDownLeft className="h-4 w-4" /></div><div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">In Hand</span><h4 className="text-lg font-black italic text-gray-900">₹ 0.00</h4></div></div>
                 <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex flex-col gap-2"><div className="h-8 w-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center"><Timer className="h-4 w-4" /></div><div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Settling</span><h4 className="text-lg font-black italic text-gray-900">₹ {pendingRequests?.length ? pendingRequests.reduce((s:any,r:any)=>s+r.amount, 0).toFixed(0) : '0.00'}</h4></div></div>
                 <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex flex-col gap-2"><div className="h-8 w-8 bg-green-50 text-green-500 rounded-lg flex items-center justify-center"><CheckCircle2 className="h-4 w-4" /></div><div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Withdrawn</span><h4 className="text-lg font-black italic text-gray-900">₹ {payoutHistory?.length ? payoutHistory.filter((h:any)=>h.status==='Completed').reduce((s:any,h:any)=>s+h.amount, 0).toFixed(0) : '0.00'}</h4></div></div>
                 <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex flex-col gap-2"><div className="h-8 w-8 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center"><ArrowUpRight className="h-4 w-4" /></div><div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Total Revenue</span><h4 className="text-lg font-black italic text-gray-900">₹ {earnings.totalDelivered.toFixed(0)}</h4></div></div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 border border-border/50 shadow-sm flex flex-col items-center gap-4">
                 <QrCode className="h-10 w-10 text-teal-300" />
                 <Button onClick={() => { setUpiForm({ upiId: vendorProfile.upiId || '', accountNumber: vendorProfile.accountNumber || '', ifscCode: vendorProfile.ifscCode || '', accountHolderName: vendorProfile.accountHolderName || '' }); setIsUpiModalOpen(true); }} variant="outline" className="w-full border-teal-200 text-teal-600 font-black uppercase text-xs">UPDATE PAYMENT UPI</Button>
              </div>

              <div className="space-y-4 pt-4">
                 <div className="flex border-b border-gray-100 gap-6 px-2 overflow-x-auto no-scrollbar">
                    {['Withdraw Request', 'Payment History', 'Transaction History'].map((t, idx) => (
                      <button key={t} onClick={() => setWalletTab(idx === 0 ? 'request' : idx === 1 ? 'history' : 'transactions')} className={cn("pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0", (idx === 0 && walletTab === 'request') || (idx === 1 && walletTab === 'history') || (idx === 2 && walletTab === 'transactions') ? "text-teal-600" : "text-gray-400")}>{t}{( (idx === 0 && walletTab === 'request') || (idx === 1 && walletTab === 'history') || (idx === 2 && walletTab === 'transactions') ) && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-full" />}</button>
                    ))}
                 </div>
                 <div className="bg-white rounded-[2.5rem] p-6 border border-border/50 shadow-sm min-h-[300px]">
                    {walletTab === 'history' ? (
                      <div className="space-y-3">
                         {payoutHistory?.map((h:any)=>(
                            <div key={h.id} className="p-4 bg-gray-50 rounded-xl flex justify-between items-center"><div className="flex items-center gap-2 text-green-600"><CheckCircle2 className="h-4 w-4" /><span className="text-[10px] font-black uppercase">Settled</span></div><span className="text-sm font-black italic">₹{h.amount.toFixed(0)}</span></div>
                         ))}
                         {!payoutHistory?.length && <p className="text-center py-20 text-[10px] font-bold text-gray-300 uppercase">No history</p>}
                      </div>
                    ) : <div className="text-center py-20 opacity-20 flex flex-col items-center"><History className="h-10 w-10 mb-4" /><p className="text-[10px] font-black text-gray-400 uppercase">History is empty</p></div>}
                 </div>
              </div>
           </div>
         )}

         {/* UPI SETUP MODAL */}
         <Dialog open={isUpiModalOpen} onOpenChange={setIsUpiModalOpen}>
           <DialogContent className="rounded-[2.5rem] max-w-md p-8 bg-white border-none shadow-2xl">
              <DialogHeader><DialogTitle className="font-black italic uppercase text-center text-xl">Payment Hub</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                 <div className="space-y-1"><label className="text-[10px] font-black uppercase text-teal-600 ml-1">UPI ID</label><Input value={upiForm.upiId} onChange={e => setUpiForm({...upiForm, upiId: e.target.value.toLowerCase()})} placeholder="store@upi" className="h-14 rounded-2xl bg-gray-50 border-none font-black italic" /></div>
                 <div className="space-y-1"><label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Account Holder</label><Input value={upiForm.accountHolderName} onChange={e => setUpiForm({...upiForm, accountHolderName: e.target.value.toUpperCase()})} className="h-12 rounded-xl bg-gray-50 border-none font-bold" /></div>
                 <Button onClick={handleSaveUpi} disabled={isProcessing || !upiForm.upiId} className="w-full h-16 bg-teal-600 text-white rounded-[1.5rem] font-black uppercase italic shadow-xl">SAVE SETTINGS</Button>
              </div>
           </DialogContent>
         </Dialog>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-50 rounded-t-[2.5rem] shadow-2xl transform-gpu">
        {[
          {id:'orders',label:'Queue',icon:ShoppingBag},
          {id:'catalog',label:'Menu',icon:Layers},
          {id:'payouts',label:'Wallet',icon:Wallet2},
          {id:'account',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => setActiveMainTab(item.id as MainTab)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-none outline-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-teal-500 scale-110" : "text-gray-500")} />
            <span className={cn("text-[8px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
