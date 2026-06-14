
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, deleteDoc, updateDoc, orderBy, getDocs, writeBatch, limit } from 'firebase/firestore';
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
  CheckCircle2,
  ShieldCheck,
  Printer,
  Download,
  Eye,
  Package,
  User,
  Power,
  PowerOff,
  MapPin,
  Phone,
  Save,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ListTree
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, useMemo, memo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { compressImage } from '@/lib/image-utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { toJpeg } from 'html-to-image';
import { saveAs } from 'file-saver';

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
  const [isPending, startTransition] = useTransition();
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('NEW ORDERS');
  const [isMounted, setIsMounted] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Vendor Profile
  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile, loading: profileLoading } = useDoc<any>(vendorRef);

  // AUTH GUARD: Redirect to login if not authenticated or not a vendor
  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (!user) {
        router.replace('/vendor/login');
      } else if (!vendorProfile) {
        toast({ variant: "destructive", title: "Access Denied", description: "This account is not a registered seller." });
        router.replace('/vendor/login');
      }
    }
  }, [user, authLoading, vendorProfile, profileLoading, router, toast]);

  // Form states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductProductForm] = useState({
    name: '', price: '', mrp: '', description: '', category: '', isVeg: true, imageUrl: '', options: [] as any[]
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [profileForm, setProfileForm] = useState({ storeName: '', address: '', phone: '', fullName: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => { 
    setIsMounted(true); 
  }, []);

  useEffect(() => {
    if (vendorProfile) {
      setProfileForm({
        storeName: vendorProfile.storeName || '',
        address: vendorProfile.address || '',
        phone: vendorProfile.phone || '',
        fullName: vendorProfile.fullName || ''
      });
    }
  }, [vendorProfile]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: allCategories } = useCollection<any>(categoriesQuery);

  const filteredCategories = useMemo(() => {
    if (!allCategories || !vendorProfile) return [];
    return allCategories.filter((cat: any) => 
      (cat.serviceType || 'Food').toLowerCase() === (vendorProfile.category || 'Food').toLowerCase()
    );
  }, [allCategories, vendorProfile]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'), limit(100));
  }, [firestore, user]);
  const { data: rawOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'products'), where('vendorId', '==', user.uid));
  }, [firestore, user]);
  const { data: myProducts } = useCollection<any>(productsQuery);

  const payoutQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'vendors', user.uid, 'payout_history'), orderBy('date', 'desc'));
  }, [firestore, user]);
  const { data: payouts } = useCollection<any>(payoutQuery);

  const orders = useMemo(() => {
    if (!rawOrders || !user) return [];
    return rawOrders.filter((o: any) => {
      const vendorId = String(user.uid);
      return o.vendorId === vendorId || (Array.isArray(o.vendorIds) && o.vendorIds.includes(vendorId)) || o.items?.some((it:any) => String(it.vendorId) === vendorId);
    });
  }, [rawOrders, user]);

  const handleToggleStore = async (online: boolean) => {
    if (!firestore || !user) return;
    try {
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, 'vendors', user.uid), { isOnline: online, updatedAt: serverTimestamp() });
      if (myProducts) {
        myProducts.forEach(p => { batch.set(doc(firestore, 'products', p.id), { isAvailable: online }, { merge: true }); });
      }
      await batch.commit();
      toast({ title: online ? "Store Open! 🟢" : "Store Closed 🔴" });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const handleSaveProduct = async () => {
    if (!firestore || !user || !vendorProfile) return;
    setIsSavingProduct(true);
    const productData = {
      name: productForm.name, price: parseFloat(productForm.price), mrp: parseFloat(productForm.mrp || productForm.price),
      description: productForm.description, category: productForm.category.toLowerCase(),
      vendorId: user.uid, restaurantName: vendorProfile.storeName, zoneId: vendorProfile.zoneId || null,
      town: vendorProfile.town || 'Local', serviceMode: vendorProfile.category || 'Food',
      imageUrl: productForm.imageUrl || 'https://picsum.photos/seed/food/400/300',
      options: productForm.options.filter(o => o.name?.trim() !== ''),
      isAvailable: vendorProfile.isOnline !== false, updatedAt: serverTimestamp()
    };
    try {
      if (editingProduct) { await setDoc(doc(firestore, 'products', editingProduct.id), productData, { merge: true }); }
      else { const newRef = doc(collection(firestore, 'products')); await setDoc(newRef, { ...productData, id: newRef.id, createdAt: serverTimestamp() }); }
      setIsProductModalOpen(false);
      toast({ title: "Product Saved!" });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
    finally { setIsSavingProduct(false); }
  };

  const handleSaveProfile = async () => {
    if (!firestore || !user) return;
    setIsSavingProfile(true);
    try {
      await updateDoc(doc(firestore, 'vendors', user.uid), {
        fullName: profileForm.fullName, address: profileForm.address, updatedAt: serverTimestamp()
      });
      toast({ title: "Profile Updated!" });
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); }
    finally { setIsSavingProfile(false); }
  };

  const filteredOrders = useMemo(() => {
    return orders?.filter(o => {
      const status = (o.status || '').toUpperCase();
      if(orderFilter === 'NEW ORDERS') return !['DELIVERED', 'CANCELLED'].includes(status);
      if(orderFilter === 'CANCELLED') return status === 'CANCELLED';
      return status === 'DELIVERED';
    });
  }, [orders, orderFilter]);

  if (!isMounted || authLoading || profileLoading || !user || !vendorProfile) {
    return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative overflow-hidden">
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b shrink-0 z-50">
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
         <Switch checked={vendorProfile?.isOnline !== false} onCheckedChange={handleToggleStore} className="scale-75 data-[state=checked]:bg-green-500" />
      </header>

      <main className={cn("flex-1 overflow-y-auto no-scrollbar transition-opacity duration-300", isPending ? "opacity-50" : "opacity-100")}>
         <div className="pb-32">
            {activeMainTab === 'orders' && (
              <div className="p-4 space-y-4 animate-in fade-in duration-500">
                  <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-4 border border-border/50">
                    {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                      <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-black text-white" : "text-gray-400")}>{f}</button>
                    ))}
                  </div>
                  {ordersLoading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> :
                  filteredOrders?.length > 0 ? filteredOrders.map(o => (
                    <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm mb-4">
                      <div className="flex justify-between items-center mb-4">
                          <div><span className="text-lg font-black italic">#{o.orderDisplayId || o.id.slice(-4)}</span><div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase mt-0.5"><Clock className="h-2.5 w-2.5" />{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'MMM d, h:mm a')}</div></div>
                          <Badge className={cn("border-none text-[8px] font-black rounded-full px-2.5 py-1 uppercase", o.status === 'Cancelled' ? "bg-red-50 text-red-600" : o.status === 'Delivered' ? "bg-green-50 text-green-600" : "bg-primary/10 text-primary")}>{o.status}</Badge>
                      </div>
                      <div className="bg-muted/30 rounded-2xl p-4 mb-4 space-y-2">
                          <div className="flex items-center gap-2 border-b border-white pb-2 mb-1"><User className="h-3.5 w-3.5 text-primary" /><span className="text-xs font-black uppercase italic">{o.customerName}</span></div>
                          {o.items?.filter((it:any) => String(it.vendorId) === String(user?.uid)).map((item:any, i:number) => (<div key={i} className="flex justify-between items-center text-xs font-bold"><span>{item.quantity}x {item.name}</span><span className="text-primary font-black">₹{(item.price * item.quantity).toFixed(2)}</span></div>))}
                      </div>
                      <Button variant="outline" className="w-full h-11 rounded-xl font-black text-[9px] uppercase"><Eye className="h-3.5 w-3.5 mr-2" /> View Details</Button>
                    </div>
                  )) : (
                    <div className="text-center py-20 opacity-30 flex flex-col items-center">
                      <ShoppingBag className="h-16 w-16 mb-4" />
                      <p className="font-black italic uppercase text-xs">No orders in this category</p>
                    </div>
                  )}
              </div>
            )}

            {activeMainTab === 'catalog' && (
              <div className="p-4 space-y-4 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between mb-2"><h2 className="text-xl font-black italic uppercase tracking-tighter">Inventory</h2><Button onClick={() => { setEditingProduct(null); setProductProductForm({ name: '', price: '', mrp: '', description: '', category: '', isVeg: true, imageUrl: '', options: [] }); setIsProductModalOpen(true); }} className="bg-black rounded-xl h-10 font-black uppercase text-[10px]"><Plus className="h-3.5 w-3.5 mr-1" /> ADD ITEM</Button></div>
                  <div className="grid grid-cols-1 gap-4">{myProducts?.map(p => (<div key={p.id} className="bg-white p-4 rounded-3xl border border-border/50 flex items-center justify-between shadow-sm"><div className="flex items-center gap-4"><img src={p.imageUrl} className="h-16 w-16 rounded-xl object-cover" alt="" /><div><h4 className="font-black text-sm uppercase italic leading-none mb-1">{p.name}</h4><p className="text-xs font-black text-primary italic">₹{p.price}</p></div></div><div className="flex gap-2"><button onClick={() => { setEditingProduct(p); setProductProductForm({ name: p.name, price: p.price.toString(), mrp: (p.mrp || p.price).toString(), description: p.description || '', category: p.category || '', isVeg: p.isVeg !== false, imageUrl: p.imageUrl, options: p.options || [] }); setIsProductModalOpen(true); }} className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center text-blue-600"><Edit className="h-4 w-4" /></button><button onClick={() => { if(confirm("Delete?")) deleteDoc(doc(firestore!, 'products', p.id)); }} className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500"><Trash2 className="h-4 w-4" /></button></div></div>))}</div>
              </div>
            )}

            {activeMainTab === 'payouts' && (
              <div className="p-4 space-y-6 animate-in fade-in duration-500">
                  <div className="bg-[#0B0B0B] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1"><Wallet className="h-4 w-4 text-primary" /><span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Balance</span></div>
                        <h3 className="text-5xl font-black italic tracking-tighter">₹{vendorProfile?.walletBalance?.toFixed(2) || '0.00'}</h3>
                    </div>
                    <div className="absolute top-0 right-0 h-full w-32 bg-white/5 -skew-x-12 translate-x-10" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 ml-1">History</h2>
                    {payouts?.map(p => (<div key={p.id} className="bg-white p-5 rounded-3xl border border-border/50 flex items-center justify-between shadow-sm"><div className="flex items-center gap-4"><div className="h-11 w-11 bg-green-50 rounded-2xl flex items-center justify-center text-green-600"><ArrowUpRight className="h-6 w-6" /></div><div><h4 className="font-black text-sm italic uppercase">{p.note || 'Settlement'}</h4><p className="text-[9px] font-bold text-muted-foreground uppercase">{p.date?.seconds ? format(new Date(p.date.seconds * 1000), 'MMM d, yyyy') : 'Recent'}</p></div></div><div className="text-right"><span className="text-lg font-black text-green-600">+₹{p.amount}</span></div></div>))}
                  </div>
              </div>
            )}

            {activeMainTab === 'account' && (
              <div className="p-4 space-y-6 animate-in fade-in duration-500">
                  <div className="flex flex-col items-center py-8">
                    <div className="relative group"><div className="h-32 w-32 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden bg-muted">{vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <Store className="h-12 w-12 m-auto text-gray-300" />}</div><button className="absolute bottom-[-10px] right-[-10px] bg-white p-3 rounded-2xl shadow-xl border border-border text-primary"><Camera className="h-5 w-5" /></button></div>
                    <h2 className="text-2xl font-black italic mt-6">{vendorProfile?.storeName}</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{vendorProfile?.category} Provider</p>
                  </div>
                  <div className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm space-y-5">
                    <Input value={profileForm.fullName} onChange={e => setProfileForm({...profileForm, fullName: e.target.value})} placeholder="Owner Name" className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                    <Input value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} placeholder="Store Address" className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                    <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full h-14 bg-black rounded-2xl font-black uppercase italic shadow-xl">{isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} SAVE UPDATES</Button>
                    <Button variant="ghost" onClick={() => { signOut(auth!); router.push('/'); }} className="w-full h-12 text-red-500 font-black uppercase text-[10px]"><LogOut className="h-4 w-4 mr-2" /> DISCONNECT</Button>
                  </div>
              </div>
            )}
         </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-[1000] rounded-t-[2.5rem] shadow-2xl transform-gpu">
        {[
          {id:'orders',label:'Orders',icon:LayoutDashboard},
          {id:'catalog',label:'Catalog',icon:Layers},
          {id:'payouts',label:'Payouts',icon:CircleDollarSign},
          {id:'account',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => startTransition(() => setActiveMainTab(item.id as MainTab))} className="flex flex-col items-center gap-1 active:scale-90 transition-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-primary scale-110" : "text-gray-500")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>

      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-sm max-h-[85vh] overflow-y-auto no-scrollbar focus:outline-none border-none p-0">
           <DialogHeader className="p-6 pb-2 border-b"><DialogTitle className="font-black italic uppercase text-center text-xl">Manager</DialogTitle></DialogHeader>
           <div className="p-6 space-y-6">
              <div onClick={() => fileInputRef.current?.click()} className="h-44 border-2 border-dashed rounded-3xl flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer">{productForm.imageUrl ? <img src={productForm.imageUrl} className="h-full w-full object-cover" /> : <div className="text-center opacity-30"><ImageIcon className="h-8 w-8 mx-auto mb-2" /><span className="text-[10px] font-black uppercase">Upload Photo</span></div>}</div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = async () => setProductProductForm({...productForm, imageUrl: await compressImage(r.result as string, 800, 800)}); r.readAsDataURL(f); } }} />
              <div className="space-y-4">
                <Input placeholder="Product Name" value={productForm.name} onChange={e => setProductProductForm({...productForm, name: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/30 border-none" />
                <div className="grid grid-cols-2 gap-3">
                   <Input placeholder="MRP" type="number" value={productForm.mrp} onChange={e => setProductProductForm({...productForm, mrp: e.target.value})} className="h-12 rounded-xl bg-muted/30 border-none" />
                   <Input placeholder="Price" type="number" value={productForm.price} onChange={e => setProductProductForm({...productForm, price: e.target.value})} className="h-12 rounded-xl border-primary/40" />
                </div>
                <Select value={productForm.category} onValueChange={(val) => setProductProductForm({...productForm, category: val})}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none font-bold"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent className="rounded-2xl">{filteredCategories.map((cat: any) => (<SelectItem key={cat.id} value={cat.name.toLowerCase()} className="font-bold py-3 uppercase text-[10px]">{cat.name}</SelectItem>))}</SelectContent>
                </Select>
                <Textarea placeholder="Details" value={productForm.description} onChange={e => setProductProductForm({...productForm, description: e.target.value})} className="rounded-xl bg-muted/30 border-none h-24 p-4 text-xs" />
              </div>
              <Button onClick={handleSaveProduct} disabled={isSavingProduct} className="w-full h-16 bg-primary rounded-3xl font-black uppercase italic shadow-xl text-white">{isSavingProduct ? <Loader2 className="h-6 w-6 animate-spin" /> : editingProduct ? 'UPDATE' : 'PUBLISH'}</Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
