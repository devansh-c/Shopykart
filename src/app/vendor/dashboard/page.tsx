"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, deleteDoc, updateDoc, orderBy, writeBatch, limit } from 'firebase/firestore';
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
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';

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
  const [currentTimeMins, setCurrentTimeMins] = useState<number | null>(null);

  useEffect(() => { 
    setIsMounted(true); 
    const syncTime = () => {
      const now = new Date();
      setCurrentTimeMins(now.getHours() * 60 + now.getMinutes());
    };
    syncTime();
    const interval = setInterval(syncTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile, loading: profileLoading } = useDoc<any>(vendorRef);

  // AUTOMATIC STATUS CHECK
  const isCurrentlyOpenByTime = useMemo(() => {
    return isStoreScheduleOpen(vendorProfile, currentTimeMins);
  }, [vendorProfile, currentTimeMins]);

  // AUTH GUARD
  useEffect(() => {
    if (!isMounted || authLoading) return;
    const sessionActive = localStorage.getItem('shopykart_session_active') === 'true';
    if (!user && !authLoading) {
      if (!sessionActive) router.replace('/vendor/login');
    }
  }, [user, authLoading, router, isMounted]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: allCategories } = useCollection<any>(categoriesQuery);

  const filteredCategories = useMemo(() => {
    if (!allCategories || !vendorProfile) return [];
    const vType = (vendorProfile.category || 'Food').toLowerCase();
    return allCategories.filter((cat: any) => (cat.serviceType || 'Food').toLowerCase() === vType);
  }, [allCategories, vendorProfile]);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    name: '', price: '', mrp: '', description: '', category: '', isVeg: true, isVarietyRequired: false, imageUrl: '', options: [] as any[]
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [profileForm, setProfileForm] = useState({ storeName: '', address: '', phone: '', fullName: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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

  const orders = useMemo(() => {
    if (!rawOrders || !user) return [];
    return rawOrders.filter((o: any) => {
      const vId = String(user.uid);
      return o.vendorId === vId || (Array.isArray(o.vendorIds) && o.vendorIds.includes(vId)) || o.items?.some((it:any) => String(it.vendorId) === vId);
    });
  }, [rawOrders, user]);

  const filteredOrders = useMemo(() => {
    return orders?.filter(o => {
      const status = (o.status || '').toUpperCase();
      if(orderFilter === 'NEW ORDERS') return !['DELIVERED', 'CANCELLED'].includes(status);
      return status === (orderFilter === 'CANCELLED' ? 'CANCELLED' : 'DELIVERED');
    });
  }, [orders, orderFilter]);

  const handleToggleStore = async (online: boolean) => {
    if (!firestore || !user) return;
    try {
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, 'vendors', user.uid), { isOnline: online, updatedAt: serverTimestamp() });
      if (myProducts) {
        myProducts.forEach(p => { 
          batch.set(doc(firestore, 'products', p.id), { isAvailable: online }, { merge: true }); 
        });
      }
      await batch.commit();
      toast({ title: online ? "Manual Switch: ON 🟢" : "Manual Switch: OFF 🔴" });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
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
    setProductForm(prev => ({
      ...prev,
      options: [...prev.options, { name: '', price: 0 }]
    }));
  };

  const handleRemoveOption = (index: number) => {
    setProductForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...productForm.options];
    (newOptions[index] as any)[field] = field === 'price' ? parseFloat(value) || 0 : value;
    setProductForm(prev => ({ ...prev, options: newOptions }));
  };

  const handleSaveProduct = async () => {
    if (!firestore || !user || !productForm.name || !productForm.price || !productForm.category) {
      toast({ variant: "destructive", title: "Missing Info" });
      return;
    }
    setIsSavingProduct(true);
    const productData = {
      name: productForm.name.trim(),
      mrp: parseFloat(productForm.mrp) || parseFloat(productForm.price),
      price: parseFloat(productForm.price),
      description: productForm.description.trim(),
      category: productForm.category.toLowerCase().trim(),
      vendorId: user.uid,
      restaurantName: vendorProfile?.storeName || 'My Store',
      isVeg: productForm.isVeg,
      imageUrl: productForm.imageUrl || 'https://picsum.photos/seed/food/300/300',
      options: productForm.options.filter(o => o.name.trim() !== ''),
      isVarietyRequired: productForm.isVarietyRequired,
      isAvailable: vendorProfile?.isOnline !== false,
      updatedAt: serverTimestamp(),
      isDeleted: false,
    };
    try {
      if (editingId) {
        await setDoc(doc(firestore, 'products', editingId), productData, { merge: true });
        await setDoc(doc(firestore, 'vendors', user.uid, 'products', editingId), productData, { merge: true });
      } else {
        const newRef = doc(collection(firestore, 'products'));
        await setDoc(newRef, { ...productData, id: newRef.id, createdAt: serverTimestamp() });
        await setDoc(doc(firestore, 'vendors', user.uid, 'products', newRef.id), { ...productData, id: newRef.id, createdAt: serverTimestamp() });
      }
      setIsProductModalOpen(false);
      setEditingId(null);
      toast({ title: "Product Saved!" });
    } catch (e) { toast({ variant: "destructive", title: "Save Failed" }); }
    finally { setIsSavingProduct(false); }
  };

  if (!isMounted || authLoading || (profileLoading && !vendorProfile)) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Restoring secure session...</p>
      </div>
    );
  }

  const myActiveProducts = myProducts?.filter(p => !p.isDeleted) || [];

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative overflow-hidden">
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b shrink-0 z-50">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted border border-border/50">
              {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <Utensils className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-sm font-black italic uppercase leading-none">{vendorProfile?.storeName}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={cn("h-1.5 w-1.5 rounded-full", (vendorProfile?.isOnline !== false && isCurrentlyOpenByTime) ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                <p className="text-[8px] font-bold text-muted-foreground uppercase">
                  {(vendorProfile?.isOnline !== false && isCurrentlyOpenByTime) ? 'Accepting Orders' : 'Store Closed'}
                </p>
              </div>
            </div>
         </div>
         <div className="flex items-center gap-3">
            <span className="text-[7px] font-black uppercase text-muted-foreground">Master Switch</span>
            <Switch checked={vendorProfile?.isOnline !== false} onCheckedChange={handleToggleStore} className="scale-75 data-[state=checked]:bg-green-500" />
         </div>
      </header>

      <main className={cn("flex-1 overflow-y-auto no-scrollbar transition-opacity duration-300", isPending ? "opacity-50" : "opacity-100")}>
         <div className="pb-32">
            <div className="p-4">
               {/* TIMING INFO BANNER */}
               <div className={cn(
                 "p-4 rounded-2xl border-2 mb-6 flex items-center justify-between",
                 isCurrentlyOpenByTime ? "bg-green-50 border-green-100 text-green-700" : "bg-red-50 border-red-100 text-red-700"
               )}>
                  <div className="flex items-center gap-3">
                     <Clock className="h-5 w-5" />
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest">Automatic Schedule</span>
                        <span className="text-xs font-bold italic uppercase">{vendorProfile?.openingTime} - {vendorProfile?.closingTime}</span>
                     </div>
                  </div>
                  <Badge className={cn("border-none text-[8px] font-black", isCurrentlyOpenByTime ? "bg-green-600 text-white" : "bg-red-600 text-white")}>
                    {isCurrentlyOpenByTime ? 'LIVE NOW' : 'OFFLINE'}
                  </Badge>
               </div>
            </div>

            {activeMainTab === 'orders' && (
              <div className="p-4 pt-0 space-y-4 animate-in fade-in duration-500">
                  <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-4 border border-border/50">
                    {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                      <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-black text-white" : "text-gray-400")}>{f}</button>
                    ))}
                  </div>
                  {ordersLoading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> :
                  filteredOrders?.length > 0 ? filteredOrders.map(o => (
                    <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm mb-4">
                      <div className="flex justify-between items-center mb-4">
                          <div><span className="text-lg font-black italic">#{o.orderDisplayId || o.id.slice(-4)}</span><div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase mt-0.5"><Clock className="h-2.5 w-2.5" />{o.createdAt?.seconds ? format(new Date(o.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Recently'}</div></div>
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
              <div className="p-4 pt-0 space-y-4 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter">Inventory</h2>
                    <Dialog open={isProductModalOpen} onOpenChange={(val) => { setIsProductModalOpen(val); if(!val) { setEditingId(null); setProductForm({ name: '', price: '', mrp: '', description: '', category: '', isVeg: true, isVarietyRequired: false, imageUrl: '', options: [] }); } }}>
                      <DialogTrigger asChild>
                        <Button className="bg-black rounded-xl h-10 font-black uppercase text-[10px]"><Plus className="h-3.5 w-3.5 mr-1" /> ADD ITEM</Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-[2.5rem] max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar focus:outline-none p-0">
                        <DialogHeader className="p-6 border-b"><DialogTitle className="font-black italic uppercase text-center">{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle></DialogHeader>
                        <div className="p-8 space-y-8">
                           <div onClick={() => fileInputRef.current?.click()} className="h-40 border-2 border-dashed rounded-[2rem] flex items-center justify-center bg-muted/20 cursor-pointer overflow-hidden group">
                              {productForm.imageUrl ? <img src={productForm.imageUrl} className="h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-2"><ImageIcon className="h-8 w-8 opacity-20" /><span className="text-[10px] font-black uppercase text-muted-foreground">Product Photo</span></div>}
                           </div>
                           <input type="file" ref={fileInputRef} className="hidden" onChange={handleProductImageSelect} />
                           
                           <div className="space-y-4">
                              <Input placeholder="Product Name" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/20 border-none" />
                              <div className="grid grid-cols-2 gap-4">
                                <Input placeholder="MRP ₹" type="number" value={productForm.mrp} onChange={e => setProductForm({...productForm, mrp: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-none" />
                                <Input placeholder="Price ₹" type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="h-12 rounded-xl border-primary/40 font-bold" />
                              </div>
                              <Textarea placeholder="Description" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="rounded-xl h-24 bg-muted/20 border-none p-4" />
                              
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Choose Category</label>
                                <Select value={productForm.category} onValueChange={(val) => setProductForm({...productForm, category: val})}>
                                  <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold">
                                    <SelectValue placeholder="Select Category" />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-2xl">
                                    {filteredCategories.map((cat: any) => (
                                      <SelectItem key={cat.id} value={cat.name.toLowerCase()} className="font-bold py-3 uppercase text-xs">
                                        {cat.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                 <span className="text-xs font-black uppercase">Pure Veg?</span>
                                 <Switch checked={productForm.isVeg} onCheckedChange={v => setProductForm({...productForm, isVeg: v})} />
                              </div>
                           </div>

                           {/* VARIETY / OPTIONS BUILDER */}
                           <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200 space-y-6">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-xl text-primary"><ListPlus className="h-5 w-5" /></div>
                                    <h3 className="text-sm font-black uppercase tracking-tight">Varieties / Options</h3>
                                 </div>
                                 <Button type="button" onClick={handleAddOption} className="bg-white border-2 border-gray-100 text-gray-800 h-9 rounded-xl font-black uppercase text-[9px] hover:bg-gray-50"><Plus className="h-3 w-3 mr-1" /> ADD OPTION</Button>
                              </div>

                              {productForm.options.length > 0 && (
                                <div className="space-y-3">
                                   {productForm.options.map((opt, idx) => (
                                     <div key={idx} className="flex gap-3 animate-in slide-in-from-right-2 duration-300">
                                        <Input value={opt.name} onChange={e => updateOption(idx, 'name', e.target.value)} placeholder="e.g. Regular Size" className="flex-1 h-11 rounded-xl bg-white border-none font-bold text-xs" />
                                        <Input type="number" value={opt.price} onChange={e => updateOption(idx, 'price', e.target.value)} placeholder="+ ₹" className="w-24 h-11 rounded-xl bg-white border-none font-black text-center text-primary" />
                                        <button onClick={() => handleRemoveOption(idx)} className="h-11 w-11 rounded-xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><X className="h-4 w-4" /></button>
                                     </div>
                                   ))}

                                   <div className="pt-4 border-t border-dashed flex items-center justify-between">
                                      <div className="flex flex-col">
                                         <span className="text-xs font-black uppercase">Selection Required?</span>
                                         <span className="text-[8px] font-bold text-muted-foreground uppercase">Customer must pick one to checkout</span>
                                      </div>
                                      <Switch checked={productForm.isVarietyRequired} onCheckedChange={v => setProductForm({...productForm, isVarietyRequired: v})} />
                                   </div>
                                </div>
                              )}
                              {productForm.options.length === 0 && (
                                <p className="text-[9px] font-bold text-muted-foreground text-center uppercase tracking-widest italic opacity-50">No varieties defined yet.</p>
                              )}
                           </div>

                           <Button onClick={handleSaveProduct} disabled={isSavingProduct} className="w-full h-18 bg-primary text-white rounded-[2rem] font-black uppercase italic text-lg shadow-xl">
                             {isSavingProduct ? <Loader2 className="h-6 w-6 animate-spin" /> : editingId ? 'UPDATE PRODUCT' : 'PUBLISH ITEM'}
                           </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {myActiveProducts?.map(p => (
                      <div key={p.id} className="bg-white p-4 rounded-3xl border border-border/50 flex items-center justify-between shadow-sm relative overflow-hidden group">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <img src={p.imageUrl} className="h-16 w-16 rounded-xl object-cover bg-muted" alt="" />
                            {p.options?.length > 0 && (
                              <div className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border border-white">
                                <ListPlus className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-black text-sm uppercase italic leading-none mb-1">{p.name}</h4>
                            <p className="text-xs font-black text-primary italic">₹{p.price}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingId(p.id); setProductForm({ ...p, options: p.options || [] }); setIsProductModalOpen(true); }} className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center text-blue-600"><Edit className="h-4 w-4" /></button>
                          <button onClick={async () => { if(confirm("Delete item?")) { await setDoc(doc(firestore!, 'products', p.id), { isDeleted: true }, { merge: true }); toast({title: 'Deleted'}); } }} className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            )}

            {activeMainTab === 'account' && (
              <div className="p-4 pt-0 space-y-6 animate-in fade-in duration-500">
                  <div className="flex flex-col items-center py-8">
                    <div className="relative group"><div className="h-32 w-32 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden bg-muted">{vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <Store className="h-12 w-12 m-auto text-gray-300" />}</div><button className="absolute bottom-[-10px] right-[-10px] bg-white p-3 rounded-2xl shadow-xl border border-border text-primary"><Camera className="h-5 w-5" /></button></div>
                    <h2 className="text-2xl font-black italic mt-6">{vendorProfile?.storeName}</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{vendorProfile?.category} Provider</p>
                  </div>
                  <div className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm space-y-5">
                    <Input value={profileForm.fullName} onChange={e => setProfileForm({...profileForm, fullName: e.target.value})} placeholder="Owner Name" className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                    <Input value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} placeholder="Store Address" className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                    <Button onClick={async () => { setIsSavingProfile(true); await updateDoc(doc(firestore!, 'vendors', user!.uid), { fullName: profileForm.fullName, address: profileForm.address }); setIsSavingProfile(false); toast({title:'Updated'}); }} disabled={isSavingProfile} className="w-full h-14 bg-black rounded-2xl font-black uppercase italic shadow-xl">{isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} SAVE UPDATES</Button>
                    <Button variant="ghost" onClick={() => { localStorage.removeItem('shopykart_session_active'); signOut(auth!); router.push('/'); }} className="w-full h-12 text-red-500 font-black uppercase text-[10px]"><LogOut className="h-4 w-4 mr-2" /> DISCONNECT</Button>
                  </div>
              </div>
            )}
         </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-1000 rounded-t-[2.5rem] shadow-2xl transform-gpu">
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
    </div>
  );
}
