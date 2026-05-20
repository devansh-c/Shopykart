
"use client"

import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, Clock, CheckCircle2, Circle, Loader2, XCircle, AlertTriangle } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const steps = [
  { id: 'Placed', label: 'Order Placed' },
  { id: 'Accepted', label: 'Accepted' },
  { id: 'Preparing', label: 'Preparing' },
  { id: 'Ready for Pickup', label: 'Ready for Pickup' },
  { id: 'Picked Up', label: 'Picked Up' },
  { id: 'Out for Delivery', label: 'Out for Delivery' },
  { id: 'Delivered', label: 'Delivered' },
];

export default function OrderDetailsClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isCancelling, setIsCancelling] = useState(false);

  const orderRef = useMemoFirebase(() => {
    if (!firestore || !orderId) return null;
    return doc(firestore, 'orders', orderId);
  }, [firestore, orderId]);

  const { data: order, loading } = useDoc<any>(orderRef);

  const handleCancelOrder = async () => {
    if (!firestore || !orderId || order?.status !== 'Placed') return;
    
    const confirmCancel = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmCancel) return;

    setIsCancelling(true);
    try {
      await updateDoc(doc(firestore, 'orders', orderId), {
        status: 'Cancelled',
        cancelledAt: new Date(),
        cancelledBy: 'customer'
      });
      toast({
        title: "Order Cancelled",
        description: "Your order has been successfully cancelled.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not cancel order. Please contact support.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <Clock className="h-12 w-12 text-primary mb-4 animate-pulse" />
        <h2 className="text-xl font-black italic uppercase">No Order ID</h2>
        <p className="text-muted-foreground text-xs mt-2">Please select an order from your history.</p>
        <button onClick={() => router.push('/orders')} className="mt-8 text-primary font-black uppercase text-[10px] tracking-widest">View Order History</button>
      </div>
    );
  }

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-black italic uppercase">Order Not Found</h2>
        <p className="text-muted-foreground text-xs mt-2">The order ID might be invalid or deleted.</p>
        <button onClick={() => router.push('/')} className="mt-8 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase italic text-xs">Back to Home</button>
      </div>
    );
  }

  const isCancelled = order.status === 'Cancelled';
  const currentStatusIdx = steps.findIndex(s => s.id === order.status);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/orders')} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold italic uppercase">Track Order</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className={cn(
          "rounded-xl p-4 flex items-center gap-3 border",
          isCancelled ? "bg-red-50 border-red-100 text-red-600" : "bg-[#FFF8E6] border-[#FFE8B3] text-[#B38B00]"
        )}>
          {isCancelled ? <XCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
          <div className="font-bold text-sm">
            Order #{order.orderDisplayId || orderId.slice(-5).toUpperCase()}
            {isCancelled && " - CANCELLED"}
          </div>
        </div>

        {isCancelled ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center space-y-4">
             <div className="bg-red-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto text-red-500">
                <AlertTriangle className="h-8 w-8" />
             </div>
             <h3 className="font-black text-xl italic uppercase text-gray-800">Order Terminated</h3>
             <p className="text-xs text-muted-foreground font-medium leading-relaxed px-4">
               This order was cancelled. If any amount was deducted, it will be refunded within 3-5 business days.
             </p>
             <Button 
              onClick={() => router.push('/menu')}
              className="w-full h-12 rounded-xl bg-black font-black uppercase italic text-xs tracking-widest"
             >
               REORDER SOMETHING ELSE
             </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-black text-sm uppercase mb-6 tracking-widest">Order Progress</h3>
            <div className="space-y-0 ml-1">
              {steps.map((step, idx) => {
                const isCompleted = idx <= currentStatusIdx;
                const isCurrent = idx === currentStatusIdx;
                return (
                  <div key={step.id} className="flex gap-4 relative">
                    {idx !== steps.length - 1 && (
                      <div className={cn("absolute left-[11px] top-6 w-[2px] h-full -z-0", isCompleted ? "bg-primary" : "bg-gray-100")} />
                    )}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center border-2",
                        isCompleted ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-white border-gray-200"
                      )}>
                        {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> : <Circle className="h-2 w-2 text-gray-300" />}
                      </div>
                    </div>
                    <div className={cn("pb-6 text-sm font-black uppercase italic tracking-tighter", isCompleted ? "text-black" : "text-gray-400")}>
                      {step.label}
                      {isCurrent && <span className="ml-2 inline-block h-1.5 w-1.5 bg-primary rounded-full animate-ping" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {order.status === 'Placed' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-red-50">
             <div className="flex flex-col items-center text-center gap-4">
                <div className="space-y-1">
                   <h4 className="font-black text-xs uppercase tracking-widest text-gray-400">Changed your mind?</h4>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase">You can cancel until the store accepts your order.</p>
                </div>
                <Button 
                  disabled={isCancelling}
                  onClick={handleCancelOrder}
                  variant="outline" 
                  className="w-full h-12 rounded-xl border-2 border-red-100 text-red-500 font-black uppercase italic text-[10px] tracking-[0.2em] hover:bg-red-50"
                >
                  {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : "CANCEL ORDER"}
                </Button>
             </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-black text-sm uppercase tracking-tight mb-4">Summary</h3>
          <div className="space-y-3">
            {order.items?.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="font-bold">{item.quantity}x {item.name}</span>
                <span className="font-black">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            <div className="pt-3 border-t border-dashed flex justify-between items-center">
              <span className="text-base font-black uppercase italic">Total Paid</span>
              <span className="text-xl font-black text-primary italic">₹{order.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
