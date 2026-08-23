
"use client"

import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  Circle, 
  Loader2, 
  XCircle, 
  AlertTriangle, 
  ReceiptText, 
  Printer, 
  Download, 
  Eye, 
  MapPin, 
  CreditCard, 
  Banknote, 
  Sparkles, 
  Trash2, 
  Crown, 
  MessageSquareQuote,
  KeyRound,
  Package,
  User,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState, useEffect, Suspense } from 'react';
import { format } from 'date-fns';

const steps = [
  { id: 'Placed', label: 'Order Placed' },
  { id: 'Accepted', label: 'Accepted' },
  { id: 'Preparing', label: 'Preparing' },
  { id: 'Ready for Pickup', label: 'Ready for Pickup' },
  { id: 'Picked Up', label: 'Picked Up' },
  { id: 'Out for Delivery', label: 'Out for Delivery' },
  { id: 'Delivered', label: 'Delivered' },
];

function OrderDetailsInner({ forcedId }: { forcedId?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const resolveOrder = async () => {
      if (!firestore) return;

      const queryId = forcedId || searchParams.get('id');
      if (queryId && queryId.length > 10) {
         try {
           const snap = await getDocs(query(collection(firestore, 'orders'), where('__name__', '==', queryId), limit(1)));
           if (!snap.empty) {
             setOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
             setLoading(false);
             return;
           }
         } catch (e) {}
      }

      const hash = window.location.hash.replace('#', '');
      const orderNum = parseInt(hash);

      if (!isNaN(orderNum) && user) {
         try {
           const q = query(
             collection(firestore, 'orders'), 
             where('userId', '==', user.uid), 
             where('customerOrderNumber', '==', orderNum),
             limit(1)
           );
           const snap = await getDocs(q);
           if (!snap.empty) {
             setOrder({ id: snap.docs[0].id, ...snap.docs[0].data() });
             setLoading(false);
             return;
           }
         } catch (e) {}
      }
      
      setLoading(false);
    };

    resolveOrder();

    const handleHashChange = () => resolveOrder();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [firestore, user, forcedId, searchParams]);

  const handleCancelOrder = async () => {
    if (!firestore || !order || isCancelling) return;
    if (!confirm("Are you sure?")) return;

    setIsCancelling(true);
    try {
      await updateDoc(doc(firestore, 'orders', order.id), {
        status: 'Cancelled',
        updatedAt: serverTimestamp()
      });
      toast({ title: "Order Cancelled" });
      setOrder({...order, status: 'Cancelled'});
    } catch (err) {
      toast({ variant: "destructive", title: "Failed" });
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  
  if (!order) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-50 h-20 w-20 rounded-full flex items-center justify-center text-red-500 mb-6"><Package className="h-10 w-10" /></div>
        <h2 className="text-xl font-black italic uppercase text-gray-800">Order not found</h2>
        <Button onClick={() => router.push('/')} className="mt-8 bg-black rounded-xl">Back to Home</Button>
      </div>
    );
  }

  const isCancelled = order.status === 'Cancelled';
  const currentStatusIdx = steps.findIndex(s => s.id === order.status);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-40">
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/orders')} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-50"><ChevronLeft className="h-6 w-6 text-gray-700" /></button>
          <h1 className="text-lg font-bold italic uppercase tracking-tighter">My Order Journey</h1>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        <div className={cn("rounded-[2.5rem] p-6 flex items-center justify-between border shadow-sm", isCancelled ? "bg-red-50 border-red-100 text-red-600" : "bg-white border-gray-100")}>
          <div className="flex items-center gap-4">
            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg", isCancelled ? "bg-red-600 text-white" : "bg-primary text-white")}>
              {isCancelled ? <XCircle className="h-6 w-6" /> : <Zap className="h-6 w-6 animate-pulse" />}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase opacity-40">Order #{order.customerOrderNumber}</span>
              <div className="font-black text-xl italic uppercase tracking-tighter leading-none">{isCancelled ? "Cancelled" : order.status}</div>
            </div>
          </div>
          {order.status === 'Placed' && <button onClick={handleCancelOrder} className="bg-red-50 text-red-600 px-4 h-10 rounded-xl font-black text-[10px] uppercase">Cancel</button>}
        </div>

        {/* DELIVERY OTP - ONLY IF NOT CANCELLED/DELIVERED */}
        {!isCancelled && order.status !== 'Delivered' && (
          <div className="bg-[#0B0B0B] rounded-[3rem] p-8 shadow-2xl relative overflow-hidden border border-white/5 text-white">
             <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="bg-primary/20 p-3 rounded-2xl border border-primary/20">
                         <KeyRound className="h-7 w-7 text-primary animate-pulse" />
                      </div>
                      <div>
                         <h3 className="text-sm font-black uppercase tracking-widest leading-none">Identity Pin</h3>
                         <p className="text-[9px] font-bold text-gray-500 uppercase mt-1">Share this with rider only</p>
                      </div>
                   </div>
                   <div className="bg-white/5 px-6 py-2 rounded-2xl border border-white/10">
                      <span className="text-3xl font-black italic tracking-[0.2em] text-primary">{order.deliveryOTP}</span>
                   </div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl flex gap-4 border border-white/10">
                   <ShieldCheck className="h-5 w-5 text-green-500 shrink-0" />
                   <p className="text-[9px] font-bold text-gray-400 uppercase leading-relaxed">Verification ensures your order is delivered only to you. Stay safe!</p>
                </div>
             </div>
             <div className="absolute top-0 right-0 h-full w-44 bg-primary/5 -skew-x-12 translate-x-12" />
          </div>
        )}

        {/* TRACKING STEPS */}
        {!isCancelled && (
          <div className="bg-white rounded-[3rem] p-10 shadow-sm border border-gray-100">
            <h3 className="font-black text-[10px] uppercase mb-10 tracking-[0.3em] text-gray-300 text-center">Tracking History</h3>
            <div className="space-y-0 relative">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex gap-6 relative">
                  {idx !== steps.length - 1 && (
                    <div className={cn("absolute left-[13px] top-6 w-[2px] h-[calc(100%-12px)]", idx < currentStatusIdx ? "bg-primary" : "bg-gray-100")} />
                  )}
                  <div className={cn("h-7 w-7 rounded-full flex items-center justify-center border-2 z-10 transition-all duration-500", idx <= currentStatusIdx ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-white border-gray-100")}>
                    {idx <= currentStatusIdx ? <CheckCircle2 className="h-4 w-4 text-white" /> : <div className="h-1.5 w-1.5 rounded-full bg-gray-100" />}
                  </div>
                  <div className={cn("pb-10 text-[11px] font-black uppercase italic tracking-widest", idx <= currentStatusIdx ? "text-gray-900" : "text-gray-300")}>
                    {step.label}
                    {idx === currentStatusIdx && (
                      <span className="ml-3 inline-block h-1.5 w-1.5 bg-primary rounded-full animate-ping" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ORDER SUMMARY */}
        <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100">
           <h3 className="font-black text-[10px] uppercase mb-6 tracking-[0.3em] text-gray-300">Bill Summary</h3>
           <div className="space-y-4">
              {order.items?.map((item:any, i:number) => (
                <div key={i} className="flex justify-between items-center font-bold text-xs">
                   <span className="text-gray-600">{item.quantity}x {item.name}</span>
                   <span className="text-gray-900">₹{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
              <div className="pt-4 border-t border-dashed border-gray-100 flex justify-between items-center">
                 <span className="font-black italic uppercase tracking-tighter text-lg">Amount Paid</span>
                 <span className="text-2xl font-black italic tracking-tighter text-primary">₹{order.total?.toFixed(0)}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderDetailsClient({ forcedId }: { forcedId?: string }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <OrderDetailsInner forcedId={forcedId} />
    </Suspense>
  );
}
