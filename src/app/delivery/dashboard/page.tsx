"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
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
  ExternalLink,
  ChevronRight,
  Bike,
  ShieldAlert
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

type MainTab = 'tasks' | 'history' | 'payout' | 'profile';

const OrderCard = memo(({ order, onUpdate, type, userData }: any) => {
  const [enteredCode, setEnteredCode] = useState('');
  const [collectionMethod, setCollectionMethod] = useState<'Online' | 'Cash' | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const isReadyForPickup = order.status === 'Ready for Pickup';
  const isOutForDelivery = order.status === 'Out for Delivery';
  const isPickedUp = order.status === 'Picked Up';

  // Google Maps Coordinates
  const customerLat = order.customerLat || order.customerLocation?.latitude;
  const customerLng = order.customerLng || order.customerLocation?.longitude;

  const handleAction = () => {
    if (isReadyForPickup) {
      // In Task Marketplace mode
      onUpdate(order.id, 'Picked Up', null, userData);
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
            {!isReadyForPickup && (
              <button onClick={handleCall} className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center text-white active:scale-90 transition-all shadow-lg shadow-green-100">
                <PhoneCall className="h-5 w-5" />
              </button>
            )}
            <button onClick={startNavigation} className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white active:scale-90 transition-all shadow-lg shadow-primary/10">
              <Compass className="h-5 w-5" />
            </button>
          </div>
       </div>

       <div className="bg-muted/30 rounded-[2rem] p-5 mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-xl shadow-sm text-primary"><Bike className="h-5 w-5" /></div>
            <span className="text-sm font-black uppercase italic tracking-tighter text-gray-800">{order.restaurantName || 'ShopyKart Hub'}</span>
          </div>
          
          {!isReadyForPickup && (
            <div className="flex items-start gap-4 pt-1">
              <div className="bg-white p-2 rounded-xl shadow-sm text-primary shrink-0"><MapPin className="h-5 w-5" /></div>
              <span className="text-[11px] font-bold text-gray-600 leading-tight">{order.address}</span>
            </div>
          )}
          
          <div className="pt-3 border-t border-white/50 space-y-2">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-gray-400">Total Collection</span>
                <span className="text-base font-black italic text-gray-900">₹{order.total?.toFixed(0)}</span>
             </div>
          </div>
       </div>

       {isPickedUp && (
         <div className="mb-6 animate-in slide-in-from-bottom-2">
            <Button 
              onClick={handleAction} 
              className="w-full bg-primary h-16 rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all"
            >
              DISPATCH ORDER
            </Button>
         </div>
       )}

       {isReadyForPickup && (
         <div className="mb-2 animate-in slide-in-from-bottom-2">
            <Button 
              onClick={handleAction} 
              className="w-full bg-green-600 h-16 rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all border-b-4 border-green-800"
            >
              <CheckCircle2 className="h-5 w-5 mr-2" /> ACCEPT PICKUP TASK
            </Button>
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
                <Button 
                  onClick={handleAction} 
                  disabled={enteredCode.length !== 6 || !collectionMethod}
                  className="w-full h-16 bg-green-600 rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all mt-4"
                >
                  VERIFY & DELIVER
                </Button>
              </div>
            )}
         </div>
       )}

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
                   />
                   <div className="absolute inset-0 border-4 border-primary/20 rounded-[2.5rem] pointer-events-none" />
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
  
  const [activeTab, setActiveTab] = useState<MainTab>('tasks');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const partnerRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'delivery_partners', user.uid);
  }, [firestore, user]);
  
  const { data: partnerProfile, loading: profileLoading } = useDoc<any>(partnerRef);

  useEffect(() => {
    if (!isMounted || authLoading || profileLoading) return;
    
    // REDIRECT IF NOT LOGGED IN: Persistence Guard
    const sessionActive = localStorage.getItem('delivery_session_active') === 'true';
    if (!user && !authLoading) {
      if (!sessionActive) router.replace('/delivery/login');
      return;
    }

    // SECURITY CHECK: If user is logged in but no partner profile exists, sign them out
    if (user && !partnerProfile && !profileLoading) {
       console.warn("Security Alert: Logged in user has no delivery profile.");
       localStorage.removeItem('delivery_session_active');
       signOut(auth!).then(() => {
          router.replace('/delivery/login');
       });
    }
  }, [user, authLoading, profileLoading, partnerProfile, router, isMounted, auth]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: allOrders } = useCollection<any>(ordersQuery);

  const taskOrders = useMemo(() => {
    if (!allOrders || !partnerProfile || !user) return [];
    return allOrders.filter(order => {
      // 1. New Tasks in Zone (Not assigned to anyone yet)
      const isMarketplaceTask = order.status === 'Ready for Pickup' && !order.deliveryPartnerId && 
        (order.pincode === partnerProfile.assignedPincode || order.zoneId === partnerProfile.zoneId || !partnerProfile.assignedPincode);
      
      // 2. My Current Tasks (Assigned to me and not terminal)
      const isMyCurrentTask = order.deliveryPartnerId === user.uid && ['Picked Up', 'Out for Delivery'].includes(order.status);
      
      return isMarketplaceTask || isMyCurrentTask;
    });
  }, [allOrders, partnerProfile, user]);

  const historyOrders = useMemo(() => {
    if (!allOrders || !user) return [];
    return allOrders.filter(o => o.deliveryPartnerId === user.uid && ['Delivered', 'Cancelled'].includes(o.status));
  }, [allOrders, user]);

  const updateDelivery = async (orderId: string, status: string, collectionMethod?: string | null, partnerData?: any) => {
    if (!firestore || !user) return;
    try {
      const updateData: any = { 
        status, 
        updatedAt: serverTimestamp() 
      };
      
      if (status === 'Picked Up') {
        updateData.deliveryPartnerId = user.uid;
        updateData.deliveryPartnerName = partnerData?.fullName || 'Partner';
        updateData.deliveryPartnerPhone = partnerData?.phone || '';
      }

      if (collectionMethod) {
        updateData.paymentCollectionMethod = collectionMethod;
      }
      
      await updateDoc(doc(firestore, 'orders', orderId), updateData);
      toast({ title: `Order ${status}!` });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  if (!isMounted || authLoading || profileLoading || (!user && !authLoading)) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic animate-pulse">Syncing Fleet Dashboard...</p>
      </div>
    );
  }

  // FALLBACK FOR MISSING PROFILE
  if (!user || !partnerProfile) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-10 text-center gap-6">
         <div className="h-20 w-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 shadow-inner">
            <ShieldAlert className="h-10 w-10" />
         </div>
         <div className="space-y-2">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">Access Denied</h2>
            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">
               This account is not authorized to access the delivery dashboard. Please contact support.
            </p>
         </div>
         <Button 
            onClick={() => { localStorage.removeItem('delivery_session_active'); signOut(auth!); router.replace('/delivery/login'); }}
            className="h-12 px-8 bg-black text-white rounded-xl font-black uppercase italic text-[10px]"
         >
            BACK TO LOGIN
         </Button>
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

      <main className="flex-1 pb-32">
         {activeTab === 'tasks' && (
           <div className="p-4 space-y-6 animate-in fade-in duration-500">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xl font-black italic uppercase tracking-tighter">Current Tasks</h2>
                 <Badge className="bg-primary/5 text-primary border-none text-[8px] px-2 font-black">{taskOrders.length} ALERTS</Badge>
              </div>
              <div className="space-y-4">
                {taskOrders.length > 0 ? taskOrders.map((order) => (
                  <OrderCard key={order.id} order={order} type="active" onUpdate={updateDelivery} userData={partnerProfile} />
                )) : (
                  <div className="text-center py-20 opacity-30 flex flex-col items-center">
                    <div className="bg-gray-100 p-8 rounded-full mb-6"><Bike className="h-16 w-16" /></div>
                    <p className="font-black italic uppercase text-xs">Waiting for tasks in your zone...</p>
                  </div>
                )}
              </div>
           </div>
         )}

         {activeTab === 'history' && (
           <div className="p-4 space-y-6 animate-in fade-in duration-500">
              <div className="flex items-center justify-between px-2">
                 <h2 className="text-xl font-black italic uppercase tracking-tighter">Delivery History</h2>
              </div>
              <div className="space-y-4">
                {historyOrders.map((order) => (
                  <div key={order.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm opacity-80">
                     <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black italic">#{order.customerOrderNumber}</span>
                        <Badge className={cn("text-[7px] font-black uppercase border-none", order.status === 'Delivered' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600")}>{order.status}</Badge>
                     </div>
                     <div className="flex items-center gap-3">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase truncate">{order.address}</span>
                     </div>
                  </div>
                ))}
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
          {id:'tasks',label:'Tasks',icon:LayoutDashboard},
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
