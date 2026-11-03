"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, updateDoc, orderBy, limit, addDoc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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
  Sparkles,
  CheckCircle2,
  QrCode,
  Sparkle,
  Package,
  Phone,
  Settings,
  ShieldAlert
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn, slugify } from '@/lib/utils';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';
import { compressImage } from '@/lib/image-utils';
import { extractAndGenerateMenu } from '@/ai/flows/bulk-menu-extraction-flow';

type MainTab = 'orders' | 'catalog' | 'payouts' | 'account';
type OrderFilter = 'NEW ORDERS' | 'DELIVERED' | 'CANCELLED';

export default function BeautyDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const menuInputRef = useRef<HTMLInputElement>(null);
  const manualImageInputRef = useRef<HTMLInputElement>(null);
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('NEW ORDERS');
  const [walletTab, setWalletTab] = useState<'request' | 'history' | 'transactions'>('request');
  const [isMounted, setIsMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const [manualProduct, setManualProduct] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    imageUrl: ''
  });

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
      if (!sessionActive) router.replace('/vendor/login?type=Beauty');
    }
  }, [user, authLoading, router, isMounted]);

  const vendorRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'vendors', user.uid) : null, [firestore, user]);
  const { data: vendorProfile, loading: profileLoading } = useDoc<any>(vendorRef);

  const ordersQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'orders'), orderBy('createdAt', 'desc')) : null, [firestore, user]);
  const { data: rawOrders } = useCollection<any>(ordersQuery);

  const productsQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'products'), where('vendorId', '==', user.uid)) : null, [firestore, user]);
  const { data: products } = useCollection<any>(productsQuery);

  const payoutHistoryQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'vendors', user.uid, 'payout_history'), orderBy('date', 'desc')) : null, [firestore, user]);
  const { data: payoutHistory } = useCollection<any>(payoutHistoryQuery);

  const pendingRequestsQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'payout_requests'), where('vendorId', '==', user.uid), where('status', '==', 'Pending')) : null, [firestore, user]);
  const { data: pendingRequests } = useCollection<any>(pendingRequestsQuery);

  const earnings = useMemo(() => {
    if (!rawOrders || !user) return { today: 0, thisWeek: 0, thisMonth: 0, totalDelivered: 0, totalCancelled: 0 };
    let today = 0, week = 0, month = 0, totalDelivered = 0, totalCancelled = 0;
    
    const now = new Date();
    const dayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    rawOrders.forEach((o: any) => {
      const vId = String(user.uid);
      const isForMe = String(o.vendorId) === vId || (Array.isArray(o.vendorIds) && o.vendorIds.includes(vId)) || o.items?.some((it: any) => String(it.vendorId) === vId);
      if (!isForMe) return;

      const amt = Number(o.total) || 0;
      const status = (o.status || '').toUpperCase();
      const orderDate = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : new Date(o.createdAt);

      if (status === 'DELIVERED') {
        totalDelivered += amt;
        if (isAfter(orderDate, dayStart)) today += amt;
        if (isAfter(orderDate, weekStart)) week += amt;
        if (isAfter(orderDate, monthStart)) month += amt;
      } else if (status === 'CANCELLED') {
        totalCancelled += amt;
      }
    });
    return { today, thisWeek: week, thisMonth: month, totalDelivered, totalCancelled };
  }, [rawOrders, user]);

  const filteredOrders = useMemo(() => {
    if (!rawOrders || !user) return [];
    
    const myOrders = rawOrders.filter((o: any) => {
      const vId = String(user.uid);
      return String(o.vendorId) === vId || (Array.isArray(o.vendorIds) && o.vendorIds.includes(vId)) || o.items?.some((it: any) => String(it.vendorId) === vId);
    });

    if (orderFilter === 'DELIVERED') {
      return myOrders.filter((o: any) => o.status === 'Delivered');
    } else if (orderFilter === 'CANCELLED') {
      return myOrders.filter((o: any) => o.status === 'Cancelled');
    } else {
      const activeStatuses = ['Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Out for Delivery'];
      return myOrders.filter((o: any) => activeStatuses.includes(o.status));
    }
  }, [rawOrders, user, orderFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!firestore) return;
    try {
      const updateData: any = { status: newStatus, updatedAt: serverTimestamp() };
      if (newStatus === 'Ready for Pickup') updateData.pickupOTP = Math.floor(1000 + Math.random() * 9000).toString();
      await updateDoc(doc(firestore, 'orders', orderId), updateData);
      toast({ title: `Service ${newStatus}!` });
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); }
  };

  const handleManualImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 400, 400);
      setManualProduct(prev => ({ ...prev, imageUrl: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const handleManualAddProduct = async () => {
    if (!firestore || !user || !manualProduct.name || !manualProduct.price) return;
    setIsProcessing(true);
    try {
      const productRef = doc(collection(firestore, 'products'));
      const pData = {
        ...manualProduct,
        id: productRef.id,
        price: parseFloat(manualProduct.price),
        vendorId: user.uid,
        restaurantName: vendorProfile?.storeName || 'Studio',
        zoneId: vendorProfile?.zoneId || 'global',
        town: vendorProfile?.town || 'Local',
        isAvailable: true,
        isVeg: true,
        isDeleted: false,
        serviceMode: 'Beauty',
        slug: slugify(manualProduct.name),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(productRef, pData);
      await setDoc(doc(firestore, 'vendors', user.uid, 'products', productRef.id), pData);
      
      setIsManualAddOpen(false);
      setManualProduct({ name: '', price: '', category: '', description: '', imageUrl: '' });
      toast({ title: "Service Added! ✅" });
    } catch (err) { toast({ variant: "destructive", title: "Failed" }); }
    finally { setIsProcessing(false); }
  };

  const handleMenuScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firestore || !user || !vendorProfile) return;
    
    setIsScanning(true);
    toast({ title: "AI Scanning Price List...", description: "Identifying beauty services and products." });
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64 = reader.result as string;
        const result = await extractAndGenerateMenu({ 
          photoDataUri: base64, 
          vendorCategory: 'Beauty' 
        });

        if (result.items.length > 0) {
          const batch = writeBatch(firestore);
          result.items.forEach((item) => {
            const productRef = doc(collection(firestore, 'products'));
            const pData = {
              ...item,
              id: productRef.id,
              vendorId: user.uid,
              restaurantName: vendorProfile.storeName,
              zoneId: vendorProfile.zoneId || 'global',
              town: vendorProfile.town || 'Local',
              isAvailable: true,
              isVeg: true,
              isDeleted: false,
              serviceMode: 'Beauty',
              slug: slugify(item.name),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            batch.set(productRef, pData);
          });
          await batch.commit();
          toast({ title: "Service List Updated! ✨", description: `${result.items.length} items added.` });
        }
      } catch (err) {
        toast({ variant: "destructive", title: "AI Error" });
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleAvailability = async (id: string, current: boolean) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'products', id), { isAvailable: !current });
  };

  const handleSaveUpi = async () => {
    if (!firestore || !user || !upiForm.upiId) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(firestore, 'vendors', user.uid), { ...upiForm, kycCompleted: true, updatedAt: serverTimestamp() });
      setIsUpiModalOpen(false);
      toast({ title: "Payment Info Saved" });
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
      toast({ title: "Request Sent to Admin" });
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); }
    finally { setIsWithdrawLoading(false); }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      localStorage.removeItem('shopykart_session_active');
      router.replace('/vendor/login?type=Beauty');
    }
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
         <div className="flex items-center gap-2">
           <Switch checked={vendorProfile?.isOnline !== false} onCheckedChange={async (o) => { await updateDoc(doc(firestore!, 'vendors', user!.uid), { isOnline: o }); }} className="scale-75 data-[state=checked]:bg-green-500" />
           <button onClick={() => setActiveMainTab('account')} className="h-8 w-8 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center active:scale-90 transition-transform"><Settings className="h-4 w-4" /></button>
         </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
         {activeMainTab === 'orders' && (
           <div className="p-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-rose-500 p-6 rounded-[2rem] text-white shadow-xl shadow-rose-200/50 relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10"><span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Today</span><div className="text-3xl font-black italic mt-1">₹ {earnings.today.toFixed(0)}</div></div>
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md relative z-10"><Zap className="h-8 w-8 text-white fill-white/20" /></div>
                 </div>
                 <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-xl shadow-blue-200/50 relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10"><span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">This Week</span><div className="text-3xl font-black italic mt-1">₹ {earnings.thisWeek.toFixed(0)}</div></div>
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md relative z-10"><TrendingUp className="h-8 w-8 text-white" /></div>
                 </div>
                 <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-200/50 relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10"><span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">This Month</span><div className="text-3xl font-black italic mt-1">₹ {earnings.thisMonth.toFixed(0)}</div></div>
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md relative z-10"><Calendar className="h-8 w-8 text-white" /></div>
                 </div>
              </div>

              <div className="bg-[#0B0B0B] p-6 rounded-[2.5rem] text-white relative overflow-hidden border border-white/5 shadow-2xl group cursor-pointer active:scale-95 transition-all">
                <div className="relative z-10 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-rose-400">
                      <Sparkles className="h-4 w-4 animate-pulse" />
                      <h4 className="text-xs font-black uppercase italic tracking-widest">Boost Your Business</h4>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Get more clients by creating local ads</p>
                  </div>
                  <div className="bg-rose-400/10 p-2 rounded-xl text-rose-400 border border-rose-400/20"><Megaphone className="h-5 w-5" /></div>
                </div>
                <div className="absolute top-0 right-0 h-full w-24 bg-white/5 -skew-x-12 translate-x-10" />
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
                <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm mb-4">
                   <div className="flex justify-between items-start mb-4">
                      <div><span className="text-2xl font-black italic">#{o.customerOrderNumber}</span><p className="text-[8px] font-black text-gray-400 uppercase mt-1">{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'hh:mm a')}</p></div>
                      <Badge className={cn("border-none font-black text-[8px] uppercase", o.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-rose-50 text-rose-600')}>{o.status}</Badge>
                   </div>
                   <div className="bg-muted/30 rounded-3xl p-5 mb-4 space-y-3">
                      <div className="flex items-center gap-2 border-b border-white pb-2"><User className="h-3.5 w-3.5 text-rose-600" /><span className="text-xs font-black uppercase italic">{o.customerName}</span></div>
                      {o.items?.filter((it:any) => String(it.vendorId) === String(user?.uid)).map((item:any, i:number) => (
                        <div key={i} className="flex justify-between items-center text-[11px] font-black uppercase italic"><span className="text-gray-700">{item.quantity}x {item.name}</span><span className="text-rose-600">₹{(item.price * item.quantity).toFixed(0)}</span></div>
                      ))}
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

         {activeMainTab === 'catalog' && (
           <div className="p-4 space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xl font-black italic uppercase">Services</h2>
                 <div className="flex gap-2">
                    <button onClick={() => menuInputRef.current?.click()} disabled={isScanning} className="bg-[#0B0B0B] text-white px-4 h-10 rounded-xl font-black uppercase text-[9px] italic tracking-widest flex items-center gap-2 shadow-lg active:scale-95 disabled:opacity-50">
                       {isScanning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkle className="h-3 w-3 text-rose-400" />}
                       AI MENU SCAN
                    </button>
                    <input type="file" ref={menuInputRef} className="hidden" accept="image/*" onChange={handleMenuScan} />
                    
                    <button onClick={() => setIsManualAddOpen(true)} className="h-10 w-10 bg-white border border-border/50 rounded-xl flex items-center justify-center text-rose-600 active:scale-90 shadow-sm"><Plus className="h-5 w-5" /></button>
                 </div>
              </div>

              {isScanning && (
                <div className="bg-rose-50 p-6 rounded-[2rem] border-2 border-dashed border-rose-200 flex flex-col items-center text-center space-y-3 animate-pulse">
                   <Loader2 className="h-10 w-10 animate-spin text-rose-600" />
                   <h4 className="font-black italic uppercase text-sm">Magic Scanning...</h4>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                 {products?.filter(p => !p.isDeleted).map(p => (
                   <div key={p.id} className="bg-white p-4 rounded-[2rem] border border-border/50 shadow-sm flex items-center gap-4 relative group">
                      <div className="h-16 w-16 rounded-xl overflow-hidden bg-muted shrink-0">
                         <img src={p.imageUrl} className="h-full w-full object-cover" alt="" />
                      </div>
                      <div className="flex-1 min-w-0 pr-10">
                         <h4 className="font-black text-sm uppercase italic truncate">{p.name}</h4>
                         <p className="text-[10px] font-black text-rose-600 italic">₹{p.price}</p>
                         <Switch checked={p.isAvailable !== false} onCheckedChange={() => toggleAvailability(p.id, p.isAvailable !== false)} className="scale-75 mt-1 data-[state=checked]:bg-rose-600" />
                      </div>
                      <button onClick={async () => { if(confirm("Remove?")) await updateDoc(doc(firestore!, 'products', p.id), {isDeleted: true}); }} className="absolute top-4 right-4 h-8 w-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
                   </div>
                 ))}
              </div>
           </div>
         )}

         {activeMainTab === 'payouts' && (
           <div className="p-4 space-y-6">
              <h2 className="text-xl font-black italic uppercase ml-2">Wallet</h2>
              <div className="bg-rose-600 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                 <div className="relative z-10 space-y-1"><span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Payout Due</span><div className="text-5xl font-black italic">₹ {vendorProfile?.walletBalance?.toFixed(2) || '0.00'}</div></div>
                 <div className="relative z-10 flex justify-end mt-4">
                    <Button onClick={handleWithdrawRequest} disabled={isWithdrawLoading || (vendorProfile?.walletBalance || 0) <= 0} className="bg-white text-rose-600 rounded-xl h-10 px-6 font-black uppercase text-[10px] italic">
                      {isWithdrawLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Withdraw'}
                    </Button>
                 </div>
                 <Wallet2 className="absolute bottom-4 right-4 h-24 w-24 text-white opacity-10 -rotate-12" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex flex-col gap-2"><div className="h-8 w-8 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center"><ArrowDownLeft className="h-4 w-4" /></div><div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Cash in Hand</span><h4 className="text-lg font-black italic text-gray-900">₹ 0.00</h4></div></div>
                 <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex flex-col gap-2"><div className="h-8 w-8 bg-amber-50 text-amber-500 rounded-lg flex items-center justify-center"><Timer className="h-4 w-4" /></div><div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Settling</span><h4 className="text-lg font-black italic text-gray-900">₹ {pendingRequests?.length ? pendingRequests.reduce((s:any,r:any)=>s+r.amount, 0).toFixed(0) : '0.00'}</h4></div></div>
                 <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex flex-col gap-2"><div className="h-8 w-8 bg-green-50 text-green-500 rounded-lg flex items-center justify-center"><CheckCircle2 className="h-4 w-4" /></div><div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Withdrawn</span><h4 className="text-lg font-black italic text-gray-900">₹ {payoutHistory?.length ? payoutHistory.filter((h:any)=>h.status==='Completed').reduce((s:any,h:any)=>s+h.amount, 0).toFixed(0) : '0.00'}</h4></div></div>
                 <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex flex-col gap-2"><div className="h-8 w-8 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center"><ArrowUpRight className="h-4 w-4" /></div><div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Total Sale</span><h4 className="text-lg font-black italic text-gray-900">₹ {earnings.totalDelivered.toFixed(0)}</h4></div></div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 border border-border/50 shadow-sm flex flex-col items-center gap-4">
                 <QrCode className="h-10 w-10 text-rose-300" />
                 <Button onClick={() => { setUpiForm({ upiId: vendorProfile.upiId || '', accountNumber: vendorProfile.accountNumber || '', ifscCode: vendorProfile.ifscCode || '', accountHolderName: vendorProfile.accountHolderName || '' }); setIsUpiModalOpen(true); }} variant="outline" className="w-full border-rose-200 text-rose-600 font-black uppercase text-xs">UPDATE PAYMENT UPI</Button>
              </div>

              <div className="space-y-4 pt-4">
                 <div className="flex border-b border-gray-100 gap-6 px-2 overflow-x-auto no-scrollbar">
                    {['Withdraw Request', 'Payment History', 'Transaction History'].map((t, idx) => (
                      <button key={t} onClick={() => setWalletTab(idx === 0 ? 'request' : idx === 1 ? 'history' : 'transactions')} className={cn("pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative shrink-0", (idx === 0 && walletTab === 'request') || (idx === 1 && walletTab === 'history') || (idx === 2 && walletTab === 'transactions') ? "text-rose-600" : "text-gray-400")}>{t}{( (idx === 0 && walletTab === 'request') || (idx === 1 && walletTab === 'history') || (idx === 2 && walletTab === 'transactions') ) && <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-600 rounded-t-full" />}</button>
                    ))}
                 </div>
                 <div className="bg-white rounded-[2.5rem] p-6 border border-border/50 shadow-sm min-h-[300px]">
                   {walletTab === 'history' ? (
                     <div className="space-y-3">
                       {payoutHistory?.map((h: any) => (
                         <div key={h.id} className="p-4 bg-gray-50 rounded-xl flex justify-between items-center">
                           <div className="flex items-center gap-2 text-green-600"><CheckCircle2 className="h-4 w-4" /><span className="text-[10px] font-black uppercase italic">Settled</span></div>
                           <span className="text-sm font-black italic">₹{h.amount.toFixed(0)}</span>
                         </div>
                       ))}
                       {!payoutHistory?.length && <p className="text-center py-20 text-[10px] font-bold text-gray-300 uppercase">No history found</p>}
                     </div>
                   ) : <div className="text-center py-20 opacity-20 flex flex-col items-center"><History className="h-10 w-10 mb-4" /><p className="text-[10px] font-black text-gray-400 uppercase">Record is empty</p></div>}
                 </div>
              </div>
           </div>
         )}

         {activeMainTab === 'account' && (
            <div className="p-8 space-y-10 animate-in fade-in duration-500">
               <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="h-32 w-32 rounded-[3rem] overflow-hidden border-[6px] border-white shadow-2xl mx-auto bg-gray-50 flex items-center justify-center relative">
                      {vendorProfile?.imageUrl ? (
                        <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <Store className="h-10 w-10 text-gray-300" />
                      )}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">{vendorProfile?.storeName}</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3">HUB ID • {vendorProfile?.storeId}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-5">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="bg-rose-50 p-2 rounded-xl text-rose-600"><Sparkles className="h-5 w-5" /></div>
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-400 uppercase">Hub Type</span>
                              <span className="text-sm font-black uppercase italic text-gray-800">BEAUTY & CARE HUB</span>
                           </div>
                        </div>
                     </div>
                     <div className="h-[1px] w-full bg-gray-50" />
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Globe className="h-5 w-5" /></div>
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-400 uppercase">Serving Region</span>
                              <span className="text-sm font-black uppercase italic text-gray-800">{vendorProfile?.town || 'Local'}</span>
                           </div>
                        </div>
                     </div>
                     <div className="h-[1px] w-full bg-gray-50" />
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="bg-green-50 p-2 rounded-xl text-green-600"><Phone className="h-5 w-5" /></div>
                           <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-400 uppercase">Registered Mobile</span>
                              <span className="text-sm font-black uppercase italic text-gray-800">{vendorProfile?.phone}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="w-full h-18 bg-white border border-red-50 text-red-500 rounded-[2.2rem] flex items-center justify-center gap-3 font-black uppercase italic text-sm shadow-sm active:scale-95 transition-all"
                  >
                    <LogOut className="h-5 w-5" /> DISCONNECT ACCOUNT
                  </button>
               </div>
            </div>
         )}

         {/* UPI SETUP MODAL */}
         <Dialog open={isUpiModalOpen} onOpenChange={setIsUpiModalOpen}>
           <DialogContent className="rounded-[2.5rem] max-w-md p-8 bg-white border-none shadow-2xl">
              <DialogHeader><DialogTitle className="font-black italic uppercase text-center text-xl">Withdraw Details</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                 <div className="space-y-1"><label className="text-[10px] font-black uppercase text-rose-600 ml-1">UPI ID (Mandatory)</label><Input value={upiForm.upiId} onChange={e => setUpiForm({...upiForm, upiId: e.target.value.toLowerCase()})} placeholder="store@upi" className="h-14 rounded-2xl bg-gray-50 border-none font-black italic" /></div>
                 <div className="space-y-1"><label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Account Holder</label><Input value={upiForm.accountHolderName} onChange={e => setUpiForm({...upiForm, accountHolderName: e.target.value.toUpperCase()})} className="h-12 rounded-xl bg-gray-50 border-none" /></div>
                 <Button onClick={handleSaveUpi} disabled={isProcessing || !upiForm.upiId} className="w-full h-16 bg-rose-600 text-white rounded-[1.5rem] font-black uppercase italic shadow-xl">SAVE SETTINGS</Button>
              </div>
           </DialogContent>
         </Dialog>

         {/* MANUAL ADD MODAL */}
         <Dialog open={isManualAddOpen} onOpenChange={setIsManualAddOpen}>
           <DialogContent className="rounded-[2.5rem] max-w-md p-0 overflow-hidden border-none shadow-2xl bg-white max-h-[90vh] flex flex-col">
              <DialogHeader className="p-8 pb-4">
                 <DialogTitle className="font-black italic uppercase text-center text-2xl tracking-tighter">Manual Add</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-0 space-y-6">
                 <div onClick={() => manualImageInputRef.current?.click()} className="h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center bg-muted/20 cursor-pointer overflow-hidden group hover:border-rose-400 transition-all">
                    {manualProduct.imageUrl ? <img src={manualProduct.imageUrl} className="h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-2"><ImageIcon className="h-8 w-8 opacity-20" /><span className="text-[9px] font-black uppercase">Service Photo</span></div>}
                 </div>
                 <input type="file" ref={manualImageInputRef} className="hidden" accept="image/*" onChange={handleManualImageSelect} />
                 
                 <div className="space-y-4">
                    <Input placeholder="SERVICE NAME" value={manualProduct.name} onChange={e => setManualProduct({...manualProduct, name: e.target.value.toUpperCase()})} className="h-12 rounded-xl font-bold bg-muted/20 border-none" />
                    <div className="grid grid-cols-2 gap-4">
                       <Input type="number" placeholder="PRICE ₹" value={manualProduct.price} onChange={e => setManualProduct({...manualProduct, price: e.target.value})} className="h-12 rounded-xl font-black bg-muted/20 border-none" />
                       <Input placeholder="CATEGORY" value={manualProduct.category} onChange={e => setManualProduct({...manualProduct, category: e.target.value.toUpperCase()})} className="h-12 rounded-xl font-bold bg-muted/20 border-none" />
                    </div>
                    <Textarea placeholder="SHORT DESCRIPTION" value={manualProduct.description} onChange={e => setManualProduct({...manualProduct, description: e.target.value})} className="rounded-xl h-24 bg-muted/20 border-none p-4" />
                 </div>
              </div>
              <div className="p-8 bg-muted/5 border-t">
                 <Button onClick={handleManualAddProduct} disabled={isProcessing || !manualProduct.name} className="w-full h-16 bg-rose-600 text-white rounded-[2rem] font-black uppercase italic shadow-xl">
                   {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : "PUBLISH SERVICE"}
                 </Button>
              </div>
           </DialogContent>
         </Dialog>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-50 rounded-t-[2.5rem] shadow-2xl">
        {[
          {id:'orders',label:'Queue',icon:ShoppingBag},
          {id:'catalog',label:'Menu',icon:Layers},
          {id:'payouts',label:'Wallet',icon:Wallet2},
          {id:'account',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => setActiveMainTab(item.id as MainTab)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-none outline-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-rose-500 scale-110" : "text-gray-500")} />
            <span className={cn("text-[8px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
