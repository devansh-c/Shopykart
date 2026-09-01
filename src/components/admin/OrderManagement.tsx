
"use client"

import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Package, 
  User, 
  MapPin, 
  PhoneCall, 
  Navigation, 
  Map as MapIcon, 
  ShieldCheck, 
  X, 
  ExternalLink, 
  Loader2, 
  Banknote, 
  RotateCcw,
  Undo2,
  Crown, 
  Bike, 
  Trash2,
  Coins,
  Truck,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';

const OrderMapViewer = dynamic(() => import('@/components/shared/OrderMapViewer'), { 
  ssr: false,
  loading: () => <div className="h-44 w-full bg-muted animate-pulse rounded-2xl" />
});

const STATUS_FLOW = [
  "Placed", 
  "Accepted", 
  "Preparing", 
  "Ready for Pickup", 
  "Picked Up", 
  "Out for Delivery", 
  "Delivered"
];

export default function OrderManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: orders, loading } = useCollection<any>(ordersQuery);

  const handleNextStatus = async (id: string, currentStatus: string) => {
    if (!firestore) return;
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex < STATUS_FLOW.length - 1) {
      const nextStatus = STATUS_FLOW[currentIndex + 1];
      await updateDoc(doc(firestore, 'orders', id), { 
        status: nextStatus,
        updatedAt: serverTimestamp()
      });
      toast({ title: `Order ${nextStatus}!` });
    }
  };

  const handlePrevStatus = async (id: string, currentStatus: string) => {
    if (!firestore) return;
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex > 0) {
      const prevStatus = STATUS_FLOW[currentIndex - 1];
      await updateDoc(doc(firestore, 'orders', id), { 
        status: prevStatus,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Status Reversed", description: `Back to ${prevStatus}` });
    }
  };

  const getButtonLabel = (status: string) => {
    switch (status) {
      case 'Placed': return 'ACCEPT ORDER';
      case 'Accepted': return 'START PREPARING';
      case 'Preparing': return 'READY FOR PICKUP';
      case 'Ready for Pickup': return 'MARK PICKED UP';
      case 'Picked Up': return 'OUT FOR DELIVERY';
      case 'Out for Delivery': return 'MARK DELIVERED';
      case 'Delivered': return 'ORDER COMPLETED';
      default: return 'UPDATE STATUS';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">ORDER LOGISTICS</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Management Console</p>
        </div>
        <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase text-xs px-4 py-1.5 shadow-sm">
          {orders?.length || 0} TOTAL
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-10 pb-32">
        {orders?.map((order: any) => {
          const isCancelled = order.status === 'Cancelled';
          const isDelivered = order.status === 'Delivered';
          const lat = order.customerLat || order.customerLocation?.latitude;
          const lng = order.customerLng || order.customerLocation?.longitude;
          const currentIndex = STATUS_FLOW.indexOf(order.status);
          const hasNext = currentIndex < STATUS_FLOW.length - 1 && !isCancelled;
          const hasPrev = currentIndex > 0 && !isCancelled;

          return (
            <div key={order.id} className="bg-[#1C1C1C] rounded-[3rem] p-8 border border-white/5 shadow-2xl text-white transform-gpu transition-all">
              
              {/* TOP HEADER: ORDER # AND STATUS */}
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "h-20 w-20 rounded-[1.75rem] flex items-center justify-center border-2 shrink-0 transition-colors",
                    isCancelled ? "bg-red-950 border-red-900 text-red-500" : isDelivered ? "bg-green-950 border-green-900 text-green-500" : "bg-primary/10 border-primary/20 text-primary"
                  )}>
                    <Package className="h-10 w-10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <h3 className="font-black text-4xl italic uppercase tracking-tighter leading-none">ORDER #{order.customerOrderNumber || '...'}</h3>
                       <Badge className={cn(
                         "border-none text-[8px] font-black uppercase px-3 py-1 rounded-full",
                         isCancelled ? "bg-red-500 text-white" : isDelivered ? "bg-green-500 text-white" : "bg-primary text-white animate-pulse"
                       )}>{order.status.toUpperCase()}</Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                       <div className="bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                          <Banknote className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-[10px] font-black text-gray-300 uppercase tracking-tight">{order.paymentMethod?.toUpperCase()}</span>
                       </div>
                       
                       {/* DROP SPOT STATUS */}
                       <div className={cn(
                         "px-3 py-1.5 rounded-xl border flex items-center gap-2",
                         lat ? "bg-green-500/10 border-green-500/20 text-green-500" : "bg-red-500/10 border-red-500/20 text-red-500"
                       )}>
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="text-[9px] font-black uppercase">{lat ? 'DROP PIN SET' : 'DROP SPOT MISSING'}</span>
                       </div>

                       {/* PREMIUM & COINS FLAGS */}
                       {order.isPremiumPacking && (
                         <div className="bg-amber-400 text-black px-3 py-1.5 rounded-xl border-none flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span className="text-[9px] font-black uppercase">PREMIUM PACKING</span>
                         </div>
                       )}
                       {order.redeemCoins && (
                         <div className="bg-blue-600 text-white px-3 py-1.5 rounded-xl border-none flex items-center gap-2">
                            <Coins className="h-3.5 w-3.5" />
                            <span className="text-[9px] font-black uppercase">COINS REDEEMED</span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Store Outlet</p>
                   <span className="text-sm font-black italic uppercase text-primary">{order.restaurantName || 'ShopyKart'}</span>
                </div>
              </div>

              {/* CUSTOMER & ITEMS CARD */}
              <div className="bg-white/5 rounded-[2.5rem] p-7 mb-8 border border-white/5 shadow-inner">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-5">
                       <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                          <User className="h-6 w-6" />
                       </div>
                       <span className="font-black text-2xl italic uppercase tracking-tighter text-white">{order.customerName}</span>
                    </div>
                    <button 
                      onClick={() => window.open(`tel:${order.customerPhone}`)}
                      className="h-14 w-14 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-90 transition-all border-b-4 border-green-800"
                    >
                       <PhoneCall className="h-7 w-7" />
                    </button>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-3">
                       {order.items?.map((item: any, i: number) => (
                         <div key={i} className="flex justify-between items-center text-lg font-black italic">
                            <span className="text-gray-400"><span className="text-white">{item.quantity}x</span> <span className="uppercase text-white/90">{item.name}</span></span>
                            <span className="text-primary">₹{(item.price * item.quantity).toFixed(0)}</span>
                         </div>
                       ))}
                    </div>

                    <div className="pt-6 mt-4 border-t border-dashed border-white/10 flex items-start gap-3">
                       <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                       <p className="text-xs font-bold text-gray-400 uppercase leading-relaxed tracking-tight">{order.address}</p>
                    </div>

                    {lat && (
                      <div className="pt-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full h-14 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/10">
                              <MapIcon className="h-4 w-4 mr-2 text-primary" /> VIEW DROP LOGISTICS
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white">
                            <DialogHeader className="p-8">
                               <DialogTitle className="font-black italic uppercase text-center text-xl text-gray-900">Delivery Route</DialogTitle>
                            </DialogHeader>
                            <div className="p-8 pt-0 space-y-6">
                               <div className="h-64 w-full bg-muted rounded-[2rem] overflow-hidden border-4 border-muted/20">
                                  <OrderMapViewer lat={lat} lng={lng} />
                                </div>
                                <Button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`)} className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl">
                                   <Navigation className="h-4 w-4 mr-2" /> OPEN GOOGLE MAPS
                                </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                 </div>
              </div>

              {/* WORKFLOW STATUS BUTTONS */}
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-500 ml-1 tracking-widest">Workflow Status Control</label>
                 <div className="flex gap-3">
                    <Button 
                      onClick={() => handleNextStatus(order.id, order.status)}
                      disabled={isDelivered || isCancelled}
                      className={cn(
                        "flex-1 h-18 py-8 rounded-[1.75rem] font-black uppercase italic text-lg tracking-tighter transition-all active:scale-95 border-b-4",
                        isDelivered ? "bg-green-600 border-green-800" : "bg-white text-black hover:bg-primary hover:text-white border-gray-200"
                      )}
                    >
                      {isDelivered ? <CheckCircle2 className="mr-2 h-6 w-6" /> : null}
                      {getButtonLabel(order.status)}
                    </Button>
                    
                    {hasPrev && (
                      <button 
                        onClick={() => handlePrevStatus(order.id, order.status)}
                        className="h-18 w-18 bg-white/10 rounded-[1.75rem] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/20 transition-all border border-white/5 active:scale-90"
                        title="Reverse Status"
                      >
                         <Undo2 className="h-7 w-7" />
                      </button>
                    )}

                    {!isCancelled && !isDelivered && (
                      <button 
                        onClick={async () => { if(confirm("Cancel this order?")) await updateDoc(doc(firestore!, 'orders', order.id), { status: 'Cancelled' }); }}
                        className="h-18 w-18 bg-red-900/20 rounded-[1.75rem] flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 active:scale-90"
                      >
                         <X className="h-7 w-7" />
                      </button>
                    )}
                 </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
