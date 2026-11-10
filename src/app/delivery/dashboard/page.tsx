"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy, serverTimestamp, getDoc, increment } from 'firebase/firestore';
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
  ShieldCheck,
  ListTree,
  AlertCircle,
  BellRing,
  Zap,
  ArrowUpRight,
  Wallet,
  Phone,
  IndianRupee,
  Store,
  XCircle,
  Timer,
  ShoppingBag,
  ListPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useEffect, useState, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { format, differenceInSeconds } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { scheduleTestNotification } from '@/components/shared/PermissionManager';
import { Skeleton } from '@/components/ui/skeleton';

const TaskCard = memo(({ order, onUpdate, userData, onPass }: any) => {
  const [pickupCode, setPickupCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [collectionMethod, setCollectionMethod] = useState<'Online' | 'Cash' | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [timeLeftStr, setTimeLeftStr] = useState('20:00');
  const [isOverdue, setIsOverdue] = useState(false);

  const isReadyForPickup = order.status === 'Ready for Pickup' || order.status === 'Accepted Task';
  const isPickedUp = order.status === 'Picked Up';
  const isOutForDelivery = order.status === 'Out for Delivery';
  const isMyTask = order.deliveryPartnerId === userData?.uid;

  useEffect(() => {
    if (!isMyTask || !order.readyForPickupAt || order.status === 'Delivered' || order.status === 'Cancelled') return;

    const interval = setInterval(() => {
      const startTime = order.readyForPickupAt?.seconds ? new Date(order.readyForPickupAt.seconds * 1000) : new Date();
      const elapsedSeconds = differenceInSeconds(new Date(), startTime);
      const limitSeconds = 20 * 60; 
      const remainingSeconds = limitSeconds - elapsedSeconds;

      if (remainingSeconds <= 0) {
        setIsOverdue(true);
        const overBy = Math.abs(remainingSeconds);
        const mm = Math.floor(overBy / 60);
        const ss = overBy % 60;
        setTimeLeftStr(`-${mm}:${String(ss).padStart(2, '0')}`);
      } else {
        setIsOverdue(false);
        const mm = Math.floor(remainingSeconds / 60);
        const ss = remainingSeconds % 60;
        setTimeLeftStr(`${mm}:${String(ss).padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isMyTask, order.readyForPickupAt, order.status]);

  const handleAction = () => {
    if (order.status === 'Ready for Pickup' && !order.deliveryPartnerId) {
       onUpdate(order.id, 'Accepted Task', null, userData);
       return;
    }

    if (isReadyForPickup && isMyTask) {
      if (pickupCode === order.pickupOTP) {
        onUpdate(order.id, 'Picked Up', null, userData);
        setPickupCode('');
      } else {
        alert("Invalid Pickup OTP! Ask store for the 4-digit code.");
      }
    } 
    else if (isPickedUp) {
      onUpdate(order.id, 'Out for Delivery');
    } 
    else if (isOutForDelivery) {
      if (!collectionMethod) {
        alert("Select payment collection mode first.");
        return;
      }
      if (enteredCode === order.deliveryOTP) {
        onUpdate(order.id, 'Delivered', collectionMethod, userData);
        setEnteredCode('');
      } else {
        alert("Invalid Delivery OTP! Ask customer for 6-digit code.");
      }
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 transform-gpu">
       <div className="p-5 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-2">
             <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
             <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Task ID #{order.customerOrderNumber}</span>
          </div>
          {isMyTask && !['Delivered', 'Cancelled'].includes(order.status) && (
             <div className={cn(
               "flex items-center gap-2 px-3 py-1 rounded-full border shadow-sm animate-pulse",
               isOverdue ? "bg-red-50 border-red-200 text-red-600" : "bg-primary/5 border-primary/20 text-primary"
             )}>
                <Timer className="h-3 w-3" />
                <span className="text-xs font-black tabular-nums">{timeLeftStr}</span>
             </div>
          )}
          <Badge className={cn("border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-lg", 
            isMyTask ? "bg-primary text-white" : "bg-gray-200 text-gray-600")}>
            {isMyTask ? 'MY TASK' : 'NEW TASK'}
          </Badge>
       </div>

       <div className="p-6 space-y-8">
          {/* STORE SECTION */}
          <div className="flex items-start gap-4">
             <div className="h-14 w-14 rounded-2xl overflow-hidden bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100 shadow-inner">
                {order.vendorImageUrl ? (
                  <img src={order.vendorImageUrl} className="h-full w-full object-cover" alt="Hub" />
                ) : (
                  <Store className="h-7 w-7" />
                )}
             </div>
             <div className="min-w-0 text-left flex-1">
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none mb-1.5">Pick From (Hub)</p>
                <h3 className="text-xl font-black uppercase italic tracking-tighter truncate text-gray-900 leading-none mb-1">{order.restaurantName}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase italic truncate">{order.vendorAddress || order.town || 'Local Hub'}</p>
             </div>
             {order.vendorPhone && (
               <button onClick={() => window.open(`tel:${order.vendorPhone}`)} className="h-12 w-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 active:scale-90 transition-transform">
                 <Phone className="h-5 w-5" />
               </button>
             )}
          </div>

          <div className="bg-muted/30 rounded-[2rem] p-6 border border-border/40">
             <div className="flex items-center gap-2 mb-4 border-b border-white pb-3">
                <ListPlus className="h-4 w-4 text-primary" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Items to Carry</h4>
             </div>
             <div className="space-y-3">
                {order.items?.map((item: any, idx: number) => (
                   <div key={idx} className="flex justify-between items-center bg-white/60 p-3 rounded-xl border border-white">
                      <span className="text-[11px] font-black uppercase italic text-gray-800">
                         <span className="text-primary">{item.quantity}x</span> {item.name} {item.selectedOption ? `(${item.selectedOption.name})` : ''}
                      </span>
                      <Badge className="bg-gray-100 text-gray-400 border-none text-[8px] font-black">PKD</Badge>
                   </div>
                ))}
             </div>
          </div>

          <div className="flex items-start gap-4">
             <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shrink-0 border border-primary/10">
                <User className="h-7 w-7" />
             </div>
             <div className="min-w-0 text-left flex-1">
                <p className="text-[9px] font-black text-primary uppercase tracking-widest leading-none mb-1.5">Deliver To</p>
                <h3 className="text-xl font-black uppercase italic tracking-tighter truncate text-gray-900 leading-none mb-1">{order.customerName}</h3>
                <p className="text-[10px] font-bold text-gray-500 leading-tight uppercase italic line-clamp-2">{order.address}</p>
             </div>
             {isMyTask && (
               <button onClick={() => window.open(`tel:${order.customerPhone}`)} className="h-12 w-12 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-100 active:scale-90 transition-transform">
                 <Phone className="h-5 w-5" />
               </button>
             )}
          </div>

          <div className="bg-[#0B0B0B] p-6 rounded-[2rem] flex items-center justify-between text-white shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
                <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] block mb-1">Collection Amount</span>
                <div className="text-3xl font-black italic tracking-tighter">₹ {order.total?.toFixed(0)}</div>
             </div>
             <div className="relative z-10 text-right">
                <Badge className="bg-white/10 text-white border-none font-black text-[9px] uppercase tracking-widest">{order.paymentMethod || 'COD'}</Badge>
             </div>
             <Banknote className="absolute top-0 right-0 h-24 w-24 text-white opacity-5 -rotate-12 translate-x-4 -translate-y-4" />
          </div>

          <div className="pt-2">
             {!isMyTask ? (
               <div className="flex gap-4">
                  <button onClick={() => onPass(order.id)} className="flex-1 h-18 rounded-[1.75rem] bg-gray-50 text-gray-400 font-black uppercase text-[10px] tracking-widest border border-gray-100 active:scale-95 transition-all">PASS TASK</button>
                  <button onClick={handleAction} className="flex-[2] h-18 rounded-[1.75rem] bg-[#0B0B0B] text-white font-black uppercase italic text-lg shadow-xl active:scale-95 transition-all border-b-4 border-gray-800">ACCEPT TASK</button>
               </div>
             ) : (
               <div className="space-y-4 animate-in slide-in-from-top-2">
                  {isReadyForPickup && (
                    <div className="space-y-4">
                       <div className="bg-primary/5 p-5 rounded-[2rem] border border-primary/10">
                          <label className="text-[10px] font-black text-primary uppercase block mb-4 text-center tracking-[0.2em]">Enter Store Pickup OTP</label>
                          <Input 
                            type="tel" maxLength={4} placeholder="0 0 0 0" 
                            value={pickupCode} onChange={e => setPickupCode(e.target.value.replace(/\D/g,''))}
                            className="h-20 rounded-2xl border-none bg-white text-center font-black text-4xl tracking-[0.5em] text-primary shadow-inner"
                          />
                       </div>
                       <Button onClick={handleAction} disabled={pickupCode.length !== 4} className="w-full h-20 bg-primary text-white rounded-[2rem] font-black uppercase italic text-xl shadow-xl shadow-primary/20">CONFIRM PICKUP</Button>
                    </div>
                  )}

                  {isPickedUp && (
                    <Button onClick={handleAction} className="w-full h-24 bg-blue-600 text-white rounded-[2.5rem] font-black uppercase italic text-2xl shadow-xl shadow-blue-200 flex items-center justify-center gap-4">
                       <Navigation className="h-8 w-8" /> START DELIVERY
                    </Button>
                  )}

                  {isOutForDelivery && (
                    <div className="space-y-6">
                       <button onClick={() => setShowQr(true)} className="w-full h-16 bg-gray-900 text-white rounded-[1.75rem] font-black uppercase italic text-sm flex items-center justify-center gap-3 shadow-xl"><QrCode className="h-6 w-6" /> SHOW COLLECTION QR</button>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setCollectionMethod('Online')} className={cn("h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all", collectionMethod === 'Online' ? "bg-primary/5 border-primary text-primary" : "bg-gray-50 border-transparent text-gray-400")}>
                             <CreditCard className="h-5 w-5" /><span className="text-[10px] font-black uppercase">Online</span>
                          </button>
                          <button onClick={() => setCollectionMethod('Cash')} className={cn("h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all", collectionMethod === 'Cash' ? "bg-amber-50 border-amber-500 text-amber-700" : "bg-gray-50 border-transparent text-gray-400")}>
                             <Banknote className="h-5 w-5" /><span className="text-[10px] font-black uppercase">Cash</span>
                          </button>
                       </div>

                       {collectionMethod && (
                         <div className="space-y-5 pt-2 animate-in zoom-in duration-500">
                            <label className="text-[10px] font-black text-green-600 uppercase text-center block tracking-[0.2em]">Enter Customer Delivery OTP</label>
                            <Input 
                              type="tel" maxLength={6} placeholder="0 0 0 0 0 0" 
                              value={enteredCode} onChange={e => setEnteredCode(e.target.value.replace(/\D/g,''))}
                              className="h-20 rounded-2xl border-none bg-green-50 text-center font-black text-4xl tracking-[0.4em] text-green-700 shadow-inner"
                            />
                            <Button onClick={handleAction} disabled={enteredCode.length !== 6} className="w-full h-24 bg-green-600 text-white rounded-[2.5rem] font-black uppercase italic text-2xl shadow-xl shadow-green-100">MARK DELIVERED</Button>
                         </div>
                       )}
                    </div>
                  )}
               </div>
             )}
          </div>
       </div>

       <Dialog open={showQr} onOpenChange={setShowQr}>
          <DialogContent className="rounded-[3rem] max-w-sm p-10 text-center space-y-8 bg-white border-none shadow-2xl focus:outline-none">
             <DialogHeader>
                <DialogTitle className="font-black italic uppercase text-3xl tracking-tighter">Collect Payment</DialogTitle>
                <DialogDescription className="sr-only">UPI QR Code for collection</DialogDescription>
             </DialogHeader>
             <div className="bg-gray-50 p-8 rounded-[2.5rem] border-4 border-dashed border-gray-200">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${order.total}&cu=INR`)}`} className="h-56 w-56 mx-auto" alt="QR" />
                <p className="mt-6 text-4xl font-black italic text-gray-900 tracking-tighter">₹{order.total?.toFixed(0)}</p>
             </div>
             <Button onClick={() => setShowQr(false)} className="w-full h-16 bg-black text-white rounded-2xl font-black uppercase italic">CLOSE QR</Button>
          </DialogContent>
       </Dialog>
    </div>
  );
});
TaskCard.displayName = "TaskCard";

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
    if (!isMounted || authLoading) return;
    const hasActiveSession = localStorage.getItem('shopykart_session_active') === 'true';
    if (!user) {
      if (!hasActiveSession) router.replace('/delivery/login');
      return;
    }
  }, [isMounted, user, authLoading, router]);

  const ordersQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'orders'), orderBy('createdAt', 'desc')) : null, [firestore]);
  const { data: allOrders } = useCollection<any>(ordersQuery);

  const taskOrders = useMemo(() => {
    if (!allOrders || !user) return [];
    return allOrders.filter(order => {
      if (dismissedTasks.includes(order.id)) return false;
      const isAvailable = (order.status === 'Ready for Pickup') && !order.deliveryPartnerId;
      const isMyTask = order.deliveryPartnerId === user.uid && !['Delivered', 'Cancelled'].includes(order.status);
      return isAvailable || isMyTask;
    });
  }, [allOrders, user, dismissedTasks]);

  const historyOrders = useMemo(() => {
    if (!allOrders || !user) return [];
    return allOrders.filter(order => order.deliveryPartnerId === user.uid && ['Delivered', 'Cancelled'].includes(order.status));
  }, [allOrders, user]);

  const updateDelivery = async (orderId: string, status: string, collectionMethod?: string | null, partnerData?: any) => {
    if (!firestore || !user) return;
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      const updateData: any = { status, updatedAt: serverTimestamp() };
      
      if (status === 'Accepted Task') {
        updateData.deliveryPartnerId = user.uid;
        updateData.deliveryPartnerName = partnerData?.fullName || 'Partner';
        updateData.deliveryPartnerPhone = partnerData?.phone || '';
      }
      
      if (status === 'Delivered') {
        const snap = await getDoc(orderRef);
        const data = snap.data();
        if (data?.readyForPickupAt) {
          const startTime = data.readyForPickupAt.seconds ? new Date(data.readyForPickupAt.seconds * 1000) : new Date();
          const durationMins = Math.ceil(differenceInSeconds(new Date(), startTime) / 60);
          updateData.totalDeliveryDuration = durationMins;
        }
        updateData.deliveredAt = serverTimestamp();

        // LOGIC: CREDIT VENDOR WALLETS ON DELIVERY (Full credit, no auto-deduction)
        if (data && data.items) {
           const vendorsToUpdate = new Map<string, number>();
           data.items.forEach((item: any) => {
             if (item.vendorId) {
               const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
               vendorsToUpdate.set(item.vendorId, (vendorsToUpdate.get(item.vendorId) || 0) + itemTotal);
             }
           });
           for (const [vId, amount] of Array.from(vendorsToUpdate.entries())) {
             const vendorRef = doc(firestore, 'vendors', vId);
             // Credit FULL amount. Commission (₹10) managed manually.
             await updateDoc(vendorRef, { walletBalance: increment(amount), updatedAt: serverTimestamp() });
           }
        }
      }

      if (collectionMethod) updateData.paymentCollectionMethod = collectionMethod;
      await updateDoc(orderRef, updateData);
      toast({ title: `Task ${status}` });
    } catch (e) { 
      toast({ variant: "destructive", title: "Update Failed" }); 
    }
  };

  const handlePass = (id: string) => {
    const next = [...dismissedTasks, id];
    setDismissedTasks(next);
    localStorage.setItem('fleet_dismissed_tasks', JSON.stringify(next));
    toast({ title: "Task Dismissed" });
  };

  const handleTestAlert = async () => {
    setIsTesting(true);
    toast({ title: "Ringing Check! 📱", description: "Phone 5s me bajega." });
    await scheduleTestNotification();
    setTimeout(() => setIsTesting(false), 5000);
  };

  if (!isMounted || authLoading || (profileLoading && !partnerProfile && user)) {
    return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col max-w-lg mx-auto relative overflow-hidden transform-gpu">
      <header className="bg-white px-6 py-6 border-b border-gray-50 shrink-0 z-[500] shadow-sm">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-primary/10 shadow-inner bg-gray-50 flex items-center justify-center">
                 {partnerProfile?.photoUrl ? (
                   <img src={partnerProfile.photoUrl} className="h-full w-full object-cover" alt="" />
                 ) : (
                   <User className="h-7 w-7 text-gray-300" />
                 )}
              </div>
              <div>
                 <h1 className="text-lg font-black italic uppercase leading-none mb-1.5 truncate max-w-[140px]">{partnerProfile?.fullName?.split(' ')[0]}</h1>
                 <div className="flex items-center gap-1.5">
                    <div className={cn("h-2 w-2 rounded-full", partnerProfile?.isOnline ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                    <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">{partnerProfile?.isOnline ? 'Active on duty' : 'Currently off duty'}</span>
                 </div>
              </div>
           </div>
           <div className="flex flex-col items-center gap-1">
              <span className="text-[7px] font-black text-primary uppercase tracking-widest">Go Duty</span>
              <Switch 
                checked={partnerProfile?.isOnline === true} 
                onCheckedChange={async (o) => { if(firestore && user) await updateDoc(doc(firestore, 'delivery_partners', user.uid), { isOnline: o }); }} 
                className="data-[state=checked]:bg-green-500" 
              />
           </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
         {activeTab === 'tasks' && (
           <div className="p-5 space-y-6">
              <div className="bg-white p-5 rounded-[2rem] border border-gray-100 flex items-center justify-between shadow-sm">
                 <div className="flex items-center gap-3">
                    <div className="h-11 w-11 bg-primary/5 rounded-2xl flex items-center justify-center text-primary border border-primary/10">
                       <BellRing className="h-5 w-5 animate-ring" />
                    </div>
                    <div>
                       <h4 className="text-[11px] font-black uppercase italic tracking-tighter">Sound System</h4>
                       <p className="text-[8px] font-bold text-gray-400 uppercase">Test background alert ringing</p>
                    </div>
                 </div>
                 <Button onClick={handleTestAlert} disabled={isTesting} className="h-9 px-4 bg-[#0B0B0B] text-white rounded-xl font-black uppercase text-[8px] italic tracking-widest">{isTesting ? 'Wait...' : 'TEST ALERT'}</Button>
              </div>

              <div className="flex items-center justify-between px-2">
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">Task Queue</h2>
                 <Badge variant="outline" className="rounded-full border-gray-200 text-gray-400 font-black uppercase text-[10px]">
                   {taskOrders.length} PENDING
                 </Badge>
              </div>

              <div className="space-y-4">
                {taskOrders.length > 0 ? taskOrders.map((order) => (
                  <TaskCard key={order.id} order={order} onUpdate={updateDelivery} userData={partnerProfile} onPass={handlePass} />
                )) : (
                  <div className="text-center py-20 opacity-20 flex flex-col items-center">
                    <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                       <Bike className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="font-black italic uppercase text-xs tracking-widest">No active tasks</p>
                    <p className="text-[10px] font-bold mt-2">Check back later</p>
                  </div>
                )}
              </div>
           </div>
         )}

         {activeTab === 'history' && (
           <div className="p-5 space-y-6 animate-in fade-in duration-500">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter px-2">My Task History</h2>
              <div className="space-y-4">
                {historyOrders.length > 0 ? historyOrders.map((order) => (
                  <div key={order.id} className="bg-white p-5 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between group">
                     <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center",
                          order.status === 'Delivered' ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                        )}>
                           {order.status === 'Delivered' ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
                        </div>
                        <div>
                           <h4 className="font-black italic uppercase text-sm leading-none mb-1">#{order.customerOrderNumber}</h4>
                           <p className="text-[10px] font-bold text-gray-400 uppercase italic truncate max-w-[150px]">{order.restaurantName}</p>
                           {order.totalDeliveryDuration && (
                             <Badge className="bg-blue-50 text-blue-600 border-none text-[7px] font-black uppercase mt-1">
                               {order.totalDeliveryDuration} min delivery
                             </Badge>
                           )}
                        </div>
                     </div>
                     <div className="text-right">
                        <div className="flex items-center gap-1">
                           <IndianRupee className="h-3 w-3 text-gray-400" />
                           <span className="text-sm font-black text-gray-900 italic block">{order.total?.toFixed(0)}</span>
                        </div>
                        <Badge className={cn(
                          "border-none text-[7px] font-black uppercase tracking-widest px-2",
                          order.status === 'Delivered' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        )}>
                          {order.status}
                        </Badge>
                     </div>
                  </div>
                )) : (
                  <div className="text-center py-20 opacity-20">
                     <History className="h-12 w-12 mx-auto mb-4" />
                     <p className="font-black uppercase text-xs">History is empty</p>
                  </div>
                )}
              </div>
           </div>
         )}

         {activeTab === 'profile' && (
            <div className="p-8 space-y-10 animate-in fade-in duration-500">
               <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="h-32 w-32 rounded-[3rem] overflow-hidden border-[6px] border-white shadow-2xl mx-auto bg-gray-50 flex items-center justify-center relative">
                      {partnerProfile?.photoUrl ? (
                        <img src={partnerProfile.photoUrl} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <User className="h-10 w-10 text-gray-300" />
                      )}
                      <div className="absolute inset-0 border-[2px] border-black/5 rounded-[3rem] pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">{partnerProfile?.fullName}</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3">RIDER ID • {user?.uid.slice(-8)}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-5">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="bg-primary/5 p-2 rounded-xl text-primary"><PhoneCall className="h-5 w-5" /></div>
                           <span className="text-sm font-black uppercase italic text-gray-800">{partnerProfile?.phone}</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300" />
                     </div>
                     <div className="h-[1px] w-full bg-gray-50" />
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><ShieldCheck className="h-5 w-5" /></div>
                           <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Verified Partner</span>
                        </div>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                     </div>
                  </div>

                  <button 
                    onClick={() => { localStorage.removeItem('shopykart_session_active'); signOut(auth!).then(() => router.replace('/')); }}
                    className="w-full h-18 bg-white border border-red-50 text-red-500 rounded-[2.2rem] flex items-center justify-center gap-3 font-black uppercase italic text-sm shadow-sm active:scale-95 transition-all"
                  >
                    <LogOut className="h-5 w-5" /> DISCONNECT ACCOUNT
                  </button>
               </div>
            </div>
         )}
      </main>

      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[440px] bg-[#0F172A]/90 backdrop-blur-xl pt-4 pb-4 px-6 flex justify-around border border-white/10 z-[1000] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {[
          {id:'tasks',label:'TASKS',icon:LayoutDashboard},
          {id:'history',label:'HISTORY',icon:History},
          {id:'profile',label:'ID CARD',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-all group outline-none">
            <div className={cn(
              "h-1 w-5 rounded-full transition-all mb-1", 
              activeTab === item.id ? "bg-primary w-8" : "bg-transparent"
            )} />
            <item.icon className={cn("h-5 w-5 transition-all", activeTab === item.id ? "text-primary scale-110" : "text-gray-500 group-hover:text-gray-300")} />
            <span className={cn("text-[9px] font-black uppercase tracking-[0.1em]", activeTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
