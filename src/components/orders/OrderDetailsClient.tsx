"use client"

import { useSearchParams, useRouter } from 'next/navigation';
import { 
  ChevronLeft, 
  MoreHorizontal, 
  Loader2,
  Minimize2,
  PhoneCall,
  KeyRound,
  ShieldCheck,
  XCircle,
  HelpCircle,
  Download,
  IndianRupee,
  FileText
} from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, limit, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState, useEffect, Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

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
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [etaMinutes, setEtaMinutes] = useState<number>(44);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
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

  useEffect(() => {
    if (!order || order.status === 'Delivered' || order.status === 'Cancelled') return;

    const orderKey = `shopykart_eta_anchor_${order.id}`;
    let targetArrivalTime = localStorage.getItem(orderKey);

    if (!targetArrivalTime) {
      const newTarget = Date.now() + (44 * 60 * 1000);
      localStorage.setItem(orderKey, newTarget.toString());
      targetArrivalTime = newTarget.toString();
    }

    const updateCountdown = () => {
      const now = Date.now();
      const diffMs = parseInt(targetArrivalTime!) - now;
      const remainingMins = Math.max(1, Math.ceil(diffMs / (60 * 1000)));
      setEtaMinutes(remainingMins);

      if (order.status === 'Delivered') {
        localStorage.removeItem(orderKey);
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 30000); 

    return () => clearInterval(timer);
  }, [order]);

  const handleEtaUpdateFromMap = (etaString: string) => {
    console.debug("Map ETA Sync:", etaString);
  };

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

  const handleCancelOrder = async () => {
    if (!firestore || !order || order.status !== 'Placed' || isCancelling) return;
    
    if (!confirm("Are you sure you want to cancel this order?")) return;

    setIsCancelling(true);
    try {
      await updateDoc(doc(firestore, 'orders', order.id), {
        status: 'Cancelled',
        updatedAt: serverTimestamp()
      });
      setOrder({...order, status: 'Cancelled'});
      toast({ title: "Order Cancelled", description: "Your order has been cancelled successfully." });
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed" });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleHelp = () => {
    const message = `Hi ShopyKart Support, I need help with my Order #${order?.customerOrderNumber || 'N/A'}.`;
    window.open(`https://wa.me/917992090977?text=${encodeURIComponent(message)}`, '_blank');
  };

  const generateReceipt = async () => {
    if (!order) return;
    setIsDownloading(true);
    try {
      const { toBlob } = await import('html-to-image');
      const FileSaver = await import('file-saver');
      const saveAs = FileSaver.saveAs || (FileSaver as any).default;

      const receipt = document.createElement('div');
      receipt.style.padding = '40px 30px';
      receipt.style.width = '420px';
      receipt.style.backgroundColor = '#ffffff';
      receipt.style.color = '#000000';
      receipt.style.fontFamily = 'monospace';
      receipt.style.textTransform = 'uppercase';
      
      const orderDate = format(new Date(order.createdAt?.seconds * 1000 || Date.now()), 'dd MMM yyyy, hh:mm a');
      const upiUrl = `upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${order.total?.toFixed(2)}&cu=INR`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

      const itemsHtml = order.items?.map((item: any) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 11px; font-weight: 800;">
          <span style="flex: 2; pr: 10px;">${item.name}</span>
          <span style="flex: 0.5; text-align: center;">X${item.quantity}</span>
          <span style="flex: 1; text-align: right;">${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      `).join('');

      receipt.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="margin: 0; font-size: 38px; font-weight: 900; letter-spacing: -2px; font-style: italic;">SHOPYKART</h1>
          <p style="margin: 2px 0; font-size: 10px; font-weight: 900; letter-spacing: 2px;">PREMIUM DELIVERY NETWORK</p>
          <div style="margin-top: 15px; font-size: 9px; font-weight: 800;">SHOPYKART PREMIUM DELIVERY</div>
          <div style="font-size: 9px; font-weight: 800;">POWERED BY DEVANSH GUPTA</div>
          <div style="border-top: 1.5px dashed #000; margin: 15px auto 0; width: 100%;"></div>
        </div>

        <div style="margin-bottom: 25px; line-height: 1.8; font-size: 11px; font-weight: 800;">
          <div style="display: flex; justify-content: space-between;"><span>ORDER NO:</span><span style="font-weight: 900;">#${order.customerOrderNumber || '1'}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>TIME:</span><span>${orderDate}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>STORES:</span><span style="text-align: right; max-width: 200px;">${order.restaurantName || 'ShopyKart Hub'}</span></div>
          <div style="display: flex; justify-content: space-between; margin-top: 10px;"><span>CUSTOMER:</span><span>${order.customerName}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>PHONE:</span><span>${order.customerPhone}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>ADDRESS:</span><span style="text-align: right; max-width: 200px;">${order.address}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>PAYMENT:</span><span>${order.paymentMethod === 'ONLINE' ? 'ONLINE PREPAID' : 'CASH ON DELIVERY'}</span></div>
        </div>

        <div style="border-top: 1.5px dashed #000; margin-bottom: 10px;"></div>
        <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 900; margin-bottom: 10px;">
          <span style="flex: 2;">ITEM DESCRIPTION</span>
          <span style="flex: 0.5; text-align: center;">QTY</span>
          <span style="flex: 1; text-align: right;">PRICE</span>
        </div>
        <div style="border-top: 1.5px dashed #000; margin-bottom: 15px;"></div>

        <div style="margin-bottom: 20px;">
          ${itemsHtml}
        </div>

        <div style="border-top: 1.5px dashed #000; margin-bottom: 15px;"></div>

        <div style="font-size: 11px; font-weight: 800; space-y: 6px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>ITEMS SUBTOTAL:</span><span>₹${(order.total - 10).toFixed(2)}</span></div>
          <div style="display: flex; justify-content: space-between; font-style: italic;"><span>DELHIVERY FEE:</span><span>₹10.00</span></div>
        </div>

        <div style="border-top: 2px solid #000; margin: 15px 0;"></div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 24px; font-weight: 900; font-style: italic;">GRAND TOTAL</span>
          <span style="font-size: 24px; font-weight: 900; font-style: italic;">₹${order.total?.toFixed(2)}</span>
        </div>
        <div style="border-top: 1.5px dashed #000; margin: 15px 0;"></div>

        <div style="text-align: center; margin: 25px 0;">
          <div style="border: 1.5px dotted #000; display: inline-block; padding: 10px; margin-bottom: 8px;">
            <img src="${qrCodeUrl}" style="width: 150px; height: 140px; display: block;" />
          </div>
          <p style="font-size: 9px; font-weight: 900; letter-spacing: 2px; margin: 0;">SCAN TO PAY</p>
        </div>

        <div style="text-align: center; margin-top: 25px;">
          <p style="font-size: 16px; font-weight: 900; font-style: italic; margin-bottom: 5px;">ENJOY YOUR DELICIOUS MEAL!</p>
          <p style="font-size: 8px; font-weight: 700; color: #555; line-height: 1.4;">THANK YOU FOR CHOOSING SHOPYKART! THIS IS A COMPUTER GENERATED INVOICE.</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <div style="border: 1.5px solid #000; display: inline-block; padding: 4px 15px; font-size: 10px; font-weight: 900; letter-spacing: 2px;">
            POWERED BY SHOPYKART
          </div>
        </div>
      `;
      
      document.body.appendChild(receipt);
      
      // CRITICAL FIX: Add skipFonts and cacheBust to prevent SecurityError with cross-origin assets
      const blob = await toBlob(receipt, { 
        pixelRatio: 2, 
        cacheBust: true,
        skipFonts: true,
        style: { fontFamily: 'monospace' } 
      }); 
      document.body.removeChild(receipt);
      
      if (blob && typeof saveAs === 'function') {
        saveAs(blob, `ShopyKart_Receipt_${order.customerOrderNumber || order.id.slice(-4)}.png`);
        toast({ title: "Receipt Downloaded! ✅" });
      }
    } catch (err) {
      console.error("Receipt generation error:", err);
      toast({ variant: "destructive", title: "Download Failed" });
    } finally {
      setIsDownloading(false);
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
      <Button onClick={() => router.push('/')} className="mt-8 bg-black rounded-xl h-14 px-8 font-black uppercase italic shadow-xl">Back to Explore</Button>
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-900 shadow-lg border border-black/5 active:scale-90 transition-transform pointer-events-auto">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl w-48 p-2 border-none shadow-2xl bg-white/95 backdrop-blur-xl z-[100000]">
              {order.status === 'Placed' && (
                <DropdownMenuItem 
                  onClick={handleCancelOrder}
                  disabled={isCancelling}
                  className="flex items-center gap-3 p-3 rounded-xl text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
                >
                  <XCircle className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{isCancelling ? 'Cancelling...' : 'Cancel Order'}</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem 
                onClick={handleHelp}
                className="flex items-center gap-3 p-3 rounded-xl text-gray-900 focus:bg-gray-50 cursor-pointer"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Help & Support</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
            onEtaUpdate={handleEtaUpdateFromMap}
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
                    <span className="text-2xl font-black italic tracking-tighter leading-none">{etaMinutes}</span>
                    <span className="text-[8px] font-black uppercase tracking-widest leading-none mt-1">mins</span>
                 </div>
              </div>

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

              <div className="pt-6 mt-6 border-t border-dashed border-gray-100 flex items-center justify-between">
                 <div className="flex flex-col">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Payable Amount</span>
                    <div className="flex items-center gap-1.5 text-2xl font-black italic text-gray-900 tracking-tighter">
                       <IndianRupee className="h-5 w-5 text-primary" />
                       <span>{order.total?.toFixed(0)}</span>
                    </div>
                 </div>
                 
                 <button 
                  onClick={generateReceipt}
                  disabled={isDownloading}
                  className="flex items-center gap-2 text-[9px] font-black uppercase text-blue-600 hover:text-blue-700 transition-colors py-2 px-4 bg-blue-50 rounded-xl"
                 >
                    {isDownloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                    <span>{isDownloading ? 'Generating...' : 'Download Receipt'}</span>
                 </button>
              </div>
            </div>
         </div>
      </div>

      <div className={cn(
        "px-4 py-4 transition-all duration-500",
        isMapExpanded ? "opacity-0" : "opacity-100"
      )}>
         {/* FLOATING OTP BOX */}
         {order.deliveryOTP && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
           <div className="flex justify-center -mb-5 relative z-[150] animate-in zoom-in duration-500">
             <div className="bg-[#0B0B0B] text-white px-6 py-2.5 rounded-[1.25rem] shadow-2xl border-2 border-primary/30 flex flex-col items-center">
                <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60 flex items-center gap-1">
                  <KeyRound className="h-2 w-2 text-primary" /> SECURE DELIVERY OTP
                </span>
                <span className="text-sm font-black italic text-primary tracking-widest mt-0.5">{order.deliveryOTP}</span>
             </div>
           </div>
         )}

         {order.deliveryPartnerId ? (
            <div className="bg-white rounded-[2.5rem] p-5 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.1)] border border-gray-50 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-700 pt-8">
               <div className="flex items-center gap-5">
                  <div className="relative">
                     <div className="h-16 w-16 bg-primary/5 rounded-[1.5rem] flex items-center justify-center border border-primary/10 overflow-hidden shadow-inner">
                        <img src="https://cdn-icons-png.flaticon.com/512/619/619032.png" className="h-full w-full object-cover p-2 opacity-80" alt="" />
                     </div>
                     <div className="absolute -bottom-1 -right-1 bg-green-500 h-4 w-4 rounded-full border-2 border-white shadow-sm" />
                  </div>
                  <div className="min-w-0">
                     <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em] block mb-1">Your Delivery Hero</span>
                     <h4 className="text-xl font-black italic uppercase tracking-tighter text-gray-900 leading-none truncate max-w-[160px]">{order.deliveryPartnerName}</h4>
                  </div>
               </div>
               
               <button 
                  onClick={handleCallPartner}
                  className="h-14 w-14 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-green-100 active:scale-90 transition-all border-b-4 border-green-800"
               >
                  <PhoneCall className="h-7 w-7" />
               </button>
            </div>
         ) : order.status === 'Cancelled' ? (
            <div className="bg-red-50 rounded-[2.5rem] p-8 text-center border-2 border-red-100">
               <XCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
               <h3 className="text-2xl font-black italic uppercase text-red-600 tracking-tighter">Order Cancelled</h3>
               <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mt-2">Any refund will be processed to source.</p>
            </div>
         ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
               <Loader2 className="h-5 w-5 animate-spin text-gray-400 mb-2" />
               <p className="text-[8px] font-black uppercase tracking-[0.4em]">Assigning your delivery hero...</p>
            </div>
         )}
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
