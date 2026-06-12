
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
import { useEffect, useState, useRef, useMemo, memo, useTransition } from 'react';
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

const OrderCard = memo(({ order, onUpdate, onMapOpen, filter }: any) => (
  <div className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm relative overflow-hidden group transform-gpu">
     <div className="flex justify-between items-start mb-4">
        <div>
           <Badge className={cn("border-none uppercase text-[8px] font-black px-2.5 py-1 rounded-full mb-2", order.status === 'Cancelled' ? "bg-red-50 text-red-600" : order.status === 'Delivered' ? "bg-green-50 text-green-600" : "bg-primary/10 text-primary")}>{order.status}</Badge>
           <h3 className="text-xl font-black italic tracking-tighter leading-none">#{order.orderDisplayId || order.id.slice(-4)}</h3>
           <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase mt-1"><Clock className="h-2.5 w-2.5" />{format(new Date(order.createdAt?.seconds * 1000 || Date.now()), 'MMM d, h:mm a')}</div>
        </div>
        <button onClick={() => onMapOpen(order)} className="h-12 w-12 bg-muted/50 rounded-2xl flex items-center justify-center text-primary active:scale-90 transition-all"><Compass className="h-6 w-6" /></button>
     </div>
     <div className="bg-muted/30 rounded-2xl p-4 mb-4 space-y-3">
        <div className="flex items-center gap-3"><div className="bg-white p-1.5 rounded-lg shadow-sm text-primary"><User className="h-3.5 w-3.5" /></div><span className="text-xs font-black uppercase italic tracking-tighter">{order.customerName}</span></div>
        <div className="flex items-start gap-3"><div className="bg-white p-1.5 rounded-lg shadow-sm text-primary shrink-0"><MapPin className="h-3.5 w-3.5" /></div><span className="text-[10px] font-bold text-gray-600 leading-tight">{order.address}</span></div>
     </div>
     {filter === 'NEW' && (
       <div className="flex gap-2">
          {order.status === 'Ready for Pickup' && <Button onClick={() => onUpdate(order.id, 'Picked Up')} className="flex-1 bg-black h-12 rounded-2xl font-black uppercase text-xs">Accept & Pickup</Button>}
          {order.status === 'Picked Up' && <Button onClick={() => onUpdate(order.id, 'Out for Delivery')} className="flex-1 bg-blue-600 h-12 rounded-2xl font-black uppercase text-xs">Start Delivery</Button>}
          {order.status === 'Out for Delivery' && <Button onClick={() => onUpdate(order.id, 'Delivered')} className="flex-1 bg-green-600 h-12 rounded-2xl font-black uppercase text-xs">Mark Delivered</Button>}
       </div>
     )}
  </div>
));
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
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedTaskCoords, setSelectedTaskCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  const partnerRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'delivery_partners', user.uid);
  }, [firestore, user]);
  const { data: partnerProfile, loading: profileLoading } = useDoc<any>(partnerRef);

  useEffect(() => {
    if (!authLoading && !user) { router.push('/delivery/login'); return; }
    if (!authLoading && !profileLoading && user && !partnerProfile) {
      if (auth) signOut(auth);
      router.push('/delivery/login');
    }
  }, [user, authLoading, profileLoading, partnerProfile, router, auth]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: allOrders } = useCollection<any>(ordersQuery);

  const filteredHomeOrders = useMemo(() => {
    if (!allOrders || !partnerProfile || !user) return [];
    return allOrders.filter(order => {
      if (homeFilter === 'NEW') return (order.status === 'Ready for Pickup' && order.pincode === partnerProfile.assignedPincode) || (order.deliveryPartnerId === user.uid && ['Picked Up', 'Out for Delivery'].includes(order.status));
      if (homeFilter === 'DELIVERED') return order.status === 'Delivered' && order.deliveryPartnerId === user.uid;
      return order.status === 'Cancelled' && (order.deliveryPartnerId === user.uid || order.pincode === partnerProfile.assignedPincode);
    });
  }, [allOrders, partnerProfile, user, homeFilter]);

  const handleTabSelect = (id: MainTab) => {
    startTransition(() => { setActiveTab(id); });
  };

  const updateDelivery = async (orderId: string, status: string) => {
    if (!firestore || !user) return;
    try {
      await updateDoc(doc(firestore, 'orders', orderId), { status, deliveryPartnerId: user.uid, updatedAt: serverTimestamp() });
      toast({ title: "Updated" });
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); }
  };

  if (authLoading || profileLoading) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!user || !partnerProfile) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col max-w-lg mx-auto shadow-2xl relative transform-gpu">
      <header className="bg-white px-6 py-6 border-b sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <div className="h-12 w-12 rounded-2xl overflow-hidden border-2 border-primary/10 bg-muted"><img src={partnerProfile.photoUrl} className="h-full w-full object-cover" alt="" /></div>
           <div><h1 className="text-sm font-black italic uppercase leading-none mb-1">{partnerProfile.fullName}</h1><div className="flex items-center gap-1.5"><div className={cn("h-1.5 w-1.5 rounded-full", partnerProfile.isOnline ? "bg-green-500 animate-pulse" : "bg-red-500")} /><p className="text-[8px] font-black uppercase text-muted-foreground">{partnerProfile.isOnline ? 'On Duty' : 'Off Duty'}</p></div></div>
        </div>
        <Switch checked={partnerProfile.isOnline === true} onCheckedChange={async (o) => { await updateDoc(doc(firestore!, 'delivery_partners', user.uid), { isOnline: o }); toast({ title: o ? "Online" : "Offline" }); }} className="data-[state=checked]:bg-green-500" />
      </header>

      <main className={cn("flex-1 pb-32 transition-opacity duration-300", isPending ? "opacity-50" : "opacity-100")}>
         {activeTab === 'home' && (
           <div className="p-4 space-y-6 animate-in fade-in duration-500">
              <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-border/50">
                {['NEW', 'DELIVERED', 'CANCELLED'].map((f) => (
                  <button key={f} onClick={() => setHomeFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", homeFilter === f ? "bg-primary text-white shadow-lg" : "text-gray-400")}>{f} ORDERS</button>
                ))}
              </div>
              <div className="space-y-4 content-visibility-auto">
                {filteredHomeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} filter={homeFilter} onUpdate={updateDelivery} onMapOpen={(o:any) => { setSelectedTaskCoords({lat: Number(o.latitude), lng: Number(o.longitude)}); setIsMapOpen(true); }} />
                ))}
              </div>
           </div>
         )}
      </main>

      <nav className="fixed bottom-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-50 rounded-t-[2.5rem] shadow-2xl">
        {[
          {id:'home',label:'Home',icon:LayoutDashboard},
          {id:'history',label:'History',icon:History},
          {id:'payout',label:'Payout',icon:CircleDollarSign},
          {id:'profile',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => handleTabSelect(item.id as MainTab)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-none">
            <item.icon className={cn("h-5 w-5", activeTab === item.id ? "text-primary scale-110" : "text-gray-500")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", activeTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>

      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-full sm:max-w-xl h-[85vh] p-0 overflow-hidden bg-white border-none shadow-2xl">
           {selectedTaskCoords && <div className="h-full w-full"><OrderMapViewer lat={selectedTaskCoords.lat} lng={selectedTaskCoords.lng} /></div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
