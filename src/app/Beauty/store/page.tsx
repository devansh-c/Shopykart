
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, deleteDoc, updateDoc, orderBy, writeBatch, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  LogOut,
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
  Sparkles,
  ShieldCheck,
  Calendar,
  Tag,
  FileText,
  Printer,
  Download,
  Eye,
  User,
  Save,
  ArrowUpRight,
  ListTree,
  CreditCard,
  Banknote,
  ChevronRight,
  Timer,
  Megaphone,
  Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { compressImage } from '@/lib/image-utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
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
  const storeImageInputRef = useRef<HTMLInputElement>(null);
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [isPending, startTransition] = useTransition();
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('NEW ORDERS');
  const [isMounted, setIsMounted] = useState(false);
  const [isUpdatingStoreImage, setIsUpdatingStoreImage] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  // AUTH GUARD
  useEffect(() => {
    if (!isMounted || authLoading) return;
    const sessionActive = localStorage.getItem('shopykart_session_active') === 'true';
    if (!user && !authLoading) {
      if (!sessionActive) router.replace('/vendor/login?type=Beauty');
    }
  }, [user, authLoading, router, isMounted]);

  // Vendor Profile
  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile, loading: profileLoading } = useDoc<any>(vendorRef);

  // Product Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isVarietyRequired, setIsVarietyRequired] = useState(false);
  const [options, setOptions] = useState<{ name: string; price: number }[]>([]);
  const [productForm, setProductForm] = useState({
    name: '', price: '', mrp: '', description: '', category: '', imageUrl: '', preparingTime: ''
  });

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'), where('serviceType', '==', 'Beauty'));
  }, [firestore]);
  const { data: beautyCategories } = useCollection<any>(categoriesQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'products'), where('vendorId', '==', user.uid));
  }, [firestore, user]);
  const { data: myProducts } = useCollection<any>(productsQuery);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'), limit(100));
  }, [firestore, user]);
  const { data: rawOrders } = useCollection<any>(ordersQuery);

  const payoutHistoryQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'vendors', user.uid, 'payout_history'), orderBy('date', 'desc'), limit(50));
  }, [firestore, user]);
  const { data: payoutHistory } = useCollection<any>(payoutHistoryQuery);

  const filteredOrders = useMemo(() => {
    if (!rawOrders || !user) return [];
    const vId = String(user.uid);
    return rawOrders.filter((o: any) => {
      const isForMe = o.vendorId === vId || (Array.isArray(o.vendorIds) && o.vendorIds.includes(vId)) || o.items?.some((it:any) => String(it.vendorId) === vId);
      if (!isForMe) return false;
      const status = (o.status || '').toUpperCase();
      if(orderFilter === 'NEW ORDERS') return !['DELIVERED', 'CANCELLED'].includes(status);
      return status === (orderFilter === 'CANCELLED' ? 'CANCELLED' : 'DELIVERED');
    });
  }, [rawOrders, user, orderFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!firestore) return;
    try {
      const updateData: any = { status: newStatus, updatedAt: serverTimestamp() };
      if (newStatus === 'Ready for Pickup') updateData.pickupOTP = Math.floor(1000 + Math.random() * 9000).toString();
      await updateDoc(doc(firestore, 'orders', orderId), updateData);
      toast({ title: `Order ${newStatus}!` });
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); }
  };

  const handleAddOption = () => {
    setOptions([...options, { name: '', price: 0 }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...options];
    (newOptions[index] as any)[field] = field === 'price' ? parseFloat(value) || 0 : value;
    setOptions(newOptions);
  };

  const handleSaveProduct = async () => {
    if (!firestore || !user || !productForm.name || !productForm.price) return;
    setIsSavingProduct(true);
    const pData = {
      name: productForm.name,
      price: parseFloat(productForm.price),
      mrp: parseFloat(productForm.mrp) || parseFloat(productForm.price),
      description: productForm.description,
      category: productForm.category,
      vendorId: user.uid,
      restaurantName: vendorProfile?.storeName || 'Beauty Hub',
      serviceMode: 'Beauty',
      imageUrl: productForm.imageUrl || 'https://picsum.photos/seed/beauty/400/400',
      isAvailable: true,
      options: options.filter(opt => opt.name.trim() !== ''),
      isVarietyRequired: isVarietyRequired,
      updatedAt: serverTimestamp(),
      isDeleted: false,
    };
    try {
      const newRef = doc(collection(firestore, 'products'));
      await setDoc(newRef, { ...pData, id: newRef.id, createdAt: serverTimestamp() });
      await setDoc(doc(firestore, 'vendors', user.uid, 'products', newRef.id), { ...pData, id: newRef.id, createdAt: serverTimestamp() });
      setIsProductModalOpen(false);
      resetProductForm();
      toast({ title: "Product Published!" });
    } catch (e) { toast({ variant: "destructive", title: "Save Error" }); }
    finally { setIsSavingProduct(false); }
  };

  const resetProductForm = () => {
    setProductForm({ name: '', price: '', mrp: '', description: '', category: '', imageUrl: '', preparingTime: '' });
    setOptions([]);
    setIsVarietyRequired(false);
  };

  const handleProductImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 600, 600);
      setProductForm(prev => ({ ...prev, imageUrl: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const handleTestAlert = async () => {
    setIsTesting(true);
    toast({ title: "Loud Test! 🔊", description: "Phone 10s mein bajega." });
    await scheduleTestNotification();
    setTimeout(() => setIsTesting(false), 5000);
  };

  if (!isMounted || authLoading || (profileLoading && !vendorProfile)) {
    return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-rose-600" /></div>;
  }

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
           <div className="p-4 space-y-4">
              <div className="bg-[#0B0B0B] p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden text-white mb-2">
                 <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                       <div className="h-12 w-12 bg-rose-500/20 rounded-xl flex items-center justify-center text-rose-500 border border-rose-500/20"><BellRing className="h-6 w-6 animate-ring" /></div>
                       <div><h2 className="text-sm font-black italic uppercase">Ringer Test</h2><p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Test loud background alerts</p></div>
                    </div>
                    <Button onClick={handleTestAlert} disabled={isTesting} className="h-10 px-4 bg-rose-600 text-white rounded-xl font-black uppercase text-[8px]">TEST LOUD</Button>
                 </div>
              </div>

              <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-border/50">
                {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-rose-600 text-white" : "text-gray-400")}>{f}</button>
                ))}
              </div>

              {filteredOrders.length > 0 ? filteredOrders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm">
                   <div className="flex justify-between items-start mb-4">
                      <div><span className="text-2xl font-black italic tracking-tighter">#{o.customerOrderNumber}</span><p className="text-[8px] font-black text-gray-400 uppercase mt-1">{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'hh:mm a')}</p></div>
                      <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[8px] uppercase">{o.status}</Badge>
                   </div>
                   <div className="bg-muted/30 rounded-3xl p-5 mb-4 space-y-3">
                      <div className="flex items-center gap-2 border-b border-white pb-2"><User className="h-3.5 w-3.5 text-rose-600" /><span className="text-xs font-black uppercase italic">{o.customerName}</span></div>
                      {o.items?.filter((it:any) => String(it.vendorId) === String(user?.uid)).map((item:any, i:number) => (
                        <div key={i} className="flex justify-between items-center text-[11px] font-black uppercase italic"><span className="text-gray-700">{item.quantity}x {item.name}</span><span className="text-rose-600">₹{item.price * item.quantity}</span></div>
                      ))}
                      {o.pickupOTP && o.status === 'Ready for Pickup' && <div className="bg-black p-3 rounded-2xl text-center"><span className="text-[7px] font-black text-rose-500 uppercase tracking-widest">PICKUP OTP</span><h4 className="text-xl font-black text-white italic tracking-[0.4em]">{o.pickupOTP}</h4></div>}
                   </div>
                   <div className="flex flex-col gap-2">
                      {o.status === 'Placed' && <Button onClick={() => handleUpdateStatus(o.id, 'Accepted')} className="h-14 bg-green-600 text-white rounded-2xl font-black uppercase italic">ACCEPT SERVICE</Button>}
                      {o.status === 'Accepted' && <Button onClick={() => handleUpdateStatus(o.id, 'Preparing')} className="h-14 bg-rose-600 text-white rounded-2xl font-black uppercase italic">START PROCESS</Button>}
                      {o.status === 'Preparing' && <Button onClick={() => handleUpdateStatus(o.id, 'Ready for Pickup')} className="h-14 bg-black text-white rounded-2xl font-black uppercase italic">READY FOR PICKUP</Button>}
                   </div>
                </div>
              )) : <div className="text-center py-20 opacity-20"><ShoppingBag className="h-12 w-12 mx-auto mb-2" /><p className="font-black uppercase text-xs">No active orders</p></div>}
           </div>
         )}

         {activeMainTab === 'catalog' && (
           <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                 <h2 className="text-xl font-black italic uppercase">Cosmetics Catalog</h2>
                 <Dialog open={isProductModalOpen} onOpenChange={(val) => { setIsProductModalOpen(val); if(!val) resetProductForm(); }}>
                   <DialogTrigger asChild>
                     <Button className="bg-rose-600 rounded-xl h-10 font-black uppercase text-[10px]"><Plus className="h-4 w-4 mr-1" /> ADD SERVICE</Button>
                   </DialogTrigger>
                   <DialogContent className="rounded-[2.5rem] max-w-md max-h-[85vh] overflow-y-auto no-scrollbar focus:outline-none p-0">
                      <DialogHeader className="p-6 border-b"><DialogTitle className="font-black italic uppercase text-center">New Service Entry</DialogTitle></DialogHeader>
                      <div className="p-8 space-y-6">
                         <div onClick={() => fileInputRef.current?.click()} className="h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center bg-muted/20 cursor-pointer overflow-hidden group">
                            {productForm.imageUrl ? <img src={productForm.imageUrl} className="h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-2"><ImageIcon className="h-8 w-8 opacity-20" /><span className="text-[10px] font-black uppercase text-muted-foreground">Service Photo</span></div>}
                         </div>
                         <input type="file" ref={fileInputRef} className="hidden" onChange={handleProductImageSelect} />
                         
                         <div className="space-y-4">
                            <Input placeholder="Service Name" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/20 border-none" />
                            <div className="grid grid-cols-2 gap-4">
                              <Input placeholder="MRP ₹" type="number" value={productForm.mrp} onChange={e => setProductForm({...productForm, mrp: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-none" />
                              <Input placeholder="Selling Price ₹" type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="h-12 rounded-xl border-rose-400 font-bold" />
                            </div>
                            <Textarea placeholder="Details / Description" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="rounded-xl h-24 bg-muted/20 border-none p-4" />
                            
                            {/* RESTORED VARIETIES SECTION */}
                            <div className="space-y-4 p-6 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                      <div className="bg-rose-50 p-2 rounded-xl text-rose-600"><ListTree className="h-4 w-4" /></div>
                                      <div>
                                         <h4 className="text-[11px] font-black uppercase tracking-tight">Variations</h4>
                                         <p className="text-[7px] font-bold text-muted-foreground uppercase">Add different sizes or options</p>
                                      </div>
                                   </div>
                                   <div className="flex items-center gap-2">
                                      <span className="text-[8px] font-black uppercase text-gray-400">Choice Required?</span>
                                      <Switch checked={isVarietyRequired} onCheckedChange={setIsVarietyRequired} className="scale-75 data-[state=checked]:bg-rose-600" />
                                   </div>
                                </div>

                                <div className="space-y-3">
                                   {options.map((opt, idx) => (
                                     <div key={idx} className="flex gap-3 animate-in slide-in-from-right-2 duration-300">
                                        <Input 
                                          placeholder="Variant (e.g. Small)" 
                                          value={opt.name}
                                          onChange={e => updateOption(idx, 'name', e.target.value)}
                                          className="h-10 rounded-xl bg-white border-none font-bold text-xs uppercase flex-[2]"
                                        />
                                        <div className="relative flex-1">
                                           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-rose-600">₹</span>
                                           <Input 
                                              type="number" 
                                              placeholder="0" 
                                              value={opt.price}
                                              onChange={e => updateOption(idx, 'price', e.target.value)}
                                              className="h-10 pl-6 rounded-xl bg-white border-none font-black text-xs text-rose-600"
                                           />
                                        </div>
                                        <button 
                                          onClick={() => handleRemoveOption(idx)}
                                          className="h-10 w-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center"
                                        >
                                           <Trash2 className="h-4 w-4" />
                                        </button>
                                     </div>
                                   ))}
                                   <button 
                                      onClick={handleAddOption}
                                      className="w-full h-10 border-2 border-dashed border-rose-200 text-rose-600 rounded-xl font-black uppercase text-[8px] tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-rose-50"
                                   >
                                      <Plus className="h-3 w-3" /> ADD VARIETY
                                   </button>
                                </div>
                            </div>
                         </div>
                         <Button onClick={handleSaveProduct} disabled={isSavingProduct} className="w-full h-16 bg-rose-600 text-white rounded-[2rem] font-black uppercase italic shadow-xl">
                           {isSavingProduct ? <Loader2 className="h-5 w-5 animate-spin" /> : 'PUBLISH SERVICE'}
                         </Button>
                      </div>
                   </DialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 {myProducts?.filter(p => !p.isDeleted).map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-3xl border border-border/50 shadow-sm flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <img src={p.imageUrl} className="h-16 w-16 rounded-2xl object-cover bg-muted" alt="" />
                          <div>
                             <h4 className="font-black text-sm uppercase italic leading-none mb-1">{p.name}</h4>
                             <p className="text-xs font-black text-rose-600 italic">₹{p.price}</p>
                          </div>
                       </div>
                       <button onClick={async () => { if(confirm("Remove?")) await updateDoc(doc(firestore!, 'products', p.id), { isDeleted: true }); }} className="h-10 w-10 text-red-500"><Trash2 className="h-4 w-4" /></button>
                    </div>
                 ))}
              </div>
           </div>
         )}

         {activeMainTab === 'payouts' && (
           <div className="p-4 space-y-6">
              <h2 className="text-xl font-black italic uppercase">Beauty Earnings</h2>
              <div className="bg-[#0B0B0B] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                 <div className="relative z-10 space-y-4">
                    <span className="text-[10px] font-black uppercase text-gray-500">Beauty Wallet Balance</span>
                    <div className="text-5xl font-black italic text-rose-500">₹{vendorProfile?.walletBalance?.toFixed(2) || '0.00'}</div>
                 </div>
              </div>
              <div className="space-y-4">
                 <h3 className="text-[10px] font-black uppercase text-muted-foreground ml-2">Recent Payouts</h3>
                 {payoutHistory?.length > 0 ? payoutHistory.map((p: any) => (
                    <div key={p.id} className="bg-white p-5 rounded-3xl border shadow-sm flex items-center justify-between">
                       <div><h4 className="font-black text-sm uppercase italic">₹{p.amount?.toFixed(2)}</h4><p className="text-[8px] font-bold text-muted-foreground uppercase">{format(new Date(p.date?.seconds * 1000), 'MMM d, h:mm a')}</p></div>
                       <Badge className="bg-green-100 text-green-700 border-none font-black text-[7px] uppercase">SUCCESS</Badge>
                    </div>
                 )) : <div className="text-center py-20 opacity-20"><History className="h-10 w-10 mx-auto" /><p className="font-black uppercase text-[10px] mt-2">No history</p></div>}
              </div>
           </div>
         )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-50 rounded-t-[2.5rem] shadow-2xl transform-gpu">
        {[
          {id:'orders',label:'Orders',icon:LayoutDashboard},
          {id:'catalog',label:'Catalog',icon:Layers},
          {id:'payouts',label:'Payouts',icon:CircleDollarSign},
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
