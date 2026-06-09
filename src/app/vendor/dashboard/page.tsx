
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
  FileText,
  CheckCircle2
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
    setNewProduct({ 
      name: '', 
      mrp: '', 
      price: '', 
      description: '', 
      category: '', 
      imageUrl: '', 
      isVeg: true, 
      mfgDate: '', 
      expiryDate: '', 
      options: [] 
    });
  };

  const handleAddOption = () => {
    setNewProduct({
      ...newProduct,
      options: [...newProduct.options, { name: '', price: 0 }]
    });
  };

  const handleRemoveOption = (index: number) => {
    const updated = [...newProduct.options];
    updated.splice(index, 1);
    setNewProduct({ ...newProduct, options: updated });
  };

  const handleUpdateOption = (index: number, field: 'name' | 'price', value: string) => {
    const updated = [...newProduct.options];
    if (field === 'price') {
      updated[index].price = parseFloat(value) || 0;
    } else {
      updated[index].name = value;
    }
    setNewProduct({ ...newProduct, options: updated });
  };

  const handleAddProduct = async () => {
    if (!firestore || !user || !vendorProfile) return;
    if (!newProduct.name || !newProduct.price || !newProduct.imageUrl || !newProduct.category) {
      toast({ variant: "destructive", title: "Missing Info", description: "Name, Price, Category and Image are mandatory." });
      return;
    }
    setIsSubmitting(true);
    const targetId = editingId || doc(collection(firestore, 'products')).id;
    const productData = {
      id: targetId,
      name: newProduct.name.trim(),
      mrp: parseFloat(newProduct.mrp) || parseFloat(newProduct.price),
      price: parseFloat(newProduct.price),
      description: newProduct.description.trim() || '',
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
      toast({ title: "Product Synced!", description: "Changes are now live on the app." });
    } catch (e) { 
      toast({ variant: "destructive", title: "Error Saving" }); 
    } finally { 
      setIsSubmitting(false); 
    }
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
            <Button onClick={() => { if (pendingOrders[0]) updateOrderStatus(pendingOrders[0].id, 'Accepted'); }} className="w-full h-18 py-8 bg-white text-black hover:bg-gray-100 rounded-3xl font-black italic text-xl shadow-2xl active:scale-95 transition-all">ACCEPT NOW</Button>
          </div>
        </DialogContent>
      </Dialog>

      <header className="bg-white px-4 py-4 flex items-center justify-between border-b sticky top-0 z-50">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted border border-border/50">
              {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <Utensils className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-sm font-black italic uppercase leading-none">{vendorProfile?.storeName || 'Business Portal'}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                 <div className={cn("h-1.5 w-1.5 rounded-full", vendorProfile?.isOnline !== false ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                 <p className="text-[8px] font-bold text-muted-foreground uppercase">{vendorProfile?.isOnline !== false ? 'Accepting' : 'Closed'}</p>
              </div>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <Switch checked={vendorProfile?.isOnline !== false} onCheckedChange={toggleVendorStatus} className="scale-75 data-[state=checked]:bg-green-500" />
            <Button variant="ghost" onClick={() => { localStorage.removeItem('shopykart_session_active'); signOut(auth!); }} className="text-red-500 h-10 w-10 p-0 rounded-xl bg-red-50 transition-all active:scale-90"><LogOut className="h-4 w-4" /></Button>
         </div>
      </header>

      <main className="flex-1 pb-32 overflow-y-auto no-scrollbar">
         {activeMainTab === 'orders' ? (
           <div className="p-4 space-y-4 animate-in fade-in duration-500">
              <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-4 border border-border/50">
                {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-black text-white shadow-lg" : "text-gray-400")}>{f}</button>
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
                      {o.items?.map((item:any, i:number) => (<div key={i} className="flex justify-between items-center text-xs font-bold"><span className="text-gray-700">{item.quantity}x {item.name}</span><span className="text-primary font-black">₹{(item.price * item.quantity).toFixed(2)}</span></div>))}
                   </div>
                   {orderFilter === 'NEW ORDERS' && (
                     <div className="flex gap-2">
                        {o.status === 'Placed' && <Button onClick={() => updateOrderStatus(o.id, 'Accepted')} className="flex-1 bg-black h-12 rounded-2xl font-black uppercase text-xs shadow-lg transition-all active:scale-95">Accept Order</Button>}
                        {o.status === 'Accepted' && <Button onClick={() => updateOrderStatus(o.id, 'Preparing')} className="flex-1 bg-primary h-12 rounded-2xl font-black uppercase text-xs shadow-lg transition-all active:scale-95">Start Cooking</Button>}
                        {o.status === 'Preparing' && <Button onClick={() => updateOrderStatus(o.id, 'Ready for Pickup')} className="flex-1 bg-green-600 h-12 rounded-2xl font-black uppercase text-xs shadow-lg transition-all active:scale-95">Ready for Pickup</Button>}
                        {['Placed', 'Accepted'].includes(o.status) && <Button variant="ghost" onClick={() => { if(confirm("Cancel?")) updateOrderStatus(o.id, 'Cancelled'); }} className="h-12 w-12 rounded-2xl bg-red-50 text-red-500 transition-all active:scale-90"><XCircle className="h-5 w-5" /></Button>}
                     </div>
                   )}
                </div>
              ))}
              {(!orders || orders.length === 0) && <div className="text-center py-20 opacity-20 flex flex-col items-center"><ShoppingBag className="h-16 w-16 mb-4" /><p className="font-black italic uppercase tracking-widest text-xs">No active orders</p></div>}
           </div>
         ) : activeMainTab === 'catalog' ? (
           <div className="p-4 space-y-4 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-4 px-1">
                 <h2 className="text-xl font-black italic uppercase tracking-tighter">Inventory Master</h2>
                 <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if(!val) resetForm(); }}>
                    <DialogTrigger asChild><Button className="bg-black text-white rounded-xl h-10 font-black uppercase text-[9px] tracking-widest transition-all active:scale-95"><Plus className="mr-1 h-3.5 w-3.5" /> ADD NEW ITEM</Button></DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar border-none shadow-2xl">
                       <DialogHeader><DialogTitle className="font-black italic uppercase text-center text-xl tracking-tighter">Dish Configuration</DialogTitle></DialogHeader>
                       <div className="space-y-5 pt-4">
                          <div onClick={() => fileInputRef.current?.click()} className="h-44 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center bg-muted/20 cursor-pointer overflow-hidden group hover:border-primary/40 transition-all">
                             {newProduct.imageUrl ? <img src={newProduct.imageUrl} className="h-full w-full object-cover" alt="" /> : <div className="flex flex-col items-center gap-2"><ImageIcon className="h-8 w-8 opacity-10" /><span className="text-[10px] font-black uppercase text-muted-foreground">Upload Dish Photo</span></div>}
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = async () => setNewProduct({...newProduct, imageUrl: await compressImage(r.result as string, 800, 800)}); r.readAsDataURL(f); } }} />
                          
                          <div className="space-y-4">
                             <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Dish Name</label>
                                <Input placeholder="e.g. Cheese Burst Pizza" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/10 border-none" />
                             </div>
                             
                             <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-1"><FileText className="h-3 w-3" /> Description</label>
                                <Textarea placeholder="Details about ingredients, spicy level, etc." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="rounded-xl bg-muted/10 h-24 font-medium text-xs border-none" />
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                   <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">MRP (Optional)</label>
                                   <Input placeholder="₹ 0.00" type="number" value={newProduct.mrp} onChange={e => setNewProduct({...newProduct, mrp: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-none font-bold text-gray-500" />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[9px] font-black uppercase text-primary ml-1">Selling Price *</label>
                                   <Input placeholder="₹ 0.00" type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="h-12 rounded-xl border-primary/20 bg-primary/5 font-black italic text-primary" />
                                </div>
                             </div>

                             <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Category Assignment</label>
                                <Select value={newProduct.category} onValueChange={(val) => setNewProduct({...newProduct, category: val})}>
                                     <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold text-xs"><SelectValue placeholder="Select Section" /></SelectTrigger>
                                     <SelectContent className="rounded-2xl border-none shadow-2xl">{globalCategories?.map((cat: any) => (<SelectItem key={cat.id} value={cat.name.toLowerCase()} className="font-bold py-3 text-xs uppercase">{cat.name}</SelectItem>))}</SelectContent>
                                </Select>
                             </div>

                             <div className="space-y-3 pt-2">
                                <div className="flex items-center justify-between px-1">
                                   <label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2"><ListPlus className="h-3 w-3" /> Variants (e.g. Size, Extra Topping)</label>
                                   <Button type="button" onClick={handleAddOption} variant="ghost" className="h-7 text-[8px] font-black uppercase border border-primary/20 text-primary rounded-lg active:scale-95 transition-all">+ ADD VARIANT</Button>
                                </div>
                                
                                <div className="space-y-2">
                                   {newProduct.options.map((opt, idx) => (
                                     <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-right-2 duration-300">
                                       <Input 
                                         placeholder="Label (e.g. Full)" 
                                         value={opt.name} 
                                         onChange={e => handleUpdateOption(idx, 'name', e.target.value)}
                                         className="h-11 rounded-xl text-[10px] font-bold bg-muted/10 border-none"
                                       />
                                       <Input 
                                         type="number" 
                                         placeholder="Extra ₹" 
                                         value={opt.price} 
                                         onChange={e => handleUpdateOption(idx, 'price', e.target.value)}
                                         className="h-11 w-20 rounded-xl text-[10px] font-black text-center bg-primary/5 border-none text-primary"
                                       />
                                       <Button onClick={() => handleRemoveOption(idx)} variant="ghost" size="icon" className="h-11 w-11 text-red-400 bg-red-50 rounded-xl shrink-0 active:scale-90 transition-all"><X className="h-4 w-4" /></Button>
                                     </div>
                                   ))}
                                </div>
                             </div>
                          </div>

                          <Button onClick={handleAddProduct} disabled={isSubmitting} className="w-full h-16 bg-primary text-white rounded-3xl font-black uppercase italic shadow-xl shadow-primary/20 text-lg transition-all active:scale-95">{isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'PUBLISH TO MENU'}</Button>
                       </div>
                    </DialogContent>
                 </Dialog>
              </div>
              <div className="grid grid-cols-1 gap-3">
                 {products?.map(p => (
                   <div key={p.id} className={cn("bg-white p-4 rounded-[2rem] border border-border/50 flex items-center justify-between group shadow-sm hover:shadow-md transition-all", p.isAvailable === false && "opacity-60 grayscale-[0.3]")}>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img src={p.imageUrl} className="h-16 w-16 rounded-2xl object-cover bg-muted border border-border/50" alt="" />
                          {p.options?.length > 0 && <div className="absolute -top-1 -right-1 bg-primary text-white h-4 w-4 rounded-full flex items-center justify-center text-[7px] font-black border-2 border-white shadow-sm">{p.options.length}</div>}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-sm uppercase italic truncate max-w-[120px]">{p.name}</h4>
                          <div className="flex items-center gap-3 mt-1">
                             <p className="text-primary font-black text-xs italic">₹{p.price}</p>
                             <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded-lg border border-border/30">
                                <span className={cn("text-[7px] font-black uppercase", p.isAvailable !== false ? "text-green-600" : "text-gray-400")}>{p.isAvailable !== false ? 'Live' : 'Hidden'}</span>
                                <Switch checked={p.isAvailable !== false} onCheckedChange={(val) => toggleProductAvailability(p.id, p.vendorId, val)} className="scale-50 data-[state=checked]:bg-green-500" />
                             </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => { setEditingId(p.id); setNewProduct({ name: p.name, mrp: (p.mrp || p.price).toString(), price: p.price.toString(), description: p.description || '', category: p.category, imageUrl: p.imageUrl, isVeg: p.isVeg !== false, mfgDate: p.mfgDate || '', expiryDate: p.expiryDate || '', options: p.options || [] }); setIsAddOpen(true); }} size="icon" variant="ghost" className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl transition-all active:scale-90"><Edit className="h-4 w-4" /></Button>
                        <Button onClick={() => { if(confirm("Permanently remove this dish?")) { deleteDoc(doc(firestore!, 'products', p.id)); deleteDoc(doc(firestore!, 'vendors', user!.uid, 'products', p.id)); } }} size="icon" variant="ghost" className="h-10 w-10 bg-red-50 text-red-600 rounded-xl transition-all active:scale-90"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                   </div>
                 ))}
                 {(!products || products.length === 0) && <div className="text-center py-20 opacity-20 uppercase font-black text-[10px] tracking-widest italic border-2 border-dashed rounded-[3rem]">Menu is empty</div>}
              </div>
           </div>
         ) : activeMainTab === 'payouts' ? (
           <div className="p-4 space-y-6 animate-in fade-in duration-500">
              <div className="bg-[#0B0B0B] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5">
                 <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 opacity-60"><Wallet className="h-4 w-4 text-primary" /><span className="text-[10px] font-black uppercase tracking-widest">Available for Payout</span></div>
                    <h3 className="text-5xl font-black italic tracking-tighter text-white leading-none">₹{vendorProfile?.walletBalance?.toFixed(2) || '0.00'}</h3>
                    <div className="mt-6 flex items-center gap-2">
                       <div className="bg-white/10 px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">KYC Verified Portal</span>
                       </div>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 h-full w-32 bg-primary/5 -skew-x-12 translate-x-12" />
              </div>
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2 flex items-center gap-2"><History className="h-3.5 w-3.5" /> Recent Settlements</h3>
                 <div className="space-y-3">
                    {payoutHistory?.map((p: any) => (
                      <div key={p.id} className="bg-white p-5 rounded-3xl border border-border/50 flex items-center justify-between shadow-sm transition-all hover:shadow-md">
                         <div className="flex items-center gap-4">
                            <div className="h-11 w-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center font-black italic text-lg shadow-inner">₹</div>
                            <div>
                               <h4 className="font-black text-sm italic tracking-tight uppercase">+ ₹{p.amount}</h4>
                               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{p.note || 'Bank Transfer'}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <Badge className="bg-green-100 text-green-700 border-none text-[8px] font-black uppercase px-2 mb-1">SUCCESS</Badge>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">{isMounted && p.date?.seconds ? format(new Date(p.date.seconds * 1000), 'MMM d, yyyy') : 'Recently'}</p>
                         </div>
                      </div>
                    ))}
                    {(!payoutHistory || payoutHistory.length === 0) && <div className="text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-muted/50"><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-40 italic">No payout history found</p></div>}
                 </div>
              </div>
           </div>
         ) : (
           <div className="p-4 space-y-6 animate-in fade-in duration-500">
              <div className="bg-white p-8 rounded-[3rem] border border-border/50 shadow-sm text-center relative overflow-hidden group">
                 <div className="relative mx-auto w-24 h-24 mb-6">
                    <div className="h-full w-full rounded-[2rem] border-4 border-white shadow-xl bg-muted overflow-hidden flex items-center justify-center transition-all group-hover:scale-105 duration-500">
                      {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <Utensils className="h-10 w-10 text-primary opacity-20" />}
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-primary p-2.5 rounded-xl text-white shadow-lg shadow-primary/20"><Camera className="h-4 w-4" /></div>
                 </div>
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">{vendorProfile?.storeName || 'Merchant Portal'}</h2>
                 <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-[9px] font-black text-muted-foreground uppercase bg-muted px-2.5 py-1 rounded-full tracking-widest">{vendorProfile?.category} Expert</span>
                    <span className="h-1 w-1 bg-gray-300 rounded-full" />
                    <span className="text-[9px] font-black text-primary uppercase bg-primary/5 px-2.5 py-1 rounded-full tracking-widest italic">{vendorProfile?.town} Region</span>
                 </div>
              </div>

              <div className="space-y-3">
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-2">Security & Identity</h3>
                 <div className="bg-white rounded-[2.5rem] border border-border/50 shadow-sm divide-y divide-border/30 overflow-hidden">
                    {[
                      { icon: Store, label: 'Merchant ID', value: vendorProfile?.storeId || '...' },
                      { icon: CircleDollarSign, label: 'Section Type', value: vendorProfile?.category || '...' },
                      { icon: Wallet, label: 'Wallet Balance', value: `₹${vendorProfile?.walletBalance?.toFixed(2) || 0}` },
                    ].map((item, idx) => (
                      <div key={idx} className="p-6 flex items-center justify-between group hover:bg-muted/10 transition-colors">
                         <div className="flex items-center gap-4">
                            <div className="bg-primary/5 p-3 rounded-xl text-primary"><item.icon className="h-4 w-4" /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
                         </div>
                         <span className="text-sm font-black italic text-gray-800 uppercase">{item.value}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="p-2 space-y-4">
                <Button onClick={() => { localStorage.removeItem('shopykart_session_active'); signOut(auth!); }} className="w-full h-16 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-3xl font-black uppercase italic text-xs tracking-widest transition-all active:scale-95 border-none shadow-none">
                   LOGOUT & EXIT PORTAL
                </Button>
                <p className="text-center text-[8px] font-bold text-gray-400 uppercase tracking-[0.5em]">ShopyKart Merchant Services</p>
              </div>
           </div>
         )}
      </main>

      <nav className="fixed bottom-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-10 px-6 flex justify-around border-t border-white/5 z-50 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        {[
          {id:'orders',label:'Orders',icon:LayoutDashboard},
          {id:'catalog',label:'Catalog',icon:Layers},
          {id:'payouts',label:'Payouts',icon:CircleDollarSign},
          {id:'account',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => setActiveMainTab(item.id as MainTab)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-none group relative">
            <item.icon className={cn("h-5 w-5 transition-none", activeMainTab === item.id ? "text-primary scale-110" : "text-gray-500 group-hover:text-gray-400")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest transition-none", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
            {activeMainTab === item.id && (
              <div className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full animate-in zoom-in duration-300" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
