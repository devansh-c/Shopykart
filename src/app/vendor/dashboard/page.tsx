
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { Loader2, ShoppingBag, CheckCircle, Flame, Clock, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function VendorDashboard() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: orders, loading } = useCollection<any>(ordersQuery);

  const updateStatus = (orderId: string, nextStatus: string) => {
    if (!firestore) return;
    const ref = doc(firestore, 'orders', orderId);
    updateDoc(ref, { status: nextStatus })
      .then(() => toast({ title: "Status Updated", description: `Order is now ${nextStatus}` }));
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] p-6 pb-24">
      <header className="mb-8">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Vendor Panel</h1>
        <p className="text-muted-foreground text-sm font-bold">Manage your live orders in real-time</p>
      </header>

      <div className="space-y-4">
        {orders?.map((order) => (
          <div key={order.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-border/40">
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-primary tracking-widest">{order.status}</span>
                <h3 className="font-black italic text-lg leading-none mt-1">Order #{order.id.slice(-4)}</h3>
                <p className="text-xs text-muted-foreground mt-1 font-medium">{order.items?.length} Items • ₹{order.total}</p>
              </div>
              <div className="bg-primary/10 p-3 rounded-2xl"><ShoppingBag className="h-6 w-6 text-primary" /></div>
            </div>

            <div className="space-y-2 mb-6">
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="text-sm font-bold flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="text-muted-foreground">₹{item.price}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {order.status === 'Placed' && (
                <Button onClick={() => updateStatus(order.id, 'Accepted')} className="w-full bg-green-500 hover:bg-green-600 rounded-xl font-black uppercase italic h-12">Accept</Button>
              )}
              {order.status === 'Accepted' && (
                <Button onClick={() => updateStatus(order.id, 'Preparing')} className="w-full bg-primary rounded-xl font-black uppercase italic h-12"><Flame className="mr-2 h-4 w-4" /> Start Prep</Button>
              )}
              {order.status === 'Preparing' && (
                <Button onClick={() => updateStatus(order.id, 'Ready for Pickup')} className="w-full bg-blue-500 hover:bg-blue-600 rounded-xl font-black uppercase italic h-12 col-span-2">Mark Ready</Button>
              )}
              {(order.status === 'Placed' || order.status === 'Accepted') && (
                <Button variant="outline" className="w-full rounded-xl border-red-100 text-red-500 font-bold h-12">Reject</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
