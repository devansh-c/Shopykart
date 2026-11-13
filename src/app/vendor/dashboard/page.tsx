
"use client"

import { useEffect, useState, useRef, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { 
  collection, 
  doc, 
  query, 
  where, 
  setDoc, 
  serverTimestamp, 
  updateDoc, 
  orderBy, 
  limit, 
  addDoc, 
  getDoc, 
  deleteDoc, 
  increment 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  ShoppingBag, 
  Plus, 
  LogOut,
  Layers,
  UserCircle2,
  Store,
  Loader2,
  User,
  ImageIcon,
  Trash2,
  History,
  Timer,
  Megaphone,
  Globe,
  Calendar,
  Zap,
  TrendingUp,
  Wallet2,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  QrCode,
  Sparkles,
  Settings,
  Phone,
  ListTree,
  X,
  Clock,
  Ticket,
  Percent,
  IndianRupee,
  Edit2,
  BarChart3,
  FileText,
  PhoneCall,
  XCircle,
  StickyNote,
  KeyRound,
  MapPin,
  AlertCircle,
  Package,
  MessageSquare,
  ChevronRight,
  ShieldCheck,
  Info,
  CalendarDays,
  CalendarRange,
  Wallet,
  Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn, slugify } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfDay, startOfWeek, startOfMonth, isAfter } from 'date-fns';
import { compressImage } from '@/lib/image-utils';
import { requestPushToken } from '@/firebase/messaging';

type MainTab = 'orders' | 'catalog' | 'coupons' | 'payouts' | 'account';
type OrderFilter = 'NEW ORDERS' | 'DELIVERED' | 'CANCELLED';

