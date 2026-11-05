
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
  ListTree,
  X,
  Clock,
  Ticket,
  Percent,
  IndianRupee,
  Edit2,
  MessageSquare
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

type MainTab = 'orders' | 'catalog' | 'coupons' | 'payouts' | 'account';
type OrderFilter = 'NEW ORDERS' | 'DELIVERED' | 'CANCELLED';

const TIME_SLOTS = [
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM",
  "08:00 PM", "08:15 PM", "08:30 PM", "09:00 PM", "10:10 PM", "11:00 PM", "12:00 AM"
];

export default function VendorDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const manualImageInputRef = useRef<HTMLInputElement>(null);
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('NEW ORDERS');
  const [isMounted, setIsMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [isTimingModalOpen, setIsTimingModalOpen] = useState(false);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [manualProduct, setManualProduct] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    imageUrl: '',
    isVarietyRequired: false,
    options: [] as { name: string; price: number }[]
  });

  const [couponForm, setCouponForm] = useState({
    code: '',
    discountValue: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    minOrderValue: ''
  });

  const [upiForm, setUpiForm] = useState({
    upiId: '',
    accountNumber: '',
    ifscCode: '',
    accountHolderName: ''
  });

  const [timings, setTimings] = useState({
    openingTime: '10:00 AM',
    closingTime: '08:15 PM'
  });

  useEffect(() => { setIsMounted(true); }, []);

  // SESSION GUARD: Strictly patient logic to survive Firebase refresh cycles
  useEffect(() => {
    if (!isMounted || authLoading) return;
    
    const sessionActive = localStorage.getItem('shopykart_session_active') === 'true';
    
    if (!user && !sessionActive) {
      router.replace('/vendor/login');
    }
  }, [user, authLoading, router, isMounted]);

  const vendorRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'vendors', user.uid) : null, [firestore, user]);
  const { data: vendorProfile, loading: profileLoading } = useDoc<any>(vendorRef);

  useEffect(() => {
    if (vendorProfile) {
      setTimings({
        openingTime: vendorProfile.openingTime || '10:00 AM',
        closingTime: vendorProfile.closingTime || '08:15 PM'
      });
      setUpiForm({
        upiId: vendorProfile.upiId || '',
        accountNumber: vendorProfile.accountNumber || '',
        ifscCode: vendorProfile.ifscCode || '',
        accountHolderName: vendorProfile.accountHolderName || ''
      });
    }
  }, [vendorProfile]);

  const ordersQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'orders'), orderBy('createdAt', 'desc')) : null, [firestore, user]);
  const { data: rawOrders } = useCollection<any>(ordersQuery);

  const productsQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'products'), where('vendorId', '==', user.uid)) : null, [firestore, user]);
  const { data: products } = useCollection<any>(productsQuery);

  const couponsQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'coupons'), where('vendorId', '==', user.uid)) : null, [firestore, user]);
  const { data: coupons } = useCollection<any>(couponsQuery);

  const categoriesQuery = useMemoFirebase(() => (firestore) ? query(collection(firestore, 'categories')) : null, [firestore]);
  const { data: categories } = useCollection<any>(categoriesQuery);

  const pendingRequestsQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'payout_requests'), where('vendorId', '==', user.uid), where('status', '==', 'Pending')) : null, [firestore, user]);
  const { data: pendingRequests } = useCollection<any>(pendingRequestsQuery);

  const earnings = useMemo(() => {
    const fallback = { today: 0, thisWeek: 0, thisMonth: 0, totalDelivered: 0, totalCancelled: 0 };
    if (!rawOrders || !user) return fallback;

    let today = 0, week = 0, month = 0, totalDelivered = 0, totalCancelled = 0;
    const now = new Date();
    const dayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    rawOrders.forEach((o: any) => {
      const vId = String(user.uid);
      const isForMe = String(o.vendorId) === vId || (Array.isArray(o.vendorIds) && o.vendorIds.includes(vId));
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
    const myOrders = rawOrders.filter((o: any) => String(o.vendorId) === String(user.uid));
    if (orderFilter === 'DELIVERED') return myOrders.filter((o: any) => o.status === 'Delivered');
    if (orderFilter === 'CANCELLED') return myOrders.filter((o: any) => o.status === 'Cancelled');
    const activeStatuses = ['Placed', 'Accepted', 'Preparing', 'Ready for Pickup', 'Picked Up', 'Out for Delivery'];
    return myOrders.filter((o: any) => activeStatuses.includes(o.status));
  }, [rawOrders, user, orderFilter]);

  const handleManualImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result as string, 400, 400);
        setManualProduct(prev => ({ ...prev, imageUrl: compressed }));
      } catch (err) {
        toast({ variant: "destructive", title: "Image Error" });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddVariety = () => {
    setManualProduct(prev => ({
      ...prev,
      options: [...prev.options, { name: '', price: 0 }]
    }));
  };

  const updateVariety = (index: number, field: string, value: any) => {
    const newOptions = [...manualProduct.options];
    (newOptions[index] as any)[field] = field === 'price' ? parseFloat(value) || 0 : value;
    setManualProduct(prev => ({ ...prev, options: newOptions }));
  };

  const handleSaveTimings = async () => {
    if (!firestore || !user) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(firestore, 'vendors', user.uid), {
        openingTime: timings.openingTime,
        closingTime: timings.closingTime,
        updatedAt: serverTimestamp()
      });
      setIsTimingModalOpen(false);
      toast({ title: "Timings Updated! ⏰" });
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to save timings" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!firestore) return;
    try {
      const updateData: any = { status: newStatus, updatedAt: serverTimestamp() };
      if (newStatus === 'Ready for Pickup') updateData.pickupOTP = Math.floor(1000 + Math.random() * 9000).toString();
      await updateDoc(doc(firestore, 'orders', orderId), updateData);
      toast({ title: `Order ${newStatus}!` });
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); }
  };

  const handleEditProduct = (p: any) => {
    setEditingId(p.id);
    setManualProduct({
      name: p.name,
      price: p.price.toString(),
      category: p.category || '',
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      isVarietyRequired: p.isVarietyRequired || false,
      options: p.options || []
    });
    setIsManualAddOpen(true);
  };

  const handleManualAddProduct = async () => {
    if (!firestore || !user || !manualProduct.name || !manualProduct.price) return;
    setIsProcessing(true);
    try {
      const productRef = editingId ? doc(firestore, 'products', editingId) : doc(collection(firestore, 'products'));
      const pData = {
        ...manualProduct,
        id: productRef.id,
        price: parseFloat(manualProduct.price),
        vendorId: user.uid,
        restaurantName: vendorProfile?.storeName || 'Store',
        zoneId: vendorProfile?.zoneId || 'global',
        town: vendorProfile?.town || 'Local',
        isAvailable: true, 
        isVeg: true,
        isDeleted: false,
        slug: slugify(manualProduct.name),
        createdAt: editingId ? serverTimestamp() : serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await setDoc(productRef, pData, { merge: true });
      setIsManualAddOpen(false);
      setEditingId(null);
      setManualProduct({ name: '', price: '', category: '', description: '', imageUrl: '', isVarietyRequired: false, options: [] });
      toast({ title: editingId ? "Item Updated! ✅" : "Item Added! ✅" });
    } catch (err) { toast({ variant: "destructive", title: "Operation Failed" }); }
    finally { setIsProcessing(false); }
  };

  const handleCreateCoupon = async () => {
    if (!firestore || !user || !couponForm.code || !couponForm.discountValue) return;
    setIsProcessing(true);
    try {
      await addDoc(collection(firestore, 'coupons'), {
        code: couponForm.code.toUpperCase().trim(),
        discountValue: parseFloat(couponForm.discountValue),
        discountType: couponForm.discountType,
        minOrderValue: parseFloat(couponForm.minOrderValue) || 0,
        vendorId: user.uid,
        storeName: vendorProfile?.storeName || 'Store',
        createdAt: serverTimestamp()
      });
      setIsCouponModalOpen(false);
      setCouponForm({ code: '', discountValue: '', discountType: 'percentage', minOrderValue: '' });
      toast({ title: "Coupon Created! 🎫" });
    } catch (err) { toast({ variant: "destructive", title: "Failed" }); }
    finally { setIsProcessing(false); }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      localStorage.removeItem('shopykart_session_active');
      router.replace('/vendor/login');
    }
  };

  const isSessionActive = typeof window !== 'undefined' && localStorage.getItem('shopykart_session_active') === 'true';

  if (!isMounted || (authLoading && isSessionActive) || (profileLoading && !vendorProfile)) {
    return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative overflow-hidden">
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b shrink-0 z-50">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-rose-50 border border-rose-100 flex items-center justify-center text-primary">
              {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <Store className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-sm font-black italic uppercase leading-none">{vendorProfile?.storeName}</h1>
              <div className="flex items-center gap-1.5 mt-1"><div className={cn("h-1.5 w-1.5 rounded-full", vendorProfile?.isOnline !== false ? "bg-green-500 animate-pulse" : "bg-red-500")} /><p className="text-[8px] font-bold text-muted-foreground uppercase">{vendorProfile?.isOnline !== false ? 'Accepting' : 'Closed'}</p></div>
            </div>
         </div>
         <div className="flex items-center gap-2">
           <Switch checked={vendorProfile?.isOnline !== false} onCheckedChange={async (o) => { if(firestore && user) await updateDoc(doc(firestore, 'vendors', user.uid), { isOnline: o }); }} className="scale-75 data-[state=checked]:bg-green-500" />
           <button onClick={() => setActiveMainTab('account')} className="h-8 w-8 bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center active:scale-90 transition-transform"><Settings className="h-4 w-4" /></button>
         </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
         {activeMainTab === 'orders' && (
           <div className="p-4 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-[#EF4444] p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden flex items-center justify-between">
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
                  <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-[#EF4444] text-white" : "text-gray-400")}>{f}</button>
                ))}
              </div>

              {(orderFilter === 'DELIVERED' || orderFilter === 'CANCELLED') && (
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-white p-4 rounded-3xl border text-center"><span className="text-[7px] font-black text-gray-400 uppercase">Sales</span><div className="text-xl font-black text-green-600">₹{earnings.totalDelivered.toFixed(0)}</div></div>
                   <div className="bg-white p-4 rounded-3xl border text-center"><span className="text-[7px] font-black text-gray-400 uppercase">Loss</span><div className="text-xl font-black text-red-600">₹{earnings.totalCancelled.toFixed(0)}</div></div>
                </div>
              )}

              {filteredOrders.length > 0 ? filteredOrders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm mb-4">
                   <div className="flex justify-between items-start mb-4">
                      <div><span className="text-2xl font-black italic">#{o.customerOrderNumber}</span><p className="text-[8px] font-black text-gray-400 uppercase mt-1">{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'hh:mm a')}</p></div>
                      <Badge className={cn("border-none font-black text-[8px] uppercase", o.status === 'Cancelled' ? 'bg-red-50 text-red-600' : 'bg-primary/5 text-primary')}>{o.status}</Badge>
                   </div>
                   <div className="bg-muted/30 rounded-3xl p-5 mb-4 space-y-2">
                      <div className="flex items-center gap-2 border-b pb-2"><User className="h-3.5 w-3.5 text-primary" /><span className="text-xs font-black uppercase">{o.customerName}</span></div>
                      {o.items?.filter((it:any) => String(it.vendorId) === String(user?.uid)).map((item:any, i:number) => (
                        <div key={i} className="flex justify-between text-[11px] font-black uppercase italic"><span>{item.quantity}x {item.name} {item.selectedOption ? `(${item.selectedOption.name})` : ''}</span><span>₹{item.price * item.quantity}</span></div>
                      ))}
                      {o.cookingInstructions && (
                        <div className="mt-3 pt-3 border-t border-white/50 space-y-1">
                          <div className="flex items-center gap-1.5 text-primary">
                             <MessageSquare className="h-3 w-3" />
                             <span className="text-[8px] font-black uppercase tracking-widest">Kitchen Note</span>
                          </div>
                          <p className="text-[10px] font-bold text-gray-800 italic uppercase">"{o.cookingInstructions}"</p>
                        </div>
                      )}
                   </div>
                   <div className="flex flex-col gap-2">
                      {o.status === 'Placed' && <Button onClick={() => handleUpdateStatus(o.id, 'Accepted')} className="h-14 bg-green-600 text-white rounded-2xl font-black uppercase">ACCEPT ORDER</Button>}
                      {o.status === 'Accepted' && <Button onClick={() => handleUpdateStatus(o.id, 'Preparing')} className="h-14 bg-primary text-white rounded-2xl font-black uppercase">START PREPARING</Button>}
                      {o.status === 'Preparing' && <Button onClick={() => handleUpdateStatus(o.id, 'Ready for Pickup')} className="h-14 bg-black text-white rounded-2xl font-black uppercase">READY FOR PICKUP</Button>}
                   </div>
                </div>
              )) : <div className="text-center py-20 opacity-20"><ShoppingBag className="h-12 w-12 mx-auto mb-2" /><p className="font-black uppercase text-xs">No active orders</p></div>}
           </div>
         )}

         {activeMainTab === 'catalog' && (
           <div className="p-4 space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xl font-black italic uppercase">Menu</h2>
                 <button onClick={() => { setEditingId(null); setManualProduct({name:'',price:'',category:'',description:'',imageUrl:'',isVarietyRequired:false,options:[]}); setIsManualAddOpen(true); }} className="h-12 px-6 bg-primary text-white rounded-xl font-black uppercase italic text-xs shadow-lg active:scale-90 flex items-center gap-2"><Plus className="h-5 w-5" /> ADD NEW ITEM</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 {products?.filter(p => !p.isDeleted).map(p => (
                   <div key={p.id} className="bg-white p-4 rounded-[2rem] border border-border shadow-sm flex items-center gap-4 relative group">
                      <img src={p.imageUrl} className="h-20 w-20 rounded-2xl object-cover shrink-0" alt="" />
                      <div className="flex-1 min-w-0 pr-10">
                         <h4 className="font-black text-sm uppercase italic truncate">{p.name}</h4>
                         <p className="text-[10px] font-black text-primary">₹{p.price}</p>
                         <div className="flex items-center gap-4 mt-2">
                           <div className="flex items-center gap-1.5">
                             <Switch checked={p.isAvailable !== false} onCheckedChange={() => updateDoc(doc(firestore!, 'products', p.id), { isAvailable: !p.isAvailable })} className="scale-75 data-[state=checked]:bg-primary" />
                             <span className="text-[8px] font-black uppercase text-muted-foreground">{p.isAvailable !== false ? 'Available' : 'Unavailable'}</span>
                           </div>
                           <button onClick={() => handleEditProduct(p)} className="h-8 w-8 bg-gray-50 rounded-lg flex items-center justify-center text-blue-600 border border-blue-50 active:scale-90 transition-transform"><Edit2 className="h-3.5 w-3.5" /></button>
                         </div>
                      </div>
                      <button onClick={async () => { if(confirm("Remove?")) await updateDoc(doc(firestore!, 'products', p.id), {isDeleted: true}); }} className="absolute top-4 right-4 h-8 w-8 text-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
                   </div>
                 ))}
              </div>
           </div>
         )}

         {activeMainTab === 'coupons' && (
           <div className="p-4 space-y-6">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xl font-black italic uppercase">My Offers</h2>
                 <button onClick={() => setIsCouponModalOpen(true)} className="h-12 px-6 bg-green-600 text-white rounded-xl font-black uppercase italic text-xs shadow-lg active:scale-90 flex items-center gap-2"><Plus className="h-5 w-5" /> CREATE COUPON</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 {coupons?.map((c: any) => (
                   <div key={c.id} className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-green-200 shadow-sm flex items-center justify-between group relative overflow-hidden">
                      <div className="flex items-center gap-4 relative z-10">
                         <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100 shrink-0">
                            <Ticket className="h-6 w-6" />
                         </div>
                         <div>
                            <h4 className="font-black text-base text-gray-900 uppercase tracking-widest">{c.code}</h4>
                            <p className="text-[10px] font-bold text-green-600 uppercase">
                              {c.discountValue}{c.discountType === 'percentage' ? '%' : '₹'} OFF • Min ₹{c.minOrderValue || 0}
                            </p>
                         </div>
                      </div>
                      <button onClick={async () => { if(confirm("Delete Coupon?")) await deleteDoc(doc(firestore!, 'coupons', c.id)); }} className="h-10 w-10 text-red-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all bg-red-50"><Trash2 className="h-4 w-4" /></button>
                   </div>
                 ))}
              </div>
           </div>
         )}

         {activeMainTab === 'payouts' && (
           <div className="p-4 space-y-6">
              <h2 className="text-xl font-black italic uppercase ml-2">Wallet</h2>
              <div className="bg-[#EF4444] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[180px]">
                 <div className="relative z-10 space-y-1"><span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Payout Due</span><div className="text-5xl font-black italic">₹ {vendorProfile?.walletBalance?.toFixed(2) || '0.00'}</div></div>
                 <div className="relative z-10 flex justify-end mt-4">
                    <button onClick={() => { if(!vendorProfile.upiId) setIsUpiModalOpen(true); else if((vendorProfile.walletBalance||0)>0) setIsProcessing(true); }} disabled={isProcessing || (vendorProfile?.walletBalance || 0) <= 0} className="bg-white text-primary rounded-xl h-10 px-6 font-black uppercase text-[10px] italic">Withdraw</button>
                 </div>
                 <Wallet2 className="absolute bottom-4 right-4 h-24 w-24 text-white opacity-10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-5 rounded-[2rem] border border-blue-100 shadow-sm flex flex-col gap-2"><ArrowDownLeft className="h-4 w-4 text-blue-500" /><div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Cash in Hand</span><h4 className="text-lg font-black italic">₹ 0.00</h4></div></div>
                 <div className="bg-white p-5 rounded-[2rem] border border-amber-100 shadow-sm flex flex-col gap-2"><Timer className="h-4 w-4 text-amber-500" /><div><span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Settling</span><h4 className="text-lg font-black italic">₹ {pendingRequests?.reduce((s:any,r:any)=>s+r.amount, 0).toFixed(0) || '0.00'}</h4></div></div>
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
                  <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-5">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4"><div className="bg-primary/5 p-2 rounded-xl text-primary"><Clock className="h-5 w-5" /></div><div><span className="text-[10px] font-black text-gray-400 uppercase">Hub Timings</span><span className="text-sm font-black uppercase italic text-gray-800 block">{vendorProfile?.openingTime} - {vendorProfile?.closingTime}</span></div></div>
                        <button onClick={() => setIsTimingModalOpen(true)} className="text-[10px] font-black text-primary uppercase">EDIT</button>
                     </div>
                     <div className="flex items-center gap-4"><div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Globe className="h-5 w-5" /></div><div><span className="text-[10px] font-black text-gray-400 uppercase">Region</span><span className="text-sm font-black uppercase italic text-gray-800 block">{vendorProfile?.town}</span></div></div>
                     <div className="flex items-center gap-4"><div className="bg-green-50 p-2 rounded-xl text-green-600"><Phone className="h-5 w-5" /></div><div><span className="text-[10px] font-black uppercase text-gray-800 block">{vendorProfile?.phone}</span></div></div>
                  </div>
                  <button onClick={handleLogout} className="w-full h-18 bg-white border border-red-50 text-red-500 rounded-[2.2rem] flex items-center justify-center gap-3 font-black uppercase italic text-sm shadow-sm active:scale-95 transition-all"><LogOut className="h-5 w-5" /> DISCONNECT ACCOUNT</button>
               </div>
            </div>
         )}

         <Dialog open={isManualAddOpen} onOpenChange={setIsManualAddOpen}>
           <DialogContent className="rounded-[2.5rem] max-w-md p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none flex flex-col max-h-[90vh]">
              <DialogHeader className="p-8 pb-4"><DialogTitle className="font-black italic uppercase text-center text-xl">{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle></DialogHeader>
              <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-0 space-y-6">
                 <div onClick={() => manualImageInputRef.current?.click()} className="h-32 border-2 border-dashed rounded-2xl flex items-center justify-center bg-muted/20 cursor-pointer overflow-hidden">{manualProduct.imageUrl ? <img src={manualProduct.imageUrl} className="h-full w-full object-cover" /> : <ImageIcon className="opacity-20" />}</div>
                 <input type="file" ref={manualImageInputRef} className="hidden" onChange={handleManualImageSelect} />
                 
                 <div className="space-y-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Item Name</label>
                       <Input placeholder="ITEM NAME" value={manualProduct.name} onChange={e => setManualProduct({...manualProduct, name: e.target.value.toUpperCase()})} className="h-12 rounded-xl border-none bg-muted/20 font-bold" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Base Price ₹</label>
                          <Input type="number" value={manualProduct.price} onChange={e => setManualProduct({...manualProduct, price: e.target.value})} placeholder="0.00" className="h-12 rounded-xl font-black text-lg bg-muted/20 border-none" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Category</label>
                          <Select value={manualProduct.category} onValueChange={v => setManualProduct({...manualProduct, category: v})}>
                             <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold"><SelectValue placeholder="Select" /></SelectTrigger>
                             <SelectContent className="rounded-2xl max-h-[300px]">
                                {categories?.map(c => <SelectItem key={c.id} value={c.name.toLowerCase()} className="font-bold py-3 uppercase text-xs">{c.name}</SelectItem>)}
                             </SelectContent>
                          </Select>
                       </div>
                    </div>

                    <div className="space-y-4 p-5 bg-gray-50 rounded-[1.5rem] border-2 border-dashed">
                       <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                             <span className="text-[10px] font-black uppercase text-gray-500">Varieties / Sizes</span>
                             <div className="flex items-center gap-2 mt-1">
                                <span className="text-[8px] font-bold text-muted-foreground">Is Selection Required?</span>
                                <Switch checked={manualProduct.isVarietyRequired} onCheckedChange={(v) => setManualProduct({...manualProduct, isVarietyRequired: v})} className="scale-75 data-[state=checked]:bg-primary" />
                             </div>
                          </div>
                          <button onClick={handleAddVariety} className="text-[10px] font-black text-primary uppercase bg-white px-3 py-1 rounded-lg border shadow-sm">+ ADD</button>
                       </div>
                       <div className="space-y-3">
                          {manualProduct.options.map((opt, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                               <Input placeholder="NAME" value={opt.name} onChange={e => updateVariety(idx, 'name', e.target.value.toUpperCase())} className="h-10 rounded-lg bg-white border-none text-[10px] font-bold flex-1" />
                               <Input type="number" placeholder="₹" value={opt.price} onChange={e => updateVariety(idx, 'price', e.target.value)} className="h-10 w-20 rounded-lg bg-white border-none text-[10px] font-black text-center" />
                               <button onClick={() => setManualProduct(prev => ({...prev, options: prev.options.filter((_, i) => i !== idx)}))} className="text-red-500 p-1"><X className="h-4 w-4" /></button>
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
                 <Button onClick={handleManualAddProduct} disabled={isProcessing || !manualProduct.name} className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl">
                   {isProcessing ? <Loader2 className="animate-spin" /> : editingId ? "UPDATE ITEM" : "PUBLISH ITEM"}
                 </Button>
              </div>
           </DialogContent>
         </Dialog>

         <Dialog open={isCouponModalOpen} onOpenChange={setIsCouponModalOpen}>
           <DialogContent className="rounded-[2.5rem] max-w-md p-8 border-none shadow-2xl bg-white focus:outline-none">
              <DialogHeader><DialogTitle className="font-black italic uppercase text-center text-xl">Create Promo Code</DialogTitle></DialogHeader>
              <div className="space-y-6 pt-6">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Coupon Code</label>
                    <Input placeholder="E.G. PIZZA20" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase().replace(/\s/g,'')})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xl italic" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Discount Mode</label>
                       <Select value={couponForm.discountType} onValueChange={(v: any) => setCouponForm({...couponForm, discountType: v})}>
                          <SelectTrigger className="h-14 rounded-2xl bg-gray-50 border-none font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-2xl">
                             <SelectItem value="percentage" className="font-bold py-3 uppercase italic text-xs">Percent (%)</SelectItem>
                             <SelectItem value="fixed" className="font-bold py-3 uppercase italic text-xs">Rupees (₹)</SelectItem>
                          </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Value</label>
                       <div className="relative">
                          {couponForm.discountType === 'percentage' ? <Percent className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" /> : <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600" />}
                          <Input type="number" placeholder="0" value={couponForm.discountValue} onChange={e => setCouponForm({...couponForm, discountValue: e.target.value})} className="h-14 pl-12 rounded-2xl bg-gray-50 border-none font-black text-xl text-green-600" />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Min. Order Value (₹)</label>
                    <Input type="number" placeholder="299" value={couponForm.minOrderValue} onChange={e => setCouponForm({...couponForm, minOrderValue: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
                 </div>

                 <Button onClick={handleCreateCoupon} disabled={isProcessing || !couponForm.code || !couponForm.discountValue} className="w-full h-18 bg-green-600 text-white rounded-[1.5rem] font-black uppercase italic shadow-xl">
                   {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : "ACTIVATE COUPON"}
                 </Button>
              </div>
           </DialogContent>
         </Dialog>

         <Dialog open={isUpiModalOpen} onOpenChange={setIsUpiModalOpen}>
           <DialogContent className="rounded-[2.5rem] max-w-md p-8 bg-white border-none shadow-2xl">
              <DialogHeader><DialogTitle className="font-black italic uppercase text-center text-xl">Withdraw Settings</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                 <div className="space-y-1"><label className="text-[10px] font-black uppercase text-primary">UPI ID</label><Input value={upiForm.upiId} onChange={e => setUpiForm({...upiForm, upiId: e.target.value.toLowerCase()})} placeholder="store@upi" className="h-14 rounded-2xl bg-gray-50 border-none font-bold" /></div>
                 <Button onClick={async () => { if(!firestore||!user) return; setIsProcessing(true); await updateDoc(doc(firestore, 'vendors', user.uid), {...upiForm}); setIsUpiModalOpen(false); toast({title:"Updated"}); setIsProcessing(false); }} disabled={isProcessing || !upiForm.upiId} className="w-full h-16 bg-primary text-white rounded-[1.5rem] font-black uppercase italic shadow-xl">SAVE SETTINGS</Button>
              </div>
           </DialogContent>
         </Dialog>

         <Dialog open={isTimingModalOpen} onOpenChange={setIsTimingModalOpen}>
           <DialogContent className="rounded-[2.5rem] max-w-md p-8 bg-white border-none shadow-2xl">
              <DialogHeader><DialogTitle className="font-black italic uppercase text-center text-xl">Hub Timing Settings</DialogTitle></DialogHeader>
              <div className="space-y-6 pt-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Opening Time</label>
                       <Select value={timings.openingTime} onValueChange={(val) => setTimings({...timings, openingTime: val})}>
                          <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-2xl">{TIME_SLOTS.map(t => <SelectItem key={t} value={t} className="font-bold text-xs">{t}</SelectItem>)}</SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Closing Time</label>
                       <Select value={timings.closingTime} onValueChange={(val) => setTimings({...timings, closingTime: val})}>
                          <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-2xl">{TIME_SLOTS.map(t => <SelectItem key={t} value={t} className="font-bold text-xs">{t}</SelectItem>)}</SelectContent>
                       </Select>
                    </div>
                 </div>
                 <p className="text-[8px] font-bold text-center text-muted-foreground uppercase">Orders will only be accepted within this window.</p>
                 <Button onClick={handleSaveTimings} disabled={isProcessing} className="w-full h-16 bg-black text-white rounded-[1.5rem] font-black uppercase italic shadow-xl">SAVE TIMINGS</Button>
              </div>
           </DialogContent>
         </Dialog>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-50 rounded-t-[2.5rem]">
        {[{id:'orders',label:'Queue',icon:ShoppingBag},{id:'catalog',label:'Menu',icon:Layers},{id:'coupons',label:'Offers',icon:Ticket},{id:'payouts',label:'Wallet',icon:Wallet2},{id:'account',label:'Profile',icon:UserCircle2}].map(item => (
          <button key={item.id} onClick={() => setActiveMainTab(item.id as MainTab)} className="flex flex-col items-center gap-1.5 active:scale-90 outline-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-primary" : "text-gray-50")} />
            <span className={cn("text-[8px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
