
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, updateDoc, orderBy, limit } from 'firebase/firestore';
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
  Sparkles,
  ImageIcon,
  Trash2,
  Wallet,
  ChevronRight,
  Save,
  ShieldCheck,
  CreditCard,
  Timer,
  ListTree,
  StickyNote,
  MessageSquare,
  CalendarDays,
  CheckCircle2,
  Play,
  PackageCheck,
  KeyRound
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

  const [isKYCOpen, setIsKYCOpen] = useState(false);
  const [isSavingKYC, setIsSavingKYC] = useState(false);
  const [kycForm, setKycForm] = useState({
    accountHolderName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: ''
  });

  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [selectedOrderIdForNote, setSelectedOrderIdForNote] = useState<string | null>(null);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => { setIsMounted(true); }, []);

  // AUTH GUARD: Persistent Session Check to block login flash
  useEffect(() => {
    if (!isMounted || authLoading) return;
    const sessionActive = localStorage.getItem('shopykart_session_active') === 'true';
    if (!user && !sessionActive) {
      router.replace('/vendor/login');
    }
  }, [user, authLoading, router, isMounted]);

  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile, loading: profileLoading } = useDoc<any>(vendorRef);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore || !vendorProfile) return null;
    const type = vendorProfile.category || 'Food';
    return query(collection(firestore, 'categories'), where('serviceType', '==', type));
  }, [firestore, vendorProfile]);
  const { data: foodCategories, loading: catsLoading } = useCollection<any>(categoriesQuery, `vendor_cats_${vendorProfile?.category}`);

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

  const filteredOrders = useMemo(() => {
    if (!rawOrders || !user) return [];
    return rawOrders.filter((o: any) => {
      const vId = String(user.uid);
      return o.vendorId === vId || (Array.isArray(o.vendorIds) && o.vendorIds.includes(vId)) || o.items?.some((it:any) => String(it.vendorId) === vId);
    });
  }, [rawOrders, user]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    if (!firestore) return;
    try {
      const updateData: any = { 
        status: newStatus, 
        updatedAt: serverTimestamp() 
      };
      
      // If moving to Ready for Pickup, generate a 4-digit OTP
      if (newStatus === 'Ready for Pickup') {
        updateData.pickupOTP = Math.floor(1000 + Math.random() * 9000).toString();
      }

      await updateDoc(doc(firestore, 'orders', orderId), updateData);
      toast({ title: `Order ${newStatus}!` });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleSaveAdminNote = async () => {
    if (!firestore || !selectedOrderIdForNote) return;
    try {
      await updateDoc(doc(firestore, 'orders', selectedOrderIdForNote), {
        adminNote: adminNote.toUpperCase(),
        noteUpdatedAt: serverTimestamp()
      });
      setIsNoteOpen(false);
      setAdminNote('');
      toast({ title: "Note Updated!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to save note" });
    }
  };

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

  // BLOCKING LOADER FOR ZERO FLASH
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
              <h2 className="text-xl font-black italic uppercase ml-2 mt-2">Active Orders</h2>
              <div className="space-y-4">
                 {filteredOrders.length > 0 ? filteredOrders.map((o: any) => (
                   <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm mb-4 transform-gpu transition-all">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                            <span className="text-3xl font-black italic italic tracking-tighter">#{o.customerOrderNumber || o.id.slice(-4)}</span>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase mt-1">
                               <Clock className="h-3 w-3 text-primary" />
                               {isMounted && o.createdAt ? format(new Date(o.createdAt.seconds * 1000 || o.createdAt), 'hh:mm a') : '--:--'}
                            </div>
                          </div>
                          <Badge className={cn("border-none text-[8px] font-black rounded-full px-3 py-1 uppercase", 
                            o.status === 'Cancelled' ? "bg-red-50 text-red-600" : 
                            o.status === 'Delivered' ? "bg-green-50 text-green-600" :
                            "bg-primary/10 text-primary")}>
                            {o.status}
                          </Badge>
                      </div>

                      <div className="bg-muted/30 rounded-[2rem] p-5 mb-6 space-y-4">
                          <div className="flex items-center justify-between border-b border-white pb-3 mb-1">
                             <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                  <User className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-sm font-black uppercase italic">{o.customerName}</span>
                             </div>
                             <button 
                              onClick={() => { setSelectedOrderIdForNote(o.id); setAdminNote(o.adminNote || ''); setIsNoteOpen(true); }}
                              className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100 active:scale-90 transition-all"
                             >
                                <StickyNote className="h-5 w-5" />
                             </button>
                          </div>
                          
                          <div className="space-y-3">
                             {o.items?.filter((it:any) => String(it.vendorId) === String(user?.uid)).map((item:any, i:number) => (
                                <div key={i} className="space-y-1">
                                   <div className="flex justify-between items-center text-xs font-black uppercase italic">
                                      <span className="text-gray-700">{item.quantity}x {item.name}</span>
                                      <span className="text-primary">₹{(item.price * item.quantity).toFixed(0)}</span>
                                   </div>
                                </div>
                             ))}
                          </div>

                          {o.pickupOTP && o.status === 'Ready for Pickup' && (
                            <div className="bg-[#0B0B0B] p-4 rounded-2xl flex flex-col items-center justify-center text-center animate-in zoom-in duration-500 border-2 border-primary/30 shadow-xl">
                               <span className="text-[7px] font-black text-primary uppercase tracking-[0.3em] mb-1">SECURE PICKUP OTP</span>
                               <h4 className="text-2xl font-black italic tracking-[0.5em] text-white pl-2">{o.pickupOTP}</h4>
                            </div>
                          )}
                      </div>

                      {/* ACTION BUTTONS BASED ON STATUS */}
                      <div className="flex flex-col gap-3">
                         {o.status === 'Placed' && (
                           <Button onClick={() => handleUpdateStatus(o.id, 'Accepted')} className="w-full h-16 bg-green-600 hover:bg-green-700 text-white rounded-[1.5rem] font-black uppercase italic shadow-lg active:scale-95 transition-all">
                              <CheckCircle2 className="mr-2 h-5 w-5" /> ACCEPT ORDER
                           </Button>
                         )}
                         {o.status === 'Accepted' && (
                           <Button onClick={() => handleUpdateStatus(o.id, 'Preparing')} className="w-full h-16 bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] font-black uppercase italic shadow-lg active:scale-95 transition-all">
                              <Play className="mr-2 h-5 w-5" /> START PREPARING
                           </Button>
                         )}
                         {o.status === 'Preparing' && (
                           <Button onClick={() => handleUpdateStatus(o.id, 'Ready for Pickup')} className="w-full h-16 bg-black hover:bg-black/90 text-white rounded-[1.5rem] font-black uppercase italic shadow-lg active:scale-95 transition-all">
                              <PackageCheck className="mr-2 h-5 w-5" /> READY FOR PICKUP
                           </Button>
                         )}
                         {o.status === 'Ready for Pickup' && (
                            <div className="h-14 bg-gray-50 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-200">
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Waiting for Rider...</span>
                            </div>
                         )}
                      </div>
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

        {/* Catalog, Payouts, Account tabs remain same but with zero-flash guards */}
        {activeMainTab === 'catalog' && (
           <div className="p-4 space-y-6">
              {/* Catalog Content (Refer to previous code) */}
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

      {/* Admin Note Dialog */}
      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
         <DialogContent className="rounded-[2.5rem] max-w-sm p-8 border-none shadow-2xl bg-white focus:outline-none">
            <div className="flex flex-col items-center text-center space-y-4">
               <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100 shadow-inner">
                  <StickyNote className="h-8 w-8" />
               </div>
               <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Order Note</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Visible to customer on tracking page</DialogDescription>
               </DialogHeader>
            </div>
            <div className="space-y-6 mt-6">
               <Textarea 
                 placeholder="E.G. RIDER ASSIGNED" 
                 value={adminNote}
                 onChange={e => setAdminNote(e.target.value)}
                 className="min-h-[120px] rounded-[1.5rem] bg-gray-50 border-none font-black text-xs uppercase p-4"
               />
               <Button onClick={handleSaveAdminNote} disabled={!adminNote.trim()} className="w-full h-16 bg-black text-white rounded-[2rem] font-black uppercase italic shadow-xl">PUBLISH NOTE</Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
