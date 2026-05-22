
"use client"

import { BottomNav } from '@/components/shared/BottomNav';
import { ShoppingBag, ChevronRight, Clock, MapPin, Package, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { format } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';

export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'orders'),
      where('userId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: orders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  const sortedOrders = useMemo(() => {
    if (!orders) return [];
    return [...orders].sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
  }, [orders]);

  const isLoading = userLoading || (ordersLoading && !orders);

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-32">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">My Orders</h1>
      </div>

      <div className="px-4 space-y-5">
        {isLoading ? (
          <div className="flex justify-center py-20">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : sortedOrders.length > 0 ? (
          sortedOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-[2rem] p-6 border border-border/40 shadow-sm active:scale-[0.98] transition-all group">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center",
                    order.status === 'Delivered' ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary shadow-lg shadow-primary/5"
                  )}>
                    <Package className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg italic tracking-tight">#{order.orderDisplayId || order.id.slice(-5).toUpperCase()}</h3>
                    <div className="flex items-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                      <Clock className="h-3 w-3 mr-1" />
                      {isMounted && order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Just now'}
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                  ['Delivered', 'Cancelled'].includes(order.status) 
                    ? "bg-gray-100 text-gray-500 border border-gray-200"
                    : "bg-green-100 text-green-700 animate-pulse border border-green-200" 
                )}>
                  {order.status}
                </div>
              </div>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3 text-xs">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground font-medium line-clamp-1">{order.address}</span>
                </div>
                <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-foreground">{item.quantity}x {item.name}</span>
                      <span className="text-muted-foreground">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-dashed border-border pt-5 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total Paid</span>
                  <span className="text-xl font-black text-foreground italic tracking-tight">₹{order.total?.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => router.push(`/orders/track?id=${order.id}`)}
                  className="bg-[#0B0B0B] text-white px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center hover:bg-primary transition-colors"
                >
                  Track Order
                  <ChevronRight className="h-4 w-4 ml-2" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 opacity-30 flex flex-col items-center">
            <ShoppingBag className="h-16 w-16 mb-4" />
            <p className="font-black italic uppercase tracking-widest text-sm">No orders yet</p>
            <button 
              onClick={() => router.push('/menu')}
              className="mt-6 text-primary font-black uppercase text-[10px] tracking-widest underline underline-offset-4"
            >
              Order something delicious now
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
