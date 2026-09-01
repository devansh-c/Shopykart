
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
  Navigation,
  CheckCircle2,
  MessageSquareQuote,
  Share2,
  Heart,
  TrendingUp,
  Percent
} from 'lucide-react';
import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, getDocs, limit, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';

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
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col transform-gpu overflow-x-hidden">
      
      {/* 1. TOP HALF: FIXED MAP & HEADER */}
      <div className="relative h-[65vh] w-full shrink-0">
        {/* HEADER OVERLAY */}
        <header className="absolute top-0 left-0 right-0 z-[100] px-4 py-4 flex items-center justify-between pointer-events-none">
          <button onClick={() => router.push('/orders')} className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-900 shadow-xl border border-black/5 active:scale-90 transition-transform pointer-events-auto">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex flex-col items-center">
             <h4 className="text-[11px] font-black uppercase italic tracking-tighter text-gray-900 leading-none drop-shadow-sm">{order.restaurantName}</h4>
             <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">
               {format(new Date(order.createdAt?.seconds * 1000 || Date.now()), 'hh:mm a')} • {order.items?.length || 1} items
             </p>
          </div>
          <button className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-900 shadow-xl border border-black/5 active:scale-90 transition-transform pointer-events-auto">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </header>

        {/* MAP BACKGROUND */}
        <div className="absolute inset-0 z-0">
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

        {/* TRACKING CARD (FLOATING OVER MAP) */}
        <div className="absolute bottom-6 left-4 right-4 z-[100]">
           <div className="bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden border border-black/5 animate-in slide-in-from-bottom-6 duration-700">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                   <div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">
                        {getHeadline()}
                      </h2>
                   </div>
                   <div className="bg-[#16a34a] text-white h-14 w-14 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-green-100/50">
                      <span className="text-xl font-black italic tracking-tighter leading-none">{eta.split(' ')[0]}</span>
                      <span className="text-[7px] font-black uppercase tracking-widest leading-none mt-1 opacity-90">mins</span>
                   </div>
                </div>

                <div className="space-y-5 relative">
                   <div className="absolute left-[5px] top-[14px] bottom-[14px] w-[2px] border-l-2 border-dashed border-gray-100" />
                   
                   <div className="flex items-center gap-4 relative">
                      <div className="h-2.5 w-2.5 rounded-full bg-gray-200 border-2 border-white shadow-sm shrink-0" />
                      <span className="text-[11px] font-black uppercase italic text-gray-600 truncate">{order.restaurantName}</span>
                   </div>
                   
                   <div className="flex items-start gap-4 relative">
                      <div className="h-3 w-3 bg-green-500 rounded-sm border-2 border-white shadow-sm shrink-0 mt-1" />
                      <div className="flex-1 min-w-0">
                         <p className="text-[10px] font-black text-gray-900 uppercase leading-none truncate">To {order.customerName}</p>
                         <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 leading-relaxed line-clamp-1 italic">
                           {order.address}
                         </p>
                      </div>
                   </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between group cursor-pointer active:scale-95 transition-all">
                   <span className="text-[9px] font-black uppercase tracking-widest text-gray-900 flex items-center gap-2">
                      Add Delivery Instructions
                      <ChevronRight className="h-2.5 w-2.5 text-gray-400" />
                   </span>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* 2. BOTTOM HALF: SCROLLABLE CONTENT */}
      <div className="flex-1 bg-[#F9FAFB] pb-32">
        {/* PAYMENT PROMO BAR */}
        <div className="px-4 py-4">
           <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-black/5 shadow-sm active:scale-[0.98] transition-all cursor-pointer">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center overflow-hidden">
                    <img src="https://cdn-icons-png.flaticon.com/512/10691/10691811.png" className="h-6 w-6 object-contain" alt="" />
                 </div>
                 <div className="flex flex-col">
                    <p className="text-[10px] font-black uppercase tracking-tight text-gray-900">Pay ₹{order.total?.toFixed(0)} online to avoid cash handling.</p>
                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Get cashback with ShopyKart Coins</p>
                 </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
           </div>
        </div>

        {/* WHILE YOU WAIT SECTION */}
        <section className="mt-8 space-y-6">
           <div className="px-6 flex flex-col items-center">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-400 text-center">WHILE YOU WAIT</h3>
              <div className="h-[2px] w-12 bg-primary/40 mt-2 rounded-full" />
           </div>

           <div className="px-4 space-y-6">
              {/* Promo Banner 1 */}
              <div className="relative aspect-[16/8] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white group transform-gpu transition-transform hover:scale-[1.02]">
                 <img src="https://picsum.photos/seed/promo1/800/400" className="absolute inset-0 w-full h-full object-cover" alt="" />
                 <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent flex flex-col justify-center p-8">
                    <span className="bg-primary text-white text-[8px] font-black px-3 py-1 rounded-full uppercase italic tracking-widest w-fit mb-3">ELITE DEAL</span>
                    <h4 className="text-white font-black text-2xl italic leading-none tracking-tighter uppercase drop-shadow-md">Win Free<br/>Choc-Bars!</h4>
                    <p className="text-white/70 text-[9px] font-bold uppercase mt-3 tracking-widest italic">Scream Challenge is Live</p>
                 </div>
              </div>

              {/* Reward Milestone Card */}
              <div className="bg-[#0B0B0B] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5">
                 <div className="relative z-10 space-y-5">
                    <div className="flex items-center gap-4">
                       <div className="bg-amber-400 p-2.5 rounded-xl text-black">
                          <TrendingUp className="h-6 w-6" />
                       </div>
                       <div>
                          <h4 className="text-lg font-black italic uppercase tracking-tighter">Road to Platinum</h4>
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">3 more orders to unlock</p>
                       </div>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-400 rounded-full w-[70%]" />
                    </div>
                    <p className="text-[8px] font-bold text-gray-400 uppercase leading-relaxed text-center">
                       Keep ordering to unlock premium concierge services.
                    </p>
                 </div>
                 <div className="absolute top-0 right-0 h-full w-24 bg-white/5 -skew-x-12 translate-x-10 pointer-events-none" />
              </div>

              {/* Promo Banner 2 */}
              <div className="relative aspect-[16/8] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white group transform-gpu transition-transform hover:scale-[1.02]">
                 <img src="https://picsum.photos/seed/promo2/800/400" className="absolute inset-0 w-full h-full object-cover" alt="" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8">
                    <div className="flex items-center gap-2 mb-2">
                       <ShieldCheck className="h-4 w-4 text-green-400" />
                       <span className="text-white font-black text-[9px] uppercase tracking-widest">Safe & Secure</span>
                    </div>
                    <h4 className="text-white font-black text-xl italic leading-tight tracking-tighter uppercase">100% Contactless<br/>Gourmet Handling</h4>
                 </div>
              </div>
           </div>
        </section>
      </div>

      {/* FLOATING OTP BADGE */}
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
