
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
  ListTree,
  KeyRound,
  Check
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
  const storeImageInputRef = useRef<HTMLInputElement>(null);
  
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

  const isCurrentlyOpenByTime = useMemo(() => {
    return isStoreScheduleOpen(vendorProfile, currentTimeMins);
  }, [vendorProfile, currentTimeMins]);

  useEffect(() => {
    if (!isMounted || authLoading) return;
    const sessionActive = localStorage.getItem('shopykart_session_active') === 'true';
    if (!user && !authLoading) {
      if (!sessionActive) router.replace('/vendor/login');
    }
  }, [user, authLoading, router, isMounted]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'), limit(100));
  }, [firestore, user]);
  const { data: rawOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

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

  if (!isMounted || authLoading || (profileLoading && !vendorProfile)) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">Restoring secure session...</p>
      </div>
    );
  }

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
                                <span className="text-[9px] font-black uppercase">Grand Total</span>
                                <span className="text-lg font-black italic">₹{o.total?.toFixed(0)}</span>
                             </div>
                          </div>
                      </div>

                      {/* SECURITY CODES SECTION */}
                      {['Placed', 'Accepted', 'Preparing', 'Ready for Pickup'].includes(o.status) && (
                        <div className="grid grid-cols-2 gap-3 mb-6">
                           <div className="bg-[#0B0B0B] p-4 rounded-2xl border border-white/5 text-center">
                              <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest block mb-1">Pickup Code</span>
                              <div className="text-xl font-black italic text-white tracking-widest">{o.pickupOTP || '----'}</div>
                              <span className="text-[6px] font-bold text-gray-500 uppercase mt-1">Give to Rider</span>
                           </div>
                           <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center">
                              <span className="text-[7px] font-black text-primary uppercase tracking-widest block mb-1">Customer OTP</span>
                              <div className="text-xl font-black italic text-gray-800 tracking-widest">{o.deliveryOTP || '------'}</div>
                              <span className="text-[6px] font-bold text-gray-400 uppercase mt-1">Tracker Reference</span>
                           </div>
                        </div>
                      )}

                      {/* WORKFLOW BUTTONS */}
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
                    <div className="text-center py-20 opacity-30 flex flex-col items-center">
                      <ShoppingBag className="h-16 w-16 mb-4" />
                      <p className="font-black italic uppercase text-xs">No orders in this category</p>
                    </div>
                  )}
              </div>
            )}

            {activeMainTab === 'account' && (
              <div className="p-4 space-y-6 animate-in fade-in duration-500">
                  <div className="flex flex-col items-center py-8">
                    <div className="h-32 w-32 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden bg-muted flex items-center justify-center relative">
                      {vendorProfile?.imageUrl && <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" />}
                    </div>
                    <h2 className="text-2xl font-black italic mt-6">{vendorProfile?.storeName}</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{vendorProfile?.category} Provider</p>
                  </div>
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
          <button key={item.id} onClick={() => setActiveMainTab(item.id as MainTab)} className="flex flex-col items-center gap-1 active:scale-90 transition-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-primary scale-110" : "text-gray-500")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
