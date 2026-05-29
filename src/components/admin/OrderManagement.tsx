
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ShoppingBag, ChevronRight, Clock, Package, User, MapPin, ReceiptText, Sparkles, Store, PhoneCall, Navigation, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

const statusOptions = [
  "Placed",
  "Accepted",
  "Preparing",
  "Ready for Pickup",
  "Picked Up",
  "Out for Delivery",
  "Delivered",
  "Cancelled"
];

export function OrderManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: orders, loading } = useCollection<any>(ordersQuery);

  const handleStatusUpdate = async (id: string, status: string) => {
    if (!firestore) return;
    const ref = doc(firestore, 'orders', id);
    await updateDoc(ref, { status });
    toast({ title: "Status Updated", description: `Order #${id.slice(-4)} is now ${status}.` });
  };

  const handleTrackLocation = (order: any) => {
    if (order.latitude && order.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`;
      window.open(url, '_blank');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Placed': return "bg-gray-100 text-gray-600";
      case 'Preparing': return "bg-amber-100 text-amber-600";
      case 'Out for Delivery': return "bg-blue-100 text-blue-600";
      case 'Delivered': return "bg-green-100 text-green-600";
      case 'Cancelled': return "bg-red-100 text-red-600";
      default: return "bg-primary/10 text-primary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-black italic uppercase text-gray-800">Order Operations</h2>
          <p className="text-xs text-muted-foreground font-bold">Real-time order management dashboard</p>
        </div>
        <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase text-[10px] px-3">
          {orders?.length || 0} TOTAL ORDERS
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {orders?.map((order) => (
          <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border border-border/50 hover:shadow-xl transition-all group">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex-1 flex items-start space-x-5">
                <div className={cn(
                  "h-16 w-16 rounded-3xl flex items-center justify-center transition-colors shrink-0",
                  getStatusColor(order.status)
                )}>
                  <Package className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-black text-lg italic tracking-tight">#{order.orderDisplayId || order.id.slice(-5).toUpperCase()}</h3>
                    <Badge className={cn("text-[9px] font-black uppercase tracking-widest rounded-full border-none", getStatusColor(order.status))}>
                      {order.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-4">
                    <Clock className="h-3 w-3 text-primary" />
                    {isMounted && order.createdAt?.seconds 
                      ? format(new Date(order.createdAt.seconds * 1000), 'MMM d, h:mm a') 
                      : 'Just now'}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-6">
                    <div className="flex flex-col gap-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Business Source</p>
                      <div className="flex items-center text-xs font-black text-primary uppercase tracking-tighter">
                        <Store className="h-3.5 w-3.5 mr-1.5" />
                        {order.restaurantName || 'ShopyKart Select'}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Customer Identity</p>
                      <div className="flex items-center justify-between bg-muted/20 p-2.5 rounded-xl border border-border/30">
                        <div className="flex items-center text-xs font-bold text-gray-700 min-w-0">
                          <User className="h-3.5 w-3.5 mr-1.5 text-gray-400 shrink-0" />
                          <div className="flex flex-col truncate">
                            <span className="truncate">{order.customerName || 'Premium User'}</span>
                            <span className="text-[10px] font-black text-muted-foreground">{order.customerPhone || 'No Phone'}</span>
                          </div>
                        </div>
                        {order.customerPhone && (
                          <button 
                            onClick={() => window.open(`tel:${order.customerPhone}`)}
                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg shadow-lg shadow-green-500/20 active:scale-90 transition-all ml-2"
                            title="Call Customer"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 md:col-span-2">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">Delivery Location</p>
                      <div className="flex items-center justify-between bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                        <div className="flex items-start text-xs font-bold text-gray-600 min-w-0 pr-4">
                          <MapPin className="h-3.5 w-3.5 mr-1.5 text-primary shrink-0 mt-0.5" />
                          <div className="flex flex-col min-w-0">
                             <span className="truncate line-clamp-1">{order.address}</span>
                             {order.latitude && <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Live GPS Pin Enabled ✅</span>}
                          </div>
                        </div>
                        <button 
                          onClick={() => handleTrackLocation(order)}
                          className="shrink-0 flex items-center gap-1.5 bg-blue-600 px-4 py-2 rounded-xl shadow-xl shadow-blue-200 text-white text-[10px] font-black uppercase italic hover:bg-blue-700 transition-all active:scale-95 animate-jump"
                        >
                          <Compass className="h-4 w-4" />
                          TRACK GPS
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/20 rounded-2xl p-4 border border-border/30 space-y-2">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border/50">
                       <ReceiptText className="h-3.5 w-3.5 text-primary" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Ordered Products</span>
                    </div>
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-xs font-bold">
                        <div className="flex items-center gap-2">
                           <span className={cn("text-gray-700", item.isCustom && "text-primary italic font-black")}>{item.quantity}x {item.name}</span>
                           {item.isCustom && <Badge className="bg-primary/10 text-primary text-[6px] px-1 py-0 rounded">CUSTOM</Badge>}
                        </div>
                        <span className="text-primary font-black">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    
                    <div className="pt-2 mt-2 border-t border-dashed border-border/50 flex justify-between items-center">
                       <span className="text-[10px] font-black text-muted-foreground uppercase">Grand Total</span>
                       <span className="text-base font-black text-foreground italic tracking-tight">₹{order.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 shrink-0">
                <div className="bg-muted/30 p-2 rounded-2xl flex items-center gap-3">
                  <Select 
                    defaultValue={order.status} 
                    onValueChange={(val) => handleStatusUpdate(order.id, val)}
                  >
                    <SelectTrigger className="w-[180px] rounded-xl font-black text-[10px] uppercase tracking-widest h-11 bg-white border-none shadow-sm focus:ring-primary/20">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      {statusOptions.map(status => (
                        <SelectItem key={status} value={status} className="font-bold text-xs py-3">
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {order.instructions && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[9px] font-black text-amber-600 uppercase mb-1">Instructions:</p>
                    <p className="text-[10px] font-bold text-amber-900 leading-tight italic">"{order.instructions}"</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
