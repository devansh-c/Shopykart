"use client"

import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, Clock, CheckCircle2, Circle, Loader2, XCircle, AlertTriangle, ReceiptText, Printer, Download, Eye, MapPin, CreditCard, Banknote } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState } from 'react';
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

export default function OrderDetailsClient({ forcedId }: { forcedId?: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // Use forcedId (from dynamic route) or search param 'id'
  const orderId = forcedId || searchParams.get('id');
  
  const [isDownloading, setIsDownloading] = useState(false);

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

  const generateReceiptHTML = (orderData: any, settingsData: any) => {
    const upiId = "9450355709@axl";
    const amount = orderData.total.toFixed(2);
    const upiUri = `upi://pay?pa=${upiId}&pn=ShopyKart&am=${amount}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
    const dateStr = orderData.createdAt?.seconds ? format(new Date(orderData.createdAt.seconds * 1000), 'dd/MM/yy HH:mm') : '--';
    const subtotal = orderData.subtotal || orderData.items?.reduce((acc:any, it:any) => acc + (it.price * it.quantity), 0) || 0;

    return (
      <div id={`receipt-content-${orderData.id}`} className="bg-white text-black p-5 font-mono text-[10px] uppercase leading-tight w-[280px] mx-auto border border-gray-100 shadow-none print:shadow-none">
        <div className="text-center space-y-1 mb-4">
          <h2 className="text-2xl font-black italic tracking-tighter leading-none">SHOPYKART</h2>
          <p className="text-[7px] font-bold opacity-60 mb-2">PREMIUM DELIVERY NETWORK</p>
          <p className="text-[8px] whitespace-pre-line leading-tight mt-2">{settingsData?.receiptHeader || 'MAIN ROAD, MAURANIPUR'}</p>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="space-y-1">
          <div className="flex justify-between"><span>ORDER ID:</span><span className="font-black">#{orderData.orderDisplayId || orderData.id.slice(-5)}</span></div>
          <div className="flex justify-between"><span>DATE:</span><span>{dateStr}</span></div>
          <div className="flex justify-between"><span>CUSTOMER:</span><span className="font-black">{orderData.customerName?.slice(0, 18)}</span></div>
          <div className="flex justify-between border-t border-dashed border-black/10 pt-1 mt-1">
            <span>PAYMENT MODE:</span>
            <span className="font-black">{orderData.paymentMethod === 'online' ? 'PREPAID' : 'CASH'}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-2" />
        
        <div className="space-y-1 mb-2">
           <span className="font-black block">DELIVERY ADDRESS:</span>
           <p className="text-[9px] leading-tight opacity-80">{orderData.address}</p>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <table className="w-full text-[9px]">
          <thead>
            <tr className="border-b border-dashed border-black">
              <th className="text-left py-1" width="60%">ITEM</th>
              <th className="text-center py-1" width="15%">QTY</th>
              <th className="text-right py-1" width="25%">PRICE</th>
            </tr>
          </thead>
          <tbody>
            {orderData.items?.map((item: any, i: number) => (
              <tr key={i}>
                <td className="py-2 pr-1 font-black leading-tight">{item.name}</td>
                <td className="text-center py-2">X{item.quantity}</td>
                <td className="text-right py-2">{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-dashed border-black my-2 pt-2 space-y-1">
           <div className="flex justify-between"><span>SUBTOTAL:</span><span className="font-black">₹{subtotal.toFixed(2)}</span></div>
           {orderData.charges?.map((charge: any, idx: number) => (
             <div key={idx} className="flex justify-between"><span>{charge.name}:</span><span className="font-black">₹{charge.amount.toFixed(2)}</span></div>
           ))}
           {orderData.couponDiscount > 0 && <div className="flex justify-between"><span>COUPON:</span><span className="font-black">-₹{orderData.couponDiscount.toFixed(2)}</span></div>}
           {orderData.coinDiscount > 0 && <div className="flex justify-between"><span>COINS:</span><span className="font-black">-₹{orderData.coinDiscount.toFixed(2)}</span></div>}
           {orderData.deliveryTip > 0 && <div className="flex justify-between"><span>TIP:</span><span className="font-black">₹{orderData.deliveryTip.toFixed(2)}</span></div>}
        </div>

        <div className="border-t-2 border-black mt-2 pt-2 flex justify-between items-center text-sm font-black italic">
          <span>GRAND TOTAL</span>
          <span>₹{orderData.total?.toFixed(2)}</span>
        </div>

        <div className="border-t border-dashed border-black my-3" />

        <div className="border border-dashed border-black p-3 text-center space-y-2 mb-3">
          <p className="text-[7px] font-black tracking-widest">PAYMENT QR (SCAN TO PAY)</p>
          <img src={qrUrl} className="w-24 h-24 mx-auto grayscale" alt="QR" />
          <p className="text-[8px] font-black">PAYABLE: ₹{amount}</p>
        </div>

        <div className="text-center space-y-2">
          <p className="font-black text-[11px] italic">{settingsData?.receiptThankYou || 'ENJOY YOUR DELICIOUS MEAL!'}</p>
          <p className="text-[7px] opacity-70 whitespace-pre-line uppercase">{settingsData?.receiptFooter || 'THIS IS A COMPUTER GENERATED INVOICE'}</p>
          <div className="pt-1">
            <span className="text-[6px] font-black tracking-[0.3em] border border-black px-2 py-0.5">POWERED BY SHOPYKART POS</span>
          </div>
        </div>
      </div>
    );
  };

  const handleDownloadReceipt = async () => {
    if (!order || isDownloading) return;
    setIsDownloading(true);
    
    const element = document.getElementById(`receipt-content-${order.id}`);
    if (!element) {
      setIsDownloading(false);
      return;
    }

    try {
      const { toJpeg } = await import('html-to-image');
      const { saveAs } = await import('file-saver');
      const dataUrl = await toJpeg(element, { quality: 0.95, backgroundColor: '#ffffff', pixelRatio: 2 });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      saveAs(blob, `ShopyKart_Bill_${order.orderDisplayId || order.id.slice(-5)}.jpg`);
      toast({ title: "Saved to Gallery! ✅" });
    } catch (err) {
      toast({ variant: "destructive", title: "Download Failed" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintReceipt = () => {
    const element = document.getElementById(`receipt-content-${order.id}`);
    if (!element) return;
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.write(`
      <html>
        <head>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { margin: 0; padding: 0; display: flex; justify-content: center; }
            * { -webkit-print-color-adjust: exact; }
          </style>
        </head>
        <body>
          ${element.outerHTML}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      document.body.removeChild(iframe);
    }, 500);
  };

  if (!orderId || orderId === 'track' || orderId === 'status' || orderId === 'active') {
    return <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center"><h2 className="text-xl font-black italic uppercase">No Order Found</h2><Button onClick={() => router.push('/orders')} className="mt-8">Go to Orders</Button></div>;
  }

  if (loading && !order) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  
  if (!order) return <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center"><h2 className="text-xl font-black italic uppercase">Order Not Found</h2><Button onClick={() => router.push('/')} className="mt-8">Home</Button></div>;

  const isCancelled = order.status === 'Cancelled';
  const currentStatusIdx = steps.findIndex(s => s.id === order.status);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-32">
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/orders')} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-bold italic uppercase tracking-tighter">Track Order</h1>
        </div>
        
        <div className="flex gap-2">
          {!isCancelled && (
            <Dialog>
              <DialogTrigger asChild>
                <button className="bg-blue-50 text-blue-600 h-10 px-4 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all">
                  <Eye className="h-3.5 w-3.5" /> View Bill
                </button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden bg-white max-w-[340px] flex flex-col max-h-[85vh] z-[11000]">
                <DialogHeader className="sr-only">
                  <DialogTitle>Digital Order Bill</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col items-center">
                  <div className="w-full scale-[1.05] origin-top mb-4">
                    {generateReceiptHTML(order, settings)}
                  </div>
                </div>
                <div className="p-4 bg-gray-50 border-t flex gap-3 shrink-0">
                  <Button onClick={handlePrintReceipt} className="flex-1 bg-black text-white h-12 rounded-xl font-black uppercase text-[10px] shadow-lg">
                    <Printer className="h-4 w-4 mr-2" /> PRINT
                  </Button>
                  <Button onClick={handleDownloadReceipt} disabled={isDownloading} className="flex-1 bg-primary text-white h-12 rounded-xl font-black uppercase text-[10px] shadow-lg">
                    {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} SAVE
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className={cn(
          "rounded-2xl p-5 flex items-center gap-4 border shadow-sm",
          isCancelled ? "bg-red-50 border-red-100 text-red-600" : "bg-[#FFF8E6] border-[#FFE8B3] text-[#B38B00]"
        )}>
          {isCancelled ? <XCircle className="h-8 w-8" /> : <Clock className="h-8 w-8 animate-pulse" />}
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">ORDER #{order.orderDisplayId || order.id.slice(-5)}</span>
            <div className="font-black text-xl italic uppercase tracking-tighter">{isCancelled ? "Cancelled" : order.status}</div>
          </div>
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
