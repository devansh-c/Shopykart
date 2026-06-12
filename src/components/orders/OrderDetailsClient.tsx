
"use client"

import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, Clock, CheckCircle2, Circle, Loader2, XCircle, AlertTriangle, ReceiptText, Printer, Download, Eye } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRef, useState } from 'react';
import { format } from 'date-fns';
import { toJpeg } from 'html-to-image';
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

/**
 * @fileOverview Refactored Order Details with professional Receipt View and Download.
 * Optimized: Buttons are now always visible (sticky) in the dialog.
 */
export default function OrderDetailsClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const orderRef = useMemoFirebase(() => {
    if (!firestore || !orderId) return null;
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

    return (
      <div id="receipt-content" className="bg-white text-black p-6 font-mono text-[11px] uppercase leading-snug w-[300px] mx-auto border border-gray-100">
        <div className="text-center space-y-1 mb-4">
          <h2 className="text-2xl font-black italic tracking-tighter leading-none">SHOPYKART</h2>
          <p className="text-[8px] font-bold opacity-80">PREMIUM DELIVERY NETWORK</p>
          <p className="text-[9px] whitespace-pre-line leading-tight mt-2 opacity-90">{settingsData?.receiptHeader || 'MAIN ROAD, MAURANIPUR\nGSTIN: 09ABCDE1234F1Z5'}</p>
        </div>

        <div className="border-t border-dashed border-black my-3" />

        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between"><span>ORDER ID:</span><span className="font-black">#{orderData.orderDisplayId || orderData.id.slice(-5)}</span></div>
          <div className="flex justify-between"><span>DATE:</span><span>{dateStr}</span></div>
          <div className="flex justify-between"><span>CUSTOMER:</span><span className="font-black">{orderData.customerName?.slice(0, 20)}</span></div>
        </div>

        <div className="border-t border-dashed border-black my-3" />

        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-dashed border-black">
              <th className="text-left py-1" width="60%">ITEM DESCRIPTION</th>
              <th className="text-center py-1" width="15%">QTY</th>
              <th className="text-right py-1" width="25%">PRICE</th>
            </tr>
          </thead>
          <tbody>
            {orderData.items?.map((item: any, i: number) => (
              <tr key={i}>
                <td className="py-2 pr-2 font-black leading-tight">{item.name}</td>
                <td className="text-center py-2">X{item.quantity}</td>
                <td className="text-right py-2">{ (item.price * item.quantity).toFixed(2) }</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t-2 border-black mt-3 pt-3 flex justify-between items-center text-lg font-black italic">
          <span>GRAND TOTAL</span>
          <span>₹{orderData.total?.toFixed(2)}</span>
        </div>

        <div className="border-t border-dashed border-black my-4" />

        <div className="border border-dashed border-black p-4 text-center space-y-2 mb-4">
          <p className="text-[8px] font-black tracking-widest">PAYMENT QR (SCAN TO PAY)</p>
          <img src={qrUrl} className="w-32 h-32 mx-auto grayscale" alt="QR" />
          <p className="text-[10px] font-black">PAYABLE: ₹{amount}</p>
        </div>

        <div className="text-center space-y-3">
          <p className="font-black text-sm italic">{settingsData?.receiptThankYou || 'ENJOY YOUR DELICIOUS MEAL!'}</p>
          <p className="text-[8px] opacity-70 whitespace-pre-line">{settingsData?.receiptFooter || 'THIS IS A COMPUTER GENERATED INVOICE'}</p>
          <div className="pt-2">
            <span className="text-[7px] font-black tracking-[0.3em] border border-black px-2 py-0.5">POWERED BY SHOPYKART POS</span>
          </div>
        </div>
      </div>
    );
  };

  const handleDownloadReceipt = async () => {
    if (!order || isDownloading) return;
    setIsDownloading(true);
    
    const element = document.getElementById('receipt-download-template');
    if (!element) {
      setIsDownloading(false);
      return;
    }

    try {
      const dataUrl = await toJpeg(element, { quality: 0.95, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `ShopyKart_Bill_${order.orderDisplayId || order.id.slice(-5)}.jpg`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Saved to Gallery! ✅" });
    } catch (err) {
      toast({ variant: "destructive", title: "Download Failed" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintReceipt = () => {
    const element = document.getElementById('receipt-download-template');
    if (!element) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write('<html><head><title>Print Receipt</title>');
    printWindow.document.write('<style>body{margin:0;display:flex;justify-content:center;} @page{margin:0;size:80mm auto;}</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(element.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

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
              <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden bg-white max-w-[340px] flex flex-col max-h-[90vh]">
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
                    {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} DOWNLOAD
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

        <div id="receipt-download-template" className="hidden">
          {generateReceiptHTML(order, settings)}
        </div>
      </div>
    </div>
  );
}
