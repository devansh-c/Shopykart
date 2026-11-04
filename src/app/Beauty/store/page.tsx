
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, updateDoc, orderBy, limit, addDoc, getDoc, deleteDoc, writeBatch } from 'firebase/firestore';
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
  Sparkle,
  Settings,
  Phone,
  Sparkles,
  ListTree,
  X
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
import { compressImage } from '@/lib/image-utils';

type MainTab = 'orders' | 'catalog' | 'payouts' | 'account';
type OrderFilter = 'NEW ORDERS' | 'DELIVERED' | 'CANCELLED';

export default function BeautyDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const manualImageInputRef = useRef<HTMLInputElement>(null);
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('NEW ORDERS');
  const [walletTab, setWalletTab] = useState<'request' | 'history' | 'transactions'>('request');
  const [isMounted, setIsMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);

  const [manualProduct, setManualProduct] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    imageUrl: '',
    options: [] as { name: string; price: number }[]
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

  const categoriesQuery = useMemoFirebase(() => (firestore) ? query(collection(firestore, 'categories')) : null, [firestore]);
  const { data: categories } = useCollection<any>(categoriesQuery);

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

    if (orderFilter === 'DELIVERED') return myOrders.filter((o: any) => o.status === 'Delivered');
    if (orderFilter === 'CANCELLED') return myOrders.filter((o: any) => o.status === 'Cancelled');
    const activeStatuses = ['Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Out for Delivery'];
    return myOrders.filter((o: any) => activeStatuses.includes(o.status));
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

  const handleAddVariety = () => {
    setManualProduct(prev => ({
      ...prev,
      options: [...prev.options, { name: '', price: 0 }]
    }));
  };

  const handleRemoveVariety = (index: number) => {
    setManualProduct(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateVariety = (index: number, field: 'name' | 'price', value: string) => {
    const newOptions = [...manualProduct.options];
    if (field === 'price') {
      newOptions[index].price = parseFloat(value) || 0;
    } else {
      newOptions[index].name = value;
    }
    setManualProduct(prev => ({ ...prev, options: newOptions }));
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
        restaurantName: vendorProfile?.storeName || 'Salon',
        zoneId: vendorProfile?.zoneId || 'global',
        town: vendorProfile?.town || 'Local',
        isAvailable: true,
        isVeg: true,
        isDeleted: false,
        serviceMode: 'Beauty',
        isVarietyRequired: manualProduct.options.length > 0,
        slug: slugify(manualProduct.name),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(productRef, pData);
      await setDoc(doc(firestore, 'vendors', user.uid, 'products', productRef.id), pData);
      
      setIsManualAddOpen(false);
      setManualProduct({ name: '', price: '', category: '', description: '', imageUrl: '', options: [] });
      toast({ title: "Product Added! ✅" });
    } catch (err) { toast({ variant: "destructive", title: "Add Failed" }); }
    finally { setIsProcessing(false); }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      localStorage.removeItem('shopykart_session_active');
      router.replace('/vendor/login?type=Beauty');
    }
  };

  const currentTypeCategories = useMemo(() => {
    if (!categories) return [];
    return categories.filter(c => (c.serviceType || 'Food') === (vendorProfile?.category || 'Beauty'));
  }, [categories, vendorProfile]);

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
                 <div className="bg-rose-500 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10"><span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Today</span><div className="text-3xl font-black italic mt-1">₹ {earnings.today.toFixed(0)}</div></div>
                    <Zap className="h-8 w-8 opacity-20" />
                 </div>
                 <div className="bg-blue-600 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10"><span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Week</span><div className="text-3xl font-black italic mt-1">₹ {earnings.thisWeek.toFixed(0)}</div></div>
                    <TrendingUp className="h-8 w-8 opacity-20" />
                 </div>
                 <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden flex items-center justify-between">
                    <div className="relative z-10"><span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Month</span><div className="text-3xl font-black italic mt-1">₹ {earnings.thisMonth.toFixed(0)}</div></div>
                    <Calendar className="h-8 w-8 opacity-20" />
                 </div>
              </div>

              <div className="flex bg-white rounded-2xl p-1 shadow-sm border">
                {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-rose-600 text-white" : "text-gray-400")}>{f}</button>
                ))}
              </div>

              {(orderFilter === 'DELIVERED' || orderFilter === 'CANCELLED') && (
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white p-4 rounded-3xl border text-center"><span className="text-[7px] font-black text-gray-400 uppercase">Sales</span><div className="text-xl font-black text-green-600">₹{earnings.totalDelivered.toFixed(0)}</div></div>
                   <div className="bg-white p-4 rounded-3xl border text-center"><span className="text-[7px] font-black text-gray-400 uppercase">Loss</span><div className="text-xl font-black text-red-600">₹{earnings.totalCancelled.toFixed(0)}</div></div>
                </div>
              )}

              {filteredOrders.length > 0 ? filteredOrders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border shadow-sm mb-4">
                   <div className="flex justify-between items-start mb-4">
                      <div><span className="text-2xl font-black italic">#{o.customerOrderNumber}</span><p className="text-[8px] font-black text-gray-400 uppercase mt-1">{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'hh:mm a')}</p></div>
                      <Badge className={cn("border-none font-black text-[8px] uppercase", o.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-rose-50 text-rose-600')}>{o.status}</Badge>
                   </div>
                   <div className="bg-muted/30 rounded-3xl p-5 mb-4 space-y-2">
                      <div className="flex items-center gap-2 border-b pb-2"><User className="h-3.5 w-3.5 text-rose-600" /><span className="text-xs font-black uppercase">{o.customerName}</span></div>
                      {o.items?.filter((it:any) => String(it.vendorId) === String(user?.uid)).map((item:any, i:number) => (
                        <div key={i} className="flex justify-between text-[11px] font-black uppercase italic"><span>{item.quantity}x {item.name} {item.selectedOption ? `(${item.selectedOption.name})` : ''}</span><span>₹{item.price * item.quantity}</span></div>
                      ))}
                   </div>
                   <div className="flex flex-col gap-2">
                      {o.status === 'Placed' && <Button onClick={() => handleUpdateStatus(o.id, 'Accepted')} className="h-14 bg-green-600 text-white rounded-2xl font-black uppercase">ACCEPT SERVICE</Button>}
                      {o.status === 'Accepted' && <Button onClick={() => handleUpdateStatus(o.id, 'Preparing')} className="h-14 bg-rose-600 text-white rounded-2xl font-black uppercase">START SERVICE</Button>}
                      {o.status === 'Preparing' && <Button onClick={() => handleUpdateStatus(o.id, 'Ready for Pickup')} className="h-14 bg-black text-white rounded-2xl font-black uppercase">READY FOR PICKUP</Button>}
                   </div>
                </div>
              )) : <div className="text-center py-20 opacity-20"><ShoppingBag className="h-12 w-12 mx-auto mb-2" /><p className="font-black uppercase text-xs">No active orders</p></div>}
           </div>
         )}

         {activeMainTab === 'catalog' && (
           <div className="p-4 space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xl font-black italic uppercase">Catalog</h2>
                 <button onClick={() => setIsManualAddOpen(true)} className="h-12 px-6 bg-rose-600 text-white rounded-xl font-black uppercase italic text-xs shadow-lg active:scale-90 flex items-center gap-2"><Plus className="h-5 w-5" /> ADD NEW ITEM</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 {products?.filter(p => !p.isDeleted).map(p => (
                   <div key={p.id} className="bg-white p-4 rounded-[2rem] border shadow-sm flex items-center gap-4 relative group">
                      <img src={p.imageUrl} className="h-20 w-20 rounded-2xl object-cover shrink-0" alt="" />
                      <div className="flex-1 min-w-0 pr-10">
                         <h4 className="font-black text-sm uppercase italic truncate">{p.name}</h4>
                         <p className="text-[10px] font-black text-rose-600">₹{p.price}</p>
                         <Switch checked={p.isAvailable !== false} onCheckedChange={() => updateDoc(doc(firestore!, 'products', p.id), { isAvailable: !p.isAvailable })} className="scale-75 mt-1 data-[state=checked]:bg-rose-600" />
                      </div>
                      <button onClick={async () => { if(confirm("Remove?")) await updateDoc(doc(firestore!, 'products', p.id), {isDeleted: true}); }} className="absolute top-4 right-4 h-8 w-8 text-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
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
                    <Button onClick={() => { if(!vendorProfile.upiId) setIsUpiModalOpen(true); else if((vendorProfile.walletBalance||0)>0) setIsWithdrawLoading(true); }} disabled={isWithdrawLoading || (vendorProfile?.walletBalance || 0) <= 0} className="bg-white text-rose-600 rounded-xl h-10 px-6 font-black uppercase text-[10px] italic">Withdraw</Button>
                 </div>
                 <Wallet2 className="absolute bottom-4 right-4 h-24 w-24 text-white opacity-10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-5 rounded-[2rem] border shadow-sm flex flex-col gap-2"><ArrowDownLeft className="h-4 w-4 text-blue-500" /><div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">In Hand</span><h4 className="text-lg font-black italic">₹ 0.00</h4></div></div>
                 <div className="bg-white p-5 rounded-[2rem] border shadow-sm flex flex-col gap-2"><Timer className="h-4 w-4 text-amber-500" /><div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Settling</span><h4 className="text-lg font-black italic">₹ {pendingRequests?.reduce((s:any,r:any)=>s+r.amount, 0).toFixed(0) || '0.00'}</h4></div></div>
              </div>
              <div className="bg-white rounded-[2rem] p-6 border shadow-sm flex flex-col items-center gap-4">
                 <QrCode className="h-10 w-10 text-rose-300 opacity-30" />
                 <Button onClick={() => { setUpiForm({ upiId: vendorProfile.upiId || '', accountNumber: vendorProfile.accountNumber || '', ifscCode: vendorProfile.ifscCode || '', accountHolderName: vendorProfile.accountHolderName || '' }); setIsUpiModalOpen(true); }} variant="outline" className="w-full font-black uppercase text-xs">UPDATE PAYMENT UPI</Button>
              </div>
           </div>
         )}

         {activeMainTab === 'account' && (
            <div className="p-8 space-y-10 animate-in fade-in duration-500">
               <div className="text-center space-y-4">
                  <div className="h-32 w-32 rounded-[3rem] overflow-hidden border-[6px] border-white shadow-2xl mx-auto bg-gray-50 flex items-center justify-center">
                    {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" /> : <Store className="h-10 w-10 text-gray-300" />}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black italic uppercase text-gray-900 leading-none">{vendorProfile?.storeName}</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3">HUB ID • {vendorProfile?.storeId}</p>
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="bg-white p-6 rounded-[2.5rem] border shadow-sm space-y-5">
                     <div className="flex items-center gap-4"><div className="bg-rose-500/5 p-2 rounded-xl text-rose-600"><Sparkles className="h-5 w-5" /></div><div><span className="text-[10px] font-black text-gray-400 uppercase">Hub Type</span><span className="text-sm font-black uppercase italic text-gray-800 block">BEAUTY / COSMETICS</span></div></div>
                     <div className="flex items-center gap-4"><div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Globe className="h-5 w-5" /></div><div><span className="text-[10px] font-black text-gray-400 uppercase">Region</span><span className="text-sm font-black uppercase italic text-gray-800 block">{vendorProfile?.town}</span></div></div>
                     <div className="flex items-center gap-4"><div className="bg-green-50 p-2 rounded-xl text-green-600"><Phone className="h-5 w-5" /></div><div><span className="text-[10px] font-black text-gray-400 uppercase">Mobile</span><span className="text-sm font-black uppercase italic text-gray-800 block">{vendorProfile?.phone}</span></div></div>
                  </div>
                  <button onClick={handleLogout} className="w-full h-18 bg-white border border-red-50 text-red-500 rounded-[2.2rem] flex items-center justify-center gap-3 font-black uppercase italic text-sm shadow-sm active:scale-95 transition-all"><LogOut className="h-5 w-5" /> DISCONNECT ACCOUNT</button>
               </div>
            </div>
         )}

         <Dialog open={isManualAddOpen} onOpenChange={setIsManualAddOpen}>
           <DialogContent className="rounded-[2.5rem] max-w-md p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none flex flex-col max-h-[90vh]">
              <DialogHeader className="p-8 pb-4"><DialogTitle className="font-black italic uppercase text-center text-xl">Add Product</DialogTitle></DialogHeader>
              <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-0 space-y-6">
                 <div onClick={() => manualImageInputRef.current?.click()} className="h-32 border-2 border-dashed rounded-2xl flex items-center justify-center bg-muted/20 cursor-pointer overflow-hidden">{manualProduct.imageUrl ? <img src={manualProduct.imageUrl} className="h-full w-full object-cover" /> : <ImageIcon className="opacity-20" />}</div>
                 <input type="file" ref={manualImageInputRef} className="hidden" onChange={handleManualImageSelect} />
                 
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Product Name</label>
                       <Input placeholder="ITEM NAME" value={manualProduct.name} onChange={e => setManualProduct({...manualProduct, name: e.target.value.toUpperCase()})} className="h-12 rounded-xl border-none bg-muted/20 font-bold" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Base Price ₹</label>
                          <Input type="number" placeholder="0.00" value={manualProduct.price} onChange={e => setManualProduct({...manualProduct, price: e.target.value})} className="h-12 rounded-xl border-none bg-muted/20 font-black" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Category</label>
                          <Select value={manualProduct.category} onValueChange={v => setManualProduct({...manualProduct, category: v})}>
                             <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                             <SelectContent className="rounded-2xl max-h-[300px]">
                                {currentTypeCategories.map(c => <SelectItem key={c.id} value={c.name} className="font-bold py-3 uppercase text-xs">{c.name}</SelectItem>)}
                             </SelectContent>
                          </Select>
                       </div>
                    </div>

                    <div className="space-y-4 p-5 bg-rose-50/30 rounded-[1.5rem] border-2 border-dashed border-rose-100">
                       <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-rose-600">Varieties / Sizes</span>
                          <button onClick={handleAddVariety} className="text-[10px] font-black text-rose-600 uppercase bg-white px-3 py-1 rounded-lg border shadow-sm">+ ADD</button>
                       </div>
                       <div className="space-y-3">
                          {manualProduct.options.map((opt, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                               <Input placeholder="E.G. 100ML" value={opt.name} onChange={e => updateVariety(idx, 'name', e.target.value.toUpperCase())} className="h-10 rounded-lg bg-white border-none text-[10px] font-bold flex-1" />
                               <Input type="number" placeholder="₹" value={opt.price} onChange={e => updateVariety(idx, 'price', e.target.value)} className="h-10 w-20 rounded-lg bg-white border-none text-[10px] font-black text-center" />
                               <button onClick={() => handleRemoveVariety(idx)} className="text-red-500 p-1"><X className="h-4 w-4" /></button>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description</label>
                       <Textarea placeholder="SHORT DETAILS" value={manualProduct.description} onChange={e => setManualProduct({...manualProduct, description: e.target.value.toUpperCase()})} className="rounded-xl h-20 bg-muted/20 border-none p-4" />
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-muted/5 border-t">
                 <Button onClick={handleManualAddProduct} disabled={isProcessing || !manualProduct.name} className="w-full h-16 bg-rose-600 text-white rounded-2xl font-black uppercase italic shadow-xl">
                   {isProcessing ? <Loader2 className="animate-spin" /> : "PUBLISH PRODUCT"}
                 </Button>
              </div>
           </DialogContent>
         </Dialog>

         <Dialog open={isUpiModalOpen} onOpenChange={setIsUpiModalOpen}>
           <DialogContent className="rounded-[2.5rem] max-w-md p-8 bg-white border-none shadow-2xl">
              <DialogHeader><DialogTitle className="font-black italic uppercase text-center text-xl">Withdraw Settings</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                 <div className="space-y-1"><label className="text-[10px] font-black uppercase text-rose-600">UPI ID</label><Input value={upiForm.upiId} onChange={e => setUpiForm({...upiForm, upiId: e.target.value.toLowerCase()})} placeholder="store@upi" className="h-14 rounded-2xl bg-gray-50 border-none font-bold" /></div>
                 <Button onClick={async () => { if(!firestore||!user) return; setIsProcessing(true); await updateDoc(doc(firestore, 'vendors', user.uid), {...upiForm}); setIsUpiModalOpen(false); toast({title:"Updated"}); setIsProcessing(false); }} disabled={isProcessing || !upiForm.upiId} className="w-full h-16 bg-rose-600 text-white rounded-[1.5rem] font-black uppercase italic shadow-xl">SAVE SETTINGS</Button>
              </div>
           </DialogContent>
         </Dialog>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-50 rounded-t-[2.5rem]">
        {[{id:'orders',label:'Queue',icon:ShoppingBag},{id:'catalog',label:'Menu',icon:Layers},{id:'payouts',label:'Wallet',icon:Wallet2},{id:'account',label:'Profile',icon:UserCircle2}].map(item => (
          <button key={item.id} onClick={() => setActiveMainTab(item.id as MainTab)} className="flex flex-col items-center gap-1.5 active:scale-90 outline-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-rose-600" : "text-gray-500")} />
            <span className={cn("text-[8px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
