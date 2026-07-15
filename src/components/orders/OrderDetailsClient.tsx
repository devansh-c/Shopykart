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
  MessageSquareQuote 
} from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState, useEffect, Suspense } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  const { toast } = useToast();
  
  const orderId = forcedId || searchParams.get('id');
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const orderRef = useMemoFirebase(() => {
    if (!firestore || !orderId || orderId === 'track' || orderId === 'status' || orderId === 'active') return null;
    return doc(firestore, 'orders', String(orderId));
  }, [firestore, orderId]);

  const { data: order, loading } = useDoc<any>(orderRef);

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  const handleCancelOrder = async () => {
    if (!firestore || !order || isCancelling) return;
    if (!confirm("Are you sure you want to cancel this order?")) return;

    setIsCancelling(true);
    try {
      await updateDoc(doc(firestore, 'orders', order.id), {
        status: 'Cancelled',
        updatedAt: serverTimestamp()
      });
      toast({ title: "Order Cancelled" });
    } catch (err) {
      toast({ variant: "destructive", title: "Cancellation Failed" });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!order || isDownloading) return;
    setIsDownloading(true);
    
    const element = document.getElementById(`receipt-content-${order.id}`);
    if (!element) { setIsDownloading(false); return; }

    try {
      const { toBlob } = await import('html-to-image');
      const FileSaver = await import('file-saver');
      const saveAs = FileSaver.saveAs || (FileSaver as any).default;
      const blob = await toBlob(element, { cacheBust: true, backgroundColor: '#ffffff', pixelRatio: 2 });
      if (blob && typeof saveAs === 'function') {
        saveAs(blob, `ShopyKart_Bill_${order.orderDisplayId || order.id.slice(-5)}.jpg`);
        toast({ title: "Saved!" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Failed" });
    } finally { setIsDownloading(false); }
  };

  if (loading && !order) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!order) return <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center"><h2 className="text-xl font-black italic uppercase">Order Not Found</h2><Button onClick={() => router.push('/')} className="mt-8">Home</Button></div>;

  const isCancelled = order.status === 'Cancelled';
  const currentStatusIdx = steps.findIndex(s => s.id === order.status);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32">
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/orders')} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-50"><ChevronLeft className="h-6 w-6 text-gray-700" /></button>
          <h1 className="text-lg font-bold italic uppercase tracking-tighter">Track Order</h1>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className={cn("rounded-2xl p-5 flex items-center justify-between border", isCancelled ? "bg-red-50 border-red-100 text-red-600" : "bg-[#FFF8E6] border-[#FFE8B3] text-[#B38B00]")}>
          <div className="flex items-center gap-4">
            {isCancelled ? <XCircle className="h-8 w-8" /> : <Clock className="h-8 w-8 animate-pulse" />}
            <div><span className="text-[9px] font-black uppercase opacity-60">ORDER #{order.orderDisplayId || order.id.slice(-5)}</span><div className="font-black text-xl italic uppercase tracking-tighter">{isCancelled ? "Cancelled" : order.status}</div></div>
          </div>
          {order.status === 'Placed' && <button onClick={handleCancelOrder} className="bg-white border-2 border-red-100 text-red-500 h-10 px-4 rounded-xl font-black text-[9px]">Cancel</button>}
        </div>

        {!isCancelled && (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <h3 className="font-black text-[10px] uppercase mb-8 tracking-[0.2em] text-gray-400">Order Journey</h3>
            <div className="space-y-0 ml-1">
              {steps.map((step, idx) => (
                <div key={step.id} className="flex gap-5 relative">
                  {idx !== steps.length - 1 && <div className={cn("absolute left-[11px] top-6 w-[2px] h-[calc(100%-12px)]", idx < currentStatusIdx ? "bg-primary" : "bg-gray-100")} />}
                  <div className={cn("h-6 w-6 rounded-full flex items-center justify-center border-2 z-10", idx <= currentStatusIdx ? "bg-primary border-primary shadow-lg" : "bg-white border-gray-200")}>
                    {idx <= currentStatusIdx ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> : <Circle className="h-1 w-1 text-gray-200" />}
                  </div>
                  <div className={cn("pb-8 text-[11px] font-black uppercase italic tracking-widest", idx <= currentStatusIdx ? "text-black" : "text-gray-300")}>{step.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
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
