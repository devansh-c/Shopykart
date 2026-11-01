
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
  Globe
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
import { format, differenceInSeconds, differenceInMinutes } from 'date-fns';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';
import { compressImage } from '@/lib/image-utils';
import { scheduleTestNotification } from '@/components/shared/PermissionManager';

type MainTab = 'orders' | 'catalog' | 'coupons' | 'payouts' | 'account';

const TIME_SLOTS = [
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM",
  "08:00 PM", "08:15 PM", "08:30 PM", "09:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"
];

const PrepTimer = ({ order }: { order: any }) => {
  const [timeLeft, setTimeLeft] = useState('10:00');
  const [isOverdue, setIsOverdue] = useState(false);
  const [penalty, setPenalty] = useState(0);

  useEffect(() => {
    if (!order.acceptedAt || order.status === 'Ready for Pickup' || order.status === 'Delivered') return;
    const interval = setInterval(() => {
      const acceptedTime = order.acceptedAt.seconds ? new Date(order.acceptedAt.seconds * 1000) : new Date();
      const elapsedSecs = differenceInSeconds(new Date(), acceptedTime);
      const limitSecs = 10 * 60;
      const remainingSecs = limitSecs - elapsedSecs;
      if (remainingSecs <= 0) {
        setIsOverdue(true);
        const overdueSecs = Math.abs(remainingSecs);
        const mm = Math.floor(overdueSecs / 60);
        const ss = overdueSecs % 60;
        setTimeLeft(`+${mm}:${String(ss).padStart(2, '0')}`);
        const overdueMins = Math.floor(overdueSecs / 60);
        if (overdueMins >= 10) setPenalty(20);
        else if (overdueMins >= 5) setPenalty(10);
        else setPenalty(0);
      } else {
        setIsOverdue(false);
        const mm = Math.floor(remainingSecs / 60);
        const ss = remainingSecs % 60;
        setTimeLeft(`${mm}:${String(ss).padStart(2, '0')}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [order.acceptedAt, order.status]);

  if (!order.acceptedAt || ['Ready for Pickup', 'Delivered', 'Cancelled'].includes(order.status)) return null;

  return (
    <div className={cn("flex items-center justify-between p-4 rounded-2xl border-2 animate-pulse", isOverdue ? "bg-red-50 border-red-200" : "bg-primary/5 border-primary/10")}>
       <div className="flex items-center gap-3">
          <Timer className={cn("h-5 w-5", isOverdue ? "text-red-600" : "text-primary")} />
          <div>
             <p className={cn("text-[9px] font-black uppercase tracking-widest", isOverdue ? "text-red-500" : "text-primary")}>{isOverdue ? 'PREPARATION DELAY' : 'READY BY'}</p>
             <h4 className={cn("text-xl font-black tabular-nums", isOverdue ? "text-red-600" : "text-gray-900")}>{timeLeft}</h4>
          </div>
       </div>
       {isOverdue && penalty > 0 && <Badge className="bg-red-600 text-white border-none font-black text-[10px] py-1">₹{penalty} PENALTY</Badge>}
    </div>
  );
};

export default function VendorDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storeImageInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [isMounted, setIsMounted] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isVarietyRequired, setIsVarietyRequired] = useState(false);
  const [options, setOptions] = useState<{ name: string; price: number }[]>([]);
  const [productForm, setProductForm] = useState({
    name: '', slug: '', price: '', mrp: '', description: '', category: '', imageUrl: '', preparingTime: ''
  });

  const [isUpdatingStoreImage, setIsUpdatingStoreImage] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [isAnnActive, setIsAnnActive] = useState(false);
  const [isSavingAnn, setIsSavingAnn] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', value: '', type: 'percentage', minOrder: '0' });
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!isMounted || authLoading) return;
    if (!user && !authLoading) router.replace('/vendor/login');
  }, [user, authLoading, router, isMounted]);

  const vendorRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'vendors', user.uid) : null, [firestore, user]);
  const { data: vendorProfile, loading: profileLoading } = useDoc<any>(vendorRef);

  useEffect(() => {
    if (vendorProfile) {
      setAnnouncement(vendorProfile.storeAnnouncement || '');
      setIsAnnActive(vendorProfile.isAnnouncementActive || false);
    }
  }, [vendorProfile]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore || !vendorProfile) return null;
    return query(collection(firestore, 'categories'), where('serviceType', '==', vendorProfile.category || 'Food'));
  }, [firestore, vendorProfile]);
  const { data: foodCategories } = useCollection<any>(categoriesQuery);

  const productsQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'products'), where('vendorId', '==', user.uid)) : null, [firestore, user]);
  const { data: myProducts } = useCollection<any>(productsQuery);

  const ordersQuery = useMemoFirebase(() => (firestore && user) ? query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'), limit(100)) : null, [firestore, user]);
  const { data: rawOrders } = useCollection<any>(ordersQuery);

  const filteredOrders = useMemo(() => {
    if (!rawOrders || !user) return [];
    return rawOrders.filter((o: any) => String(o.vendorId) === String(user.uid) || (Array.isArray(o.vendorIds) && o.vendorIds.includes(user.uid)) || o.items?.some((it:any) => String(it.vendorId) === String(user.uid)));
  }, [rawOrders, user]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!firestore) return;
    try {
      const updateData: any = { status: newStatus, updatedAt: serverTimestamp() };
      if (newStatus === 'Accepted') updateData.acceptedAt = serverTimestamp();
      if (newStatus === 'Ready for Pickup') {
        const snap = await getDoc(doc(firestore, 'orders', orderId));
        const data = snap.data();
        if (data?.acceptedAt) {
          const acceptedTime = data.acceptedAt.seconds ? new Date(data.acceptedAt.seconds * 1000) : new Date();
          const minsTaken = differenceInMinutes(new Date(), acceptedTime);
          updateData.preparationMinutes = minsTaken;
          updateData.preparationPenalty = minsTaken >= 20 ? 20 : (minsTaken >= 15 ? 10 : 0);
        }
        updateData.pickupOTP = Math.floor(1000 + Math.random() * 9000).toString();
        updateData.readyForPickupAt = serverTimestamp();
      }
      await updateDoc(doc(firestore, 'orders', orderId), updateData);
      toast({ title: `Order ${newStatus}!` });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const handleSaveProduct = async () => {
    if (!firestore || !user || !productForm.name || !productForm.price || !productForm.category) return;
    setIsSavingProduct(true);
    const finalSlug = productForm.slug.trim().toLowerCase().replace(/\s+/g, '-') || slugify(productForm.name);
    const pData = {
      name: productForm.name.trim(),
      slug: finalSlug,
      price: parseFloat(productForm.price),
      mrp: parseFloat(productForm.mrp) || parseFloat(productForm.price),
      description: productForm.description.trim(),
      category: productForm.category.toLowerCase().trim(),
      preparingTime: parseInt(productForm.preparingTime) || 15,
      vendorId: user.uid,
      restaurantName: vendorProfile?.storeName || 'Store',
      serviceMode: vendorProfile?.category || 'Food',
      imageUrl: productForm.imageUrl || 'https://picsum.photos/seed/product/400/400',
      isAvailable: true,
      options: options.filter(opt => opt.name.trim() !== ''),
      isVarietyRequired,
      updatedAt: serverTimestamp(),
      isDeleted: false,
    };
    try {
      if (editingProductId) {
        await updateDoc(doc(firestore, 'products', editingProductId), pData);
        await updateDoc(doc(firestore, 'vendors', user.uid, 'products', editingProductId), pData);
      } else {
        const newRef = doc(collection(firestore, 'products'));
        await setDoc(newRef, { ...pData, id: newRef.id, createdAt: serverTimestamp() });
        await setDoc(doc(firestore, 'vendors', user.uid, 'products', newRef.id), { ...pData, id: newRef.id, createdAt: serverTimestamp() });
      }
      setIsProductModalOpen(false);
      resetProductForm();
      toast({ title: editingProductId ? "Updated!" : "Published!" });
    } catch (e) { toast({ variant: "destructive", title: "Save Error" }); }
    finally { setIsSavingProduct(false); }
  };

  const resetProductForm = () => {
    setEditingId(null);
    setEditingProductId(null);
    setProductForm({ name: '', slug: '', price: '', mrp: '', description: '', category: '', imageUrl: '', preparingTime: '' });
    setOptions([]);
    setIsVarietyRequired(false);
  };

  const handleEdit = (p: any) => {
    setEditingProductId(p.id);
    setProductForm({ name: p.name, slug: p.slug || '', price: p.price.toString(), mrp: p.mrp?.toString() || '', description: p.description || '', category: p.category || '', imageUrl: p.imageUrl || '', preparingTime: p.preparingTime?.toString() || '' });
    setOptions(p.options || []);
    setIsVarietyRequired(p.isVarietyRequired || false);
    setIsProductModalOpen(true);
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

  if (!isMounted || authLoading || (profileLoading && !vendorProfile)) return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative overflow-hidden">
      <header className="bg-white px-4 py-4 border-b flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 rounded-xl overflow-hidden border-2 border-primary/10 bg-muted shrink-0 shadow-inner"><img src={vendorProfile?.imageUrl || 'https://picsum.photos/seed/vendor/200/200'} className="h-full w-full object-cover" alt="" /></div>
           <div><h1 className="text-sm font-black italic uppercase tracking-tighter leading-none">{vendorProfile?.storeName}</h1><div className="flex items-center gap-1.5 mt-1"><div className={cn("h-1.5 w-1.5 rounded-full", vendorProfile?.isOnline !== false ? "bg-green-500 animate-pulse" : "bg-red-500")} /><p className="text-[8px] font-bold text-muted-foreground uppercase">{vendorProfile?.isOnline !== false ? 'Accepting' : 'Closed'}</p></div></div>
        </div>
        <Switch checked={vendorProfile?.isOnline !== false} onCheckedChange={async (o) => { await updateDoc(doc(firestore!, 'vendors', user!.uid), { isOnline: o }); }} className="scale-75 data-[state=checked]:bg-green-500" />
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {activeMainTab === 'orders' && (
           <div className="p-4 space-y-4">
              <h2 className="text-xl font-black italic uppercase ml-2">Active Orders</h2>
              <div className="space-y-4">
                 {filteredOrders.length > 0 ? filteredOrders.map((o: any) => (
                   <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm mb-4">
                      <div className="flex justify-between items-start mb-6">
                          <div><span className="text-3xl font-black italic tracking-tighter">#{o.customerOrderNumber}</span><div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase mt-1"><Clock className="h-3 w-3 text-primary" />{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'hh:mm a')}</div></div>
                          <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-3 py-1 rounded-full">{o.status}</Badge>
                      </div>
                      <div className="space-y-4 mb-6">
                        <PrepTimer order={o} />
                        <div className="bg-muted/30 rounded-[2rem] p-5 space-y-4">
                            <div className="flex items-center gap-3 border-b border-white pb-3 mb-1"><User className="h-4 w-4 text-primary" /><span className="text-sm font-black uppercase italic">{o.customerName}</span></div>
                            <div className="space-y-2">{o.items?.filter((it:any) => String(it.vendorId) === String(user?.uid)).map((item:any, i:number) => (
                                  <div key={i} className="flex justify-between items-center text-xs font-black uppercase italic"><span className="text-gray-700">{item.quantity}x {item.name}</span><span className="text-primary">₹{(item.price * item.quantity).toFixed(0)}</span></div>
                               ))}</div>
                            {o.pickupOTP && o.status === 'Ready for Pickup' && (<div className="bg-black p-4 rounded-2xl flex flex-col items-center justify-center text-center border-2 border-primary/30 shadow-xl"><span className="text-[7px] font-black text-primary uppercase tracking-[0.3em] mb-1">PICKUP OTP</span><h4 className="text-2xl font-black italic tracking-[0.5em] text-white pl-2">{o.pickupOTP}</h4></div>)}
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                         {o.status === 'Placed' && (<Button onClick={() => handleUpdateStatus(o.id, 'Accepted')} className="w-full h-16 bg-green-600 text-white rounded-[1.5rem] font-black uppercase italic shadow-lg active:scale-95 transition-all">ACCEPT ORDER</Button>)}
                         {o.status === 'Accepted' && (<Button onClick={() => handleUpdateStatus(o.id, 'Preparing')} className="w-full h-16 bg-primary text-white rounded-[1.5rem] font-black uppercase italic shadow-lg active:scale-95 transition-all">START PREPARING</Button>)}
                         {o.status === 'Preparing' && (<Button onClick={() => handleUpdateStatus(o.id, 'Ready for Pickup')} className="w-full h-16 bg-black text-white rounded-[1.5rem] font-black uppercase italic shadow-lg active:scale-95 transition-all">READY FOR PICKUP</Button>)}
                      </div>
                   </div>
                 )) : (<div className="text-center py-20 opacity-30 flex flex-col items-center"><ShoppingBag className="h-12 w-12 mb-4" /><p className="font-black uppercase text-xs">No active orders.</p></div>)}
              </div>
           </div>
        )}

        {activeMainTab === 'catalog' && (
          <div className="p-4 space-y-4">
             <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-black italic uppercase tracking-tighter">My Inventory</h2>
                <Dialog open={isProductModalOpen} onOpenChange={(val) => { setIsProductModalOpen(val); if(!val) resetProductForm(); }}>
                   <DialogTrigger asChild><Button className="bg-primary rounded-xl h-10 font-black uppercase text-[10px] tracking-widest"><Plus className="h-3.5 w-3.5 mr-1" /> ADD ITEM</Button></DialogTrigger>
                   <DialogContent className="rounded-[2.5rem] max-w-md max-h-[85vh] overflow-y-auto no-scrollbar focus:outline-none p-0">
                      <DialogHeader className="p-6 border-b"><DialogTitle className="font-black italic uppercase text-center">{editingProductId ? 'Edit Item' : 'New Item Entry'}</DialogTitle></DialogHeader>
                      <div className="p-8 space-y-6">
                         <div onClick={() => fileInputRef.current?.click()} className="h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center bg-muted/20 cursor-pointer overflow-hidden group hover:border-primary transition-all">{productForm.imageUrl ? <img src={productForm.imageUrl} className="h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-2"><ImageIcon className="h-8 w-8 opacity-20" /><span className="text-[10px] font-black uppercase text-muted-foreground">Product Photo</span></div>}</div>
                         <input type="file" ref={fileInputRef} className="hidden" onChange={handleProductImageSelect} />
                         <div className="space-y-4">
                            <Input placeholder="Product Name" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/20 border-none" />
                            <div className="space-y-1"><label className="text-[9px] font-black uppercase text-primary ml-1 flex items-center gap-1.5"><Globe className="h-2.5 w-2.5" /> SEO Slug</label><Input value={productForm.slug} onChange={e => setProductForm({...productForm, slug: e.target.value})} placeholder="e.g. classic-burger" className="h-12 rounded-xl bg-primary/5 border-none font-black italic text-primary" /></div>
                            <div className="grid grid-cols-2 gap-4"><Input placeholder="MRP ₹" type="number" value={productForm.mrp} onChange={e => setProductForm({...productForm, mrp: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-none" /><Input placeholder="Selling Price ₹" type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="h-12 rounded-xl border-primary/40 font-bold" /></div>
                            <Textarea placeholder="Description / Features" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="rounded-xl h-24 bg-muted/20 border-none p-4" />
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1"><label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Category</label><Select value={productForm.category} onValueChange={(val) => setProductForm({...productForm, category: val})}><SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold"><SelectValue placeholder="Select" /></SelectTrigger><SelectContent className="rounded-2xl">{foodCategories?.map((cat: any) => (<SelectItem key={cat.id} value={cat.name.toLowerCase()} className="font-bold py-3 uppercase text-xs">{cat.name}</SelectItem>))}</SelectContent></Select></div>
                               <div className="space-y-1"><label className="text-[9px] font-black uppercase text-teal-600 ml-1 flex items-center gap-1"><Timer className="h-3 w-3" /> Prep Time (Min)</label><Input type="number" placeholder="15" value={productForm.preparingTime} onChange={e => setProductForm({...productForm, preparingTime: e.target.value})} className="h-12 rounded-xl bg-primary/5 border-none text-center font-bold" /></div>
                            </div>
                            <div className="space-y-4 p-6 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="bg-primary/10 p-2 rounded-xl text-primary"><ListTree className="h-4 w-4" /></div><div><h4 className="text-[11px] font-black uppercase tracking-tight">Varieties</h4></div></div><div className="flex items-center gap-2"><span className="text-[8px] font-black uppercase text-gray-400">Choice Required?</span><Switch checked={isVarietyRequired} onCheckedChange={setIsVarietyRequired} className="scale-75 data-[state=checked]:bg-primary" /></div></div>
                                <div className="space-y-3">{options.map((opt, idx) => (
                                     <div key={idx} className="flex gap-3"><Input placeholder="Name" value={opt.name} onChange={e => updateOption(idx, 'name', e.target.value)} className="h-10 rounded-xl bg-white border-none font-bold text-xs uppercase flex-[2]" /><div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary">₹</span><Input type="number" value={opt.price} onChange={e => updateOption(idx, 'price', e.target.value)} className="h-10 pl-6 rounded-xl bg-white border-none font-black text-xs text-primary" /></div><button onClick={() => handleRemoveOption(idx)} className="h-10 w-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center"><Trash2 className="h-4 w-4" /></button></div>
                                   ))}<button onClick={handleAddOption} className="w-full h-10 border-2 border-dashed border-primary/20 text-primary rounded-xl font-black uppercase text-[8px] flex items-center justify-center gap-2"><Plus className="h-3 w-3" /> ADD VARIETY</button></div>
                            </div>
                         </div>
                         <Button onClick={handleSaveProduct} disabled={isSavingProduct} className="w-full h-16 bg-primary text-white rounded-[2rem] font-black uppercase italic shadow-xl">{isSavingProduct ? <Loader2 className="h-5 w-5 animate-spin" /> : editingProductId ? 'UPDATE ITEM' : 'PUBLISH ITEM'}</Button>
                      </div>
                   </DialogContent>
                </Dialog>
             </div>
             <div className="grid grid-cols-1 gap-4">
                {myProducts?.filter(p => !p.isDeleted)?.map(p => (
                  <div key={p.id} className="bg-white p-4 rounded-3xl border border-border/50 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <img src={p.imageUrl} className="h-16 w-16 rounded-xl object-cover bg-muted" alt="" />
                      <div>
                        <h4 className="font-black text-sm uppercase italic leading-none mb-1">{p.name}</h4>
                        <p className="text-xs font-black text-primary italic">₹{p.price}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleEdit(p)} className="h-10 w-10 text-blue-600 bg-blue-50 rounded-xl flex items-center justify-center active:scale-90 transition-all"><Edit className="h-4 w-4" /></button>
                       <button onClick={async () => { if(confirm("Remove?")) await updateDoc(doc(firestore!, 'products', p.id), { isDeleted: true }); }} className="h-10 w-10 text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeMainTab === 'payouts' && (
           <div className="p-4 space-y-6"><h2 className="text-xl font-black italic uppercase ml-2">Earnings</h2><div className="bg-[#0B0B0B] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden"><div className="relative z-10 space-y-6"><div><span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Current Balance</span><div className="text-5xl font-black italic tracking-tighter text-primary mt-1">₹{vendorProfile?.walletBalance?.toFixed(2) || '0.00'}</div></div></div></div><div className="space-y-4">{/* Payout history component would go here */}</div></div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-4 flex justify-around border-t border-white/5 z-50 rounded-t-[2.5rem] shadow-2xl">
        {[
          {id:'orders',label:'Orders',icon:LayoutDashboard},
          {id:'catalog',label:'Catalog',icon:Layers},
          {id:'payouts',label:'Payouts',icon:CircleDollarSign},
          {id:'account',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => setActiveMainTab(item.id as MainTab)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-none"><item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-primary scale-110" : "text-gray-500")} /><span className={cn("text-[8px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span></button>
        ))}
      </nav>
    </div>
  );
}