export default function VendorDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('NEW ORDERS');
  const [isMounted, setIsMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Coupon State
  const [isAddCouponOpen, setIsAddCouponOpen] = useState(false);
  const [couponForm, setCouponData] = useState({ code: '', value: '', type: 'percentage', minOrder: '' });

  // Payout State
  const [isPayoutRequestOpen, setIsPayoutRequestOpen] = useState(false);
  const [payoutForm, setPayoutForm] = useState({ amount: '', upiId: '' });

  // Note State
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteOrderId, setNoteOrderId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Time for Store Schedule
  const [currentTimeMins, setCurrentTimeMins] = useState<number | null>(null);

  useEffect(() => { 
    setIsMounted(true); 
    const d = new Date();
    setCurrentTimeMins(d.getHours() * 60 + d.getMinutes());
  }, []);

  useEffect(() => {
    if (!isMounted || authLoading) return;
    const sessionActive = localStorage.getItem('shopykart_session_active') === 'true';
    if (!user && !sessionActive) {
      router.replace('/vendor/login');
      return;
    }
    
    if (user?.uid && firestore) {
      requestPushToken(user.uid).then(token => {
        if (token) {
           updateDoc(doc(firestore, 'vendors', user.uid), {
             fcmToken: token,
             lastTokenUpdate: serverTimestamp()
           }).catch(e => console.error("Store Token sync error:", e));
        }
      });
    }
  }, [user, authLoading, router, isMounted, firestore]);

  const vendorRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'vendors', user.uid) : null, [firestore, user]);
  const { data: vendorProfile, loading: profileLoading } = useDoc<any>(vendorRef);

  const ordersQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'orders'), orderBy('createdAt', 'desc')) : null, [firestore, user]);
  const { data: rawOrders } = useCollection<any>(ordersQuery);

  const productsQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'products'), where('vendorId', '==', user.uid)) : null, [firestore, user]);
  const { data: products } = useCollection<any>(productsQuery);

  const couponsQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'coupons'), where('vendorId', '==', user.uid)) : null, [firestore, user]);
  const { data: coupons } = useCollection<any>(couponsQuery);

  const payoutHistoryQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'payout_requests'), where('vendorId', '==', user.uid), orderBy('createdAt', 'desc')) : null, [firestore, user]);
  const { data: payoutHistory } = useCollection<any>(payoutHistoryQuery);

  const earnings = useMemo(() => {
    const fallback = { today: 0, week: 0, month: 0, total: 0 };
    if (!rawOrders || !user) return fallback;

    let today = 0, week = 0, month = 0, total = 0;
    const now = new Date();
    const dayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    rawOrders.forEach((o: any) => {
      const vId = String(user.uid).trim();
      const status = (o.status || '').toUpperCase();
      
      const vendorItems = (o.items || []).filter((it: any) => String(it.vendorId).trim() === vId);
      let vendorSubtotal = vendorItems.reduce((acc: number, it: any) => acc + (Number(it.price) * Number(it.quantity)), 0);
      
      if (vendorSubtotal === 0 && (String(o.vendorId || '').trim() === vId)) {
        vendorSubtotal = Number(o.total) || 0;
      }
      
      if (vendorSubtotal === 0) return;
      if (status !== 'DELIVERED') return;

      let orderDate = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : new Date(o.createdAt || Date.now());
      
      total += vendorSubtotal;
      if (isAfter(orderDate, dayStart)) today += vendorSubtotal;
      if (isAfter(orderDate, weekStart)) week += vendorSubtotal;
      if (isAfter(orderDate, monthStart)) month += vendorSubtotal;
    });

    return { today, week, month, total };
  }, [rawOrders, user]);

  const filteredOrders = useMemo(() => {
    if (!rawOrders || !user) return [];
    const vId = String(user.uid).trim();
    const myOrders = rawOrders.filter((o: any) => String(o.vendorId || '').trim() === vId || (o.items && o.items.some((it:any) => String(it.vendorId).trim() === vId)));
    
    if (orderFilter === 'DELIVERED') return myOrders.filter((o: any) => (o.status || '').toLowerCase() === 'delivered');
    if (orderFilter === 'CANCELLED') return myOrders.filter((o: any) => (o.status || '').toLowerCase() === 'cancelled');
    
    const activeStatuses = ['placed', 'accepted', 'preparing', 'ready for pickup', 'picked up', 'out for delivery'];
    return myOrders.filter((o: any) => activeStatuses.includes((o.status || '').toLowerCase()));
  }, [rawOrders, user, orderFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!firestore) return;
    try {
      const updateData: any = { status: newStatus, updatedAt: serverTimestamp() };
      if (newStatus === 'Ready for Pickup') {
        updateData.pickupOTP = Math.floor(1000 + Math.random() * 9000).toString();
        updateData.readyForPickupAt = serverTimestamp();
      }
      await updateDoc(doc(firestore, 'orders', orderId), updateData);
      toast({ title: `Order ${newStatus}!` });
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); }
  };

  const handleSaveNote = async () => {
    if (!firestore || !noteOrderId || isSavingNote) return;
    setIsSavingNote(true);
    try {
      await updateDoc(doc(firestore, 'orders', noteOrderId), {
        adminNote: noteText.trim().toUpperCase(),
        noteUpdatedAt: serverTimestamp()
      });
      setIsNoteOpen(false);
      setNoteText('');
      setNoteOrderId(null);
      toast({ title: "Note Published!" });
    } catch (err) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleCreateCoupon = async () => {
    if (!firestore || !user || !couponForm.code) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(firestore, 'coupons'), {
        code: couponForm.code.toUpperCase().trim(),
        discountValue: parseFloat(couponForm.value),
        discountType: couponForm.type,
        minOrderValue: parseFloat(couponForm.minOrder) || 0,
        vendorId: user.uid,
        storeName: vendorProfile?.storeName,
        createdAt: serverTimestamp()
      });
      setIsAddCouponOpen(false);
      setCouponData({ code: '', value: '', type: 'percentage', minOrder: '' });
      toast({ title: "Offer Created! 🎫" });
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); }
    finally { setIsProcessing(false); }
  };

  const handleRequestPayout = async () => {
    if (!firestore || !user || !payoutForm.amount) return;
    const amt = parseFloat(payoutForm.amount);
    if (amt > (vendorProfile?.walletBalance || 0)) {
      toast({ variant: "destructive", title: "Insufficient Balance" });
      return;
    }
    setIsProcessing(true);
    try {
      await addDoc(collection(firestore, 'payout_requests'), {
        vendorId: user.uid,
        storeName: vendorProfile?.storeName,
        amount: amt,
        upiId: payoutForm.upiId,
        status: 'Pending',
        createdAt: serverTimestamp()
      });
      setIsPayoutRequestOpen(false);
      setPayoutForm({ amount: '', upiId: '' });
      toast({ title: "Request Sent! ⏳", description: "Admin will settle shortly." });
    } catch (e) { toast({ variant: "destructive", title: "Request Failed" }); }
    finally { setIsProcessing(false); }
  };

  const generateReceipt = async (order: any) => {
    setIsDownloading(order.id);
    try {
      const { toBlob } = await import('html-to-image');
      const FileSaver = await import('file-saver');
      const saveAs = FileSaver.saveAs || (FileSaver as any).default;

      const receipt = document.createElement('div');
      receipt.style.padding = '40px 30px';
      receipt.style.width = '420px';
      receipt.style.backgroundColor = '#ffffff';
      receipt.style.color = '#000000';
      receipt.style.fontFamily = 'monospace';
      receipt.style.textTransform = 'uppercase';
      
      const itemsHtml = order.items?.map((item: any) => `
        <div style="margin-bottom: 12px; border-bottom: 1px dashed #eee; padding-bottom: 5px;">
           <div style="font-size: 8px; font-weight: 900; color: #666; margin-bottom: 2px;">FROM: ${item.restaurantName || order.restaurantName || 'ShopyKart'}</div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 900;">
            <span style="flex: 2;">${item.name} ${item.selectedOption ? `(${item.selectedOption.name})` : ''}</span>
            <span style="flex: 0.5; text-align: center;">X${item.quantity}</span>
            <span style="flex: 1; text-align: right;">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        </div>
      `).join('');

      receipt.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="margin: 0; font-size: 38px; font-weight: 900; font-style: italic; letter-spacing: -2px;">SHOPYKART</h1>
          <p style="margin: 2px 0; font-size: 10px; font-weight: 900; letter-spacing: 2px;">PREMIUM DELIVERY NETWORK</p>
        </div>
        <div>${itemsHtml}</div>
        <div style="border-top: 2px solid #000; margin: 20px 0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 26px; font-weight: 900;">
          <span>TOTAL</span><span>₹${order.total?.toFixed(2)}</span>
        </div>
      `;
      
      document.body.appendChild(receipt);
      const blob = await toBlob(receipt, { pixelRatio: 2 }); 
      document.body.removeChild(receipt);
      
      if (blob && typeof saveAs === 'function') {
        saveAs(blob, `Bill_${order.customerOrderNumber}.png`);
        toast({ title: "Receipt Saved!" });
      }
    } catch (err) { toast({ variant: "destructive", title: "Failed" }); }
    finally { setIsDownloading(null); }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      localStorage.removeItem('shopykart_session_active');
      router.replace('/vendor/login');
    }
  };

  if (!isMounted || (profileLoading && !vendorProfile)) {
    return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative overflow-hidden">
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b shrink-0 z-50">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-rose-50 border border-rose-100 flex items-center justify-center text-primary">
              {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" /> : <Store className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-sm font-black italic uppercase leading-none">{vendorProfile?.storeName}</h1>
              <div className="flex items-center gap-1.5 mt-1"><div className={cn("h-1.5 w-1.5 rounded-full", vendorProfile?.isOnline !== false ? "bg-green-500 animate-pulse" : "bg-red-500")} /><p className="text-[8px] font-bold text-muted-foreground uppercase">{vendorProfile?.isOnline !== false ? 'Accepting' : 'Closed'}</p></div>
            </div>
         </div>
         <div className="flex items-center gap-2">
           <Switch checked={vendorProfile?.isOnline !== false} onCheckedChange={async (o) => { if(firestore && user) await updateDoc(doc(firestore, 'vendors', user.uid), { isOnline: o }); }} className="scale-75 data-[state=checked]:bg-green-500" />
           <button onClick={() => setActiveMainTab('account')} className="h-8 w-8 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center"><Settings className="h-4 w-4" /></button>
         </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
         {activeMainTab === 'orders' && (
           <div className="p-4 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-[#EF4444] p-4 rounded-[1.75rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between aspect-square">
                    <div className="relative z-10"><span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80">Today</span><div className="text-xl font-black italic mt-1">₹{earnings.today.toFixed(0)}</div></div>
                    <Zap className="h-6 w-6 opacity-20 self-end" />
                 </div>
                 <div className="bg-blue-600 p-4 rounded-[1.75rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between aspect-square">
                    <div className="relative z-10"><span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80">Week</span><div className="text-xl font-black italic mt-1">₹{earnings.week.toFixed(0)}</div></div>
                    <CalendarDays className="h-6 w-6 opacity-20 self-end" />
                 </div>
                 <div className="bg-indigo-600 p-4 rounded-[1.75rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between aspect-square">
                    <div className="relative z-10"><span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80">Month</span><div className="text-xl font-black italic mt-1">₹{earnings.month.toFixed(0)}</div></div>
                    <CalendarRange className="h-6 w-6 opacity-20 self-end" />
                 </div>
                 <div className="bg-emerald-600 p-4 rounded-[1.75rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between aspect-square">
                    <div className="relative z-10"><span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80">Total</span><div className="text-xl font-black italic mt-1">₹{earnings.total.toFixed(0)}</div></div>
                    <IndianRupee className="h-6 w-6 opacity-20 self-end" />
                 </div>
              </div>

              <div className="flex bg-white rounded-2xl p-1 shadow-sm border">
                {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-[#EF4444] text-white" : "text-gray-400")}>{f}</button>
                ))}
              </div>

              {filteredOrders.length > 0 ? filteredOrders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm mb-4 animate-in fade-in slide-in-from-bottom-2">
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shrink-0"><Package className="h-7 w-7" /></div>
                        <div className="min-w-0">
                           <span className="text-2xl font-black italic text-gray-900 leading-none block">#{o.customerOrderNumber}</span>
                           <div className="flex items-center gap-1.5 mt-1">
                              <Badge className="bg-primary/5 text-primary border-none font-black text-[8px] uppercase px-2">{o.status}</Badge>
                              <div className="flex items-center gap-1 text-[9px] font-black text-muted-foreground italic"><Clock className="h-2.5 w-2.5" />{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'hh:mm a')}</div>
                           </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <button onClick={() => { setNoteOrderId(o.id); setNoteText(o.adminNote || ''); setIsNoteOpen(true); }} className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100"><StickyNote className="h-5 w-5" /></button>
                         <button onClick={() => generateReceipt(o)} disabled={isDownloading === o.id} className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-blue-100">
                           {isDownloading === o.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                         </button>
                         <button onClick={() => window.open(`tel:${o.customerPhone}`)} className="h-10 w-10 bg-green-500 text-white rounded-xl flex items-center justify-center shadow-lg"><PhoneCall className="h-5 w-5" /></button>
                      </div>
                   </div>

                   <div className="bg-muted/30 rounded-[2rem] p-6 mb-6 space-y-4 border border-border/40">
                      <div className="flex items-center gap-3 border-b border-white pb-4">
                         <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-primary shrink-0"><User className="h-5 w-5" /></div>
                         <div className="min-w-0 pr-2"><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Customer</span><span className="text-sm font-black uppercase italic text-gray-900 truncate block">{o.customerName}</span></div>
                      </div>
                      <div className="flex items-start gap-3">
                         <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-blue-500 shrink-0"><MapPin className="h-5 w-5" /></div>
                         <div className="min-w-0"><span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Address</span><p className="text-[11px] font-bold text-gray-700 leading-tight uppercase italic mt-0.5">{o.address}</p></div>
                      </div>
                   </div>

                   <div className="flex flex-col gap-2">
                      {o.status === 'Placed' && <Button onClick={() => handleUpdateStatus(o.id, 'Accepted')} className="h-16 bg-green-600 text-white rounded-2xl font-black uppercase italic">ACCEPT ORDER</Button>}
                      {o.status === 'Accepted' && <Button onClick={() => handleUpdateStatus(o.id, 'Preparing')} className="h-16 bg-primary text-white rounded-2xl font-black uppercase italic">START PREPARING</Button>}
                      {o.status === 'Preparing' && <Button onClick={() => handleUpdateStatus(o.id, 'Ready for Pickup')} className="h-16 bg-black text-white rounded-2xl font-black uppercase italic">READY FOR PICKUP</Button>}
                   </div>
                </div>
              )) : <div className="text-center py-20 opacity-20"><ShoppingBag className="h-12 w-12 mx-auto mb-2" /><p className="font-black uppercase text-xs">No orders</p></div>}
           </div>
         )}

         {activeMainTab === 'catalog' && (
           <div className="p-4 space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xl font-black italic uppercase">Menu Control</h2>
                 <button onClick={() => router.push('/vendor/dashboard?action=add')} className="h-12 px-6 bg-primary text-white rounded-xl font-black uppercase italic text-xs shadow-lg">+ ADD ITEM</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 {products?.filter(p => !p.isDeleted).map(p => (
                   <div key={p.id} className="bg-white p-5 rounded-[2.5rem] border border-border shadow-sm flex items-center gap-4 relative group transition-all">
                      <div className="h-20 w-20 rounded-2xl overflow-hidden bg-muted shrink-0">
                        <img src={p.imageUrl} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 pr-10">
                        <h4 className="font-black text-sm uppercase italic truncate leading-none mb-2">{p.name}</h4>
                        <div className="flex items-center gap-3">
                          <p className="text-lg font-black text-primary italic leading-none">₹{p.price}</p>
                          <div className="h-3 w-[1px] bg-gray-200" />
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[8px] font-black uppercase", p.isAvailable === false ? "text-red-500" : "text-green-600")}>{p.isAvailable === false ? 'OFF' : 'ON'}</span>
                            <Switch checked={p.isAvailable !== false} onCheckedChange={async () => await updateDoc(doc(firestore!, 'products', p.id), {isAvailable: p.isAvailable === false})} className="scale-75 data-[state=checked]:bg-green-500" />
                          </div>
                        </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
         )}

         {activeMainTab === 'coupons' && (
           <div className="p-4 space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xl font-black italic uppercase">Store Offers</h2>
                 <Dialog open={isAddCouponOpen} onOpenChange={setIsAddCouponOpen}>
                    <DialogTrigger asChild>
                       <button className="h-12 px-6 bg-amber-500 text-white rounded-xl font-black uppercase italic text-xs shadow-lg">+ NEW OFFER</button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] max-w-sm p-8">
                       <DialogHeader><DialogTitle className="font-black uppercase italic text-center">Create Coupon</DialogTitle></DialogHeader>
                       <div className="space-y-4 pt-4">
                          <Input placeholder="CODE (e.g. WELCOME50)" value={couponForm.code} onChange={e => setCouponData({...couponForm, code: e.target.value.toUpperCase()})} className="h-12 rounded-xl font-black" />
                          <div className="grid grid-cols-2 gap-3">
                             <Input placeholder="Value" type="number" value={couponForm.value} onChange={e => setCouponData({...couponForm, value: e.target.value})} className="h-12 rounded-xl font-black" />
                             <Select value={couponForm.type} onValueChange={v => setCouponData({...couponForm, type: v})}>
                                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent><SelectItem value="percentage">% OFF</SelectItem><SelectItem value="fixed">₹ OFF</SelectItem></SelectContent>
                             </Select>
                          </div>
                          <Input placeholder="Min Order Value (₹)" type="number" value={couponForm.minOrder} onChange={e => setCouponData({...couponForm, minOrder: e.target.value})} className="h-12 rounded-xl font-black" />
                          <Button onClick={handleCreateCoupon} disabled={isProcessing} className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic">ACTIVATE OFFER</Button>
                       </div>
                    </DialogContent>
                 </Dialog>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {coupons?.map(c => (
                   <div key={c.id} className="bg-white p-6 rounded-[2.5rem] border border-amber-100 shadow-sm flex items-center justify-between relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-3 opacity-5"><Ticket className="h-16 w-16 -rotate-12" /></div>
                      <div className="relative z-10">
                         <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest leading-none block mb-1">{c.code}</span>
                         <h3 className="text-2xl font-black italic text-gray-900 tracking-tighter">{c.discountValue}{c.discountType === 'percentage' ? '%' : '₹'} OFF</h3>
                         <p className="text-[8px] font-bold text-gray-400 uppercase mt-1">Min. Order ₹{c.minOrderValue}</p>
                      </div>
                      <button onClick={async () => { if(confirm("Remove?")) await deleteDoc(doc(firestore!, 'coupons', c.id)); }} className="bg-red-50 text-red-500 h-10 w-10 rounded-xl flex items-center justify-center active:scale-90 transition-all z-10"><Trash2 className="h-4 w-4" /></button>
                   </div>
                 ))}
                 {(!coupons || coupons.length === 0) && (
                   <div className="text-center py-20 opacity-20"><Ticket className="h-12 w-12 mx-auto mb-2" /><p className="font-black uppercase text-[10px]">No store offers active</p></div>
                 )}
              </div>
           </div>
         )}

         {activeMainTab === 'payouts' && (
           <div className="bg-gray-50 min-h-full">
              <div className="bg-white px-6 pt-10 pb-6 rounded-b-[3rem] shadow-sm">
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">Settlements</h2>
              </div>

              <div className="px-5 -mt-4">
                 <div className="bg-[#EF4444] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-rose-200">
                    <div className="flex justify-between items-start relative z-10">
                       <div className="space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-80 block">Total Withdrawable Revenue</span>
                          <div className="text-4xl font-black italic tracking-tighter leading-none">₹ {vendorProfile?.walletBalance?.toFixed(2) || '0.00'}</div>
                       </div>
                       <button 
                         onClick={() => setIsPayoutRequestOpen(true)}
                         disabled={!vendorProfile?.walletBalance || vendorProfile.walletBalance < 100}
                         className="bg-white text-[#EF4444] px-6 py-2 rounded-xl font-black uppercase italic text-[11px] shadow-lg active:scale-95 transition-all disabled:opacity-50"
                       >
                         Request
                       </button>
                    </div>
                    <div className="mt-8 relative z-10 flex items-center gap-3">
                       <div className="bg-white/20 p-2 rounded-xl border border-white/10"><Info className="h-4 w-4 text-white" /></div>
                       <p className="text-[9px] font-black uppercase text-white/80 leading-tight">We will take ₹10 per order as platform fee during final settlement.</p>
                    </div>
                    <div className="absolute top-0 right-0 h-full w-40 bg-white/5 -skew-x-12 translate-x-12" />
                 </div>
              </div>

              <div className="px-5 py-20 space-y-6">
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black uppercase italic tracking-tighter">Settled By Admin</h3>
                    <Badge variant="outline" className="rounded-full text-[7px] font-black uppercase tracking-widest border-gray-200">History</Badge>
                 </div>

                 <div className="space-y-4 pb-20">
                    {payoutHistory?.filter(r => r.status === 'Completed').map(req => (
                      <div key={req.id} className="bg-white p-5 rounded-[1.75rem] border border-green-100 flex items-center justify-between group">
                         <div className="flex items-center gap-4">
                            <div className="bg-green-50 p-2.5 rounded-xl text-green-600"><CheckCircle2 className="h-5 w-5" /></div>
                            <div>
                               <h4 className="text-[11px] font-black uppercase italic text-gray-800">Bank Settlement</h4>
                               <p className="text-[8px] font-bold text-gray-400 uppercase">{format(new Date(req.paidAt?.seconds * 1000 || Date.now()), 'dd MMM yyyy')}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <div className="text-sm font-black italic text-green-600">₹ {Number(req.amount).toFixed(0)}</div>
                            <span className="text-[7px] font-black text-gray-300 uppercase tracking-widest">Paid Out</span>
                         </div>
                      </div>
                    ))}

                    {!payoutHistory?.some(r => r.status === 'Completed') && (
                      <div className="text-center py-20 opacity-20 flex flex-col items-center">
                         <History className="h-10 w-10 mb-2 text-gray-400" />
                         <p className="font-black uppercase text-[10px] text-gray-400">No previous settlements</p>
                      </div>
                    )}
                 </div>
              </div>

              <Dialog open={isPayoutRequestOpen} onOpenChange={setIsPayoutRequestOpen}>
                 <DialogContent className="rounded-[2.5rem] max-w-sm p-8">
                    <DialogHeader><DialogTitle className="font-black italic text-center text-xl uppercase">Settlement Request</DialogTitle></DialogHeader>
                    <div className="space-y-5 pt-4 text-center">
                       <Input placeholder="Amount to withdraw" type="number" value={payoutForm.amount} onChange={e => setPayoutForm({...payoutForm, amount: e.target.value})} className="h-14 rounded-2xl font-black text-center text-2xl border-none bg-gray-100" />
                       <Input placeholder="Enter UPI ID (e.g. 98xxx@ybl)" value={payoutForm.upiId} onChange={e => setPayoutForm({...payoutForm, upiId: e.target.value})} className="h-14 rounded-2xl font-black text-center border-none bg-gray-100" />
                       <Button onClick={handleRequestPayout} disabled={isProcessing || !payoutForm.amount || !payoutForm.upiId} className="w-full h-16 bg-black text-white rounded-[2rem] font-black uppercase italic shadow-xl">SUBMIT REQUEST</Button>
                    </div>
                 </DialogContent>
              </Dialog>
           </div>
         )}

         {activeMainTab === 'account' && (
            <div className="p-8 space-y-10 animate-in fade-in duration-500">
               <div className="text-center space-y-4">
                  <div className="h-32 w-32 rounded-[3rem] overflow-hidden border-[6px] border-white shadow-2xl mx-auto bg-gray-50 flex items-center justify-center">
                    {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" /> : <Store className="h-10 w-10 text-gray-300" />}
                  </div>
                  <div><h2 className="text-3xl font-black italic uppercase text-gray-900 leading-none">{vendorProfile?.storeName}</h2><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-3">HUB ID • {vendorProfile?.storeId}</p></div>
               </div>
               <div className="space-y-4">
                  <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-5">
                     <div className="flex items-center gap-4"><div className="bg-primary/5 p-2 rounded-xl text-primary"><Clock className="h-5 w-5" /></div><div><span className="text-[10px] font-black text-gray-400 uppercase">Timings</span><span className="text-sm font-black uppercase italic text-gray-800 block">{vendorProfile?.openingTime} - {vendorProfile?.closingTime}</span></div></div>
                  </div>
                  <button onClick={handleLogout} className="w-full h-18 bg-white border border-red-50 text-red-500 rounded-[2.2rem] flex items-center justify-center gap-3 font-black uppercase italic text-sm shadow-sm"><LogOut className="h-5 w-5" /> DISCONNECT ACCOUNT</button>
               </div>
            </div>
         )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-[100] rounded-t-[2.5rem]">
        {[
          {id:'orders',label:'Queue',icon:ShoppingBag},
          {id:'catalog',label:'Menu',icon:Layers},
          {id:'coupons',label:'Offer',icon:Ticket},
          {id:'payouts',label:'Wallet',icon:Wallet2},
          {id:'account',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => setActiveMainTab(item.id as MainTab)} className="flex flex-col items-center gap-1.5 active:scale-90 outline-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-primary" : "text-gray-50")} />
            <span className={cn("text-[8px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-50")}>{item.label}</span>
          </button>
        ))}
      </nav>

      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
         <DialogContent className="rounded-[2.5rem] max-w-sm p-8 border-none shadow-2xl bg-white focus:outline-none">
            <DialogHeader className="text-center mb-4">
              <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mx-auto border border-amber-100 mb-4"><StickyNote className="h-8 w-8" /></div>
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">Add Order Note</DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visible to customer instantly</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
               <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="e.g. Preparing fresh ingredients, Rider assigned..." className="min-h-[120px] rounded-2xl border-none bg-gray-50 font-bold p-4 uppercase text-xs" />
               <Button onClick={handleSaveNote} disabled={isSavingNote || !noteText.trim()} className="w-full h-16 bg-black hover:bg-amber-600 text-white rounded-[2rem] font-black uppercase italic shadow-xl">
                 {isSavingNote ? <Loader2 className="h-6 w-6 animate-spin" /> : "PUBLISH NOTE"}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
