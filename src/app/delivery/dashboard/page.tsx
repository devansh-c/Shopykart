
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { 
  Navigation, 
  Package, 
  CheckCircle, 
  MapPin, 
  LogOut, 
  BellRing, 
  Compass, 
  Map, 
  User, 
  PhoneCall, 
  History,
  LayoutDashboard,
  Clock,
  ShieldAlert,
  Loader2,
  X,
  ExternalLink,
  CircleDollarSign,
  UserCircle2,
  CheckCircle2,
  XCircle,
  Wallet,
  ArrowDownLeft,
  Camera,
  KeyRound,
  ChevronRight,
  ShoppingBasket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef, useMemo, memo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

type MainTab = 'home' | 'history' | 'payout' | 'profile';
type OrderFilter = 'NEW' | 'DELIVERED' | 'CANCELLED';

const OrderCard = memo(({ order, onUpdate, onMapOpen, filter }: any) => {
  const [enteredCode, setEnteredCode] = useState('');
  const isReadyForPickup = order.status === 'Ready for Pickup';
  const isOutForDelivery = order.status === 'Out for Delivery';
  const isPickedUp = order.status === 'Picked Up';

  const handleAction = () => {
    if (isReadyForPickup) {
      if (enteredCode === order.pickupOTP) {
        onUpdate(order.id, 'Picked Up');
        setEnteredCode('');
      } else {
        alert("Invalid Pickup Code! Ask the vendor for the 4-digit code.");
      }
    } else if (isPickedUp) {
      onUpdate(order.id, 'Out for Delivery');
    } else if (isOutForDelivery) {
      if (enteredCode === order.deliveryOTP) {
        onUpdate(order.id, 'Delivered');
        setEnteredCode('');
      } else {
        alert("Invalid Delivery OTP! Ask the customer for the 6-digit code.");
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm relative overflow-hidden group transform-gpu transition-all hover:shadow-xl">
       <div className="flex justify-between items-start mb-6">
          <div>
             <Badge className={cn("border-none uppercase text-[8px] font-black px-3 py-1 rounded-full mb-3", order.status === 'Cancelled' ? "bg-red-50 text-red-600" : order.status === 'Delivered' ? "bg-green-50 text-green-600" : "bg-primary/10 text-primary")}>
               {order.status}
             </Badge>
             <h3 className="text-2xl font-black italic tracking-tighter leading-none">Order #{order.customerOrderNumber || 'N/A'}</h3>
             <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase mt-1.5"><Clock className="h-3 w-3" />{format(new Date(order.createdAt?.seconds * 1000 || Date.now()), 'MMM d, h:mm a')}</div>
          </div>
          <button onClick={() => onMapOpen(order)} className="h-14 w-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-lg shadow-blue-200">
            <Navigation className="h-7 w-7" />
          </button>
       </div>

       <div className="bg-muted/30 rounded-[2rem] p-5 mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-sm text-primary"><User className="h-5 w-5" /></div>
            <span className="text-sm font-black uppercase italic tracking-tighter text-gray-800">{order.customerName}</span>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-white p-2 rounded-xl shadow-sm text-primary shrink-0"><MapPin className="h-5 w-5" /></div>
            <span className="text-[11px] font-bold text-gray-600 leading-tight">{order.address}</span>
          </div>
          
          <div className="pt-3 border-t border-white/50 space-y-2">
             <div className="flex items-center gap-2 mb-2">
                <ShoppingBasket className="h-3.5 w-3.5 text-primary" />
                <span className="text-[9px] font-black uppercase text-gray-400">Products & Bill</span>
             </div>
             {order.items?.map((item: any, i: number) => (
               <div key={i} className="flex justify-between items-center text-[10px] font-bold">
                 <span className="text-gray-700">{item.quantity}x {item.name}</span>
                 <span className="text-primary">₹{(item.price * item.quantity).toFixed(0)}</span>
               </div>
             ))}
             <div className="pt-2 flex justify-between items-center border-t border-white/20 mt-2">
                <span className="text-[10px] font-black uppercase">Total Collection</span>
                <span className="text-base font-black italic text-gray-900">₹{order.total?.toFixed(0)}</span>
             </div>
          </div>
       </div>

       {isReadyForPickup && (
         <div className="mb-6 space-y-3 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-amber-600">
               <KeyRound className="h-4 w-4" />
               <span className="text-[10px] font-black uppercase">Enter 4-Digit Pickup Code from Vendor</span>
            </div>
            <Input 
              type="tel"
              placeholder="0 0 0 0" 
              maxLength={4}
              value={enteredCode}
              onChange={e => setEnteredCode(e.target.value.replace(/\D/g,''))}
              className="h-14 rounded-2xl bg-gray-50 border-none text-center font-black text-2xl tracking-[0.8em]"
            />
         </div>
       )}

       {isOutForDelivery && (
         <div className="mb-6 space-y-3 animate-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-primary">
               <ShieldAlert className="h-4 w-4" />
               <span className="text-[10px] font-black uppercase">Enter 6-Digit Delivery OTP from Customer</span>
            </div>
            <Input 
              type="tel"
              placeholder="0 0 0 0 0 0" 
              maxLength={6}
              value={enteredCode}
              onChange={e => setEnteredCode(e.target.value.replace(/\D/g,''))}
              className="h-14 rounded-2xl bg-gray-50 border-none text-center font-black text-2xl tracking-[0.5em]"
            />
         </div>
       )}

       {filter === 'NEW' && (
         <div className="flex gap-3">
            {isReadyForPickup && (
              <Button 
                onClick={handleAction} 
                disabled={enteredCode.length !== 4}
                className="flex-1 bg-black h-16 rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all"
              >
                VERIFY & PICKUP
              </Button>
            )}
            {isPickedUp && (
              <Button 
                onClick={handleAction} 
                className="flex-1 bg-blue-600 h-16 rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all"
              >
                START DELIVERY
              </Button>
            )}
            {isOutForDelivery && (
              <Button 
                onClick={handleAction} 
                disabled={enteredCode.length !== 6}
                className="flex-1 bg-green-600 h-16 rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all"
              >
                VERIFY & DELIVER
              </Button>
            )}
         </div>
       )}
    </div>
  );
});
OrderCard.displayName = "OrderCard";

export default function DeliveryDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [isPending, startTransition] = useTransition();
  const [homeFilter, setHomeFilter] = useState<OrderFilter>('NEW');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const partnerRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'delivery_partners', user.uid);
  }, [firestore, user]);
  
  const { data: partnerProfile, loading: profileLoading } = useDoc<any>(partnerRef);

  // AUTH GUARD: Improved to prevent blank screen
  useEffect(() => {
    if (!isMounted || authLoading || profileLoading) return;
    
    const sessionActive = localStorage.getItem('delivery_session_active') === 'true';
    
    if (!user && !authLoading) {
      if (!sessionActive) {
        router.replace('/delivery/login');
      }
    }
  }, [user, authLoading, profileLoading, router, isMounted]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: allOrders } = useCollection<any>(ordersQuery);

  const filteredHomeOrders = useMemo(() => {
    if (!allOrders || !partnerProfile || !user) return [];
    return allOrders.filter(order => {
      const assignedZone = partnerProfile.assignedPincode;
      
      if (homeFilter === 'NEW') {
        // Show if ready for pickup and in my zone OR if already assigned to me
        const isReadyForMyZone = order.status === 'Ready for Pickup' && (!order.deliveryPartnerId || order.pincode === assignedZone);
        const isMineInProgress = order.deliveryPartnerId === user.uid && ['Picked Up', 'Out for Delivery'].includes(order.status);
        return isReadyForMyZone || isMineInProgress;
      }
      
      if (homeFilter === 'DELIVERED') return order.status === 'Delivered' && order.deliveryPartnerId === user.uid;
      
      return order.status === 'Cancelled' && (order.deliveryPartnerId === user.uid || order.pincode === assignedZone);
    });
  }, [allOrders, partnerProfile, user, homeFilter]);

  const updateDelivery = async (orderId: string, status: string) => {
    if (!firestore || !user) return;
    try {
      await updateDoc(doc(firestore, 'orders', orderId), { 
        status, 
        deliveryPartnerId: user.uid, 
        updatedAt: serverTimestamp() 
      });
      toast({ title: `Order ${status}!`, description: "Status updated instantly." });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const handleOpenGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  // LOADING STATE: Prevent blank screen with meaningful UI
  if (!isMounted || authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-8 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">
          Syncing Fleet Dashboard...
        </p>
      </div>
    );
  }

  // REDIRECT STATE: Show helpful info if auth fails
  if (!user || !partnerProfile) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-8 text-center animate-in fade-in duration-500">
        <div className="h-20 w-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 border border-red-100 shadow-inner">
           <ShieldAlert className="h-10 w-10" />
        </div>
        <div className="space-y-2">
           <h2 className="text-xl font-black italic uppercase text-gray-800">Access Restricted</h2>
           <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
             Identity not verified. Redirecting to secure login...
           </p>
        </div>
        <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col max-w-lg mx-auto shadow-2xl relative transform-gpu">
      <header className="bg-white px-6 py-6 border-b sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="h-12 w-12 rounded-2xl overflow-hidden border-2 border-primary/10 bg-muted"><img src={partnerProfile.photoUrl} className="h-full w-full object-cover" alt="" /></div>
           <div><h1 className="text-sm font-black italic uppercase leading-none mb-1">{partnerProfile.fullName}</h1><div className="flex items-center gap-1.5"><div className={cn("h-1.5 w-1.5 rounded-full", partnerProfile.isOnline ? "bg-green-500 animate-pulse" : "bg-red-500")} /><p className="text-[8px] font-black uppercase text-muted-foreground">{partnerProfile.isOnline ? 'On Duty' : 'Off Duty'}</p></div></div>
        </div>
        <Switch checked={partnerProfile.isOnline === true} onCheckedChange={async (o) => { if(firestore && user) await updateDoc(doc(firestore, 'delivery_partners', user.uid), { isOnline: o }); toast({ title: o ? "Online" : "Offline" }); }} className="data-[state=checked]:bg-green-500" />
      </header>

      <main className={cn("flex-1 pb-32 transition-opacity duration-300", isPending ? "opacity-50" : "opacity-100")}>
         {activeTab === 'home' && (
           <div className="p-4 space-y-6 animate-in fade-in duration-500">
              <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-border/50">
                {['NEW', 'DELIVERED', 'CANCELLED'].map((f) => (
                  <button key={f} onClick={() => setHomeFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", homeFilter === f ? "bg-primary text-white shadow-lg" : "text-gray-400")}>{f} TASKS</button>
                ))}
              </div>
              <div className="space-y-4 content-visibility-auto">
                {filteredHomeOrders.length > 0 ? filteredHomeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} filter={homeFilter} onUpdate={updateDelivery} onMapOpen={(o:any) => handleOpenGoogleMaps(Number(o.latitude || 25.2443), Number(o.longitude || 79.0838))} />
                )) : (
                  <div className="text-center py-20 opacity-30 flex flex-col items-center">
                    <Package className="h-16 w-16 mb-4" />
                    <p className="font-black italic uppercase text-xs">No active tasks available</p>
                  </div>
                )}
              </div>
           </div>
         )}

         {activeTab === 'profile' && (
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
               <div className="flex flex-col items-center text-center">
                  <div className="h-32 w-32 rounded-[3rem] overflow-hidden border-4 border-white shadow-2xl mb-4">
                     <img src={partnerProfile.photoUrl} className="h-full w-full object-cover" alt="" />
                  </div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">{partnerProfile.fullName}</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Partner ID: {user.uid.slice(-8).toUpperCase()}</p>
               </div>

               <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border space-y-4">
                  <div className="flex items-center gap-4">
                     <div className="bg-primary/5 p-3 rounded-2xl text-primary"><MapPin className="h-6 w-6" /></div>
                     <div className="text-left">
                        <span className="text-[9px] font-black text-muted-foreground uppercase">Assigned Zone</span>
                        <p className="text-sm font-black uppercase italic">{partnerProfile.assignedPincode || 'Global'}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="bg-green-50 p-3 rounded-2xl text-green-600"><PhoneCall className="h-6 w-6" /></div>
                     <div className="text-left">
                        <span className="text-[9px] font-black text-muted-foreground uppercase">Contact Number</span>
                        <p className="text-sm font-black uppercase italic">{partnerProfile.phone}</p>
                     </div>
                  </div>
               </div>

               <Button 
                  onClick={() => { localStorage.removeItem('delivery_session_active'); signOut(auth!); router.push('/'); }} 
                  variant="ghost" 
                  className="w-full h-14 text-red-500 font-black uppercase italic text-xs tracking-widest"
               >
                  <LogOut className="h-4 w-4 mr-2" /> DISCONNECT FROM FLEET
               </Button>
            </div>
         )}
      </main>

      <nav className="fixed bottom-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-50 rounded-t-[2.5rem] shadow-2xl">
        {[
          {id:'home',label:'Tasks',icon:LayoutDashboard},
          {id:'history',label:'History',icon:History},
          {id:'payout',label:'Earnings',icon:CircleDollarSign},
          {id:'profile',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as MainTab)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-none">
            <item.icon className={cn("h-5 w-5", activeTab === item.id ? "text-primary scale-110" : "text-gray-500")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", activeTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
