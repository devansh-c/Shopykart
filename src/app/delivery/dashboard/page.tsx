
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
  Camera
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';

const OrderMapViewer = dynamic(() => import('@/components/shared/OrderMapViewer'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-3xl" />
});

type MainTab = 'home' | 'history' | 'payout' | 'profile';
type OrderFilter = 'NEW' | 'DELIVERED' | 'CANCELLED';

export default function DeliveryDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [homeFilter, setHomeFilter] = useState<OrderFilter>('NEW');
  const [isMounted, setIsMounted] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedTaskCoords, setSelectedTaskCoords] = useState<{lat: number, lng: number} | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const partnerRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'delivery_partners', user.uid);
  }, [firestore, user]);
  
  const { data: partnerProfile, loading: profileLoading } = useDoc<any>(partnerRef);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/delivery/login');
      return;
    }

    if (!authLoading && !profileLoading && user && !partnerProfile) {
      toast({ 
        variant: "destructive", 
        title: "Access Restricted", 
        description: "Not authorized for Delivery Hub." 
      });
      if (auth) signOut(auth);
      router.push('/delivery/login');
    }
  }, [user, authLoading, profileLoading, partnerProfile, router, auth, toast]);

  // Orders Query based on status
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: allOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  const filteredHomeOrders = useMemo(() => {
    if (!allOrders || !partnerProfile || !user) return [];

    return allOrders.filter(order => {
      // Logic for NEW orders: Shows pickups in zone OR orders already picked up by this user
      if (homeFilter === 'NEW') {
        const isReadyForPickup = order.status === 'Ready for Pickup' && order.pincode === partnerProfile.assignedPincode;
        const isMine = order.deliveryPartnerId === user.uid && ['Picked Up', 'Out for Delivery'].includes(order.status);
        return isReadyForPickup || isMine;
      }
      
      // History filters
      if (homeFilter === 'DELIVERED') {
        return order.status === 'Delivered' && order.deliveryPartnerId === user.uid;
      }
      
      if (homeFilter === 'CANCELLED') {
        return order.status === 'Cancelled' && (order.deliveryPartnerId === user.uid || order.pincode === partnerProfile.assignedPincode);
      }

      return false;
    });
  }, [allOrders, partnerProfile, user, homeFilter]);

  const historyOrders = useMemo(() => {
    if (!allOrders || !user) return [];
    return allOrders.filter(o => o.status === 'Delivered' && o.deliveryPartnerId === user.uid);
  }, [allOrders, user]);

  const toggleDuty = async (online: boolean) => {
    if (!firestore || !user) return;
    try {
      await updateDoc(doc(firestore, 'delivery_partners', user.uid), {
        isOnline: online,
        updatedAt: serverTimestamp()
      });
      toast({ title: online ? "Duty Started" : "Duty Ended", description: online ? "You are now accepting orders." : "You are now offline." });
    } catch (e) {
      toast({ variant: "destructive", title: "Status Update Failed" });
    }
  };

  const updateDelivery = async (orderId: string, status: string) => {
    if (!firestore || !user) return;
    try {
      const ref = doc(firestore, 'orders', orderId);
      await updateDoc(ref, { 
        status: status,
        deliveryPartnerId: user.uid,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Order Updated", description: `Status changed to ${status}` });
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to update order" });
    }
  };

  const openInternalMap = (task: any) => {
    if (task.latitude && task.longitude) {
      setSelectedTaskCoords({ lat: Number(task.latitude), lng: Number(task.longitude) });
      setIsMapOpen(true);
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`;
      window.open(url, '_blank');
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !partnerProfile) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-gray-900 flex flex-col max-w-lg mx-auto shadow-2xl relative">
      {/* Header */}
      <header className="bg-white px-6 py-6 border-b sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="h-12 w-12 rounded-2xl overflow-hidden border-2 border-primary/10 bg-muted">
             <img src={partnerProfile.photoUrl || "https://picsum.photos/seed/delivery/200/200"} className="h-full w-full object-cover" alt="Profile" />
           </div>
           <div>
              <h1 className="text-sm font-black italic uppercase leading-none mb-1">{partnerProfile.fullName}</h1>
              <div className="flex items-center gap-1.5">
                 <div className={cn("h-1.5 w-1.5 rounded-full", partnerProfile.isOnline ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                 <p className="text-[8px] font-black text-muted-foreground uppercase">{partnerProfile.isOnline ? 'On Duty' : 'Off Duty'}</p>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-3 bg-muted/30 px-3 py-2 rounded-2xl border border-border/50">
           <span className="text-[9px] font-black uppercase text-gray-500">Duty</span>
           <Switch 
            checked={partnerProfile.isOnline === true} 
            onCheckedChange={toggleDuty}
            className="data-[state=checked]:bg-green-500"
          />
        </div>
      </header>

      <main className="flex-1 pb-32 overflow-y-auto no-scrollbar">
         {activeTab === 'home' && (
           <div className="p-4 space-y-6 animate-in fade-in duration-500">
              {/* Home Sub-Filters */}
              <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-border/50">
                {['NEW', 'DELIVERED', 'CANCELLED'].map((f) => (
                  <button 
                    key={f} 
                    onClick={() => setHomeFilter(f as OrderFilter)}
                    className={cn(
                      "flex-1 py-3 text-[9px] font-black rounded-xl transition-all",
                      homeFilter === f ? "bg-primary text-white shadow-lg" : "text-gray-400"
                    )}
                  >
                    {f} ORDERS
                  </button>
                ))}
              </div>

              {/* Order List */}
              <div className="space-y-4">
                {filteredHomeOrders.map((order) => (
                  <div key={order.id} className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm relative overflow-hidden group">
                     <div className="flex justify-between items-start mb-4">
                        <div>
                           <Badge className={cn(
                             "border-none uppercase text-[8px] font-black px-2.5 py-1 rounded-full mb-2",
                             order.status === 'Cancelled' ? "bg-red-50 text-red-600" : 
                             order.status === 'Delivered' ? "bg-green-50 text-green-600" : "bg-primary/10 text-primary"
                           )}>
                             {order.status}
                           </Badge>
                           <h3 className="text-xl font-black italic tracking-tighter leading-none">#{order.orderDisplayId || order.id.slice(-4)}</h3>
                           <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase mt-1">
                              <Clock className="h-2.5 w-2.5" />
                              {isMounted && order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Just now'}
                           </div>
                        </div>
                        <button onClick={() => openInternalMap(order)} className="h-12 w-12 bg-muted/50 rounded-2xl flex items-center justify-center text-primary active:scale-90 transition-all">
                           <Compass className="h-6 w-6" />
                        </button>
                     </div>

                     <div className="bg-muted/30 rounded-2xl p-4 mb-4 space-y-3">
                        <div className="flex items-center gap-3">
                           <div className="bg-white p-1.5 rounded-lg shadow-sm text-primary"><User className="h-3.5 w-3.5" /></div>
                           <span className="text-xs font-black uppercase italic tracking-tighter">{order.customerName || 'Premium User'}</span>
                        </div>
                        <div className="flex items-start gap-3">
                           <div className="bg-white p-1.5 rounded-lg shadow-sm text-primary shrink-0"><MapPin className="h-3.5 w-3.5" /></div>
                           <span className="text-[10px] font-bold text-gray-600 leading-tight">{order.address}</span>
                        </div>
                     </div>

                     {homeFilter === 'NEW' && (
                       <div className="flex gap-2">
                          {order.status === 'Ready for Pickup' && (
                            <Button onClick={() => updateDelivery(order.id, 'Picked Up')} className="flex-1 bg-black h-12 rounded-2xl font-black uppercase text-xs shadow-xl">Accept & Pickup</Button>
                          )}
                          {order.status === 'Picked Up' && (
                            <Button onClick={() => updateDelivery(order.id, 'Out for Delivery')} className="flex-1 bg-blue-600 h-12 rounded-2xl font-black uppercase text-xs">Start Delivery</Button>
                          )}
                          {order.status === 'Out for Delivery' && (
                            <Button onClick={() => updateDelivery(order.id, 'Delivered')} className="flex-1 bg-green-600 h-12 rounded-2xl font-black uppercase text-xs">Mark Delivered</Button>
                          )}
                          
                          {order.customerPhone && (
                            <Button onClick={() => window.open(`tel:${order.customerPhone}`)} variant="outline" className="h-12 w-12 p-0 rounded-2xl border-green-100 bg-green-50 text-green-600">
                               <PhoneCall className="h-5 w-5" />
                            </Button>
                          )}
                       </div>
                     )}
                  </div>
                ))}

                {filteredHomeOrders.length === 0 && (
                  <div className="text-center py-20 opacity-20 flex flex-col items-center">
                     <Package className="h-16 w-16 mb-4" />
                     <p className="font-black italic uppercase tracking-widest text-xs">No orders in this list</p>
                  </div>
                )}
              </div>
           </div>
         )}

         {activeTab === 'history' && (
           <div className="p-4 space-y-4 animate-in fade-in duration-500">
              <h2 className="text-2xl font-black italic uppercase tracking-tight mb-4">My Deliveries</h2>
              {historyOrders.map((o) => (
                <div key={o.id} className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm">
                   <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-black italic">#{o.orderDisplayId || o.id.slice(-4)}</span>
                      <Badge className="bg-green-50 text-green-600 border-none font-black text-[8px] uppercase">SUCCESSFUL</Badge>
                   </div>
                   <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                      <Clock className="h-3 w-3" />
                      {isMounted && o.createdAt?.seconds ? format(new Date(o.createdAt.seconds * 1000), 'MMM d, yyyy') : 'Recently'}
                   </div>
                   <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                      <User className="h-3.5 w-3.5 text-primary" /> {o.customerName}
                   </div>
                </div>
              ))}
              {historyOrders.length === 0 && (
                <div className="text-center py-20 opacity-20 flex flex-col items-center">
                   <History className="h-16 w-16 mb-4" />
                   <p className="font-black italic uppercase tracking-widest text-xs">No delivery history yet</p>
                </div>
              )}
           </div>
         )}

         {activeTab === 'payout' && (
           <div className="p-4 space-y-6 animate-in fade-in duration-500">
              <div className="bg-[#0B0B0B] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                 <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 opacity-60">
                       <Wallet className="h-4 w-4 text-primary" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Earnings Wallet</span>
                    </div>
                    <h3 className="text-5xl font-black italic tracking-tighter text-white">₹{partnerProfile.walletBalance?.toFixed(2) || '0.00'}</h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-6 bg-white/5 py-2 px-4 rounded-xl w-fit">Total Deliveries: {historyOrders.length}</p>
                 </div>
                 <div className="absolute top-0 right-0 h-full w-32 bg-primary/5 -skew-x-12 translate-x-12" />
              </div>

              <div className="bg-white p-6 rounded-3xl border border-border/50 shadow-sm text-center">
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Settlement Cycle: Weekly</p>
              </div>
           </div>
         )}

         {activeTab === 'profile' && (
           <div className="p-4 space-y-6 animate-in fade-in duration-500">
              <div className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm text-center">
                 <div className="relative mx-auto w-24 h-24 mb-4">
                    <img src={partnerProfile.photoUrl} className="h-full w-full object-cover rounded-[2rem] border-4 border-white shadow-xl bg-muted" alt="Store" />
                    <div className="absolute -bottom-1 -right-1 bg-primary p-2 rounded-xl text-white shadow-lg"><Camera className="h-3 w-3" /></div>
                 </div>
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter">{partnerProfile.fullName}</h2>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ID: {partnerProfile.uid?.slice(-8)} • Zone: {partnerProfile.assignedPincode}</p>
              </div>

              <div className="space-y-3">
                 <div className="bg-white rounded-3xl border border-border/50 shadow-sm divide-y divide-border/30 overflow-hidden">
                    {[
                      { icon: MapPin, label: 'Assigned Pincode', value: partnerProfile.assignedPincode },
                      { icon: PhoneCall, label: 'Contact Phone', value: partnerProfile.phone },
                      { icon: User, label: 'Account Role', value: 'Delivery Partner' },
                    ].map((item, idx) => (
                      <div key={idx} className="p-5 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <div className="bg-primary/5 p-2.5 rounded-xl text-primary"><item.icon className="h-4 w-4" /></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
                         </div>
                         <span className="text-sm font-black italic">{item.value}</span>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="p-2">
                 <Button 
                   onClick={() => signOut(auth!)}
                   className="w-full h-14 bg-red-50 text-red-500 hover:bg-red-100 rounded-2xl font-black uppercase italic text-xs tracking-widest active:scale-95 border-none shadow-none"
                 >
                   <LogOut className="h-4 w-4 mr-2" /> EXIT DASHBOARD
                 </Button>
              </div>
           </div>
         )}
      </main>

      {/* Navigation Assistant Modal */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-full sm:max-w-xl h-[85vh] p-0 overflow-hidden bg-white border-none shadow-2xl focus:outline-none">
           <DialogHeader className="p-6 bg-white border-b absolute top-0 left-0 right-0 z-50">
              <DialogTitle className="font-black italic uppercase text-center flex items-center justify-center gap-2">
                 <Map className="h-5 w-5 text-primary" />
                 Navigation Assistant
              </DialogTitle>
           </DialogHeader>
           
           <div className="h-full w-full pt-16 relative">
              {selectedTaskCoords && (
                 <OrderMapViewer lat={selectedTaskCoords.lat} lng={selectedTaskCoords.lng} />
              )}
           </div>

           <div className="absolute bottom-8 left-0 right-0 px-6 z-50 flex flex-col gap-3">
              <Button 
                onClick={() => {
                   if (selectedTaskCoords) {
                     window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedTaskCoords.lat},${selectedTaskCoords.lng}`, '_blank');
                   }
                }}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] h-14 font-black uppercase italic text-sm shadow-2xl active:scale-95 transition-all"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                START GOOGLE MAPS
              </Button>
              <Button variant="ghost" onClick={() => setIsMapOpen(false)} className="w-full text-gray-400 font-bold uppercase text-[10px] tracking-widest">CLOSE MAP</Button>
           </div>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
        {[
          {id:'home',label:'Home',icon:LayoutDashboard},
          {id:'history',label:'History',icon:History},
          {id:'payout',label:'Payout',icon:CircleDollarSign},
          {id:'profile',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as MainTab)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-none group">
            <item.icon className={cn("h-5 w-5 transition-none", activeTab === item.id ? "text-primary scale-110" : "text-gray-500")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest transition-none", activeTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
            {activeTab === item.id && <div className="h-1 w-1 bg-primary rounded-full mt-0.5" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
