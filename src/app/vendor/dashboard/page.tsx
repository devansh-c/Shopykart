
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, deleteDoc, updateDoc, orderBy, writeBatch, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  ShoppingBag, 
  Plus, 
  LogOut,
  Utensils,
  LayoutDashboard,
  Layers,
  CircleDollarSign,
  UserCircle2,
  Clock,
  Camera,
  Store,
  X,
  Loader2,
  User,
  Phone,
  CheckCircle2,
  MapPin,
  Sparkles,
  Zap,
  ImageIcon,
  Trash2,
  Wallet,
  History,
  ArrowUpRight,
  ChevronRight,
  Eye,
  Save,
  ShieldCheck,
  CreditCard,
  Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';
import { compressImage } from '@/lib/image-utils';
import dynamic from 'next/dynamic';

const GoogleMapPicker = dynamic(() => import('@/components/shared/GoogleMapPicker'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-2xl flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
});

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
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // KYC States
  const [isKYCOpen, setIsKYCOpen] = useState(false);
  const [isSavingKYC, setIsSavingKYC] = useState(false);
  const [kycForm, setKycForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: ''
  });

  // Product Form State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '', price: '', mrp: '', description: '', category: '', imageUrl: ''
  });

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

  // AUTH GUARD & REDIRECT
  useEffect(() => {
    if (!isMounted || authLoading) return;
    const sessionActive = localStorage.getItem('shopykart_session_active') === 'true';
    if (!user && !authLoading) {
      if (!sessionActive) router.replace('/vendor/login');
    }
  }, [user, authLoading, router, isMounted]);

  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile, loading: profileLoading } = useDoc<any>(vendorRef);

  // Categories for Selection
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: dbCategories } = useCollection<any>(categoriesQuery);

  const isCurrentlyOpenByTime = useMemo(() => {
    return isStoreScheduleOpen(vendorProfile, currentTimeMins);
  }, [vendorProfile, currentTimeMins]);

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
    return query(collection(firestore, 'vendors', user.uid, 'payout_history'), orderBy('date', 'desc'), limit(50));
  }, [firestore, user]);
  const { data: payouts } = useCollection<any>(payoutQuery);

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
      vendorId: user.uid,
      restaurantName: vendorProfile?.storeName || 'Store Hub',
      serviceMode: vendorProfile?.category || 'Food',
      zoneId: vendorProfile?.zoneId || null,
      town: vendorProfile?.town || 'Local',
      imageUrl: productForm.imageUrl || 'https://picsum.photos/seed/shop/400/400',
      isAvailable: true,
      updatedAt: serverTimestamp(),
      isDeleted: false,
    };

    try {
      const newRef = doc(collection(firestore, 'products'));
      await setDoc(newRef, { ...pData, id: newRef.id, createdAt: serverTimestamp() });
      await setDoc(doc(firestore, 'vendors', user.uid, 'products', newRef.id), { ...pData, id: newRef.id, createdAt: serverTimestamp() });
      
      setIsProductModalOpen(false);
      resetProductForm();
      toast({ title: "Product Added to Menu!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSavingProduct(false);
    }
  };

  const resetProductForm = () => {
    setProductForm({ name: '', price: '', mrp: '', description: '', category: '', imageUrl: '' });
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'orders', orderId), { 
        status, 
        updatedAt: serverTimestamp() 
      });
      toast({ title: `Status: ${status}` });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const handleToggleStore = async (online: boolean) => {
    if (!firestore || !user) return;
    try {
      await updateDoc(doc(firestore, 'vendors', user.uid), { isOnline: online, updatedAt: serverTimestamp() });
      toast({ title: online ? "Manual Switch: ON 🟢" : "Manual Switch: OFF 🔴" });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const handleConfirmLocation = async (lat: number, lng: number, address?: string) => {
    if (!firestore || !user) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(firestore, 'vendors', user.uid), {
        lat,
        lng,
        storeGeocodedAddress: address || '',
        updatedAt: serverTimestamp()
      });
      setIsMapOpen(false);
      toast({ title: "Hub Spot Locked! ✅", description: "Your store location is now verified." });
    } catch (err) {
      toast({ variant: "destructive", title: "Pinning Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  // STRICT BLOCKING FOR UNAUTHORIZED ACCESS
  if (!isMounted || authLoading || (profileLoading && !vendorProfile) || (!user && !authLoading)) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">
          {(!user && !authLoading) ? 'REDIRECTING TO LOGIN...' : 'VERIFYING ACCESS...'}
        </p>
      </div>
    );
  }

  const hasLocation = vendorProfile?.lat && vendorProfile?.lng;
  const isKycMissing = vendorProfile && vendorProfile.kycCompleted !== true;

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative overflow-hidden">
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b shrink-0 z-50">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted border border-border/50 shadow-sm">
              {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <Utensils className="h-5 w-5 text-primary" />}
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

      {!hasLocation && activeMainTab === 'orders' && (
        <button 
          onClick={() => setIsMapOpen(true)}
          className="bg-blue-600 text-white px-4 py-3 flex items-center justify-center gap-2 animate-in slide-in-from-top-4 duration-500 relative z-40"
        >
          <MapPin className="h-4 w-4 animate-bounce" />
          <span className="text-[10px] font-black uppercase tracking-widest italic">Action Required: Pin your Hub Spot</span>
        </button>
      )}

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
                    <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm mb-6 relative overflow-hidden group">
                      <div className="flex justify-between items-center mb-6">
                          <div>
                            <span className="text-xl font-black italic">#{o.customerOrderNumber || o.id.slice(-4)}</span>
                            <div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase mt-0.5"><Clock className="h-2.5 w-2.5" />{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'MMM d, h:mm a')}</div>
                          </div>
                          <Badge className={cn("border-none text-[8px] font-black rounded-full px-2.5 py-1 uppercase", o.status === 'Cancelled' ? "bg-red-50 text-red-600" : o.status === 'Delivered' ? "bg-green-50 text-green-600" : "bg-primary/10 text-primary")}>{o.status}</Badge>
                      </div>

                      <div className="bg-muted/30 rounded-2xl p-5 mb-6 space-y-3">
                          <div className="flex items-center gap-3 border-b border-white pb-3 mb-1">
                             <User className="h-4 w-4 text-primary" />
                             <span className="text-sm font-black uppercase italic">{o.customerName}</span>
                             <button onClick={() => window.open(`tel:${o.customerPhone}`)} className="ml-auto bg-green-500 text-white p-2 rounded-xl active:scale-90 shadow-sm"><Phone className="h-3.5 w-3.5" /></button>
                          </div>
                          <div className="space-y-2">
                             {o.items?.map((item:any, i:number) => (
                               <div key={i} className="flex justify-between items-center text-[11px] font-bold">
                                 <span className="text-gray-700">{item.quantity}x {item.name}</span>
                                 <span className="text-primary font-black">₹{(item.price * item.quantity).toFixed(0)}</span>
                               </div>
                             ))}
                             <div className="pt-3 border-t border-white/50 mt-2 flex justify-between items-center">
                                <span className="text-[9px] font-black uppercase text-muted-foreground">Grand Total</span>
                                <span className="text-lg font-black italic text-gray-900">₹{o.total?.toFixed(0)}</span>
                             </div>
                          </div>
                      </div>

                      {['Placed', 'Accepted', 'Preparing', 'Ready for Pickup'].includes(o.status) && (
                        <div className="grid grid-cols-2 gap-3 mb-6">
                           <div className="bg-[#0B0B0B] p-4 rounded-2xl border border-white/5 text-center">
                              <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest block mb-1">Pickup Code</span>
                              <div className="text-xl font-black italic text-white tracking-widest">{o.pickupOTP || '----'}</div>
                           </div>
                           <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                              <span className="text-[7px] font-black text-primary uppercase tracking-widest block mb-1">Tracker OTP</span>
                              <div className="text-xl font-black italic text-gray-800 tracking-widest">{o.deliveryOTP || '------'}</div>
                           </div>
                        </div>
                      )}

                      {orderFilter === 'NEW ORDERS' && (
                        <div className="flex flex-wrap gap-2 pt-2">
                           {o.status === 'Placed' && <Button onClick={() => updateOrderStatus(o.id, 'Accepted')} className="flex-1 h-12 bg-black text-white rounded-xl font-black uppercase text-[10px]">Accept</Button>}
                           {o.status === 'Accepted' && <Button onClick={() => updateOrderStatus(o.id, 'Preparing')} className="flex-1 h-12 bg-blue-600 text-white rounded-xl font-black uppercase text-[10px]">Start Preparing</Button>}
                           {o.status === 'Preparing' && <Button onClick={() => updateOrderStatus(o.id, 'Ready for Pickup')} className="flex-1 h-12 bg-green-600 text-white rounded-xl font-black uppercase text-[10px]">Mark Ready</Button>}
                           
                           {['Placed', 'Accepted', 'Preparing'].includes(o.status) && (
                             <Button onClick={() => { if(confirm("Cancel this order?")) updateOrderStatus(o.id, 'Cancelled'); }} variant="ghost" className="h-12 w-12 rounded-xl text-red-500 bg-red-50"><X className="h-4 w-4" /></Button>
                           )}
                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="text-center py-24 flex flex-col items-center justify-center">
                      <Zap className="h-16 w-16 text-primary mb-4 opacity-20" />
                      <h2 className="text-2xl font-black italic uppercase text-gray-900 leading-none">No active orders</h2>
                    </div>
                  )}
              </div>
            )}

            {activeMainTab === 'catalog' && (
              <div className="p-4 space-y-6 animate-in fade-in duration-500">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter">My Inventory</h2>
                    <Dialog open={isProductModalOpen} onOpenChange={(val) => { setIsProductModalOpen(val); if(!val) resetProductForm(); }}>
                       <DialogTrigger asChild>
                         <Button className="bg-primary hover:bg-black rounded-xl h-12 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20"><Plus className="h-4 w-4 mr-1.5" /> ADD PRODUCT</Button>
                       </DialogTrigger>
                       <DialogContent className="rounded-[2.5rem] max-w-md max-h-[85vh] overflow-y-auto no-scrollbar focus:outline-none p-0">
                          <DialogHeader className="p-8 pb-4 border-b"><DialogTitle className="font-black italic uppercase text-center text-xl tracking-tighter">New Item Listing</DialogTitle></DialogHeader>
                          <div className="p-8 space-y-6">
                             <div onClick={() => fileInputRef.current?.click()} className="h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center bg-muted/20 cursor-pointer overflow-hidden group hover:border-primary transition-all">
                                {productForm.imageUrl ? <img src={productForm.imageUrl} className="h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-2"><ImageIcon className="h-8 w-8 opacity-20" /><span className="text-[10px] font-black uppercase text-muted-foreground">Product Photo</span></div>}
                             </div>
                             <input type="file" ref={fileInputRef} className="hidden" onChange={handleProductImageSelect} />
                             
                             <div className="space-y-4">
                                <Input placeholder="Product Name" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="h-14 rounded-xl font-bold bg-muted/20 border-none" />
                                <div className="grid grid-cols-2 gap-4">
                                  <Input placeholder="MRP ₹" type="number" value={productForm.mrp} onChange={e => setProductForm({...productForm, mrp: e.target.value})} className="h-14 rounded-xl bg-muted/20 border-none" />
                                  <Input placeholder="Selling Price ₹" type="number" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="h-14 rounded-xl border-primary/40 font-black text-primary text-lg italic" />
                                </div>
                                <Textarea placeholder="Description / Features" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="rounded-2xl h-24 bg-muted/20 border-none p-4" />
                                
                                <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Category</label>
                                  <Select value={productForm.category} onValueChange={(val) => setProductForm({...productForm, category: val})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold">
                                      <SelectValue placeholder="Select Category" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl">
                                      {dbCategories?.map((cat: any) => (
                                        <SelectItem key={cat.id} value={cat.name.toLowerCase()} className="font-bold py-3 uppercase text-xs">
                                          {cat.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                             </div>
                             <Button onClick={handleSaveProduct} disabled={isSavingProduct} className="w-full h-18 bg-primary hover:bg-black text-white rounded-[2rem] font-black uppercase italic shadow-xl text-lg">
                               {isSavingProduct ? <Loader2 className="h-6 w-6 animate-spin" /> : 'PUBLISH ITEM'}
                             </Button>
                          </div>
                       </DialogContent>
                    </Dialog>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {myProducts?.filter(p => !p.isDeleted)?.map(p => (
                      <div key={p.id} className="bg-white p-5 rounded-[2.5rem] border border-border/50 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-4">
                          <img src={p.imageUrl} className="h-16 w-16 rounded-2xl object-cover bg-muted border border-border/40" alt="" />
                          <div>
                            <h4 className="font-black text-base uppercase italic leading-none mb-1">{p.name}</h4>
                            <div className="flex items-center gap-2">
                               <span className="text-sm font-black text-primary italic">₹{p.price}</span>
                               <span className="text-[8px] font-bold text-gray-400 line-through">₹{p.mrp}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                           <Button variant="ghost" size="icon" onClick={async () => { if(confirm("Remove item?")) await setDoc(doc(firestore!, 'products', p.id), { isDeleted: true }, { merge: true }); }} className="h-10 w-10 rounded-xl bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>
            )}

            {activeMainTab === 'payouts' && (
              <div className="p-4 space-y-6 animate-in fade-in duration-500">
                  <div className="bg-[#0B0B0B] rounded-[3rem] p-8 text-white relative overflow-hidden shadow-2xl">
                     <div className="relative z-10 space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="bg-primary/20 p-3 rounded-2xl border border-primary/20">
                              <Wallet className="h-8 w-8 text-primary" />
                           </div>
                           <div>
                              <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none">Wallet</h3>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Earnings Control</p>
                           </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
                           <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest block mb-2">Available for Withdrawal</span>
                           <div className="text-5xl font-black italic tracking-tighter text-white">₹{vendorProfile?.walletBalance?.toFixed(2) || '0.00'}</div>
                        </div>

                        <Button className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase italic shadow-xl active:scale-95 transition-all">
                           WITHDRAW NOW
                           <ArrowUpRight className="ml-2 h-5 w-5" />
                        </Button>
                     </div>
                     <div className="absolute top-0 right-0 h-full w-44 bg-primary/5 -skew-x-12 translate-x-12" />
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-black italic uppercase tracking-tighter">Settlement History</h3>
                        <History className="h-4 w-4 text-gray-400" />
                     </div>
                     
                     <div className="space-y-3">
                        {payouts && payouts.length > 0 ? payouts.map((pay: any) => (
                           <div key={pay.id} className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="h-12 w-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                                    <CheckCircle2 className="h-6 w-6" />
                                 </div>
                                 <div>
                                    <h4 className="font-black text-sm uppercase italic leading-none mb-1">₹{pay.amount?.toFixed(2)}</h4>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase">{pay.note || 'Payout Released'}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-[9px] font-black text-gray-400 uppercase italic">{pay.date?.seconds ? format(new Date(pay.date.seconds * 1000), 'MMM d') : 'Recently'}</p>
                                 <Badge className="bg-green-100 text-green-700 border-none text-[7px] font-black uppercase mt-1">COMPLETED</Badge>
                              </div>
                           </div>
                        )) : (
                           <div className="text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed">
                              <CircleDollarSign className="h-12 w-12 mx-auto text-muted-foreground/20 mb-4" />
                              <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No payout history yet</p>
                           </div>
                        )}
                     </div>
                  </div>
              </div>
            )}

            {activeMainTab === 'account' && (
              <div className="p-4 space-y-6 animate-in fade-in duration-500">
                  <div className="flex flex-col items-center py-8">
                    <div className="h-32 w-32 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden bg-muted flex items-center justify-center relative">
                      {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <Store className="h-10 w-10 text-gray-300" />}
                    </div>
                    <h2 className="text-2xl font-black italic mt-6">{vendorProfile?.storeName}</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{vendorProfile?.category} Provider</p>
                  </div>
                  
                  <div className="space-y-4">
                     <h3 className="text-[10px] font-black uppercase text-muted-foreground ml-4 tracking-widest">Business Information</h3>
                     <div className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm space-y-4">
                        <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                           <div className="flex items-center gap-3">
                              <MapPin className="h-5 w-5 text-primary" />
                              <span className="text-xs font-black uppercase">Hub Location</span>
                           </div>
                           <button 
                             onClick={() => setIsMapOpen(true)}
                             className={cn(
                               "px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all",
                               hasLocation ? "bg-green-50 text-green-600" : "bg-primary text-white"
                             )}
                           >
                             {hasLocation ? 'Verified' : 'Set Hub'}
                           </button>
                        </div>
                     </div>
                  </div>

                  {vendorProfile?.kycCompleted && (
                    <div className="space-y-4">
                       <h3 className="text-[10px] font-black uppercase text-muted-foreground ml-4 tracking-widest">Payout Identity (KYC)</h3>
                       <div className="bg-[#0B0B0B] p-8 rounded-[2.5rem] text-white shadow-2xl border border-white/5 relative overflow-hidden">
                          <div className="relative z-10 space-y-4">
                             <div className="flex items-center gap-3 mb-2">
                                <div className="bg-primary/20 p-2 rounded-xl border border-primary/20"><ShieldCheck className="h-5 w-5 text-primary" /></div>
                                <span className="text-xs font-black uppercase italic tracking-widest text-primary">Verified Bank Details</span>
                             </div>
                             <div className="space-y-4">
                                <div>
                                   <span className="text-[8px] font-black uppercase text-gray-500">Account Holder</span>
                                   <p className="text-sm font-black italic uppercase">{vendorProfile.accountHolderName}</p>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                   <div>
                                      <span className="text-[8px] font-black uppercase text-gray-500">Account Number</span>
                                      <p className="text-sm font-black tracking-widest">{vendorProfile.accountNumber}</p>
                                   </div>
                                   <div>
                                      <span className="text-[8px] font-black uppercase text-gray-500">IFSC Code</span>
                                      <p className="text-sm font-black tracking-widest text-primary">{vendorProfile.ifscCode}</p>
                                   </div>
                                </div>
                             </div>
                             <button onClick={() => setIsKYCOpen(true)} className="w-full text-gray-500 font-bold uppercase text-[9px] h-10 hover:text-white text-left underline underline-offset-4">UPDATE DETAILS</button>
                          </div>
                          <div className="absolute top-0 right-0 h-full w-40 bg-white/5 -skew-x-12 translate-x-12 pointer-events-none" />
                       </div>
                    </div>
                  )}

                  <Button variant="ghost" onClick={() => { localStorage.removeItem('shopykart_session_active'); signOut(auth!); router.push('/'); }} className="w-full h-14 text-red-500 font-black uppercase italic text-xs tracking-widest"><LogOut className="h-4 w-4 mr-2" /> DISCONNECT</Button>
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

      {/* PIN HUB MODAL */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
         <DialogContent className="rounded-none sm:rounded-[3rem] max-w-2xl h-full sm:h-[85vh] p-0 overflow-hidden border-none shadow-2xl focus:outline-none flex flex-col">
            <DialogHeader className="sr-only">
               <DialogTitle>Pin Your Hub Location</DialogTitle>
               <DialogDescription>Mark your store building for accurate delivery routing.</DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0 relative">
               <GoogleMapPicker 
                 onConfirm={handleConfirmLocation} 
                 forcedInitialCenter={hasLocation ? { lat: vendorProfile.lat, lng: vendorProfile.lng } : undefined}
               />
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
