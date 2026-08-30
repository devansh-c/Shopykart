"use client"

import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ShoppingBag, 
  ChevronRight, 
  Clock, 
  Package, 
  User, 
  MapPin, 
  ReceiptText, 
  Sparkles, 
  Store, 
  PhoneCall, 
  Navigation, 
  Compass, 
  Map as MapIcon, 
  ShieldCheck, 
  X, 
  ExternalLink, 
  Printer, 
  Download, 
  Eye, 
  Loader2, 
  ListPlus, 
  CreditCard, 
  Banknote, 
  Copy, 
  ShieldAlert, 
  CheckCircle2, 
  MessageSquareQuote, 
  Crown, 
  Bike, 
  Camera, 
  ImageIcon,
  Edit3,
  Trash2,
  FileText,
  Plus,
  Coins,
  Tag,
  Truck,
  Image as ImageIconLucide,
  KeyRound,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const statusOptions = ["Placed", "Accepted", "Preparing", "Ready for Pickup", "Picked Up", "Out for Delivery", "Delivered", "Cancelled"];

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

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  const handleStatusUpdate = async (id: string, status: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'orders', id), { status });
    toast({ title: "Status Updated", description: `Order is now ${status}.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">ORDER LOGISTICS</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Management Console</p>
        </div>
        <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase text-xs px-4 py-1.5 shadow-sm">
          {orders?.length || 0} ACTIVE
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-8 pb-32">
        {orders?.map((order: any) => {
          const isCancelled = order.status === 'Cancelled';
          const isDelivered = order.status === 'Delivered';
          const lat = order.customerLat || order.customerLocation?.latitude;
          const lng = order.customerLng || order.customerLocation?.longitude;

          return (
            <div key={order.id} className="bg-[#1C1C1C] rounded-[3rem] p-8 border border-white/5 shadow-2xl text-white transform-gpu transition-all hover:shadow-primary/5">
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
                       <h3 className="font-black text-3xl italic uppercase tracking-tighter">Order #{order.customerOrderNumber || '...'}</h3>
                       <Badge className={cn(
                         "border-none text-[8px] font-black uppercase px-2.5 py-1 rounded-full",
                         isCancelled ? "bg-red-500 text-white" : isDelivered ? "bg-green-500 text-white" : "bg-primary text-white"
                       )}>{order.status.toUpperCase()}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/10 flex items-center gap-1.5">
                          <Banknote className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">{order.paymentMethod?.toUpperCase()}</span>
                       </div>
                       <div className="bg-white/5 px-3 py-1 rounded-lg border border-white/10 flex items-center gap-1.5 text-primary">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-black uppercase">DROP SPOT {lat ? 'SET' : 'MISSING'}</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-[2rem] p-6 mb-8 border border-white/5 shadow-inner">
                 <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-primary shadow-sm">
                          <User className="h-5 w-5" />
                       </div>
                       <span className="font-black text-lg italic uppercase tracking-tight text-white">{order.customerName}</span>
                    </div>
                    <button 
                      onClick={() => window.open(`tel:${order.customerPhone}`)}
                      className="h-12 w-12 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"
                    >
                       <PhoneCall className="h-6 w-6" />
                    </button>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-2.5">
                       {order.items?.map((item: any, i: number) => (
                         <div key={i} className="flex justify-between items-center text-sm font-bold italic text-gray-400">
                            <span>{item.quantity}x <span className="text-white uppercase">{item.name}</span></span>
                            <span className="text-primary font-black">₹{(item.price * item.quantity).toFixed(0)}</span>
                         </div>
                       ))}
                    </div>

                    <div className="pt-4 mt-2 border-t border-dashed border-white/10 flex items-start gap-3">
                       <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                       <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed tracking-tight">{order.address}</p>
                    </div>

                    {lat && (
                      <div className="pt-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl font-black uppercase text-[10px] tracking-widest border border-white/10">
                              <MapIcon className="h-4 w-4 mr-2 text-primary" /> VIEW CUSTOMER DROP PIN
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white">
                            <DialogHeader className="p-8">
                               <DialogTitle className="font-black italic uppercase text-center text-xl text-gray-900">Drop Logistics</DialogTitle>
                               <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest">Pinpointed coordinate for delivery</DialogDescription>
                            </DialogHeader>
                            <div className="p-8 pt-0 space-y-6">
                               <div className="h-64 w-full bg-muted rounded-[2rem] overflow-hidden border-4 border-muted/20">
                                  <OrderMapViewer lat={lat} lng={lng} />
                                </div>
                                <Button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`)} className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl">
                                   <Navigation className="h-4 w-4 mr-2" /> OPEN IN GOOGLE MAPS
                                </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-gray-500 ml-1">Workflow Status</label>
                   <Select defaultValue={order.status} onValueChange={(val) => handleStatusUpdate(order.id, val)}>
                     <SelectTrigger className="w-full h-14 rounded-2xl font-black text-xs uppercase bg-white/5 border-white/10 shadow-none text-white"><SelectValue /></SelectTrigger>
                     <SelectContent className="rounded-[1.5rem] border-none shadow-2xl bg-[#1C1C1C] text-white">{statusOptions.map(s => <SelectItem key={s} value={s} className="font-bold text-xs py-3 uppercase focus:bg-primary">{s}</SelectItem>)}</SelectContent>
                   </Select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}