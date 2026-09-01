
"use client"

import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  MoreHorizontal, 
  MapPin, 
  KeyRound, 
  ShieldCheck, 
  Zap, 
  Loader2,
  ChevronRight,
  Info,
  Clock,
  Navigation
} from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, limit, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo, Suspense } from 'react';
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
  const { toast } = useToast();
  
  const [order, setOrder] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState<string>('--');
  const [isCancelling, setIsCancelling] = useState(false);

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
             if (!snap.empty) foundOrder = { id: snap.docs[0].id, ...snap.docs[0].data() };
           } catch (e) {}
        }
      }

      if (foundOrder) {
        setOrder(foundOrder);
        // Fetch Vendor for Map
        if (foundOrder.vendorId) {
          const vSnap = await getDoc(doc(firestore, 'vendors', foundOrder.vendorId));
          if (vSnap.exists()) setVendor(vSnap.data());
        }
      }
      setLoading(false);
    };

    resolveOrder();
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

  const getHeadline = () => {
    if (!order) return "Locating Order...";
    if (order.status === 'Placed') return "Order Placed";
    if (order.status === 'Accepted') return "Order Received!";
    if (order.status === 'Preparing') return "Chef is Cooking!";
    if (order.status === 'Ready for Pickup') return "Almost Ready!";
    if (order.status === 'Picked Up') return "Picked Up!";
    if (order.status === 'Out for Delivery') return "On the Way!";
    if (order.status === 'Delivered') return "Delivered!";
    if (order.status === 'Cancelled') return "Cancelled";
    return order.status;
  };

  if (loading) return (
    <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground italic">Syncing with Fleet...</p>
    </div>
  );
  
  if (!order) return (
    <div className="h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
      <div className="bg-red-50 h-20 w-20 rounded-[2rem] flex items-center justify-center text-red-500 mb-6 shadow-xl shadow-red-100"><Zap className="h-10 w-10" /></div>
      <h2 className="text-2xl font-black italic uppercase text-gray-900 tracking-tighter">Order not found</h2>
      <p className="text-xs font-bold text-muted-foreground uppercase mt-2">The tracking link has expired or is invalid.</p>
      <Button onClick={() => router.push('/')} className="mt-8 bg-black rounded-2xl h-14 px-8 font-black uppercase italic shadow-xl">Back to Explore</Button>
    </div>
  );

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden transform-gpu">
      
      {/* HEADER OVERLAY */}
      <header className="absolute top-0 left-0 right-0 z-[100] px-4 py-4 flex items-center justify-between">
        <button onClick={() => router.push('/orders')} className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-900 shadow-xl border border-black/5 active:scale-90 transition-transform">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex flex-col items-center">
           <h4 className="text-[11px] font-black uppercase italic tracking-tighter text-gray-900 leading-none">{order.restaurantName}</h4>
           <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">
             {format(new Date(order.createdAt?.seconds * 1000 || Date.now()), 'hh:mm a')} • {order.items?.length || 1} items
           </p>
        </div>
        <button className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-900 shadow-xl border border-black/5 active:scale-90 transition-transform">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </header>

      {/* FULL SCREEN MAP AREA */}
      <div className="flex-1 relative">
        <LiveTrackingMap 
          customerLat={order.customerLat} 
          customerLng={order.customerLng} 
          vendorLat={vendor?.lat}
          vendorLng={vendor?.lng}
          customerName={order.customerName}
          storeName={order.restaurantName}
          onEtaUpdate={(val) => setEta(val)}
        />
      </div>

      {/* DETAIL CARD OVERLAY - CLONING THE SCREENSHOT DESIGN */}
      <div className="absolute bottom-0 left-0 right-0 z-[100] p-4 pb-12 space-y-4">
        
        {/* MAIN TRACKING CARD */}
        <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden border border-black/5">
           <div className="p-7">
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
                      {getHeadline()}
                    </h2>
                 </div>
                 <div className="bg-[#16a34a] text-white h-16 w-16 rounded-2xl flex flex-col items-center justify-center shadow-xl shadow-green-100 group">
                    <span className="text-2xl font-black italic tracking-tighter leading-none">{eta.split(' ')[0]}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest leading-none mt-1 opacity-80">mins</span>
                 </div>
              </div>

              <div className="space-y-5 relative">
                 {/* Visual dashed line connector */}
                 <div className="absolute left-[5px] top-[14px] bottom-[14px] w-[2px] border-l-2 border-dashed border-gray-200" />
                 
                 <div className="flex items-center gap-4 relative">
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-300 border-2 border-white shadow-sm shrink-0" />
                    <span className="text-xs font-black uppercase italic text-gray-700 truncate">{order.restaurantName}</span>
                 </div>
                 
                 <div className="flex items-start gap-4 relative">
                    <div className="h-3 w-3 bg-green-500 rounded-sm border-2 border-white shadow-sm shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                       <p className="text-[11px] font-black text-gray-900 uppercase leading-none">To {order.customerName}</p>
                       <p className="text-[10px] font-bold text-gray-500 uppercase mt-1 leading-relaxed line-clamp-2">
                         {order.address}
                       </p>
                    </div>
                 </div>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-50 flex items-center justify-between group cursor-pointer active:scale-95 transition-all">
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                    Add Delivery Instructions
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                 </span>
              </div>
           </div>
        </div>

        {/* PROMO / PAYMENT BANNER BELOW CARD */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between border border-black/5 shadow-lg animate-in slide-in-from-bottom-2 duration-500 delay-300">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                 <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                 <p className="text-[10px] font-black uppercase tracking-tight text-gray-900">Paid ₹{order.total?.toFixed(0)} Online</p>
                 <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Enjoy your gourmet meal!</p>
              </div>
           </div>
           <ChevronRight className="h-4 w-4 text-gray-300" />
        </div>

        {/* SECRET ADMIN SHORTCUT FOR USER */}
        {order.status === 'Placed' && (
          <button 
            onClick={handleCancelOrder}
            className="w-full text-center text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
          >
            Cancel Order
          </button>
        )}
      </div>

      {/* OTP PROTECTION BOX FOR SECURITY */}
      {!['Delivered', 'Cancelled'].includes(order.status) && (
        <div className="fixed top-24 left-4 z-[100] animate-in slide-in-from-left-4 duration-500">
           <div className="bg-black text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 border border-white/10">
              <div className="flex flex-col">
                <span className="text-[6px] font-black text-gray-500 uppercase tracking-widest">GIVE TO RIDER</span>
                <span className="text-sm font-black italic tracking-[0.2em] text-primary">{order.deliveryOTP}</span>
              </div>
              <KeyRound className="h-4 w-4 text-primary" />
           </div>
        </div>
      )}

    </div>
  );
}

export default function OrderDetailsClient({ forcedId }: { forcedId?: string }) {
  return (
    <Suspense fallback={<div className="h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <OrderDetailsInner forcedId={forcedId} />
    </Suspense>
  );
}
