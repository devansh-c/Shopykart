"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { 
  Navigation, 
  Package, 
  MapPin, 
  LogOut, 
  User, 
  PhoneCall, 
  History,
  LayoutDashboard,
  Clock,
  Loader2,
  CircleDollarSign,
  UserCircle2,
  KeyRound,
  ShoppingBasket,
  QrCode,
  CreditCard,
  Banknote,
  CheckCircle2,
  X,
  Map as MapIcon,
  Compass,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useEffect, useState, useMemo, memo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';

const OrderMapViewer = dynamic(() => import('@/components/shared/OrderMapViewer'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-3xl" />
});

type MainTab = 'home' | 'history' | 'payout' | 'profile';
type OrderFilter = 'NEW' | 'DELIVERED' | 'CANCELLED';

const OrderCard = memo(({ order, onUpdate, filter }: any) => {
  const [enteredCode, setEnteredCode] = useState('');
  const [collectionMethod, setCollectionMethod] = useState<'Online' | 'Cash' | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const isReadyForPickup = order.status === 'Ready for Pickup';
  const isOutForDelivery = order.status === 'Out for Delivery';
  const isPickedUp = order.status === 'Picked Up';

  // Google Maps Coordinates from Firestore
  const customerLat = order.customerLat || order.customerLocation?.latitude;
  const customerLng = order.customerLng || order.customerLocation?.longitude;

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
      if (!collectionMethod) {
        alert("Please select payment collection method (Online/Cash) first.");
        return;
      }
      if (enteredCode === order.deliveryOTP) {
        onUpdate(order.id, 'Delivered', collectionMethod);
        setEnteredCode('');
      } else {
        alert("Invalid Delivery OTP! Ask the customer for the 6-digit code.");
      }
    }
  };

  const handleCall = () => {
    if (order.customerPhone) {
      window.open(`tel:${order.customerPhone}`);
    }
  };

  const startNavigation = () => {
    if (customerLat && customerLng) {
      // GOOGLE MAPS PLATFORMTurn-by-Turn Navigation URL
      const url = `https://www.google.com/maps/dir/?api=1&destination=${customerLat},${customerLng}&travelmode=driving`;
      window.open(url, '_blank');
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
          <div className="flex gap-2">
            <button onClick={handleCall} className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center text-white active:scale-90 transition-all shadow-lg shadow-green-100">
              <PhoneCall className="h-5 w-5" />
            </button>
            <button onClick={startNavigation} className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white active:scale-90 transition-all shadow-lg shadow-primary/10">
              <Compass className="h-5 w-5" />
            </button>
          </div>
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
          
          {customerLat && (
            <div className="pt-2">
               <button 
                onClick={() => setIsMapOpen(true)}
                className="w-full h-12 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center justify-center gap-2 font-black uppercase italic text-[9px] tracking-widest text-primary"
               >
                  <MapIcon className="h-4 w-4" /> PREVIEW GOOGLE PIN
               </button>
            </div>
          )}

          <div className="pt-3 border-t border-white/50 space-y-2">
             <div className="flex items-center gap-2 mb-2">
                <ShoppingBasket className="h-3.5 w-3.5 text-primary" />
                <span className="text-[9px] font-black uppercase text-gray-400">Products & Bill</span>
             </div>
             {order.items?.map((item: any, i: number) => (
               <div key={i} className="flex justify-between items-center text-[10px] font-bold">
                 <span className="text-gray-700">{item.quantity}x {item.name}</span>
                 <span className="text-primary font-black">₹{(item.price * item.quantity).toFixed(0)}</span>
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
         <div className="mb-6 space-y-6 animate-in slide-in-from-bottom-2">
            <Button 
              onClick={startNavigation}
              className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase italic text-sm tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-primary/20"
            >
              <Navigation className="h-6 w-6 animate-pulse" /> START TURN-BY-TURN
            </Button>

            <Button 
              onClick={() => setShowQr(true)}
              className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-xl"
            >
              <QrCode className="h-4 w-4" /> SHOW PAYMENT QR
            </Button>

            <div className="space-y-3">
              <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Collection Mode</span>
              <div className="grid grid-cols-2 gap-3">
                 <button 
                  onClick={() => setCollectionMethod('Online')}
                  className={cn(
                    "h-14 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
                    collectionMethod === 'Online' ? "bg-primary/5 border-primary text-primary shadow-inner" : "bg-gray-50 border-transparent text-gray-400"
                  )}
                 >
                    <CreditCard className="h-4 w-4" />
                    <span className="text-[9px] font-black uppercase">Online Paid</span>
                 </button>
                 <button 
                  onClick={() => setCollectionMethod('Cash')}
                  className={cn(
                    "h-14 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
                    collectionMethod === 'Cash' ? "bg-amber-50 border-amber-500 text-amber-700 shadow-inner" : "bg-gray-50 border-transparent text-gray-400"
                  )}
                 >
                    <Banknote className="h-4 w-4" />
                    <span className="text-[9px] font-black uppercase">Cash Paid</span>
                 </button>
              </div>
            </div>

            {collectionMethod && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-primary">
                   <KeyRound className="h-4 w-4" />
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
                className="flex-1 bg-primary h-16 rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all"
              >
                DISPATCH ORDER
              </Button>
            )}
            {isOutForDelivery && (
              <Button 
                onClick={handleAction} 
                disabled={enteredCode.length !== 6 || !collectionMethod}
                className="flex-1 bg-green-600 h-16 rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all"
              >
                VERIFY & DELIVER
              </Button>
            )}
         </div>
       )}

       {/* MAP PREVIEW MODAL */}
       <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
          <DialogContent className="rounded-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none">
             <div className="h-2 w-full bg-primary" />
             <div className="p-8 space-y-6">
                <DialogHeader>
                   <DialogTitle className="font-black italic uppercase text-center text-xl tracking-tighter">Customer Drop Spot</DialogTitle>
                   <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest">Pinpoint coordinate on Map</DialogDescription>
                </DialogHeader>
                <div className="h-64 w-full bg-muted rounded-[2rem] overflow-hidden border-4 border-muted/20">
                   {customerLat && <OrderMapViewer lat={customerLat} lng={customerLng} />}
                </div>
                <div className="flex gap-3">
                   <Button onClick={startNavigation} className="flex-1 h-14 bg-primary text-white rounded-2xl font-black uppercase italic"><ExternalLink className="h-4 w-4 mr-2" /> OPEN GOOGLE MAPS</Button>
                   <Button onClick={() => setIsMapOpen(false)} variant="ghost" className="h-14 w-14 rounded-2xl bg-gray-100"><X className="h-5 w-5" /></Button>
                </div>
             </div>
          </DialogContent>
       </Dialog>

       {/* QR MODAL */}
       <Dialog open={showQr} onOpenChange={setShowQr}>
          <DialogContent className="rounded-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none">
             <div className="h-2 w-full bg-primary" />
             <div className="p-8 space-y-8 flex flex-col items-center text-center">
                <DialogHeader>
                   <DialogTitle className="font-black italic uppercase text-2xl tracking-tighter">Scan to Pay</DialogTitle>
                   <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest">Digital Collection QR</DialogDescription>
                </DialogHeader>
                
                <div className="bg-white p-6 rounded-[2.5rem] border-2 border-dashed border-gray-200 shadow-inner relative group">
                   <img 
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${order.total?.toFixed(2)}&cu=INR`)}`} 
                     className="h-56 w-56 grayscale contrast-125" 
                     alt="UPI QR" 
                     crossOrigin="anonymous" 
                   />
                   <div className="absolute inset-0 border-4 border-primary/20 rounded-[2.5rem] pointer-events-none" />
                </div>

                <div className="space-y-2">
                   <p className="text-sm font-black italic text-gray-900 tracking-tight">₹{order.total?.toFixed(2)}</p>
                   <p className="text-[9px] font-black text-primary uppercase tracking-widest">9450355709@axl</p>
                </div>

                <Button onClick={() => setShowQr(false)} className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic">CLOSE QR</Button>
             </div>
          </DialogContent>
       </Dialog>
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

  useEffect(() => {
    if (!isMounted || authLoading || profileLoading) return;
    if (!user && !authLoading) {
      router.replace('/delivery/login');
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
        const isReadyForMyZone = order.status === 'Ready for Pickup' && (!order.deliveryPartnerId || order.pincode === assignedZone);
        const isMineInProgress = order.deliveryPartnerId === user.uid && ['Picked Up', 'Out for Delivery'].includes(order.status);
        return isReadyForMyZone || isMineInProgress;
      }
      
      if (homeFilter === 'DELIVERED') return order.status === 'Delivered' && order.deliveryPartnerId === user.uid;
      
      return order.status === 'Cancelled' && (order.deliveryPartnerId === user.uid || order.pincode === assignedZone);
    });
  }, [allOrders, partnerProfile, user, homeFilter]);

  const updateDelivery = async (orderId: string, status: string, collectionMethod?: string) => {
    if (!firestore || !user) return;
    try {
      const updateData: any = { 
        status, 
        deliveryPartnerId: user.uid, 
        updatedAt: serverTimestamp() 
      };
      if (collectionMethod) {
        updateData.paymentCollectionMethod = collectionMethod;
      }
      await updateDoc(doc(firestore, 'orders', orderId), updateData);
      toast({ title: `Order ${status}!` });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  if (!isMounted || authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
      </div>
    );
  }

  if (!user || !partnerProfile) return null;

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
              <div className="space-y-4">
                {filteredHomeOrders.length > 0 ? filteredHomeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} filter={homeFilter} onUpdate={updateDelivery} />
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