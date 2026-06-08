"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  LogOut,
  Utensils,
  LayoutDashboard,
  Layers,
  CircleDollarSign,
  UserCircle2,
  Edit,
  ImageIcon,
  BellRing,
  Clock,
  Camera,
  History,
  Wallet,
  Store,
  XCircle,
  X,
  Loader2,
  ListPlus,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { compressImage } from '@/lib/image-utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

type MainTab = 'orders' | 'catalog' | 'payouts' | 'account';
type OrderFilter = 'NEW ORDERS' | 'DELIVERED' | 'CANCELLED';

export default function VendorDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('NEW ORDERS');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showOrderAlarm, setShowOrderAlarm] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    mrp: '',
    price: '', 
    description: '', 
    category: '', 
    imageUrl: '', 
    isVeg: true, 
    mfgDate: '',
    expiryDate: '',
    options: [] as { name: string; price: number }[]
  });

  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile } = useDoc<any>(vendorRef);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: globalCategories } = useCollection<any>(categoriesQuery);

  // REDIRECT PROTECTION
  useEffect(() => {
    if (!authLoading && isMounted && !user) {
        const hasSessionFlag = localStorage.getItem('shopykart_session_active');
        if (!hasSessionFlag) router.push('/vendor/login');
    }
  }, [user, authLoading, router, isMounted]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'orders'), where('vendorId', '==', user.uid));
  }, [firestore, user]);
  
  const { data: rawOrders } = useCollection<any>(ordersQuery);

  const orders = useMemo(() => {
    if (!rawOrders) return [];
    return [...rawOrders].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [rawOrders]);

  const pendingOrders = useMemo(() => orders?.filter(o => o.status === 'Placed') || [], [orders]);

  useEffect(() => {
    if (pendingOrders.length > 0 && isMounted) {
      setShowOrderAlarm(true);
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(() => {});
    } else {
      setShowOrderAlarm(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, [pendingOrders, isMounted]);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'vendors', user.uid, 'products');
  }, [firestore, user]);
  const { data: products } = useCollection<any>(productsQuery);

  const payoutsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'vendors', user.uid, 'payout_history'), orderBy('date', 'desc'));
  }, [firestore, user]);
  const { data: payoutHistory } = useCollection<any>(payoutsQuery);

  const resetForm = () => {
    setEditingId(null);
    setNewProduct({ name: '', mrp: '', price: '', description: '', category: '', imageUrl: '', isVeg: true, mfgDate: '', expiryDate: '', options: [] });
  };

  const handleAddProduct = async () => {
    if (!firestore || !user || !vendorProfile) return;
    if (!newProduct.name || !newProduct.price || !newProduct.imageUrl || !newProduct.category) {
      toast({ variant: "destructive", title: "Missing Info" });
      return;
    }
    setIsSubmitting(true);
    const targetId = editingId || doc(collection(firestore, 'products')).id;
    const productData = {
      id: targetId,
      name: newProduct.name.trim(),
      mrp: parseFloat(newProduct.mrp) || parseFloat(newProduct.price),
      price: parseFloat(newProduct.price),
      description: newProduct.description,
      category: newProduct.category.toLowerCase().trim() || 'general',
      serviceMode: 'Food',
      isVeg: newProduct.isVeg,
      isAvailable: true,
      mfgDate: newProduct.mfgDate || null,
      expiryDate: newProduct.expiryDate || null,
      options: newProduct.options.filter(o => o.name.trim() !== ''),
      vendorId: user.uid,
      zoneId: vendorProfile.zoneId || null,
      town: vendorProfile.town || 'Local',
      restaurantName: vendorProfile.storeName,
      imageUrl: newProduct.imageUrl,
      updatedAt: serverTimestamp(),
      createdAt: editingId ? (products?.find(p => p.id === editingId)?.createdAt || serverTimestamp()) : serverTimestamp()
    };
    try {
      await setDoc(doc(firestore, 'products', targetId), productData, { merge: true });
      await setDoc(doc(firestore, 'vendors', user.uid, 'products', targetId), productData, { merge: true });
      setIsAddOpen(false);
      resetForm();
      toast({ title: "Product Synced!" });
    } catch (e) { toast({ variant: "destructive", title: "Error Saving" }); }
    finally { setIsSubmitting(false); }
  };

  const toggleProductAvailability = async (productId: string, vendorId: string, available: boolean) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'products', productId), { isAvailable: available, updatedAt: serverTimestamp() });
      await updateDoc(doc(firestore, 'vendors', vendorId, 'products', productId), { isAvailable: available, updatedAt: serverTimestamp() });
      toast({ title: available ? "Live" : "Hidden" });
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'orders', orderId), { status, updatedAt: serverTimestamp() });
      toast({ title: `Order ${status}` });
      if (status === 'Accepted') setShowOrderAlarm(false);
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const toggleVendorStatus = async (online: boolean) => {
    if (!firestore || !user) return;
    try {
      await updateDoc(doc(firestore, 'vendors', user.uid), { isOnline: online, updatedAt: serverTimestamp() });
      toast({ title: online ? "Store Opened" : "Store Closed" });
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative">
      <Dialog open={showOrderAlarm} onOpenChange={setShowOrderAlarm}>
        <DialogContent className="rounded-[3rem] max-w-sm bg-[#0B0B0B] text-center border-primary/40 p-10 shadow-[0_0_80px_rgba(239,68,68,0.4)]">
          <DialogHeader className="sr-only"><DialogTitle>Order Alarm</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping" />
              <div className="relative bg-primary h-24 w-24 rounded-full flex items-center justify-center shadow-2xl">
                 <BellRing className="h-12 w-12 text-white animate-bounce" />
              </div>
            </div>
            <h2 className="text-4xl font-black italic uppercase text-white leading-none tracking-tighter">ORDER<br />PLACED!</h2>
            <Button onClick={() => { if (pendingOrders[0]) updateOrderStatus(pendingOrders[0].id, 'Accepted'); }} className="w-full h-18 py-8 bg-white text-black hover:bg-gray-100 rounded-3xl font-black italic text-xl shadow-2xl active:scale-95">ACCEPT NOW</Button>
          </div>
        </DialogContent>
      </Dialog>

      <header className="bg-white px-4 py-4 flex items-center justify-between border-b sticky top-0 z-50">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted border border-border/50">
              {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <Utensils className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-sm font-black italic uppercase">{vendorProfile?.storeName || 'Business Portal'}</h1>
              <div className="flex items-center gap-1.5">
                 <div className={cn("h-1.5 w-1.5 rounded-full", vendorProfile?.isOnline !== false ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                 <p className="text-[8px] font-bold text-muted-foreground uppercase">{vendorProfile?.isOnline !== false ? 'Accepting' : 'Closed'}</p>
              </div>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <Switch checked={vendorProfile?.isOnline !== false} onCheckedChange={toggleVendorStatus} className="scale-75 data-[state=checked]:bg-green-500" />
            <Button variant="ghost" onClick={() => { localStorage.removeItem('shopykart_session_active'); signOut(auth!); }} className="text-red-500 h-10 w-10 p-0 rounded-xl bg-red-50"><LogOut className="h-4 w-4" /></Button>
         </div>
      </header>

      <main className="flex-1 pb-32 overflow-y-auto no-scrollbar">
         {activeMainTab === 'orders' ? (
           <div className="p-4 space-y-4 animate-in fade-in duration-500">
              <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-4 border border-border/50">
                {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-black text-white" : "text-gray-400")}>{f}</button>
                ))}
              </div>
              {orders?.filter(o => {
                if(orderFilter === 'NEW ORDERS') return !['Delivered', 'Cancelled'].includes(o.status);
                if(orderFilter === 'CANCELLED') return o.status === 'Cancelled';
                return o.status === 'Delivered';
              }).map(o => (
                <div key={o.id} className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm relative overflow-hidden group">
                   <div className="flex justify-between items-center mb-4">
                      <div><span className="text-lg font-black italic tracking-tighter">#{o.orderDisplayId || o.id.slice(-4)}</span><div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase mt-0.5"><Clock className="h-2.5 w-2.5" />{isMounted && o.createdAt?.seconds ? format(new Date(o.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Just now'}</div></div>
                      <Badge className={cn("border-none text-[8px] font-black rounded-full px-2.5 py-1 uppercase", o.status === 'Cancelled' ? "bg-red-50 text-red-600" : o.status === 'Delivered' ? "bg-green-50 text-green-600" : "bg-primary/10 text-primary")}>{o.status}</Badge>
                   </div>
                   <div className="bg-muted/30 rounded-2xl p-4 mb-4 space-y-2 border border-border/20">
                      {o.items?.map((item:any, i:number) => (<div key={i} className="flex justify-between items-center text-xs font-bold"><span className="text-gray-700">{item.quantity}x {item.name}</span><span className="text-primary">₹{(item.price * item.quantity).toFixed(2)}</span></div>))}
                   </div>
                   {orderFilter === 'NEW ORDERS' && (
                     <div className="flex gap-2">
                        {o.status === 'Placed' && <Button onClick={() => updateOrderStatus(o.id, 'Accepted')} className="flex-1 bg-black h-12 rounded-2xl font-black uppercase text-xs">Accept Order</Button>}
                        {o.status === 'Accepted' && <Button onClick={() => updateOrderStatus(o.id, 'Preparing')} className="flex-1 bg-primary h-12 rounded-2xl font-black uppercase text-xs">Start Cooking</Button>}
                        {o.status === 'Preparing' && <Button onClick={() => updateOrderStatus(o.id, 'Ready for Pickup')} className="flex-1 bg-green-600 h-12 rounded-2xl font-black uppercase text-xs">Ready for Pickup</Button>}
                        {['Placed', 'Accepted'].includes(o.status) && <Button variant="ghost" onClick={() => { if(confirm("Cancel?")) updateOrderStatus(o.id, 'Cancelled'); }} className="h-12 w-12 rounded-2xl bg-red-50 text-red-500"><XCircle className="h-5 w-5" /></Button>}
                     </div>
                   )}
                </div>
              ))}
           </div>
         ) : activeMainTab === 'catalog' ? (
           <div className="p-4 space-y-4 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-black italic uppercase">Inventory</h2>
                 <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if(!val) resetForm(); }}>
                    <DialogTrigger asChild><Button className="bg-black rounded-xl h-10 font-black uppercase text-[9px] tracking-widest"><Plus className="mr-1 h-3.5 w-3.5" /> ADD ITEM</Button></DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar">
                       <DialogHeader><DialogTitle className="font-black italic uppercase text-center">Dish Editor</DialogTitle></DialogHeader>
                       <div className="space-y-4 pt-4">
                          <div onClick={() => fileInputRef.current?.click()} className="h-40 border-2 border-dashed border-border rounded-2xl flex items-center justify-center bg-muted/20 cursor-pointer overflow-hidden">
                             {newProduct.imageUrl ? <img src={newProduct.imageUrl} className="h-full w-full object-cover" alt="" /> : <ImageIcon className="h-8 w-8 opacity-20" />}
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = async () => setNewProduct({...newProduct, imageUrl: await compressImage(r.result as string, 800, 800)}); r.readAsDataURL(f); } }} />
                          <Input placeholder="Dish name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="h-12 rounded-xl font-bold" />
                          <div className="grid grid-cols-2 gap-3">
                             <Input placeholder="MRP" type="number" value={newProduct.mrp} onChange={e => setMrp(e.target.value)} className="h-12 rounded-xl" />
                             <Input placeholder="Selling Price" type="number" value={newProduct.price} onChange={e => setPrice(e.target.value)} className="h-12 rounded-xl border-primary/30 font-bold" />
                          </div>
                          <Select value={newProduct.category} onValueChange={(val) => setNewProduct({...newProduct, category: val})}>
                               <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold"><SelectValue placeholder="Category" /></SelectTrigger>
                               <SelectContent className="rounded-2xl">{globalCategories?.map((cat: any) => (<SelectItem key={cat.id} value={cat.name.toLowerCase()}>{cat.name}</SelectItem>))}</SelectContent>
                          </Select>
                          <Button onClick={handleAddProduct} disabled={isSubmitting} className="w-full h-16 bg-primary rounded-[1.5rem] font-black uppercase italic shadow-xl">{isSubmitting ? 'Saving...' : 'Sync Item'}</Button>
                       </div>
                    </DialogContent>
                 </Dialog>
              </div>
              <div className="grid grid-cols-1 gap-3">
                 {products?.map(p => (
                   <div key={p.id} className={cn("bg-white p-4 rounded-[1.5rem] border border-border/50 flex items-center justify-between shadow-sm", p.isAvailable === false && "opacity-60")}>
                      <div className="flex items-center gap-4">
                        <img src={p.imageUrl} className="h-14 w-14 rounded-xl object-cover bg-muted" alt="" />
                        <div>
                          <h4 className="font-black text-sm uppercase italic truncate max-w-[120px]">{p.name}</h4>
                          <div className="flex items-center gap-2">
                             <p className="text-primary font-black text-xs">₹{p.price}</p>
                             <Switch checked={p.isAvailable !== false} onCheckedChange={(val) => toggleProductAvailability(p.id, p.vendorId, val)} className="scale-50" />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => { setEditingId(p.id); setNewProduct({ name: p.name, mrp: (p.mrp || p.price).toString(), price: p.price.toString(), description: p.description || '', category: p.category, imageUrl: p.imageUrl, isVeg: p.isVeg !== false, mfgDate: p.mfgDate || '', expiryDate: p.expiryDate || '', options: p.options || [] }); setIsAddOpen(true); }} size="icon" variant="ghost" className="h-9 w-9 bg-blue-50 text-blue-600 rounded-xl"><Edit className="h-4 w-4" /></Button>
                        <Button onClick={() => { if(confirm("Delete?")) { deleteDoc(doc(firestore!, 'products', p.id)); deleteDoc(doc(firestore!, 'vendors', user!.uid, 'products', p.id)); } }} size="icon" variant="ghost" className="h-9 w-9 bg-red-50 text-red-600 rounded-xl"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
         ) : activeMainTab === 'payouts' ? (
           <div className="p-4 space-y-6 animate-in fade-in duration-500">
              <div className="bg-[#0B0B0B] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                 <div className="relative z-10">
                    <span className="text-[10px] font-black uppercase text-gray-500">Earnings</span>
                    <h3 className="text-5xl font-black italic tracking-tighter">₹{vendorProfile?.walletBalance?.toFixed(2) || '0.00'}</h3>
                 </div>
              </div>
              <div className="space-y-3">
                 {payoutHistory?.map((p: any) => (<div key={p.id} className="bg-white p-4 rounded-2xl border border-border/50 flex items-center justify-between"><div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-black">₹</div><div><h4 className="font-black text-sm italic">+ ₹{p.amount}</h4><p className="text-[9px] font-bold text-muted-foreground uppercase">{p.note || 'Settlement'}</p></div></div><Badge className="bg-green-100 text-green-700 border-none text-[8px] font-black uppercase">Paid</Badge></div>))}
              </div>
           </div>
         ) : (
           <div className="p-4 space-y-6 animate-in fade-in duration-500">
              <div className="bg-white p-6 rounded-[2.5rem] border border-border/50 text-center">
                 <div className="relative mx-auto w-24 h-24 mb-4"><img src={vendorProfile?.imageUrl} className="h-full w-full object-cover rounded-[2rem] border-4 border-white shadow-xl bg-muted" alt="" /><div className="absolute -bottom-1 -right-1 bg-primary p-2 rounded-xl text-white shadow-lg"><Camera className="h-3 w-3" /></div></div>
                 <h2 className="text-2xl font-black italic uppercase">{vendorProfile?.storeName || 'Portal'}</h2>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase">{vendorProfile?.category} • {vendorProfile?.town}</p>
              </div>
              <Button onClick={() => { localStorage.removeItem('shopykart_session_active'); signOut(auth!); }} className="w-full h-14 bg-red-50 text-red-500 rounded-2xl font-black uppercase italic text-xs">EXIT PORTAL</Button>
           </div>
         )}
      </main>

      <nav className="fixed bottom-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-50 rounded-t-[2.5rem] shadow-2xl">
        {[
          {id:'orders',label:'Orders',icon:LayoutDashboard},
          {id:'catalog',label:'Inventory',icon:Layers},
          {id:'payouts',label:'Payouts',icon:CircleDollarSign},
          {id:'account',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => setActiveMainTab(item.id as MainTab)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-primary scale-110" : "text-gray-500")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}