
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ShoppingBag, ChevronRight, Clock, Package, User, MapPin, ReceiptText, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

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
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-black text-lg italic tracking-tight">#{order.orderDisplayId || order.id.slice(-5).toUpperCase()}</h3>
                    <Badge className={cn("text-[9px] font-black uppercase tracking-widest rounded-full border-none", getStatusColor(order.status))}>
                      {order.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 mb-6">
                    <div className="flex items-center text-xs font-bold text-muted-foreground">
                      <User className="h-3.5 w-3.5 mr-2 text-primary" />
                      <span className="truncate">{order.customerName || 'Premium User'} ({order.userId?.slice(-6)})</span>
                    </div>
                    <div className="flex items-center text-xs font-bold text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mr-2 text-primary" />
                      <span className="truncate max-w-[200px]">{order.address}</span>
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
                    
                    {/* CUSTOM SURCHARGE DISPLAY FOR ADMIN */}
                    {order.items?.some((i: any) => i.isCustom) && (
                      <div className="flex justify-between items-center text-[10px] font-black text-primary italic pt-1">
                         <div className="flex items-center gap-1.5">
                            <Sparkles className="h-3 w-3" />
                            <span>CUSTOM DISH SERVICE CHARGE</span>
                         </div>
                         <span>₹{order.items.reduce((acc: number, item: any) => acc + (item.customSurcharge || 0), 0)}</span>
                      </div>
                    )}

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
