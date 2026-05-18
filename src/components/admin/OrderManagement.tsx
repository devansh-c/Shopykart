
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ShoppingBag, ChevronRight, Clock, Package, User, MapPin } from 'lucide-react';
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
          <h2 className="text-xl font-black italic uppercase">Order Operations</h2>
          <p className="text-xs text-muted-foreground font-bold">Real-time order management dashboard</p>
        </div>
        <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase text-[10px] px-3">
          {orders?.length || 0} TOTAL
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {orders?.map((order) => (
          <div key={order.id} className="bg-white p-6 rounded-[2rem] border hover:shadow-xl transition-all group">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start space-x-5">
                <div className={cn(
                  "h-16 w-16 rounded-3xl flex items-center justify-center transition-colors shrink-0",
                  getStatusColor(order.status)
                )}>
                  <Package className="h-8 w-8" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-black text-lg italic tracking-tight">#ORD-{order.id.slice(-4).toUpperCase()}</h3>
                    <Badge className={cn("text-[9px] font-black uppercase tracking-widest rounded-full", getStatusColor(order.status))}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                    <div className="flex items-center text-xs font-bold text-muted-foreground">
                      <User className="h-3.5 w-3.5 mr-2 text-primary" />
                      ID: {order.userId?.slice(-6)}
                    </div>
                    <div className="flex items-center text-xs font-bold text-muted-foreground">
                      <ShoppingBag className="h-3.5 w-3.5 mr-2 text-primary" />
                      {order.items?.length} Items
                    </div>
                    <div className="flex items-center text-xs font-bold text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mr-2 text-primary" />
                      <span className="truncate max-w-[150px]">{order.address}</span>
                    </div>
                    <div className="flex items-center text-xs font-black text-foreground italic">
                      ₹{order.total?.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-2xl">
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
                <Button variant="default" className="h-11 px-5 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20">
                  TRACK
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
