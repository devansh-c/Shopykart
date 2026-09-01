"use client"

import { ShoppingBag, ChevronRight, Clock, MapPin, Package, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { format } from 'date-fns';
import { useMemo, useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * @fileOverview My Orders Page with High-Fidelity Shimmer Effect.
 * Fixed: Robust loading states to prevent premature "No Orders" display.
 * Implementation: Skeleton cards exactly match the structure of real order cards.
 */
export default function OrdersPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Stable query memoization with User ID guard
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(
      collection(firestore, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50) 
    );
  }, [firestore, user?.uid]);

  // Providing a unique cacheKey ensures orders are loaded instantly from localStorage on return
  const { data: orders, loading: ordersLoading } = useCollection<any>(
    ordersQuery, 
    user?.uid ? `user_orders_${user.uid}` : undefined
  );

  const handleCancelOrder = async (orderId: string) => {
    if (!firestore || cancellingId) return;
    if (!confirm("Are you sure you want to cancel this order?")) return;

    setCancellingId(orderId);
    try {
      await updateDoc(doc(firestore, 'orders', orderId), {
        status: 'Cancelled',
        updatedAt: serverTimestamp()
      });
      toast({ title: "Order Cancelled" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not cancel order." });
    } finally {
      setCancellingId(null);
    }
  };

  // Logic: Show skeletons while authenticating OR while data is being fetched and cache is empty
  const showSkeletons = userLoading || (user && ordersLoading && (!orders || orders.length === 0));

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="px-6 pt-12 pb-6 flex items-center justify-between">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-gray-900">My Orders</h1>
      </div>

      <div className="px-4 space-y-5">
        {showSkeletons ? (
          /* HIGH-FIDELITY PREMIUM SHIMMER EFFECT */
          <div className="space-y-6 animate-in fade-in duration-500">
             {[1, 2, 3].map((i) => (
               <div key={i} className="bg-white rounded-[2.5rem] p-7 border border-border/60 shadow-sm space-y-6 transform-gpu">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <Skeleton className="h-16 w-16 rounded-2xl bg-gray-100" />
                       <div className="space-y-2">
                          <Skeleton className="h-5 w-28 rounded-full bg-gray-100" />
                          <Skeleton className="h-3 w-20 rounded-full bg-gray-50 opacity-60" />
                       </div>
                    </div>
                    <Skeleton className="h-8 w-24 rounded-full bg-gray-100" />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <Skeleton className="h-4 w-4 rounded-full bg-gray-100" />
                       <Skeleton className="h-3 w-full max-w-[200px] rounded-full bg-gray-50" />
                    </div>
                    <div className="bg-muted/30 rounded-[1.5rem] p-5 space-y-3 border border-border/30">
                       <div className="flex justify-between">
                          <Skeleton className="h-3 w-32 rounded-full bg-gray-100" />
                          <Skeleton className="h-3 w-12 rounded-full bg-gray-100" />
                       </div>
                       <div className="flex justify-between">
                          <Skeleton className="h-3 w-24 rounded-full bg-gray-100 opacity-60" />
                          <Skeleton className="h-3 w-10 rounded-full bg-gray-100 opacity-60" />
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-dashed border-border">
                     <div className="space-y-1.5">
                        <Skeleton className="h-2 w-12 rounded-full bg-gray-50 opacity-40" />
                        <Skeleton className="h-7 w-24 rounded-full bg-gray-100" />
                     </div>
                     <div className="flex gap-2">
                        <Skeleton className="h-12 w-28 rounded-2xl bg-gray-100" />
                     </div>
                  </div>
               </div>
             ))}
          </div>
        ) : orders && orders.length > 0 ? (
          /* ACTUAL ORDERS DATA */
          orders.map((order) => (
            <div 
              key={order.id} 
              onClick={() => router.push(`/order/track/#${order.customerOrderNumber}`)}
              className="bg-white rounded-[2.5rem] p-7 border border-border/60 shadow-sm active:scale-[0.98] transition-all group cursor-pointer transform-gpu"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "h-16 w-16 rounded-[1.25rem] flex items-center justify-center border transition-colors",
                    order.status === 'Delivered' ? "bg-muted border-border text-muted-foreground" : "bg-primary/5 border-primary/10 text-primary shadow-lg shadow-primary/5"
                  )}>
                    <Package className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="font-black text-xl italic uppercase tracking-tighter text-gray-900 leading-none mb-1.5">Order #{order.customerOrderNumber || '...'}</h3>
                    <div className="flex items-center text-[10px] text-muted-foreground font-black uppercase tracking-widest italic">
                      <Clock className="h-3 w-3 mr-1 text-primary" />
                      {isMounted && order.createdAt ? (
                        typeof order.createdAt === 'string' 
                          ? format(new Date(order.createdAt), 'MMM d, h:mm a')
                          : format(new Date(order.createdAt.seconds * 1000), 'MMM d, h:mm a')
                      ) : 'Recently'}
                    </div>
                  </div>
                </div>
                <Badge className={cn(
                  "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border-none",
                  ['Delivered', 'Cancelled'].includes(order.status) 
                    ? "bg-gray-100 text-gray-500"
                    : "bg-green-100 text-green-700 animate-pulse" 
                )}>
                  {order.status}
                </Badge>
              </div>
              
              <div className="space-y-5 mb-6">
                <div className="flex items-start space-x-3 text-[11px] font-bold text-gray-500 uppercase italic leading-tight">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="line-clamp-1">{order.address}</span>
                </div>
                <div className="bg-muted/30 rounded-[1.5rem] p-5 space-y-2.5 border border-border/40 shadow-inner">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-xs">
                      <span className="font-black text-gray-800 uppercase italic"><span className="text-primary">{item.quantity}x</span> {item.name}</span>
                      <span className="text-gray-400 font-bold">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-dashed border-border pt-6 flex items-center justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Grand Total</span>
                  <span className="text-2xl font-black text-gray-900 italic tracking-tighter">₹{order.total?.toFixed(0)}</span>
                </div>
                
                <div className="flex gap-2">
                  {order.status === 'Placed' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCancelOrder(order.id); }}
                      disabled={cancellingId === order.id}
                      className="bg-red-50 text-red-500 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center border border-red-100 hover:bg-red-100 transition-colors"
                    >
                      {cancellingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                      Cancel
                    </button>
                  )}

                  <div className="bg-[#0B0B0B] text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center group-hover:bg-primary transition-all shadow-xl active:scale-95">
                    Track
                    <ChevronRight className="h-4 w-4 ml-2 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          /* TRUE EMPTY STATE */
          <div className="text-center py-24 animate-in fade-in zoom-in duration-700">
            <div className="relative mb-8 flex justify-center">
               <div className="absolute inset-0 bg-primary/5 rounded-full animate-ping opacity-20 scale-150" />
               <div className="relative bg-white h-32 w-32 rounded-[3rem] flex items-center justify-center border-4 border-white shadow-2xl">
                  <ShoppingBag className="h-14 w-14 text-gray-200" />
               </div>
            </div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Your history is<br /><span className="text-primary">blank!</span></h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-4 mb-10 max-w-[240px] mx-auto leading-relaxed">
              {!user ? "PLEASE LOGIN TO VIEW YOUR GOURMET JOURNEY." : "START ORDERING THE BEST FLAVORS IN TOWN."}
            </p>
            {user && (
              <button 
                onClick={() => router.push('/')}
                className="h-16 px-10 bg-[#0B0B0B] text-white rounded-[2rem] font-black uppercase italic text-sm shadow-xl active:scale-95 transition-all"
              >
                EXPLORE MENU
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
