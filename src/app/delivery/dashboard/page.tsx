
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
  QrCode,
  CreditCard,
  Banknote,
  CheckCircle2,
  X,
  ChevronRight,
  Bike,
  ShieldAlert,
  ListTree,
  AlertCircle,
  BellRing,
  Zap
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
import { scheduleTestNotification } from '@/components/shared/PermissionManager';

const OrderCard = memo(({ order, onUpdate, type, userData, onPass }: any) => {
  const [pickupCode, setPickupCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [collectionMethod, setCollectionMethod] = useState<'Online' | 'Cash' | null>(null);
  const [showQr, setShowQr] = useState(false);

  const isReadyForPickup = order.status === 'Ready for Pickup';
  const isPickedUp = order.status === 'Picked Up';
  const isOutForDelivery = order.status === 'Out for Delivery';

  const handleAction = () => {
    if (order.status === 'Ready for Pickup' && !order.deliveryPartnerId) {
       onUpdate(order.id, 'Accepted Task', null, userData);
       return;
    }

    if (isReadyForPickup && order.deliveryPartnerId === userData.uid) {
      if (pickupCode === order.pickupOTP) {
        onUpdate(order.id, 'Picked Up', null, userData);
        setPickupCode('');
      } else {
        alert("Invalid Pickup OTP! Ask store for the 4-digit code.");
      }
    } else if (isPickedUp) {
      onUpdate(order.id, 'Out for Delivery');
    } else if (isOutForDelivery) {
      if (!collectionMethod) {
        alert("Select payment collection mode first.");
        return;
      }
      if (enteredCode === order.deliveryOTP) {
        onUpdate(order.id, 'Delivered', collectionMethod);
        setEnteredCode('');
      } else {
        alert("Invalid Delivery OTP! Ask customer for 6-digit code.");
      }
    }
  };

  const isMyTask = order.deliveryPartnerId === userData?.uid;

  return (
    <div className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm relative overflow-hidden transform-gpu transition-all hover:shadow-xl">
       <div className="flex justify-between items-start mb-6">
          <div>
             <Badge className={cn("border-none uppercase text-[8px] font-black px-3 py-1 rounded-full mb-3", 
                order.status === 'Cancelled' ? "bg-red-50 text-red-600" : 
                order.status === 'Delivered' ? "bg-green-50 text-green-600" : 
                "bg-primary/10 text-primary")}>
               {order.status}
             </Badge>
             <h3 className="text-3xl font-black italic tracking-tighter leading-none">Order #{order.customerOrderNumber}</h3>
          </div>
          {!isReadyForPickup && isMyTask && (
            <button onClick={() => window.open(`tel:${order.customerPhone}`)} className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center text-white active:scale-90 shadow-lg shadow-green-100">
              <PhoneCall className="h-5 w-5" />
            </button>
          )}
       </div>

       <div className="bg-muted/30 rounded-[2rem] p-5 mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <Bike className="h-5 w-5 text-primary" />
            <span className="text-sm font-black uppercase italic text-gray-800">{order.restaurantName}</span>
          </div>
          <div className="flex items-start gap-4">
            <MapPin className="h-5 w-5 text-blue-500 shrink-0" />
            <span className="text-[11px] font-bold text-gray-600 leading-tight uppercase italic">{order.address}</span>
          </div>
       </div>

       {isReadyForPickup && !order.deliveryPartnerId && (
         <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => onPass(order.id)} variant="outline" className="h-16 rounded-[1.5rem] font-black uppercase text-[10px] text-red-500 border-red-100">PASS TASK</Button>
            <Button onClick={handleAction} className="h-16 bg-green-600 rounded-[1.5rem] font-black uppercase text-[10px] text-white shadow-xl">ACCEPT TASK</Button>
         </div>
       )}

       {isReadyForPickup && isMyTask && (
         <div className="space-y-4">
            <div className="space-y-2">
               <label className="text-[9px] font-black text-primary uppercase ml-1 flex items-center gap-1.5"><KeyRound className="h-3 w-3" /> Enter Store Pickup OTP</label>
               <Input 
                 type="tel" placeholder="0 0 0 0" maxLength={4}
                 value={pickupCode} onChange={e => setPickupCode(e.target.value.replace(/\D/g,''))}
                 className="h-16 rounded-2xl bg-gray-50 border-none text-center font-black text-3xl tracking-[0.5em]"
               />
            </div>
            <Button onClick={handleAction} disabled={pickupCode.length !== 4} className="w-full bg-black h-16 rounded-[1.5rem] font-black uppercase text-sm shadow-xl">CONFIRM PICKUP</Button>
         </div>
       )}

       {isPickedUp && isMyTask && (
         <Button onClick={handleAction} className="w-full bg-primary h-16 rounded-[1.5rem] font-black uppercase text-sm shadow-xl">START DELIVERY</Button>
       )}

       {isOutForDelivery && isMyTask && (
         <div className="space-y-6">
            <Button onClick={() => setShowQr(true)} className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic text-[10px] flex items-center justify-center gap-2 shadow-xl"><QrCode className="h-4 w-4" /> SHOW QR</Button>
            <div className="grid grid-cols-2 gap-3">
               <button onClick={() => setCollectionMethod('Online')} className={cn("h-14 rounded-2xl border-2 flex flex-col items-center justify-center gap-1", collectionMethod === 'Online' ? "bg-primary/5 border-primary text-primary" : "bg-gray-50 border-transparent text-gray-400")}><CreditCard className="h-4 w-4" /><span className="text-[9px] font-black uppercase">Online</span></button>
               <button onClick={() => setCollectionMethod('Cash')} className={cn("h-14 rounded-2xl border-2 flex flex-col items-center justify-center gap-1", collectionMethod === 'Cash' ? "bg-amber-50 border-amber-500 text-amber-700" : "bg-gray-50 border-transparent text-gray-400")}><Banknote className="h-4 w-4" /><span className="text-[9px] font-black uppercase">Cash</span></button>
            </div>
            {collectionMethod && (
              <div className="space-y-3">
                <Input type="tel" placeholder="CUSTOMER 6-DIGIT OTP" maxLength={6} value={enteredCode} onChange={e => setEnteredCode(e.target.value.replace(/\D/g,''))} className="h-14 rounded-2xl bg-gray-50 border-none text-center font-black text-2xl" />
                <Button onClick={handleAction} disabled={enteredCode.length !== 6} className="w-full h-16 bg-green-600 rounded-[1.5rem] font-black uppercase text-sm text-white">VERIFY & DELIVER</Button>
              </div>
            )}
         </div>
       )}

       <Dialog open={showQr} onOpenChange={setShowQr}>
          <DialogContent className="rounded-[3rem] max-w-sm p-8 text-center space-y-6 bg-white border-none shadow-2xl">
             <DialogHeader><DialogTitle className="font-black italic uppercase text-2xl tracking-tighter">Scan to Pay</DialogTitle></DialogHeader>
             <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${order.total}&cu=INR`)}`} className="h-48 w-48 mx-auto" alt="QR" />
                <p className="mt-4 text-2xl font-black italic text-gray-900">₹{order.total?.toFixed(0)}</p>
             </div>
             <Button onClick={() => setShowQr(false)} className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic">CLOSE</Button>
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
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'history' | 'profile'>('tasks');
  const [isMounted, setIsMounted] = useState(false);
  const [dismissedTasks, setDismissedTasks] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => { 
    setIsMounted(true); 
    const saved = localStorage.getItem('fleet_dismissed_tasks');
    if (saved) setDismissedTasks(JSON.parse(saved));
  }, []);

  const partnerRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'delivery_partners', user.uid) : null, [firestore, user]);
  const { data: partnerProfile, loading: profileLoading } = useDoc<any>(partnerRef);

  useEffect(() => {
    if (!isMounted || authLoading || profileLoading) return;
    const sessionActive = localStorage.getItem('delivery_session_active') === 'true';
    if (!user && !sessionActive) router.replace('/delivery/login');
  }, [user, authLoading, profileLoading, router, isMounted]);

  const ordersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'orders'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: allOrders } = useCollection<any>(ordersQuery);

  const taskOrders = useMemo(() => {
    if (!allOrders || !partnerProfile || !user) return [];
    return allOrders.filter(order => {
      if (dismissedTasks.includes(order.id)) return false;
      const isAvailable = order.status === 'Ready for Pickup' && !order.deliveryPartnerId;
      const isMyTask = order.deliveryPartnerId === user.uid && !['Delivered', 'Cancelled'].includes(order.status);
      return isAvailable || isMyTask;
    });
  }, [allOrders, partnerProfile, user, dismissedTasks]);

  const updateDelivery = async (orderId: string, status: string, collectionMethod?: string | null, partnerData?: any) => {
    if (!firestore || !user) return;
    try {
      const updateData: any = { status, updatedAt: serverTimestamp() };
      if (status === 'Accepted Task') {
        updateData.deliveryPartnerId = user.uid;
        updateData.deliveryPartnerName = partnerData?.fullName || 'Partner';
        updateData.deliveryPartnerPhone = partnerData?.phone || '';
      }
      if (collectionMethod) updateData.paymentCollectionMethod = collectionMethod;
      await updateDoc(doc(firestore, 'orders', orderId), updateData);
      toast({ title: `Task ${status}!` });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const handlePass = (id: string) => {
    const next = [...dismissedTasks, id];
    setDismissedTasks(next);
    localStorage.setItem('fleet_dismissed_tasks', JSON.stringify(next));
    toast({ title: "Task Dismissed" });
  };

  const handleTestAlert = async () => {
    setIsTesting(true);
    toast({ 
      title: "Ringing Check! 📱", 
      description: "App band kardo. Ghanti 10s me bajegi." 
    });
    
    const success = await scheduleTestNotification();
    if (!success) {
      toast({ variant: "destructive", title: "Setup Needed", description: "Grant permissions first." });
    }
    setTimeout(() => setIsTesting(false), 5000);
  };

  if (!isMounted || authLoading || profileLoading || (!user && !authLoading)) {
    return <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">AUTHENTICATING Fleet...</p></div>;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col max-w-lg mx-auto shadow-2xl relative transform-gpu">
      <header className="bg-white px-6 py-6 border-b sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="h-12 w-12 rounded-2xl overflow-hidden border-2 border-primary/10 bg-muted"><img src={partnerProfile?.photoUrl} className="h-full w-full object-cover" alt="" /></div>
           <div><h1 className="text-sm font-black italic uppercase leading-none mb-1">{partnerProfile?.fullName}</h1><div className="flex items-center gap-1.5"><div className={cn("h-1.5 w-1.5 rounded-full", partnerProfile?.isOnline ? "bg-green-500 animate-pulse" : "bg-red-500")} /><p className="text-[8px] font-black uppercase text-muted-foreground">{partnerProfile?.isOnline ? 'On Duty' : 'Off Duty'}</p></div></div>
        </div>
        <Switch checked={partnerProfile?.isOnline === true} onCheckedChange={async (o) => { if(firestore && user) await updateDoc(doc(firestore, 'delivery_partners', user.uid), { isOnline: o }); }} className="data-[state=checked]:bg-green-500" />
      </header>

      <main className="flex-1 pb-32 overflow-y-auto no-scrollbar">
         {activeTab === 'tasks' && (
           <div className="p-4 space-y-6">
              {/* ALERT DEBUGGER FOR FLEET */}
              <div className="bg-[#0B0B0B] p-6 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden text-white mb-2">
                 <div className="relative z-10 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                       <div className="h-12 w-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                          <BellRing className="h-6 w-6 animate-ring" />
                       </div>
                       <div>
                          <h2 className="text-sm font-black italic uppercase">Ringer Test</h2>
                          <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">Enable loud alerts for new tasks</p>
                       </div>
                    </div>
                    <Button 
                      onClick={handleTestAlert}
                      disabled={isTesting}
                      className="h-10 px-4 bg-primary hover:bg-white hover:text-black text-white rounded-xl font-black uppercase italic text-[8px] tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                      {isTesting ? "Wait..." : "TEST LOUD"}
                    </Button>
                 </div>
              </div>

              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Live Tasks</h2>
              <div className="space-y-6">
                {taskOrders.length > 0 ? taskOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onUpdate={updateDelivery} userData={partnerProfile} onPass={handlePass} />
                )) : (
                  <div className="text-center py-24 opacity-20 flex flex-col items-center">
                    <Bike className="h-20 w-20 mb-6" />
                    <p className="font-black italic uppercase text-xs tracking-widest">No orders ready for pickup</p>
                  </div>
                )}
              </div>
           </div>
         )}
         {activeTab === 'profile' && (
            <div className="p-8 space-y-8 animate-in fade-in duration-500 text-center">
               <div className="h-32 w-32 rounded-[3.5rem] overflow-hidden border-4 border-white shadow-2xl mx-auto mb-6"><img src={partnerProfile?.photoUrl} className="h-full w-full object-cover" alt="" /></div>
               <h2 className="text-3xl font-black italic uppercase tracking-tighter">{partnerProfile?.fullName}</h2>
               <Button onClick={() => { localStorage.removeItem('delivery_session_active'); signOut(auth!); router.replace('/'); }} variant="ghost" className="w-full h-16 text-red-500 font-black uppercase italic text-xs border border-red-100 rounded-3xl"><LogOut className="h-5 w-5 mr-3" /> DISCONNECT</Button>
            </div>
         )}
      </main>

      <nav className="fixed bottom-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-50 rounded-t-[2.5rem] shadow-2xl">
        {[
          {id:'tasks',label:'Tasks',icon:LayoutDashboard},
          {id:'history',label:'History',icon:History},
          {id:'profile',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-all">
            <item.icon className={cn("h-5 w-5", activeTab === item.id ? "text-primary scale-110" : "text-gray-500")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", activeTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
