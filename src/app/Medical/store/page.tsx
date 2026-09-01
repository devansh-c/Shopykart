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
  HeartPulse,
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
  Timer
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

type MainTab = 'orders' | 'catalog' | 'payouts' | 'account';
type OrderFilter = 'NEW ORDERS' | 'DELIVERED' | 'CANCELLED';

export default function MedicalDashboard() {
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

  // KYC States
  const [isKYCOpen, setIsKYCOpen] = useState(false);
  const [isSavingKYC, setIsSavingKYC] = useState(false);
  const [kycForm, setKycForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: ''
  });

  useEffect(() => { setIsMounted(true); }, []);

  // AUTH GUARD & REDIRECT
  useEffect(() => {
    if (!isMounted || authLoading) return;
    const sessionActive = localStorage.getItem('shopykart_session_active') === 'true';
    if (!user && !authLoading) {
      if (!sessionActive) router.replace('/vendor/login?type=Medical');
    }
  }, [user, authLoading, router, isMounted]);

  // Vendor Profile
  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile, loading: profileLoading } = useDoc<any>(vendorRef);

  // Categories for Selection
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'), where('serviceType', '==', 'Medical'));
  }, [firestore]);
  const { data: medicalCategories } = useCollection<any>(categoriesQuery);

  // Product Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '', price: '', mrp: '', description: '', category: '', imageUrl: '', mfgDate: '', expiryDate: '', preparingTime: ''
  });

  const [profileForm, setProfileForm] = useState({ storeName: '', address: '', fullName: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    if (vendorProfile) {
      setProfileForm({
        storeName: vendorProfile.storeName || '',
        address: vendorProfile.address || '',
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

  const handleToggleStore = async (online: boolean) => {
    if (!firestore || !user) return;
    try {
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, 'vendors', user.uid), { isOnline: online, updatedAt: serverTimestamp() });
      if (myProducts) {
        myProducts.forEach(p => { batch.set(doc(firestore, 'products', p.id), { isAvailable: online }, { merge: true }); });
      }
      await batch.commit();
      toast({ title: online ? "Pharmacy Open! 🟢" : "Pharmacy Closed 🔴" });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const handleSaveKYC = async () => {
    if (!firestore || !user) return;
    if (!kycForm.accountHolderName || !kycForm.accountNumber || !kycForm.ifscCode) {
      toast({ variant: "destructive", title: "Incomplete Details" });
      return;
    }
    if (kycForm.accountNumber !== kycForm.confirmAccountNumber) {
      toast({ variant: "destructive", title: "Account Number Mismatch" });
      return;
    }

    setIsSavingKYC(true);
    try {
      await updateDoc(doc(firestore, 'vendors', user.uid), {
        accountHolderName: kycForm.accountHolderName.trim().toUpperCase(),
        accountNumber: kycForm.accountNumber.trim(),
        ifscCode: kycForm.ifscCode.trim().toUpperCase(),
        kycCompleted: true,
        kycUpdatedAt: serverTimestamp()
      });
      setIsKYCOpen(false);
      toast({ title: "KYC Completed! ✅", description: "Payment details saved successfully." });
    } catch (err) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSavingKYC(false);
    }
  };

  const handleStoreImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      setIsUpdatingStoreImage(true);
      try {
        const compressed = await compressImage(reader.result as string, 600, 600);
        if (firestore && user) {
          await updateDoc(doc(firestore, 'vendors', user.uid), { 
            imageUrl: compressed,
            updatedAt: serverTimestamp()
          });
          toast({ title: "Logo Updated!" });
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Update Failed" });
      } finally {
        setIsUpdatingStoreImage(false);
      }
    };
    reader.readAsDataURL(file);
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

  const handleSaveProduct = async () => {
    if (!firestore || !user || !productForm.name || !productForm.price || !productForm.category) {
      toast({ variant: "destructive", title: "Missing Information" });
      return;
    }

    setIsSavingProduct(true);
    const pData = {
      name: productForm.name.trim(),
      price: parseFloat(productForm.price),
      mrp: parseFloat(productForm.mrp) || parseFloat(productForm.price),
      description: productForm.description.trim(),
      category: productForm.category.toLowerCase().trim(),
      preparingTime: parseInt(productForm.preparingTime) || 10,
      vendorId: user.uid,
      restaurantName: vendorProfile?.storeName || 'Pharmacy',
      serviceMode: 'Medical',
      zoneId: vendorProfile?.zoneId || null,
      town: vendorProfile?.town || 'Local',
      imageUrl: productForm.imageUrl || 'https://picsum.photos/seed/med/400/400',
      isAvailable: true,
      mfgDate: productForm.mfgDate || null,
      expiryDate: productForm.expiryDate || null,
      isVeg: true, 
      updatedAt: serverTimestamp(),
      isDeleted: false,
    };

    try {
      const newRef = doc(collection(firestore, 'products'));
      await setDoc(newRef, { ...pData, id: newRef.id, createdAt: serverTimestamp() });
      await setDoc(doc(firestore, 'vendors', user.uid, 'products', newRef.id), { ...pData, id: newRef.id, createdAt: serverTimestamp() });
      
      setIsProductModalOpen(false);
      resetForm();
      toast({ title: "Medicine Entry Added!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSavingProduct(false);
    }
  };

  const resetForm = () => {
    setProductForm({ name: '', price: '', mrp: '', description: '', category: '', imageUrl: '', mfgDate: '', expiryDate: '', preparingTime: '' });
  };

  const filteredOrders = useMemo(() => {
    return orders?.filter(o => {
      const status = (o.status || '').toUpperCase();
      if(orderFilter === 'NEW ORDERS') return !['DELIVERED', 'CANCELLED'].includes(status);
      return status === (orderFilter === 'CANCELLED' ? 'CANCELLED' : 'DELIVERED');
    });
  }, [orders, orderFilter]);

  // STRICT BLOCKING FOR UNAUTHORIZED ACCESS
  if (!isMounted || authLoading || (profileLoading && !vendorProfile) || (!user && !authLoading)) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {(!user && !authLoading) ? 'REDIRECTING TO LOGIN...' : 'VERIFYING SECURE SESSION...'}
        </p>
      </div>
    );
  }

  const isKycMissing = vendorProfile && vendorProfile.kycCompleted !== true;

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative overflow-hidden">
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b shrink-0 z-50">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <HeartPulse className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-sm font-black italic uppercase leading-none">{vendorProfile?.storeName || 'Pharmacy Hub'}</h1>
              <div className="flex items-center gap-1.5 mt-1"><div className={cn("h-1.5 w-1.5 rounded-full", vendorProfile?.isOnline !== false ? "bg-green-500 animate-pulse" : "bg-red-500")} /><p className="text-[8px] font-bold text-muted-foreground uppercase">{vendorProfile?.isOnline !== false ? 'Accepting' : 'Closed'}</p></div>
            </div>
         </div>
         <div className="flex items-center gap-2"><Switch checked={vendorProfile?.isOnline !== false} onCheckedChange={handleToggleStore} className="scale-75 data-[state=checked]:bg-green-500" /></div>
      </header>

      {/* KYC PENDING BANNER - AS PER IMAGE */}
      {isKycMissing && (
        <div 
          onClick={() => setIsKYCOpen(true)}
          className="bg-[#3b82f6] px-5 py-4 flex items-center justify-between cursor-pointer active:brightness-90 transition-all border-b-2 border-blue-600/20"
        >
          <div className="text-white space-y-0.5">
            <h4 className="text-sm font-black uppercase tracking-tight">KYC Pending</h4>
            <p className="text-[10px] font-bold opacity-90 leading-tight">
              KYC must be completed before the user can <br />initiate any transactions
            </p>
          </div>
          <div className="h-9 w-9 border-2 border-white/40 rounded-xl flex items-center justify-center text-white">
            <ChevronRight className="h-5 w-5 stroke-[3]" />
          </div>
        </div>
      )}

      <main className={cn("flex-1 overflow-y-auto no-scrollbar transition-opacity duration-300", isPending ? "opacity-50" : "opacity-100")}>
         <div className="pb-32">
            {activeMainTab === 'orders' && (
              <div className="p-4 space-y-4 animate-in fade-in duration-500">
                  <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-4 border border-border/50">
                    {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                      <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-teal-600 text-white" : "text-gray-400")}>{f}</button>
                    ))}
                  </div>
                  {ordersLoading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div> :
                  filteredOrders?.length > 0 ? filteredOrders.map(o => (
                    <div key={o.id} className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm mb-4">
                      <div className="flex justify-between items-center mb-4">
                          <div><span className="text-lg font-black italic">#{o.orderDisplayId || o.id.slice(-4)}</span><div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase mt-0.5"><Clock className="h-2.5 w-2.5" />{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'MMM d, h:mm a')}</div></div>
                          <Badge className={cn("border-none text-[8px] font-black rounded-full px-2.5 py-1 uppercase", o.status === 'Cancelled' ? "bg-red-50 text-red-600" : o.status === 'Delivered' ? "bg-green-50 text-green-600" : "bg-teal-50 text-teal-600")}>{o.status}</Badge>
                      </div>
                      <div className="bg-muted/30 rounded-2xl p-4 mb-4 space-y-2">
                          <div className="flex items-center gap-2 border-b border-white pb-2 mb-1"><User className="h-3.5 w-3.5 text-teal-600" /><span className="text-xs font-black uppercase italic">{o.customerName}</span></div>
                          {o.items?.filter((it:any) => String(it.vendorId) === String(user?.uid)).map((item:any, i:number) => (<div key={i} className="flex justify-between items-center text-xs font-bold"><span className="text-gray-700">{item.quantity}x {item.name}</span><span className="text-teal-600">₹{(item.price * item.quantity).toFixed(2)}</span></div>))}
                      </div>
                      <button className="w-full bg-white border-2 border-teal-200 text-teal-600 h-11 rounded-xl font-black text-[9px] uppercase active:scale-95 transition-all flex items-center justify-center gap-1.5"><Eye className="h-3.5 w-3.5" /> View Details</button>
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
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter">Pharmacy Catalog</h2>
                    <Dialog open={isProductModalOpen} onOpenChange={(val) => { setIsProductModalOpen(val); if(!val) resetForm(); }}>
                       <DialogTrigger asChild>
                         <Button className="bg-teal-600 rounded-xl h-10 font-black uppercase text-[10px]"><Plus className="h-3.5 w-3.5 mr-1" /> ADD MEDICINE</Button>
                       </DialogTrigger>
                       <DialogContent className="rounded-[2.5rem] max-w-md max-h-[85vh] overflow-y-auto no-scrollbar focus:outline-none p-0">
                          <DialogHeader className="p-6 border-b"><DialogTitle className="font-black italic uppercase text-center">New Medicine entry</DialogTitle></DialogHeader>
                          <div className="p-8 space-y-6">
                             <div onClick={() => fileInputRef.current?.click()} className="h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center bg-muted/20 cursor-pointer overflow-hidden group">
                                {productForm.imageUrl ? <img src={productForm.imageUrl} className="h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-2"><ImageIcon className="h-8 w-8 opacity-20" /><span className="text-[10px] font-black uppercase text-muted-foreground">Product Photo</span></div>}
                             </div>
                             <input type="file" ref={fileInputRef} className="hidden" onChange={handleProductImageSelect} />
                             
                             <div className="space-y-4">
                                <Input placeholder="Medicine Name" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/20 border-none" />
                                <div className="grid grid-cols-2 gap-4">
                                  <Input placeholder="MRP ₹" type="number" value={productForm.mrp} onChange={e => setProductForm({...productForm, mrp: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-none" />
                                  <Input placeholder="Selling Price ₹" type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="h-12 rounded-xl border-teal-400 font-bold" />
                                </div>
                                <Textarea placeholder="Medical Instructions (Dosage, Contents)" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="rounded-xl h-24 bg-muted/20 border-none p-4" />
                                
                                <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-1">
                                     <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Select Category</label>
                                     <Select value={productForm.category} onValueChange={(val) => setProductForm({...productForm, category: val})}>
                                       <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold">
                                         <SelectValue placeholder="Category" />
                                       </SelectTrigger>
                                       <SelectContent className="rounded-2xl">
                                         {medicalCategories?.map((cat: any) => (
                                           <SelectItem key={cat.id} value={cat.name.toLowerCase()} className="font-bold py-3 uppercase text-xs">
                                             {cat.name}
                                           </SelectItem>
                                         ))}
                                       </SelectContent>
                                     </Select>
                                   </div>
                                   <div className="space-y-1">
                                      <label className="text-[9px] font-black uppercase text-teal-600 ml-1">Prep Time (Min)</label>
                                      <div className="relative">
                                         <Timer className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-400" />
                                         <Input type="number" placeholder="10" value={productForm.preparingTime} onChange={e => setProductForm({...productForm, preparingTime: e.target.value})} className="h-12 rounded-xl bg-teal-50 border-none pl-9 font-bold" />
                                      </div>
                                   </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                   <Input placeholder="MFG Date" value={productForm.mfgDate} onChange={e => setProductForm({...productForm, mfgDate: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-none" />
                                   <Input placeholder="EXP Date" value={productForm.expiryDate} onChange={e => setProductForm({...productForm, expiryDate: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-none text-red-500 font-black" />
                                </div>
                             </div>
                             <Button onClick={handleSaveProduct} disabled={isSavingProduct} className="w-full h-16 bg-teal-600 text-white rounded-[2rem] font-black uppercase italic shadow-xl">
                               {isSavingProduct ? <Loader2 className="h-5 w-5 animate-spin" /> : 'PUBLISH ENTRY'}
                             </Button>
                          </div>
                       </DialogContent>
                    </Dialog>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {myProducts?.filter(p => !p.isDeleted)?.map(p => (
                      <div key={p.id} className="bg-white p-4 rounded-3xl border border-border/50 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                          <img src={p.imageUrl} className="h-16 w-16 rounded-xl object-cover bg-muted" alt="" />
                          <div>
                            <h4 className="font-black text-sm uppercase italic leading-none mb-1">{p.name}</h4>
                            <div className="flex items-center gap-2">
                               <p className="text-xs font-black text-teal-600 italic">₹{p.price}</p>
                               {p.preparingTime && <Badge className="bg-gray-100 text-gray-500 text-[8px] font-black border-none uppercase px-1.5"><Timer className="h-2 w-2 mr-1" />{p.preparingTime}m</Badge>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            )}

            {activeMainTab === 'account' && (
              <div className="p-4 pt-0 space-y-6 animate-in fade-in duration-500">
                  <div className="flex flex-col items-center py-8">
                    <div className="relative group">
                      <div className="h-32 w-32 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden bg-muted flex items-center justify-center relative">
                        {vendorProfile?.imageUrl ? (
                          <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" />
                        ) : (
                          <Store className="h-12 w-12 text-gray-300" />
                        )}
                        {isUpdatingStoreImage && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-white" />
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => storeImageInputRef.current?.click()}
                        className="absolute bottom-[-10px] right-[-10px] bg-white p-3 rounded-2xl shadow-xl border border-border text-teal-600 active:scale-90 transition-all"
                      >
                        <Camera className="h-5 w-5" />
                      </button>
                      <input 
                        type="file" 
                        ref={storeImageInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleStoreImageSelect} 
                      />
                    </div>
                    <h2 className="text-2xl font-black italic mt-6">{vendorProfile?.storeName}</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{vendorProfile?.category} Provider</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm space-y-5">
                    <Input value={profileForm.storeName} onChange={e => setProfileForm({...profileForm, storeName: e.target.value})} placeholder="Business Name" className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                    <Input value={profileForm.fullName} onChange={e => setProfileForm({...profileForm, fullName: e.target.value})} placeholder="Owner Name" className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                    <Input value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} placeholder="Pharmacy Address" className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                    <Button onClick={async () => { setIsSavingProfile(true); await updateDoc(doc(firestore!, 'vendors', user!.uid), { storeName: profileForm.storeName, fullName: profileForm.fullName, address: profileForm.address }); setIsSavingProfile(false); toast({title:'Updated Successfully!'}); }} disabled={isSavingProfile} className="w-full h-14 bg-teal-600 text-white rounded-2xl font-black uppercase italic shadow-xl">{isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} SAVE UPDATES</Button>
                  </div>

                  {vendorProfile?.kycCompleted && (
                    <div className="space-y-4">
                       <h3 className="text-[10px] font-black uppercase text-muted-foreground ml-4 tracking-widest">Payout Identity (KYC)</h3>
                       <div className="bg-[#0B0B0B] p-8 rounded-[2.5rem] text-white shadow-2xl border border-white/5 relative overflow-hidden">
                          <div className="relative z-10 space-y-4">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="bg-teal-500/20 p-2 rounded-xl border border-teal-500/20"><ShieldCheck className="h-5 w-5 text-teal-500" /></div>
                                <span className="text-xs font-black uppercase italic tracking-widest text-teal-500">Verified Bank Details</span>
                             </div>
                             <div className="space-y-4">
                                <div>
                                   <span className="text-[8px] font-black uppercase text-gray-500">Account Holder</span>
                                   <p className="text-sm font-black italic uppercase">{vendorProfile.accountHolderName}</p>
                                </div>
                                <div>
                                   <span className="text-[8px] font-black uppercase text-gray-500">Account Number</span>
                                   <p className="text-sm font-black tracking-widest">{vendorProfile.accountNumber}</p>
                                </div>
                                <div>
                                   <span className="text-[8px] font-black uppercase text-gray-500">IFSC Code</span>
                                   <p className="text-sm font-black tracking-widest text-teal-500">{vendorProfile.ifscCode}</p>
                                </div>
                             </div>
                             <button onClick={() => setIsKYCOpen(true)} className="w-full text-gray-500 font-bold uppercase text-[9px] h-10 hover:text-white text-left underline underline-offset-4">UPDATE DETAILS</button>
                          </div>
                          <div className="absolute top-0 right-0 h-full w-40 bg-white/5 -skew-x-12 translate-x-12 pointer-events-none" />
                       </div>
                    </div>
                  )}

                  <Button variant="ghost" onClick={() => { localStorage.removeItem('shopykart_session_active'); signOut(auth!); router.push('/'); }} className="w-full h-12 text-red-500 font-black uppercase text-[10px]"><LogOut className="h-4 w-4 mr-2" /> DISCONNECT</Button>
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
          <button key={item.id} onClick={() => startTransition(() => setActiveMainTab(item.id as MainTab))} className="flex flex-col items-center gap-1.5 active:scale-90 transition-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-teal-500 scale-110" : "text-gray-500")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* FULL SCREEN KYC POPUP - AS REQUESTED */}
      <Dialog open={isKYCOpen} onOpenChange={setIsKYCOpen}>
         <DialogContent className="inset-0 w-full h-full max-w-none rounded-none p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none flex flex-col z-[60000]">
            <div className="bg-primary h-1.5 w-full shrink-0" />
            <DialogHeader className="p-8 pb-4 shrink-0 relative">
               <button onClick={() => setIsKYCOpen(false)} className="absolute top-8 right-8 h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90"><X className="h-5 w-5" /></button>
               <div className="flex flex-col items-center text-center space-y-2">
                  <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-2 shadow-inner"><ShieldCheck className="h-8 w-8" /></div>
                  <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Payment KYC</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Complete your bank identity for payouts.</DialogDescription>
               </div>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-2 space-y-8">
               <div className="space-y-6">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Account Holder Name</label>
                     <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="AS PER BANK PASSBOOK" 
                          value={kycForm.accountHolderName}
                          onChange={e => setKycForm({...kycForm, accountHolderName: e.target.value.toUpperCase()})}
                          className="h-16 pl-12 rounded-[1.5rem] bg-gray-50 border-none font-black text-xs uppercase focus-visible:ring-1 focus-visible:ring-primary/20"
                        />
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Account Number</label>
                     <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          type="password"
                          placeholder="••••••••••••" 
                          value={kycForm.accountNumber}
                          onChange={e => setKycForm({...kycForm, accountNumber: e.target.value.replace(/\D/g,'')})}
                          className="h-16 pl-12 rounded-[1.5rem] bg-gray-50 border-none font-black tracking-[0.4em] focus-visible:ring-1 focus-visible:ring-primary/20"
                        />
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Re-enter Account Number</label>
                     <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="CONFIRM ACCOUNT NUMBER" 
                          value={kycForm.confirmAccountNumber}
                          onChange={e => setKycForm({...kycForm, confirmAccountNumber: e.target.value.replace(/\D/g,'')})}
                          className="h-16 pl-12 rounded-[1.5rem] bg-gray-50 border-none font-black tracking-widest focus-visible:ring-1 focus-visible:ring-primary/20"
                        />
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Bank IFSC Code</label>
                     <div className="relative">
                        <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="e.g. SBIN0001234" 
                          value={kycForm.ifscCode}
                          onChange={e => setKycForm({...kycForm, ifscCode: e.target.value.toUpperCase()})}
                          className="h-16 pl-12 rounded-[1.5rem] bg-gray-50 border-none font-black tracking-widest text-primary focus-visible:ring-1 focus-visible:ring-primary/20"
                        />
                     </div>
                  </div>
               </div>

               <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex items-start gap-4">
                  <ShieldCheck className="h-6 w-6 text-amber-600 shrink-0 mt-1" />
                  <p className="text-[10px] font-bold text-amber-800 uppercase leading-relaxed">
                    Ensure bank details are 100% correct. We are not responsible for wrong transfers due to incorrect KYC info.
                  </p>
               </div>
            </div>

            <div className="p-8 bg-gray-50 shrink-0 pb-12">
               <Button 
                onClick={handleSaveKYC}
                disabled={isSavingKYC}
                className="w-full h-20 bg-[#0B0B0B] hover:bg-primary text-white rounded-[2.5rem] font-black uppercase italic shadow-2xl text-xl transition-all active:scale-95"
               >
                 {isSavingKYC ? <Loader2 className="h-8 w-8 animate-spin" /> : "AUTHENTICATE & SAVE"}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
