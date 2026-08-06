
"use client"

import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { 
  ShoppingBag, Package, User, MapPin, Clock, Camera, Eye, Printer, Download, Loader2, Store, PhoneCall, ChevronRight, CheckCircle2, ShieldCheck, ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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

  const handleStatusUpdate = async (id: string, status: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'orders', id), { status, updatedAt: serverTimestamp() });
    toast({ title: "Status Updated" });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-8 pb-32">
        {loading && !orders ? (
          <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : orders?.map((order: any) => {
          const isCancelled = order.status === 'Cancelled';
          const isDelivered = order.status === 'Delivered';
          const displayTime = isMounted && order.createdAt?.seconds 
            ? format(new Date(order.createdAt.seconds * 1000), 'MMM d, h:mm a') 
            : 'Recently';

          return (
            <div key={order.id} className="bg-white rounded-[3rem] p-8 border border-border/40 shadow-sm transition-all hover:shadow-xl transform-gpu">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-6">
                  <div className={cn("h-20 w-20 rounded-[1.75rem] flex items-center justify-center border-2", isCancelled ? "bg-red-50 border-red-100" : isDelivered ? "bg-green-50 border-green-100" : "bg-primary/5 border-primary/10")}>
                    <Package className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <h3 className="font-black text-3xl italic uppercase tracking-tighter">#{order.orderDisplayId || order.id.slice(-4)}</h3>
                       <Badge className={cn("uppercase text-[8px] font-black border-none", isCancelled ? "bg-red-500 text-white" : isDelivered ? "bg-green-600 text-white" : "bg-primary text-white")}>{order.status}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] font-black text-primary uppercase tracking-widest italic">
                       <Clock className="h-4 w-4" /> {displayTime}
                    </div>
                  </div>
                </div>
              </div>

              {order.verificationImage && (
                <div className="mb-6">
                   <div className="flex items-center gap-2 text-primary mb-3">
                      <Camera className="h-4 w-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Verification Evidence</span>
                   </div>
                   <Dialog>
                      <DialogTrigger asChild>
                         <div className="relative h-44 w-full rounded-[2rem] overflow-hidden border-4 border-gray-50 cursor-pointer shadow-inner">
                            <img src={order.verificationImage} className="w-full h-full object-cover" alt="Evidence" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                               <div className="bg-white p-3 rounded-full text-black shadow-2xl"><Eye className="h-6 w-6" /></div>
                            </div>
                         </div>
                      </DialogTrigger>
                      <DialogContent className="rounded-[3rem] max-w-lg p-0 overflow-hidden border-none shadow-2xl">
                         <img src={order.verificationImage} className="w-full h-auto" />
                      </DialogContent>
                   </Dialog>
                </div>
              )}

              <div className="bg-[#F9FAFB] rounded-[2rem] p-6 mb-8 border border-border/40">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border shadow-sm"><User className="h-5 w-5 text-primary" /></div>
                       <span className="font-black text-lg italic uppercase tracking-tighter text-gray-900">{order.customerName}</span>
                    </div>
                    <button onClick={() => window.open(`tel:${order.customerPhone}`)} className="h-11 w-11 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-90 transition-all"><PhoneCall className="h-5 w-5" /></button>
                 </div>
                 <div className="space-y-2 mb-6 bg-white/50 p-4 rounded-2xl border border-white">
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-sm font-bold uppercase italic text-gray-700">
                         <span>{item.quantity}x {item.name}</span>
                         <span className="text-primary font-black">₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                 </div>
                 <div className="pt-4 border-t border-dashed flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-gray-500 uppercase leading-relaxed">{order.address}</p>
                 </div>
                 {order.utrNumber && (
                   <div className="mt-4 pt-4 border-t border-white flex items-center gap-3">
                      <Badge className="bg-blue-600 text-white font-black text-[8px] tracking-widest">UTR VERIFY</Badge>
                      <span className="font-mono text-xs font-black tracking-[0.2em] text-blue-700">{order.utrNumber}</span>
                   </div>
                 )}
              </div>

              <div className="flex flex-col gap-4">
                <Select defaultValue={order.status} onValueChange={(val) => handleStatusUpdate(order.id, val)}>
                  <SelectTrigger className="w-full h-14 rounded-2xl font-black text-xs uppercase bg-gray-50 border-none shadow-inner"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-[1.5rem] border-none shadow-2xl">
                    {statusOptions.map(s => <SelectItem key={s} value={s} className="font-bold text-xs uppercase italic py-3">{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
