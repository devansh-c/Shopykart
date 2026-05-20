"use client"

import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, Clock, CheckCircle2, Circle } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

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
  const { orderId } = useParams();
  const router = useRouter();
  const firestore = useFirestore();

  const orderRef = useMemoFirebase(() => {
    if (!firestore || !orderId) return null;
    return doc(firestore, 'orders', orderId as string);
  }, [firestore, orderId]);

  const { data: order, loading } = useDoc<any>(orderRef);

  if (loading && !order) return <div className="min-h-screen bg-white" />;
  if (!order) return <div className="min-h-screen flex items-center justify-center font-black">ORDER NOT FOUND</div>;

  const currentStatusIdx = steps.findIndex(s => s.id === order.status);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-10">
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/orders')} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-50"><ChevronLeft className="h-6 w-6" /></button>
          <h1 className="text-lg font-bold italic uppercase">Track Order</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className="bg-[#FFF8E6] border-[#FFE8B3] rounded-xl p-4 flex items-center gap-3 border text-[#B38B00]">
          <Clock className="h-5 w-5" />
          <div className="font-bold text-sm">Order #{order.orderDisplayId || (typeof order.id === 'string' ? order.id.slice(-5).toUpperCase() : '...') }</div>
        </div>

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
                    <div className={cn("h-6 w-6 rounded-full flex items-center justify-center border-2", isCompleted ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-white border-gray-200")}>
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

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-black text-sm uppercase tracking-tight mb-4">Summary</h3>
          <div className="space-y-3">
            {order.items?.map((item: any, i: number) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="font-bold">{item.quantity}x {item.name}</span>
                <span className="font-black">₹{item.price * item.quantity}</span>
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
