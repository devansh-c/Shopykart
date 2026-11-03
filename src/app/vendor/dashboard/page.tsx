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
  CheckCircle2,
  QrCode,
  Building2
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

export default function VendorDashboard() {
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);

  // UPI Form State
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
      if (!sessionActive) router.replace('/vendor/login');
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

  const filteredOrders = useMemo(() => {
    if (!rawOrders || !user) return [];
    
    // 1. Filter orders belonging to this vendor
    const myOrders = rawOrders.filter((o: any) => {
      const vId = String(user.uid);
      return String(o.vendorId) === vId || (Array.isArray(o.vendorIds) && o.vendorIds.includes(vId)) || o.items?.some((it: any) => String(it.vendorId) === vId);
    });

    // 2. Apply status filter based on active tab
    if (orderFilter === 'DELIVERED') {
      return myOrders.filter((o: any) => o.status === 'Delivered');
    } else if (orderFilter === 'CANCELLED') {
      return myOrders.filter((o: any) => o.status === 'Cancelled');
    } else {
      // NEW ORDERS: Everything else that is active
      const activeStatuses = ['Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Out for Delivery'];
      return myOrders.filter((o: any) => activeStatuses.includes(o.status));
    }
  }, [rawOrders, user, orderFilter]);

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
      } else if (status === 'CANCELLED') {
        tc += amt;
      }
    });
    return { today: t, totalDelivered: td, totalCancelled: tc };
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

  const handleSaveUpi = async () => {
    if (!firestore || !user || !upiForm.upiId) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(firestore, 'vendors', user.uid), {
        ...upiForm,
        kycCompleted: true,
        updatedAt: serverTimestamp()
      });
      setIsUpiModalOpen(false);
      toast({ title: "Payment Details Saved! ✅" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdrawRequest = async () => {
    if (!firestore || !user || !vendorProfile) return;
    
    if (!vendorProfile.upiId) {
      setIsUpiModalOpen(true);
      toast({ title: "Setup UPI First", description: "Payment details are required to withdraw." });
      return;
    }

    if ((vendorProfile.walletBalance || 0) <= 0) {
      toast({ variant: "destructive", title: "Insufficient Balance" });
      return;
    }

    if (pendingRequests && pendingRequests.length > 0) {
      toast({ variant: "destructive", title: "Request Already Pending", description: "Wait for Admin to clear previous request." });
      return;
    }

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
      toast({ title: "Withdraw Request Sent! 🚀", description: "Admin will settle your payout soon." });
    } catch (e) {
      toast({ variant: "destructive", title: "Request Failed" });
    } finally {
      setIsWithdrawLoading(false);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      localStorage.removeItem('shopykart_session_active');
      router.replace('/vendor/login');
    }
  };

  if (!isMounted || authLoading || (profileLoading && !vendorProfile)) return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative overflow-hidden">
      <header className="bg-white px-4 py-4 border-b flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 rounded-xl overflow-hidden border-2 border-primary/10 bg-muted shrink-0"><img src={vendorProfile?.imageUrl || 'https://picsum.photos/seed/vendor/200/200'} className="h-full w-full object-cover" alt="" /></div>
           <div><h1 className="text-sm font-black italic uppercase leading-none">{vendorProfile?.storeName}</h1><div className="flex items-center gap-1.5 mt-1"><div className={cn("h-1.5 w-1.5 rounded-full", vendorProfile?.isOnline !== false ? "bg-green-500 animate-pulse" : "bg-red-500")} /><p className="text-[8px] font-bold text-muted-foreground uppercase">{vendorProfile?.isOnline !== false ? 'Accepting' : 'Closed'}</p></div></div>
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
                 <div className="bg-[#EF4444] p-8 rounded-[2.5rem] text-white shadow-2xl shadow-rose-200 relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10">
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Today's Sale</span>
                       <div className="text-4xl font-black italic tracking-tighter mt-1">₹ {earnings.today.toFixed(0)}</div>
                    </div>
                    <div className="bg-white/20 p-4 rounded-[1.5rem] backdrop-blur-md relative z-10"><Wallet className="h-10 w-10 text-white fill-white/20" /></div>
                 </div>
              </div>

              <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-border/50">
                {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-[#EF4444] text-white" : "text-gray-400")}>{f}</button>
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

              {filteredOrders.length > 0 ? filteredOrders.map((o: any) => (
                <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm mb-4">
                  <div className="flex justify-between items-start mb-4">
                      <div><span className="text-2xl font-black italic">#{o.customerOrderNumber}</span><p className="text-[8px] font-black text-gray-400 uppercase mt-1">{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'hh:mm a')}</p></div>
                      <Badge className={cn("border-none text-[8px] font-black uppercase px-3 py-1 rounded-full", o.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary')}>{o.status}</Badge>
                  </div>
                  <div className="bg-muted/30 rounded-3xl p-5 mb-4 space-y-3">
                      <div className="flex items-center gap-2 border-b border-white pb-2 font-black uppercase italic text-xs text-gray-800"><User className="h-3.5 w-3.5 text-primary" />{o.customerName}</div>
                      {o.items?.filter((it:any) => String(it.vendorId) === String(user?.uid)).map((item:any, i:number) => (
                        <div key={i} className="flex justify-between items-center text-xs font-black uppercase italic"><span className="text-gray-700">{item.quantity}x {item.name}</span><span className="text-primary">₹{(item.price * item.quantity).toFixed(0)}</span></div>
                      ))}
                      {o.pickupOTP && o.status === 'Ready for Pickup' && <div className="bg-black p-3 rounded-2xl text-center border border-primary/20"><span className="text-[7px] font-black text-primary uppercase tracking-widest">PICKUP OTP</span><h4 className="text-xl font-black text-white italic tracking-[0.4em]">{o.pickupOTP}</h4></div>}
                  </div>
                  <div className="flex flex-col gap-2">
                      {o.status === 'Placed' && <Button onClick={() => handleUpdateStatus(o.id, 'Accepted')} className="w-full h-14 bg-green-600 text-white rounded-2xl font-black uppercase italic shadow-lg">ACCEPT ORDER</Button>}
                      {o.status === 'Accepted' && <Button onClick={() => handleUpdateStatus(o.id, 'Preparing')} className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic shadow-lg">START PREPARING</Button>}
                      {o.status === 'Preparing' && <Button onClick={() => handleUpdateStatus(o.id, 'Ready for Pickup')} className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic shadow-lg">READY FOR PICKUP</Button>}
                  </div>
                </div>
              )) : <div className="text-center py-20 opacity-30 flex flex-col items-center"><ShoppingBag className="h-12 w-12 mb-4" /><p className="font-black uppercase text-xs">No orders found.</p></div>}
           </div>
        )}

        {activeMainTab === 'payouts' && (
           <div className="p-4 space-y-6">
              <h2 className="text-xl font-black italic uppercase ml-2">Wallet</h2>
              <div className="bg-[#EF4444] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[200px]">
                 <div className="relative z-10 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Payout Due (Withdrawable)</span>
                    <div className="text-5xl font-black italic tracking-tighter">₹ {vendorProfile?.walletBalance?.toFixed(2) || '0.00'}</div>
                 </div>
                 <div className="relative z-10 flex justify-end mt-4">
                    <Button 
                      onClick={handleWithdrawRequest} 
                      disabled={isWithdrawLoading || (vendorProfile?.walletBalance || 0) <= 0}
                      className="bg-white text-[#EF4444] rounded-xl h-12 px-8 font-black uppercase text-[12px] italic shadow-xl active:scale-95"
                    >
                      {isWithdrawLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Withdraw Now'}
                    </Button>
                 </div>
                 <Wallet2 className="absolute bottom-4 right-4 h-24 w-24 text-white opacity-10 -rotate-12" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex flex-col gap-2">
                    <div className="h-8 w-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center"><ArrowDownLeft className="h-4 w-4" /></div>
                    <div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Cash in Hand</span><h4 className="text-lg font-black italic text-gray-900">₹ 0.00</h4></div>
                 </div>
                 <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex flex-col gap-2">
                    <div className="h-8 w-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center"><Timer className="h-4 w-4" /></div>
                    <div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Pending Settlement</span><h4 className="text-lg font-black italic text-gray-900">₹ {pendingRequests?.length ? pendingRequests.reduce((sum:any,r:any)=>sum+r.amount, 0).toFixed(2) : '0.00'}</h4></div>
                 </div>
                 <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex flex-col gap-2">
                    <div className="h-8 w-8 bg-green-50 text-green-500 rounded-lg flex items-center justify-center"><CheckCircle2 className="h-4 w-4" /></div>
                    <div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Already Withdrawn</span><h4 className="text-lg font-black italic text-gray-900">₹ {payoutHistory?.length ? payoutHistory.filter((h:any)=>h.status==='Completed').reduce((sum:any,h:any)=>sum+h.amount, 0).toFixed(2) : '0.00'}</h4></div>
                 </div>
                 <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex flex-col gap-2">
                    <div className="h-8 w-8 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center"><ArrowUpRight className="h-4 w-4" /></div>
                    <div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Total Revenue</span><h4 className="text-lg font-black italic text-gray-900">₹ {earnings.totalDelivered.toFixed(2)}</h4></div>
                 </div>
              </div>

              <div className="space-y-4 pt-4">
                 <div className="flex border-b border-gray-100 gap-6 px-2 overflow-x-auto no-scrollbar">
                    {['Withdraw Request', 'Payment History', 'Transaction History'].map((t, idx) => (
                      <button key={t} onClick={() => setWalletTab(idx === 0 ? 'request' : idx === 1 ? 'history' : 'transactions')} className={cn("pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0", (idx === 0 && walletTab === 'request') || (idx === 1 && walletTab === 'history') || (idx === 2 && walletTab === 'transactions') ? "text-primary" : "text-gray-400")}>
                        {t}
                        {((idx === 0 && walletTab === 'request') || (idx === 1 && walletTab === 'history') || (idx === 2 && walletTab === 'transactions')) && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
                      </button>
                    ))}
                 </div>
                 
                 <div className="bg-white rounded-[2.5rem] p-6 border border-border/50 shadow-sm min-h-[300px]">
                    {walletTab === 'request' && (
                      <div className="space-y-6">
                        <div className="bg-primary/5 p-6 rounded-[2rem] border border-dashed border-primary/20 text-center space-y-4">
                           <QrCode className="h-10 w-10 text-primary mx-auto opacity-30" />
                           <div className="space-y-1">
                              <h4 className="font-black uppercase text-sm italic">Payment Settings</h4>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">Configure where you receive money</p>
                           </div>
                           <Button onClick={() => { setUpiForm({ upiId: vendorProfile.upiId || '', accountNumber: vendorProfile.accountNumber || '', ifscCode: vendorProfile.ifscCode || '', accountHolderName: vendorProfile.accountHolderName || '' }); setIsUpiModalOpen(true); }} variant="outline" className="h-10 rounded-xl font-black uppercase text-[10px] border-primary/20 text-primary w-full">SETUP UPI / BANK</Button>
                        </div>
                        
                        {pendingRequests?.map((req: any) => (
                          <div key={req.id} className="bg-amber-50 p-5 rounded-2xl border border-amber-200 flex items-center justify-between animate-in zoom-in">
                             <div className="flex items-center gap-3">
                                <Timer className="h-5 w-5 text-amber-600 animate-pulse" />
                                <div><h4 className="text-xs font-black uppercase italic">Withdraw Pending</h4><p className="text-[9px] font-bold text-amber-700 uppercase">₹{req.amount.toFixed(2)}</p></div>
                             </div>
                             <Badge className="bg-amber-500 text-white border-none font-black text-[8px]">WAITING ADMIN</Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    {walletTab === 'history' && (
                      <div className="space-y-4">
                         {payoutHistory?.length ? payoutHistory.map((h:any) => (
                           <div key={h.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <div className="bg-green-100 p-2 rounded-xl text-green-600"><CheckCircle2 className="h-4 w-4" /></div>
                                 <div><h4 className="text-xs font-black uppercase italic">Settled Payout</h4><p className="text-[9px] font-bold text-gray-400 uppercase">{format(new Date(h.date), 'dd MMM yyyy')}</p></div>
                              </div>
                              <span className="text-sm font-black italic text-green-600">₹{h.amount.toFixed(0)}</span>
                           </div>
                         )) : <div className="text-center py-20 opacity-20 flex flex-col items-center"><History className="h-10 w-10 mb-2" /><p className="font-black uppercase text-xs">No payout history</p></div>}
                      </div>
                    )}
                 </div>
              </div>
           </div>
        )}

        {/* UPI SETUP MODAL */}
        <Dialog open={isUpiModalOpen} onOpenChange={setIsUpiModalOpen}>
           <DialogContent className="rounded-[2.5rem] max-w-md p-0 overflow-hidden border-none shadow-2xl bg-white">
              <DialogHeader className="p-8 pb-4">
                 <DialogTitle className="font-black italic uppercase text-center text-xl">Payment Details</DialogTitle>
                 <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase text-center tracking-widest">Admin will use these for your payouts</DialogDescription>
              </DialogHeader>
              <div className="p-8 pt-0 space-y-6">
                 <div className="space-y-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-primary ml-1">UPI ID (Most Important)</label>
                       <Input value={upiForm.upiId} onChange={e => setUpiForm({...upiForm, upiId: e.target.value.toLowerCase().trim()})} placeholder="e.g. store@upi" className="h-14 rounded-2xl bg-gray-50 border-none font-black italic text-lg" />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Account Holder Name</label>
                       <Input value={upiForm.accountHolderName} onChange={e => setUpiForm({...upiForm, accountHolderName: e.target.value.toUpperCase()})} placeholder="FULL NAME ON BANK" className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Bank A/C No.</label>
                          <Input value={upiForm.accountNumber} onChange={e => setUpiForm({...upiForm, accountNumber: e.target.value})} placeholder="Numbers only" className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">IFSC Code</label>
                          <Input value={upiForm.ifscCode} onChange={e => setUpiForm({...upiForm, ifscCode: e.target.value.toUpperCase()})} placeholder="SBIN00..." className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                       </div>
                    </div>
                 </div>
                 <Button onClick={handleSaveUpi} disabled={isProcessing || !upiForm.upiId} className="w-full h-16 bg-black text-white rounded-[1.5rem] font-black uppercase italic shadow-xl">
                   {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : "SAVE PAYMENT IDENTITY"}
                 </Button>
              </div>
           </DialogContent>
        </Dialog>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-4 flex justify-around border-t border-white/5 z-50 rounded-t-[2.5rem] shadow-2xl">
        {[
          {id:'orders',label:'Queue',icon:ShoppingBag},
          {id:'catalog',label:'Menu',icon:Layers},
          {id:'payouts',label:'Wallet',icon:Wallet2},
          {id:'account',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => setActiveMainTab(item.id as MainTab)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-none outline-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-primary scale-110" : "text-gray-500")} />
            <span className={cn("text-[8px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
