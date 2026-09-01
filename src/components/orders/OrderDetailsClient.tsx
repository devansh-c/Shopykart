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
  X,
  Map as MapIcon,
  Maximize2,
  Minimize2,
  PhoneCall,
  Bike
} from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect, Suspense, useRef } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';

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
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState<string>('44 mins');
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isUpSwipe && isMapExpanded) {
      setIsMapExpanded(false);
    }
    if (isDownSwipe && !isMapExpanded) {
      setIsMapExpanded(true);
    }
  };

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
        const vendorIds = Array.from(new Set([
          foundOrder.vendorId, 
          ...(foundOrder.vendorIds || []),
          ...(foundOrder.items?.map((it: any) => it.vendorId) || [])
        ].filter(Boolean)));

        if (vendorIds.length > 0) {
          try {
            const vendorDocs = await Promise.all(vendorIds.map(async (vId: any) => {
              const vSnap = await getDoc(doc(firestore, 'vendors', vId));
              return vSnap.exists() ? { id: vSnap.id, ...vSnap.data() } : null;
            }));
            setVendors(vendorDocs.filter(Boolean));
          } catch (vErr) {}
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

  const handleCallPartner = () => {
    if (order?.deliveryPartnerPhone) {
      window.open(`tel:${order.deliveryPartnerPhone}`);
    }
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
    <div className="min-h-screen bg-white flex flex-col transform-gpu overflow-x-hidden no-scrollbar relative">
      
      <div 
        className={cn(
          "relative w-full shrink-0 transition-all duration-700 cubic-bezier(0.23,1,0.32,1) z-0",
          isMapExpanded ? "h-screen" : "h-[48vh]"
        )}
      >
        <header className="absolute top-0 left-0 right-0 z-[100] px-4 py-4 flex items-center justify-between pointer-events-none">
          <button onClick={() => router.push('/orders')} className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-900 shadow-lg border border-black/5 active:scale-90 transition-transform pointer-events-auto">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex flex-col items-center">
             <h4 className="text-[11px] font-black uppercase italic tracking-tighter text-gray-900 leading-none drop-shadow-md">{order.restaurantName}</h4>
             <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">
               {format(new Date(order.createdAt?.seconds * 1000 || Date.now()), 'hh:mm a')} • {order.items?.length || 1} items
             </p>
          </div>
          <button className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-900 shadow-lg border border-black/5 active:scale-90 transition-transform pointer-events-auto">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </header>

        <div className={cn(
          "absolute inset-0 z-0 overflow-hidden transition-all duration-700",
          isMapExpanded ? "rounded-none" : "rounded-b-[4rem]"
        )}>
          <LiveTrackingMap 
            customerLat={parseFloat(String(order.customerLat || 0))} 
            customerLng={parseFloat(String(order.customerLng || 0))} 
            vendors={vendors}
            customerName={order.customerName}
            onEtaUpdate={(val) => setEta(val)}
          />
        </div>

        {isMapExpanded && (
          <div className="absolute bottom-10 left-0 right-0 flex justify-center z-[200] animate-in slide-in-from-bottom-4">
             <button 
              onClick={() => setIsMapExpanded(false)}
              className="bg-[#0B0B0B] text-white px-8 py-4 rounded-full font-black uppercase italic text-xs shadow-2xl flex items-center gap-3 active:scale-95 transition-all"
             >
                <Minimize2 className="h-4 w-4 text-primary" /> SHOW DETAILS
             </button>
          </div>
        )}
      </div>

      <div 
        className={cn(
          "relative z-[110] px-4 transition-all duration-700 cubic-bezier(0.23,1,0.32,1)",
          isMapExpanded ? "translate-y-[80vh] opacity-0 pointer-events-none" : "-mt-20 opacity-100"
        )}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
         <div className="bg-white rounded-[2.5rem] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.15)] overflow-hidden border border-black/[0.03]">
            <div className="w-full h-8 flex items-center justify-center cursor-ns-resize">
               <div className="w-12 h-1.5 bg-gray-100 rounded-full" />
            </div>

            <div className="p-7 pt-0">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
                      {getHeadline()}
                    </h2>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-2">Arriving Soon</p>
                 </div>
                 <div className="bg-[#16a34a] text-white w-16 h-16 rounded-[1.5rem] flex flex-col items-center justify-center shadow-lg shadow-green-100/50">
                    <span className="text-2xl font-black italic tracking-tighter leading-none">{eta.split(' ')[0]}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest leading-none mt-1">mins</span>
                 </div>
              </div>

              {/* PARTNER CARD FOR CUSTOMER */}
              {order.deliveryPartnerId && (
                <div className="bg-primary/5 rounded-[2rem] p-5 mb-6 border border-primary/10 flex items-center justify-between animate-in zoom-in duration-500">
                   <div className="flex items-center gap-4">
                      <div className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20">
                         <Bike className="h-6 w-6" />
                      </div>
                      <div>
                         <span className="text-[9px] font-black text-primary uppercase tracking-widest block mb-0.5">Your Delivery Hero</span>
                         <h4 className="text-lg font-black italic uppercase tracking-tight text-gray-900 leading-none">{order.deliveryPartnerName}</h4>
                      </div>
                   </div>
                   <button 
                    onClick={handleCallPartner}
                    className="h-14 w-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all border-b-4 border-green-800"
                   >
                      <PhoneCall className="h-7 w-7" />
                   </button>
                </div>
              )}

              <div className="space-y-6 relative mb-4">
                 <div className="absolute left-[7px] top-[10px] bottom-[10px] w-[2px] border-l-2 border-dotted border-gray-200" />
                 
                 <div className="flex items-center gap-4 relative">
                    <div className="h-3.5 w-3.5 rounded-full bg-gray-200 border-2 border-white shadow-sm shrink-0" />
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Pickup Network</span>
                       <div className="flex flex-wrap gap-2 mt-1">
                          {vendors.map((v, i) => (
                            <span key={i} className="text-[11px] font-black uppercase italic text-gray-800 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{v.storeName}</span>
                          ))}
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex items-start gap-4 relative">
                    <div className="h-4 w-4 bg-green-500 rounded-sm border-2 border-white shadow-sm shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                       <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Delivering to</span>
                       <p className="text-sm font-black text-gray-800 uppercase leading-none truncate mt-0.5">To {order.customerName}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase mt-1.5 leading-relaxed line-clamp-1 italic tracking-tight">
                         {order.address}
                       </p>
                    </div>
                 </div>
              </div>
            </div>
         </div>
      </div>

      <div className={cn(
        "px-4 py-8 transition-all duration-500",
        isMapExpanded ? "opacity-0" : "opacity-100"
      )}>
         <div className="flex items-center justify-between py-6 px-4 bg-gray-50/50 rounded-[2rem] border border-gray-100 group cursor-pointer active:bg-gray-100 transition-all">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-100">
                  <CreditCard className="h-6 w-6 text-white" />
               </div>
               <div className="flex flex-col">
                  <p className="text-[11px] font-black uppercase tracking-tight text-gray-900 leading-tight max-w-[200px]">Pay ₹{order.total?.toFixed(0)} online for No-Contact Delivery.</p>
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-widest mt-1 italic">Secure Digital Payment</p>
               </div>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
         </div>
      </div>

      <div className="mt-auto pb-10 text-center opacity-20">
         <p className="text-[8px] font-black uppercase tracking-[0.5em]">ShopyKart Secure Logistics</p>
      </div>

    </div>
  );
}

export default function OrderDetailsClient({ forcedId }: { forcedId?: string }) {
  return (
    <Suspense fallback={
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-primary h-10 w-10" />
        <p className="text-[10px] font-black uppercase tracking-widest">Locating GPS...</p>
      </div>
    }>
      <OrderDetailsInner forcedId={forcedId} />
    </Suspense>
  );
}
