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
  Banknote,
  Timer,
  ListTree,
  AlertCircle,
  StickyNote,
  MessageSquare
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

export default function VendorDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  
  const [activeMainTab, setActiveMainTab] = useState<'orders' | 'catalog' | 'payouts' | 'account'>('orders');
  const [isMounted, setIsMounted] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isVarietyRequired, setIsVarietyRequired] = useState(false);
  const [options, setOptions] = useState<{ name: string; price: number }[]>([]);
  const [productForm, setProductForm] = useState({
    name: '', price: '', mrp: '', description: '', category: '', imageUrl: '', preparingTime: ''
  });

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

  // AUTH GUARD: Prevent repetitive logins
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

  // CATEGORY ISOLATION: Only show relevant categories
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'), where('serviceType', '==', 'Food'));
  }, [firestore]);
  const { data: foodCategories } = useCollection<any>(categoriesQuery);

  // PRODUCT ISOLATION: Only show my products
  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'products'), where('vendorId', '==', user.uid));
  }, [firestore, user]);
  const { data: myProducts } = useCollection<any>(productsQuery);

  // ORDER ISOLATION: Only show my orders (including multi-vendor orders where I have items)
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'), limit(100));
  }, [firestore, user]);
  const { data: rawOrders } = useCollection<any>(ordersQuery);

  const filteredOrders = useMemo(() => {
    if (!rawOrders || !user) return [];
    return rawOrders.filter((o: any) => {
      const vId = String(user.uid);
      return o.vendorId === vId || (Array.isArray(o.vendorIds) && o.vendorIds.includes(vId)) || o.items?.some((it:any) => String(it.vendorId) === vId);
    });
  }, [rawOrders, user]);

  const handleToggleStore = async (online: boolean) => {
    if (!firestore || !user) return;
    try {
      await updateDoc(doc(firestore, 'vendors', user.uid), { 
        isOnline: online, 
        updatedAt: serverTimestamp() 
      });
      toast({ title: online ? "Store Open! 🟢" : "Store Closed 🔴" });
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
      toast({ title: "Bank Details Saved! ✅" });
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
    if (!firestore || !user || !productForm.name || !productForm.price) {
      toast({ variant: "destructive", title: "Missing Info" });
      return;
    }

    setIsSavingProduct(true);
    try {
      const newRef = doc(collection(firestore, 'products'));
      const pData = {
        name: productForm.name.trim(),
        price: parseFloat(productForm.price),
        mrp: parseFloat(productForm.mrp) || parseFloat(productForm.price),
        description: productForm.description.trim(),
        category: productForm.category.toLowerCase().trim() || 'food',
        preparingTime: parseInt(productForm.preparingTime) || 15,
        imageUrl: productForm.imageUrl || 'https://picsum.photos/seed/food/400/400',
        vendorId: user.uid,
        id: newRef.id,
        options: options.filter(opt => opt.name.trim() !== ''),
        isVarietyRequired: isVarietyRequired,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isAvailable: true,
        isDeleted: false,
        restaurantName: vendorProfile?.storeName || 'Store'
      };

      await setDoc(newRef, pData);
      
      setIsProductModalOpen(false);
      resetForm();
      toast({ title: "Product Published!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSavingProduct(false);
    }
  };

  const resetForm = () => {
    setProductForm({ name: '', price: '', mrp: '', description: '', category: '', imageUrl: '', preparingTime: '' });
    setOptions([]);
    setIsVarietyRequired(false);
  };

  if (!isMounted || authLoading || (profileLoading && !vendorProfile) || (!user && !authLoading)) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">AUTHENTICATING Hub...</p>
      </div>
    );
  }

  const isKycMissing = vendorProfile && vendorProfile.kycCompleted !== true;

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative overflow-hidden">
      <header className="bg-white px-4 py-4 border-b flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 rounded-xl overflow-hidden border-2 border-primary/10 bg-muted shrink-0 shadow-inner">
             <img src={vendorProfile?.imageUrl || 'https://picsum.photos/seed/vendor/200/200'} className="h-full w-full object-cover" alt="" />
           </div>
           <div>
             <h1 className="text-sm font-black italic uppercase tracking-tighter leading-none">{vendorProfile?.storeName || 'Vendor Console'}</h1>
             <div className="flex items-center gap-1.5 mt-1">
                <div className={cn("h-1.5 w-1.5 rounded-full", vendorProfile?.isOnline !== false ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                <p className="text-[8px] font-bold text-muted-foreground uppercase">{vendorProfile?.isOnline !== false ? 'Accepting' : 'Closed'}</p>
             </div>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <Switch 
            checked={vendorProfile?.isOnline !== false} 
            onCheckedChange={handleToggleStore} 
            className="scale-75 data-[state=checked]:bg-green-500" 
           />
        </div>
      </header>

      {/* KYC PENDING BANNER - MOBILE FULL SCREEN TRIGGER */}
      {isKycMissing && (
        <div 
          onClick={() => setIsKYCOpen(true)}
          className="bg-[#3b82f6] px-5 py-4 flex items-center justify-between cursor-pointer active:brightness-90 transition-all border-b-2 border-blue-600/20"
        >
          <div className="text-white space-y-0.5">
            <h4 className="text-sm font-black uppercase tracking-tight">Bank Details Missing</h4>
            <p className="text-[10px] font-bold opacity-90 leading-tight">
              Add your bank account to initiate weekly payouts.
            </p>
          </div>
          <div className="h-9 w-9 border-2 border-white/40 rounded-xl flex items-center justify-center text-white">
            <ChevronRight className="h-5 w-5 stroke-[3]" />
          </div>
        </div>
      )}

      <main className={cn("flex-1 overflow-y-auto no-scrollbar pb-32 transition-opacity", isPending ? "opacity-50" : "opacity-100")}>
        {activeMainTab === 'orders' && (
           <div className="p-4 space-y-4">
              <h2 className="text-xl font-black italic uppercase ml-2 mt-2">Store Orders</h2>
              <div className="space-y-4">
                 {filteredOrders.length > 0 ? filteredOrders.map((o: any) => (
                   <div key={o.id} className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm mb-4">
                      <div className="flex justify-between items-center mb-4">
                          <div>
                            <span className="text-lg font-black italic">#{o.customerOrderNumber || o.id.slice(-4)}</span>
                            <div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase mt-0.5"><Clock className="h-2.5 w-2.5" />{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'MMM d, h:mm a')}</div>
                          </div>
                          <Badge className={cn("border-none text-[8px] font-black rounded-full px-2.5 py-1 uppercase", o.status === 'Cancelled' ? "bg-red-50 text-red-600" : "bg-primary/5 text-primary")}>{o.status}</Badge>
                      </div>
                      <div className="bg-muted/30 rounded-2xl p-4 mb-4 space-y-3">
                          <div className="flex items-center gap-2 border-b border-white pb-2 mb-1"><User className="h-3.5 w-3.5 text-primary" /><span className="text-xs font-black uppercase italic">{o.customerName}</span></div>
                          
                          {/* ORDER LEVEL NOTE FOR VENDOR */}
                          {o.deliveryInstructions && (
                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-start gap-2 mb-2">
                               <StickyNote className="h-3 w-3 text-amber-600 shrink-0 mt-0.5" />
                               <p className="text-[10px] font-black italic text-amber-900 leading-tight">"{o.deliveryInstructions}"</p>
                            </div>
                          )}

                          {o.items?.filter((it:any) => String(it.vendorId) === String(user?.uid)).map((item:any, i:number) => (
                            <div key={i} className="space-y-1">
                               <div className="flex justify-between items-center text-xs font-bold">
                                  <span className="text-gray-700">{item.quantity}x {item.name}</span>
                                  <span className="text-primary">₹{(item.price * item.quantity).toFixed(2)}</span>
                               </div>
                               {item.instructions && (
                                 <div className="flex items-center gap-1.5 text-gray-500 pl-2">
                                    <MessageSquare className="h-2.5 w-2.5" />
                                    <span className="text-[9px] font-bold italic">Note: {item.instructions}</span>
                                 </div>
                               )}
                            </div>
                          ))}
                      </div>
                      <button onClick={() => router.push(`/order/track/?id=${o.id}`)} className="w-full bg-white border-2 border-primary/20 text-primary h-11 rounded-xl font-black text-[9px] uppercase active:scale-95 transition-all flex items-center justify-center gap-1.5"><Eye className="h-3.5 w-3.5" /> View Logistics</button>
                   </div>
                 )) : (
                   <div className="text-center py-20 opacity-30 flex flex-col items-center">
                      <ShoppingBag className="h-12 w-12 mb-4" />
                      <p className="font-black uppercase text-xs">No orders for your store yet.</p>
                   </div>
                 )}
              </div>
           </div>
        )}

        {activeMainTab === 'catalog' && (
          <div className="p-4 space-y-6">
            <div className="flex justify-between items-center px-2">
               <h2 className="text-xl font-black italic uppercase">Inventory</h2>
               <Dialog open={isProductModalOpen} onOpenChange={(val) => { setIsProductModalOpen(val); if(!val) resetForm(); }}>
                  <DialogTrigger asChild><Button className="bg-primary text-white rounded-xl h-10 font-black uppercase text-[10px]"><Plus className="h-4 w-4 mr-1" /> ADD ITEM</Button></DialogTrigger>
                  <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl max-h-[85vh] flex flex-col">
                     <DialogHeader className="p-8 pb-2 shrink-0">
                        <DialogTitle className="font-black italic uppercase text-center text-xl">New Product</DialogTitle>
                     </DialogHeader>
                     <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-0 space-y-6">
                        <div onClick={() => fileInputRef.current?.click()} className="h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer bg-muted/20 overflow-hidden relative group">
                           {productForm.imageUrl ? <img src={productForm.imageUrl} className="h-full w-full object-cover" alt="" /> : <div className="text-center"><Camera className="h-8 w-8 text-gray-300 mb-1 mx-auto" /><span className="text-[10px] font-black uppercase text-gray-400">Add Dish Photo</span></div>}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProductImageSelect} />
                        
                        <div className="space-y-4">
                           <Input placeholder="Product Name" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="h-12 rounded-xl border-none bg-gray-50 font-bold" />
                           
                           <div className="grid grid-cols-2 gap-4">
                              <Input type="number" placeholder="Price ₹" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="h-12 rounded-xl border-none bg-gray-50 font-black italic text-primary" />
                              <Input type="number" placeholder="Prep Time (Min)" value={productForm.preparingTime} onChange={e => setProductForm({...productForm, preparingTime: e.target.value})} className="h-12 rounded-xl border-none bg-primary/5 font-black text-center" />
                           </div>

                           <Select value={productForm.category} onValueChange={v => setProductForm({...productForm, category: v})}>
                              <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-none font-bold"><SelectValue placeholder="Pick Category" /></SelectTrigger>
                              <SelectContent className="rounded-2xl">
                                 {foodCategories?.map((c: any) => <SelectItem key={c.id} value={c.name.toLowerCase()} className="font-bold py-3 uppercase text-xs">{c.name}</SelectItem>)}
                              </SelectContent>
                           </Select>

                           <div className="space-y-4 p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                    <div className="bg-primary/10 p-2 rounded-xl text-primary"><ListTree className="h-4 w-4" /></div>
                                    <span className="text-[10px] font-black uppercase tracking-tight">Varieties / Sizes</span>
                                 </div>
                                 <Switch checked={isVarietyRequired} onCheckedChange={setIsVarietyRequired} className="scale-75 data-[state=checked]:bg-primary" />
                              </div>
                              <div className="space-y-2">
                                 {options.map((opt, idx) => (
                                   <div key={idx} className="flex gap-2">
                                      <Input placeholder="Name" value={opt.name} onChange={e => updateOption(idx, 'name', e.target.value)} className="h-10 rounded-xl bg-white border-none font-bold text-xs uppercase flex-[2]" />
                                      <Input type="number" placeholder="+₹" value={opt.price} onChange={e => updateOption(idx, 'price', e.target.value)} className="h-10 rounded-xl bg-white border-none font-black text-xs text-primary flex-1" />
                                      <button onClick={() => handleRemoveOption(idx)} className="text-red-500 h-10 w-10"><Trash2 className="h-4 w-4" /></button>
                                   </div>
                                 ))}
                                 <button onClick={handleAddOption} className="w-full h-10 border-2 border-dashed border-primary/20 text-primary rounded-xl font-black uppercase text-[8px] flex items-center justify-center gap-2">
                                    <Plus className="h-3 w-3" /> ADD VARIETY
                                 </button>
                              </div>
                           </div>
                           <Textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} placeholder="Description..." className="rounded-xl bg-gray-50 border-none p-4" />
                        </div>
                     </div>
                     <div className="p-8 bg-muted/5 border-t">
                        <Button onClick={handleSaveProduct} disabled={isSavingProduct} className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl">
                           {isSavingProduct ? <Loader2 className="h-6 w-6 animate-spin" /> : "PUBLISH TO MENU"}
                        </Button>
                     </div>
                  </DialogContent>
               </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-4">
               {myProducts?.filter(p => !p.isDeleted).map(p => (
                 <div key={p.id} className="bg-white p-4 rounded-[2rem] border border-border/50 shadow-sm flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className="h-16 w-16 rounded-2xl overflow-hidden bg-muted border shrink-0">
                          <img src={p.imageUrl} className="h-full w-full object-cover" alt="" />
                       </div>
                       <div>
                          <h4 className="font-black text-sm uppercase italic leading-none mb-1">{p.name}</h4>
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-black text-primary italic">₹{p.price}</span>
                             {p.preparingTime && <Badge className="bg-green-50 text-green-600 border-none font-black text-[7px] px-1.5 py-0">{p.preparingTime}M</Badge>}
                          </div>
                       </div>
                    </div>
                    <button className="h-10 w-10 text-gray-300"><ChevronRight className="h-4 w-4" /></button>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeMainTab === 'payouts' && (
          <div className="p-4 space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm relative overflow-hidden">
               <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                  <div className="h-16 w-16 bg-primary/5 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                    <Wallet className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Available to Withdraw</span>
                    <h2 className="text-5xl font-black italic text-gray-900 tracking-tighter">₹{vendorProfile?.walletBalance?.toFixed(2) || '0.00'}</h2>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <div className="flex items-center justify-between px-2">
                 <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Identity & Payouts</h3>
                 <button 
                  onClick={() => setIsKYCOpen(true)}
                  className="flex items-center gap-2 text-primary font-black uppercase text-[10px] bg-primary/5 px-4 py-2 rounded-full border border-primary/10"
                 >
                   <CreditCard className="h-3.5 w-3.5" />
                   {vendorProfile?.kycCompleted ? 'Update Bank' : 'Add Bank Account'}
                 </button>
               </div>

               {vendorProfile?.kycCompleted && (
                 <div className="bg-[#0B0B0B] p-8 rounded-[2.5rem] text-white shadow-2xl border border-white/5 relative overflow-hidden">
                    <div className="relative z-10 space-y-4">
                       <div className="flex items-center gap-3">
                          <div className="bg-primary/20 p-2 rounded-xl border border-primary/20"><ShieldCheck className="h-5 w-5 text-primary" /></div>
                          <span className="text-xs font-black uppercase italic tracking-widest text-primary">Verified Bank Details</span>
                       </div>
                       <div className="grid grid-cols-1 gap-4">
                          <div>
                             <span className="text-[8px] font-black uppercase text-gray-500">Account Holder</span>
                             <p className="text-sm font-black italic uppercase">{vendorProfile.accountHolderName}</p>
                          </div>
                          <div className="flex justify-between items-end">
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
                    </div>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeMainTab === 'account' && (
           <div className="p-4 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-border/50 text-center space-y-4">
                 <div className="h-24 w-24 bg-muted rounded-3xl mx-auto overflow-hidden border-4 border-white shadow-xl">
                    <img src={vendorProfile?.imageUrl} className="h-full w-full object-cover" alt="" />
                 </div>
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter">{vendorProfile?.storeName}</h2>
                 <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">Partner ID: {vendorProfile?.storeId?.toUpperCase()}</p>
                 <div className="pt-6 border-t border-gray-50 flex flex-col gap-3">
                   <Button variant="ghost" onClick={() => { localStorage.removeItem('shopykart_session_active'); signOut(auth!); router.replace('/'); }} className="w-full h-12 text-red-500 font-black uppercase text-[10px]"><LogOut className="h-4 w-4 mr-2" /> DISCONNECT ACCOUNT</Button>
                 </div>
              </div>
           </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-[1000] rounded-t-[2.5rem] shadow-2xl transform-gpu">
        {[
          {id:'orders',label:'Orders',icon:LayoutDashboard},
          {id:'catalog',label:'Catalog',icon:Layers},
          {id:'payouts',label:'Payouts',icon:CircleDollarSign},
          {id:'account',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => startTransition(() => setActiveMainTab(item.id as any))} className="flex flex-col items-center gap-1.5 active:scale-90 transition-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-primary scale-110" : "text-gray-500")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* KYC HUB - MOBILE OPTIMIZED FULL SCREEN */}
      <Dialog open={isKYCOpen} onOpenChange={setIsKYCOpen}>
         <DialogContent className="inset-0 w-full h-full max-w-none rounded-none p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none flex flex-col z-[60000]">
            <div className="bg-primary h-1.5 w-full shrink-0" />
            <DialogHeader className="p-8 pb-4 shrink-0 relative">
               <button onClick={() => setIsKYCOpen(false)} className="absolute top-8 right-8 h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 active:scale-90"><X className="h-5 w-5" /></button>
               <div className="flex flex-col items-center text-center space-y-2">
                  <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-2 shadow-inner"><ShieldCheck className="h-8 w-8" /></div>
                  <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">KYC HUB</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Complete bank identity for payouts.</DialogDescription>
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
                  <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-1" />
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
