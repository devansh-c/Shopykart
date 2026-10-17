
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, updateDoc, orderBy, limit, addDoc, deleteDoc } from 'firebase/firestore';
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
  KeyRound,
  Megaphone,
  Tag,
  Percent,
  Ticket
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
  
  const [activeMainTab, setActiveMainTab] = useState<'orders' | 'catalog' | 'coupons' | 'account'>('orders');
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

  // Announcement State
  const [announcement, setAnnouncement] = useState('');
  const [isAnnActive, setIsAnnActive] = useState(false);
  const [isSavingAnn, setIsSavingAnn] = useState(false);

  // Coupon State
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', value: '', type: 'percentage', minOrder: '0' });
  const [isSavingCoupon, setIsSavingCoupon] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

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

  useEffect(() => {
    if (vendorProfile) {
      setAnnouncement(vendorProfile.storeAnnouncement || '');
      setIsAnnActive(vendorProfile.isAnnouncementActive || false);
    }
  }, [vendorProfile]);

  const couponsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'coupons'), where('vendorId', '==', user.uid));
  }, [firestore, user]);
  const { data: myCoupons } = useCollection<any>(couponsQuery);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore || !vendorProfile) return null;
    const type = vendorProfile.category || 'Food';
    return query(collection(firestore, 'categories'), where('serviceType', '==', type));
  }, [firestore, vendorProfile]);
  const { data: foodCategories } = useCollection<any>(categoriesQuery);

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
      
      if (newStatus === 'Ready for Pickup') {
        updateData.pickupOTP = Math.floor(1000 + Math.random() * 9000).toString();
      }

      await updateDoc(doc(firestore, 'orders', orderId), updateData);
      toast({ title: `Order ${newStatus}!` });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!firestore || !user) return;
    setIsSavingAnn(true);
    try {
      await updateDoc(doc(firestore, 'vendors', user.uid), {
        storeAnnouncement: announcement.trim().toUpperCase(),
        isAnnouncementActive: isAnnActive,
        annUpdatedAt: serverTimestamp()
      });
      toast({ title: "Announcement Updated!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSavingAnn(false);
    }
  };

  const handleSaveCoupon = async () => {
    if (!firestore || !user || !couponForm.code || !couponForm.value) return;
    setIsSavingCoupon(true);
    try {
      await addDoc(collection(firestore, 'coupons'), {
        code: couponForm.code.toUpperCase().trim(),
        discountValue: parseFloat(couponForm.value),
        discountType: couponForm.type,
        minOrderValue: parseFloat(couponForm.minOrder) || 0,
        vendorId: user.uid,
        vendorName: vendorProfile?.storeName || 'Store',
        createdAt: serverTimestamp(),
      });
      setIsCouponModalOpen(false);
      setCouponForm({ code: '', value: '', type: 'percentage', minOrder: '0' });
      toast({ title: "Coupon Created!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Creation Failed" });
    } finally {
      setIsSavingCoupon(false);
    }
  };

  if (!isMounted || authLoading || (profileLoading && !vendorProfile) || (!user && !authLoading)) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">AUTHENTICATING Hub...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative overflow-hidden">
      <header className="bg-white px-4 py-4 border-b flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
           <div className="h-10 w-10 rounded-xl overflow-hidden border-2 border-primary/10 bg-muted shrink-0 shadow-inner">
             <img src={vendorProfile?.imageUrl || 'https://picsum.photos/seed/vendor/200/200'} className="h-full w-full object-cover" alt="" />
           </div>
           <div>
             <h1 className="text-sm font-black italic uppercase tracking-tighter leading-none">{vendorProfile?.storeName}</h1>
             <div className="flex items-center gap-1.5 mt-1">
                <div className={cn("h-1.5 w-1.5 rounded-full", vendorProfile?.isOnline !== false ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                <p className="text-[8px] font-bold text-muted-foreground uppercase">{vendorProfile?.isOnline !== false ? 'Accepting' : 'Closed'}</p>
             </div>
           </div>
        </div>
        <Switch 
          checked={vendorProfile?.isOnline !== false} 
          onCheckedChange={async (o) => { await updateDoc(doc(firestore!, 'vendors', user!.uid), { isOnline: o }); }} 
          className="scale-75 data-[state=checked]:bg-green-500" 
        />
      </header>

      <main className={cn("flex-1 overflow-y-auto no-scrollbar pb-32 transition-opacity", isPending ? "opacity-50" : "opacity-100")}>
        {activeMainTab === 'orders' && (
           <div className="p-4 space-y-4">
              <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm space-y-4">
                 <div className="flex items-center gap-3">
                    <Megaphone className="h-5 w-5 text-primary" />
                    <h3 className="text-sm font-black italic uppercase tracking-tight">Live Store Notice</h3>
                 </div>
                 <Textarea 
                   placeholder="E.G. WE ARE CLOSED TODAY FOR HOLI" 
                   value={announcement}
                   onChange={e => setAnnouncement(e.target.value.toUpperCase())}
                   className="bg-gray-50 border-none font-bold text-xs p-4 rounded-xl min-h-[80px]"
                 />
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black uppercase text-muted-foreground">Show to customers?</span>
                       <Switch checked={isAnnActive} onCheckedChange={setIsAnnActive} className="scale-75 data-[state=checked]:bg-green-500" />
                    </div>
                    <Button onClick={handleSaveAnnouncement} disabled={isSavingAnn} className="h-10 px-6 bg-black text-white rounded-xl font-black uppercase text-[9px]">
                       {isSavingAnn ? <Loader2 className="h-3 w-3 animate-spin" /> : "PUBLISH"}
                    </Button>
                 </div>
              </div>

              <h2 className="text-xl font-black italic uppercase ml-2">Active Orders</h2>
              <div className="space-y-4">
                 {filteredOrders.length > 0 ? filteredOrders.map((o: any) => (
                   <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm mb-4">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                            <span className="text-3xl font-black italic tracking-tighter">#{o.customerOrderNumber || o.id.slice(-4)}</span>
                            <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase mt-1">
                               <Clock className="h-3 w-3 text-primary" />
                               {format(new Date(o.createdAt?.seconds * 1000 || o.createdAt), 'hh:mm a')}
                            </div>
                          </div>
                          <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase px-3 py-1 rounded-full">{o.status}</Badge>
                      </div>

                      <div className="bg-muted/30 rounded-[2rem] p-5 mb-6 space-y-4">
                          <div className="flex items-center gap-3 border-b border-white pb-3 mb-1">
                             <User className="h-4 w-4 text-primary" />
                             <span className="text-sm font-black uppercase italic">{o.customerName}</span>
                          </div>
                          <div className="space-y-2">
                             {o.items?.filter((it:any) => String(it.vendorId) === String(user?.uid)).map((item:any, i:number) => (
                                <div key={i} className="flex justify-between items-center text-xs font-black uppercase italic">
                                   <span className="text-gray-700">{item.quantity}x {item.name}</span>
                                   <span className="text-primary">₹{(item.price * item.quantity).toFixed(0)}</span>
                                </div>
                             ))}
                          </div>
                          {o.pickupOTP && o.status === 'Ready for Pickup' && (
                            <div className="bg-black p-4 rounded-2xl flex flex-col items-center justify-center text-center border-2 border-primary/30 shadow-xl">
                               <span className="text-[7px] font-black text-primary uppercase tracking-[0.3em] mb-1">PICKUP OTP</span>
                               <h4 className="text-2xl font-black italic tracking-[0.5em] text-white pl-2">{o.pickupOTP}</h4>
                            </div>
                          )}
                      </div>

                      <div className="flex flex-col gap-3">
                         {o.status === 'Placed' && (
                           <Button onClick={() => handleUpdateStatus(o.id, 'Accepted')} className="w-full h-16 bg-green-600 text-white rounded-[1.5rem] font-black uppercase italic shadow-lg active:scale-95 transition-all">ACCEPT ORDER</Button>
                         )}
                         {o.status === 'Accepted' && (
                           <Button onClick={() => handleUpdateStatus(o.id, 'Preparing')} className="w-full h-16 bg-primary text-white rounded-[1.5rem] font-black uppercase italic shadow-lg active:scale-95 transition-all">START PREPARING</Button>
                         )}
                         {o.status === 'Preparing' && (
                           <Button onClick={() => handleUpdateStatus(o.id, 'Ready for Pickup')} className="w-full h-16 bg-black text-white rounded-[1.5rem] font-black uppercase italic shadow-lg active:scale-95 transition-all">READY FOR PICKUP</Button>
                         )}
                      </div>
                   </div>
                 )) : (
                   <div className="text-center py-20 opacity-30 flex flex-col items-center">
                      <ShoppingBag className="h-12 w-12 mb-4" />
                      <p className="font-black uppercase text-xs">No active orders.</p>
                   </div>
                 )}
              </div>
           </div>
        )}

        {activeMainTab === 'coupons' && (
           <div className="p-4 space-y-6">
              <div className="flex items-center justify-between mb-2">
                 <h2 className="text-xl font-black italic uppercase ml-2 mt-2">Store Coupons</h2>
                 <Button onClick={() => setIsCouponModalOpen(true)} className="h-10 bg-primary text-white rounded-xl font-black uppercase text-[9px]">+ NEW COUPON</Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                 {myCoupons?.length > 0 ? myCoupons.map((c: any) => (
                   <div key={c.id} className="bg-white p-5 rounded-[2rem] border border-border shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600"><Tag className="h-6 w-6" /></div>
                         <div>
                            <h4 className="font-black italic uppercase text-sm leading-none">{c.code}</h4>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">{c.discountValue}{c.discountType === 'percentage' ? '%' : '₹'} OFF • Min ₹{c.minOrderValue}</p>
                         </div>
                      </div>
                      <button onClick={() => deleteDoc(doc(firestore!, 'coupons', c.id))} className="h-10 w-10 text-red-500 bg-red-50 rounded-xl flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
                   </div>
                 )) : (
                   <div className="text-center py-20 opacity-30 flex flex-col items-center">
                      <Ticket className="h-12 w-12 mb-4" />
                      <p className="font-black uppercase text-xs">Create your first offer.</p>
                   </div>
                 )}
              </div>
           </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-50 rounded-t-[2.5rem] shadow-2xl">
        {[
          {id:'orders',label:'Orders',icon:LayoutDashboard},
          {id:'catalog',label:'Catalog',icon:Layers},
          {id:'coupons',label:'Offers',icon:Tag},
          {id:'account',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => setActiveMainTab(item.id as any)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-primary scale-110" : "text-gray-500")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Coupon Modal */}
      <Dialog open={isCouponModalOpen} onOpenChange={setIsCouponModalOpen}>
         <DialogContent className="rounded-[2.5rem] max-w-sm p-8">
            <DialogHeader><DialogTitle className="font-black italic uppercase text-center">New Coupon</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
               <Input placeholder="COUPON CODE" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
               <div className="grid grid-cols-2 gap-4">
                  <Select value={couponForm.type} onValueChange={v => setCouponForm({...couponForm, type: v})}>
                     <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-none font-bold"><SelectValue /></SelectTrigger>
                     <SelectContent><SelectItem value="percentage">Percent %</SelectItem><SelectItem value="fixed">Fixed ₹</SelectItem></SelectContent>
                  </Select>
                  <Input type="number" placeholder="VALUE" value={couponForm.value} onChange={e => setCouponForm({...couponForm, value: e.target.value})} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
               </div>
               <Input type="number" placeholder="MIN ORDER ₹" value={couponForm.minOrder} onChange={e => setCouponForm({...couponForm, minOrder: e.target.value})} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
               <Button onClick={handleSaveCoupon} disabled={isSavingCoupon} className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl">
                  {isSavingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "CREATE OFFER"}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
