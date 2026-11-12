
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
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn, slugify } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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

const TIME_SLOTS = [
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM",
  "08:00 PM", "08:15 PM", "08:30 PM", "09:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"
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

  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteOrderId, setNoteOrderId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

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

  const earnings = useMemo(() => {
    const fallback = { today: 0, thisWeek: 0, thisMonth: 0, totalDelivered: 0, totalCancelled: 0 };
    if (!rawOrders || !user) return fallback;

    let today = 0, week = 0, month = 0, totalDelivered = 0, totalCancelled = 0;
    const now = new Date();
    const dayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    rawOrders.forEach((o: any) => {
      const vId = String(user.uid).trim();
      const status = (o.status || '').toUpperCase();
      
      const vendorItems = (o.items || []).filter((it: any) => String(it.vendorId).trim() === vId);
      let vendorSubtotal = vendorItems.reduce((acc: number, it: any) => acc + (Number(it.price) * Number(it.quantity)), 0);
      
      if (vendorSubtotal === 0 && (String(o.vendorId || '').trim() === vId || (o.vendorIds && Array.isArray(o.vendorIds) && o.vendorIds.includes(vId)))) {
        vendorSubtotal = Number(o.total) || 0;
      }

      if (vendorSubtotal === 0) return;

      let orderDate = new Date();
      if (o.createdAt?.seconds) {
        orderDate = new Date(o.createdAt.seconds * 1000);
      } else if (typeof o.createdAt === 'string') {
        orderDate = new Date(o.createdAt);
      }

      if (status === 'DELIVERED') {
        totalDelivered += vendorSubtotal;
        if (isAfter(orderDate, todayStart)) today += vendorSubtotal;
        if (isAfter(orderDate, weekStart)) week += vendorSubtotal;
        if (isAfter(orderDate, monthStart)) month += vendorSubtotal;
      } else if (status === 'CANCELLED') {
        totalCancelled += vendorSubtotal;
      }
    });

    return { today, thisWeek: week, thisMonth: month, totalDelivered, totalCancelled };
  }, [rawOrders, user]);

  const filteredOrders = useMemo(() => {
    if (!rawOrders || !user) return [];
    const vId = String(user.uid).trim();
    
    const myOrders = rawOrders.filter((o: any) => {
      const isDirect = String(o.vendorId || '').trim() === vId;
      const isInArray = Array.isArray(o.vendorIds) && o.vendorIds.map((v:any) => String(v).trim()).includes(vId);
      const hasItem = Array.isArray(o.items) && o.items.some((it: any) => String(it.vendorId).trim() === vId);
      return isDirect || isInArray || hasItem;
    });
    
    if (orderFilter === 'DELIVERED') {
      return myOrders.filter((o: any) => (o.status || '').toLowerCase() === 'delivered');
    }
    if (orderFilter === 'CANCELLED') {
      return myOrders.filter((o: any) => (o.status || '').toLowerCase() === 'cancelled');
    }
    
    const activeStatuses = ['placed', 'accepted', 'preparing', 'ready for pickup', 'picked up', 'out for delivery', 'accepted task'];
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
      const vId = String(user?.uid).trim();
      const myItems = order.items?.filter((it: any) => String(it.vendorId).trim() === vId);
      const myTotal = myItems.reduce((acc: number, it: any) => acc + (it.price * it.quantity), 0);
      const itemsHtml = myItems.map((item: any) => `
        <div style="margin-bottom: 12px; border-bottom: 1px dashed #eee; padding-bottom: 5px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 900;">
            <span style="flex: 2;">${item.name} ${item.selectedOption ? `(${item.selectedOption.name})` : ''}</span>
            <span style="flex: 0.5; text-align: center;">X${item.quantity}</span>
            <span style="flex: 1; text-align: right;">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        </div>
      `).join('');
      receipt.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 900; font-style: italic;">${vendorProfile?.storeName}</h1>
          <p style="margin: 2px 0; font-size: 9px; font-weight: 900;">POWERED BY SHOPYKART</p>
          <p style="margin: 10px 0; font-size: 10px; font-weight: 900; border: 1px solid #000; padding: 5px;">ORDER #${order.customerOrderNumber}</p>
        </div>
        <div>${itemsHtml}</div>
        <div style="border-top: 2px solid #000; margin: 20px 0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 22px; font-weight: 900;">
          <span>TOTAL</span><span>₹${myTotal.toFixed(2)}</span>
        </div>
      `;
      document.body.appendChild(receipt);
      const blob = await toBlob(receipt, { pixelRatio: 2 }); 
      document.body.removeChild(receipt);
      if (blob && typeof saveAs === 'function') {
        saveAs(blob, `Bill_${order.customerOrderNumber}.png`);
        toast({ title: "Bill Saved!" });
      }
    } catch (err) { toast({ variant: "destructive", title: "Failed" }); }
    finally { setIsDownloading(null); }
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
        updatedAt: serverTimestamp()
      };
      await setDoc(productRef, pData, { merge: true });
      setIsManualAddOpen(false);
      setEditingId(null);
      setManualProduct({ name: '', price: '', category: '', description: '', imageUrl: '', isVarietyRequired: false, options: [] });
      toast({ title: editingId ? "Item Updated!" : "Item Added!" });
    } catch (err) { toast({ variant: "destructive", title: "Operation Failed" }); }
    finally { setIsProcessing(false); }
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
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[#EF4444] p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between aspect-square">
                    <div className="relative z-10"><span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Today</span><div className="text-2xl font-black italic mt-1">₹ {earnings.today.toFixed(0)}</div></div>
                    <Zap className="h-8 w-8 opacity-20 self-end" />
                 </div>
                 <div className="bg-blue-600 p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between aspect-square">
                    <div className="relative z-10"><span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Week</span><div className="text-2xl font-black italic mt-1">₹ {earnings.thisWeek.toFixed(0)}</div></div>
                    <TrendingUp className="h-8 w-8 opacity-20 self-end" />
                 </div>
                 <div className="bg-indigo-600 p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between aspect-square">
                    <div className="relative z-10"><span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Month</span><div className="text-2xl font-black italic mt-1">₹ {earnings.thisMonth.toFixed(0)}</div></div>
                    <Calendar className="h-8 w-8 opacity-20 self-end" />
                 </div>
                 <div className="bg-emerald-600 p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between aspect-square">
                    <div className="relative z-10"><span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Total</span><div className="text-2xl font-black italic mt-1">₹ {earnings.totalDelivered.toFixed(0)}</div></div>
                    <BarChart3 className="h-8 w-8 opacity-20 self-end" />
                 </div>
              </div>

              <div className="flex bg-white rounded-2xl p-1 shadow-sm border">
                {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-[#EF4444] text-white" : "text-gray-400")}>{f}</button>
                ))}
              </div>

              {filteredOrders.length > 0 ? filteredOrders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm mb-4">
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
                         <button onClick={() => generateReceipt(o)} disabled={isDownloading === o.id} className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100">{isDownloading === o.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}</button>
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

                   <div className="space-y-3 mb-6 bg-gray-50/50 p-5 rounded-3xl border border-dashed border-gray-200">
                      <div className="flex items-center gap-2 mb-2"><ShoppingBag className="h-4 w-4 text-gray-400" /><span className="text-[10px] font-black uppercase text-gray-500">Items</span></div>
                      {o.items?.filter((it:any) => String(it.vendorId).trim() === String(user?.uid).trim()).map((item:any, i:number) => (
                        <div key={i} className="flex justify-between items-center text-[11px] font-black uppercase italic">
                           <span><span className="text-primary">{item.quantity}x</span> {item.name}</span>
                           <span>₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                      {o.cookingInstructions && <div className="mt-3 pt-3 border-t border-gray-200"><p className="text-[10px] font-bold text-gray-800 italic uppercase">"{o.cookingInstructions}"</p></div>}
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
                 <h2 className="text-xl font-black italic uppercase">Menu</h2>
                 <button onClick={() => { setEditingId(null); setManualProduct({name:'',price:'',category:'',description:'',imageUrl:'',isVarietyRequired:false,options:[]}); setIsManualAddOpen(true); }} className="h-12 px-6 bg-primary text-white rounded-xl font-black uppercase italic text-xs shadow-lg">+ ADD NEW ITEM</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 {products?.filter(p => !p.isDeleted).map(p => (
                   <div key={p.id} className="bg-white p-4 rounded-[2rem] border border-border shadow-sm flex items-center gap-4 relative group">
                      <img src={p.imageUrl} className="h-20 w-20 rounded-2xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0 pr-10"><h4 className="font-black text-sm uppercase italic truncate">{p.name}</h4><p className="text-[10px] font-black text-primary">₹{p.price}</p></div>
                      <button onClick={async () => { if(confirm("Remove?")) await updateDoc(doc(firestore!, 'products', p.id), {isDeleted: true}); }} className="absolute top-4 right-4 h-8 w-8 text-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
                   </div>
                 ))}
              </div>
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

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-50 rounded-t-[2.5rem]">
        {[{id:'orders',label:'Queue',icon:ShoppingBag},{id:'catalog',label:'Menu',icon:Layers},{id:'coupons',label:'Offers',icon:Ticket},{id:'payouts',label:'Wallet',icon:Wallet2},{id:'account',label:'Profile',icon:UserCircle2}].map(item => (
          <button key={item.id} onClick={() => setActiveMainTab(item.id as MainTab)} className="flex flex-col items-center gap-1.5 active:scale-90 outline-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-primary" : "text-gray-50")} />
            <span className={cn("text-[8px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-50")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
