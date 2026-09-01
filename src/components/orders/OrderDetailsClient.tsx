"use client"

import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  MoreHorizontal, 
  ChevronRight, 
  Loader2,
  Navigation,
  CheckCircle2,
  CreditCard,
  X
} from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';

const LiveTrackingMap = dynamic(() => import('./LiveTrackingMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse" />
});

function OrderDetailsInner({ forcedId }: { forcedId?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const [order, setOrder] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState<string>('44 mins');

  useEffect(() => {
    const resolveOrder = async () => {
      if (!firestore) return;

      const queryId = forcedId || searchParams.get('id');
      let foundOrder = null;

      if (queryId && queryId.length > 10) {
         try {
           const snap = await getDocs(query(collection(firestore, 'orders'), where('__name__', '==', queryId), limit(1)));
           if (!snap.empty) foundOrder = { id: snap.docs[0].id, ...snap.docs[0].data() };
         } catch (e) {}
      }

      if (!foundOrder) {
        const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
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
             if (!snap.empty) foundOrder = { id: snap.docs[0].id, ...snap.docs[0].data() };
           } catch (e) {}
        }
      }

      if (foundOrder) {
        setOrder(foundOrder);
        if (foundOrder.vendorId || foundOrder.items?.[0]?.vendorId) {
          const vId = foundOrder.vendorId || foundOrder.items[0].vendorId;
          const vSnap = await getDoc(doc(firestore, 'vendors', vId));
          if (vSnap.exists()) setVendor(vSnap.data());
        }
      }
      setLoading(false);
    };

    resolveOrder();
  }, [firestore, user, forcedId, searchParams]);

  const getHeadline = () => {
    if (!order) return "Locating Order...";
    if (order.status === 'Placed') return "Order Placed";
    if (order.status === 'Accepted' || order.status === 'Preparing') return "Order Received!";
    if (order.status === 'Ready for Pickup') return "Order Ready!";
    if (order.status === 'Picked Up' || order.status === 'Out for Delivery') return "On the Way!";
    if (order.status === 'Delivered') return "Delivered!";
    if (order.status === 'Cancelled') return "Cancelled";
    return order.status;
  };

  if (loading) return (
    <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">Connecting...</p>
    </div>
  );
  
  if (!order) return (
    <div className="h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-2xl font-black italic uppercase text-gray-900 tracking-tighter">Order not found</h2>
      <Button onClick={() => router.push('/')} className="mt-8 bg-black rounded-2xl h-14 px-8 font-black uppercase italic shadow-xl">Back to Explore</Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col transform-gpu overflow-x-hidden no-scrollbar">
      
      {/* 1. TOP HALF: MAP SECTION */}
      <div className="relative h-[48vh] w-full shrink-0">
        <header className="absolute top-0 left-0 right-0 z-[100] px-4 py-4 flex items-center justify-between pointer-events-none">
          <button onClick={() => router.push('/orders')} className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-900 shadow-lg border border-black/5 active:scale-90 transition-transform pointer-events-auto">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex flex-col items-center">
             <h4 className="text-[12px] font-black uppercase italic tracking-tighter text-gray-900 leading-none">{order.restaurantName}</h4>
             <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Order Tracking Live</p>
          </div>
          <button className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-900 shadow-lg border border-black/5 active:scale-90 transition-transform pointer-events-auto">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </header>

        {/* MAP CONTAINER WITH CURVE */}
        <div className="absolute inset-0 z-0 overflow-hidden rounded-b-[2.5rem]">
          <LiveTrackingMap 
            customerLat={parseFloat(String(order.customerLat || 0))} 
            customerLng={parseFloat(String(order.customerLng || 0))} 
            vendorLat={vendor?.lat ? parseFloat(String(vendor.lat)) : undefined}
            vendorLng={vendor?.lng ? parseFloat(String(vendor.lng)) : undefined}
            customerName={order.customerName}
            storeName={order.restaurantName}
            onEtaUpdate={(val) => setEta(val)}
          />
        </div>
      </div>

      {/* 2. FLOATING TRACKING CARD - OVERLAPPING MAP */}
      <div className="relative z-[110] px-4 -mt-12">
         <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden border border-black/[0.03]">
            <div className="p-7">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
                      {getHeadline()}
                    </h2>
                 </div>
                 <div className="bg-[#16a34a] text-white w-16 h-16 rounded-[1.25rem] flex flex-col items-center justify-center shadow-lg shadow-green-100/50">
                    <span className="text-2xl font-black italic tracking-tighter leading-none">{eta.split(' ')[0]}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest leading-none mt-1">mins</span>
                 </div>
              </div>

              <div className="space-y-5 relative">
                 <div className="absolute left-[7px] top-[10px] bottom-[10px] w-[2px] border-l-2 border-dotted border-gray-200" />
                 
                 <div className="flex items-center gap-4 relative">
                    <div className="h-3 w-3 rounded-full bg-gray-200 border-2 border-white shadow-sm shrink-0" />
                    <span className="text-xs font-black uppercase italic text-gray-500 truncate">{order.restaurantName}</span>
                 </div>
                 
                 <div className="flex items-start gap-4 relative">
                    <div className="h-3.5 w-3.5 bg-green-500 rounded-sm border-2 border-white shadow-sm shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                       <p className="text-sm font-black text-gray-800 uppercase leading-none truncate">To {order.customerName}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase mt-1.5 leading-relaxed line-clamp-1 italic tracking-tight">
                         {order.address}
                       </p>
                    </div>
                 </div>
              </div>

              <div className="mt-8 pt-5 border-t border-gray-50 flex items-center justify-between">
                 <span className="text-[11px] font-black uppercase tracking-tight text-gray-800 flex items-center gap-2">
                    Add Delivery Instructions <ChevronRight className="h-3.5 w-3.5" />
                 </span>
              </div>
            </div>
         </div>
      </div>

      {/* 3. UPI PAYMENT STRIP */}
      <div className="px-4 py-8">
         <div className="flex items-center justify-between py-4 border-b border-t border-gray-50 group cursor-pointer active:bg-gray-50 transition-all">
            <div className="flex items-center gap-4">
               <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-100">
                  <CreditCard className="h-5 w-5 text-white" />
               </div>
               <div className="flex flex-col">
                  <p className="text-[11px] font-black uppercase tracking-tight text-gray-900 leading-tight">Pay ₹{order.total?.toFixed(0)} online to avoid cash handling.</p>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Secure Digital Payment</p>
               </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
         </div>
      </div>

      {/* CLEAN FOOTER */}
      <div className="mt-auto pb-10 text-center opacity-20">
         <p className="text-[8px] font-black uppercase tracking-[0.5em]">ShopyKart Secure Network</p>
      </div>

    </div>
  );
}

export default function OrderDetailsClient({ forcedId }: { forcedId?: string }) {
  return (
    <Suspense fallback={<div className="h-screen bg-white flex flex-col items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <OrderDetailsInner forcedId={forcedId} />
    </Suspense>
  );
}
