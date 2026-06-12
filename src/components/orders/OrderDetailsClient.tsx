
"use client"

import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, Clock, CheckCircle2, Circle, Loader2, XCircle, AlertTriangle, ReceiptText, Printer } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRef } from 'react';
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

export default function OrderDetailsClient() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

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

  const handlePrintReceipt = () => {
    if (typeof window === 'undefined' || !order) return;
    
    // Create a hidden iframe for clean POS printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const docRef = iframe.contentWindow?.document;
    if (!docRef) return;

    const upiId = "9450355709@axl";
    const upiName = "ShopyKart";
    const amount = order.total.toFixed(2);
    const upiUri = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${amount}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;

    docRef.open();
    docRef.write(`
      <html>
        <head>
          <title>ShopyKart POS Bill</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { 
              font-family: "monospace", sans-serif; 
              padding: 4mm; 
              margin: 0; 
              color: #000; 
              background: #fff; 
              width: 72mm; 
              font-size: 11px; 
              text-transform: uppercase; 
              line-height: 1.2;
            }
            .center { text-align: center; }
            .bold { font-weight: 900; }
            .header-title { font-size: 18px; font-weight: 900; margin-bottom: 2px; }
            .subtitle { font-size: 8px; font-weight: 700; margin-bottom: 5px; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 10px; }
            .item-table { width: 100%; margin: 8px 0; border-collapse: collapse; }
            .item-table th { text-align: left; font-size: 9px; border-bottom: 1px dashed #000; padding-bottom: 4px; }
            .item-table td { padding: 4px 0; vertical-align: top; font-weight: 700; }
            .right { text-align: right; }
            .total-row { display: flex; justify-content: space-between; align-items: center; font-size: 15px; font-weight: 900; margin-top: 8px; border-top: 2px solid #000; padding-top: 6px; }
            .qr-container { margin: 12px 0; text-align: center; border: 1px dashed #000; padding: 10px; }
            .qr-code { width: 120px; height: 120px; filter: grayscale(1); }
            .footer-text { font-size: 8px; margin-top: 15px; line-height: 1.3; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="center">
            <div class="header-title">SHOPYKART</div>
            <div class="subtitle">PREMIUM DELIVERY NETWORK</div>
            <div style="font-size: 9px; white-space: pre-line;">${settings?.receiptHeader || 'MAIN ROAD, MAURANIPUR\nPH: +91 9450355709'}</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="info-row"><span class="bold">ORDER ID:</span><span class="bold">#${order.orderDisplayId || order.id.slice(-5).toUpperCase()}</span></div>
          <div class="info-row"><span>DATE:</span><span>${order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'dd/MM/yy HH:mm') : '--'}</span></div>
          <div class="info-row"><span>CUSTOMER:</span><span class="bold">${order.customerName?.slice(0, 18)}</span></div>
          
          <div class="divider"></div>
          
          <table class="item-table">
            <thead>
              <tr>
                <th width="65%">ITEM DESCRIPTION</th>
                <th width="15%" class="center">QTY</th>
                <th width="20%" class="right">PRICE</th>
              </tr>
            </thead>
            <tbody>
              ${order.items?.map((item: any) => `
                <tr>
                  <td>${item.name}</td>
                  <td class="center">x${item.quantity}</td>
                  <td class="right">${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-row">
            <span>GRAND TOTAL</span>
            <span>₹${order.total?.toFixed(2)}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="qr-container">
            <div style="font-size: 8px; margin-bottom: 5px; font-weight: 900;">PAYMENT QR (SCAN TO PAY)</div>
            <img src="${qrUrl}" class="qr-code" />
            <div style="font-size: 9px; margin-top: 5px; font-weight: 900;">PAYABLE: ₹${amount}</div>
          </div>
          
          <div class="center">
            <div style="font-size: 11px; font-weight: 900; margin-bottom: 4px;">${settings?.receiptThankYou || 'THANK YOU FOR ORDERING!'}</div>
            <div class="footer-text">${settings?.receiptFooter || 'THIS IS A COMPUTER GENERATED INVOICE\nNO SIGNATURE REQUIRED'}</div>
            <div style="font-size: 7px; margin-top: 10px; letter-spacing: 1px; font-weight: bold;">POWERED BY SHOPYKART POS</div>
          </div>
        </body>
      </html>
    `);
    docRef.close();
    
    // Mobile-friendly delayed trigger
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        // Clean up
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 2000);
      }
    }, 800);
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <Clock className="h-12 w-12 text-primary mb-4 animate-pulse" />
        <h2 className="text-xl font-black italic uppercase">No Order ID</h2>
        <button onClick={() => router.push('/orders')} className="mt-8 text-primary font-black uppercase text-[10px] tracking-widest">View Order History</button>
      </div>
    );
  }

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-black italic uppercase">Order Not Found</h2>
        <button onClick={() => router.push('/')} className="mt-8 bg-black text-white px-8 py-4 rounded-2xl font-black uppercase italic text-xs">Back to Home</button>
      </div>
    );
  }

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
        {!isCancelled && (
           <button 
            onClick={handlePrintReceipt}
            className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95 transition-all"
           >
              <Printer className="h-3.5 w-3.5" />
              Print Bill
           </button>
        )}
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <div className={cn(
          "rounded-2xl p-5 flex items-center gap-4 border shadow-sm",
          isCancelled ? "bg-red-50 border-red-100 text-red-600" : "bg-[#FFF8E6] border-[#FFE8B3] text-[#B38B00]"
        )}>
          {isCancelled ? (
            <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center"><XCircle className="h-6 w-6" /></div>
          ) : (
            <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center"><Clock className="h-6 w-6 animate-pulse" /></div>
          )}
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Status ID: #${order.orderDisplayId || orderId.slice(-5).toUpperCase()}</span>
            <div className="font-black text-lg italic uppercase tracking-tighter">
              {isCancelled ? "Order Terminated" : order.status}
            </div>
          </div>
        </div>

        {!isCancelled && (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <h3 className="font-black text-[10px] uppercase mb-8 tracking-[0.2em] text-gray-400">Order Journey</h3>
            <div className="space-y-0 ml-1">
              {steps.map((step, idx) => {
                const isCompleted = idx <= currentStatusIdx;
                const isCurrent = idx === currentStatusIdx;
                return (
                  <div key={step.id} className="flex gap-5 relative">
                    {idx !== steps.length - 1 && (
                      <div className={cn("absolute left-[11px] top-6 w-[2px] h-[calc(100%-12px)] -z-0", isCompleted ? "bg-primary" : "bg-gray-100")} />
                    )}
                    <div className="relative z-10 flex flex-col items-center">
                      <div className={cn(
                        "h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all duration-500",
                        isCompleted ? "bg-primary border-primary shadow-lg shadow-primary/20 scale-110" : "bg-white border-gray-200"
                      )}>
                        {isCompleted ? <CheckCircle2 className="h-3.5 w-3.5 text-white" /> : <Circle className="h-1.5 w-1.5 text-gray-200" />}
                      </div>
                    </div>
                    <div className={cn("pb-8 text-[11px] font-black uppercase italic tracking-widest transition-all", isCompleted ? "text-black" : "text-gray-300")}>
                      {step.label}
                      {isCurrent && <span className="ml-3 inline-block h-1.5 w-1.5 bg-primary rounded-full animate-ping" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Bill Summary</h3>
             <ReceiptText className="h-4 w-4 text-gray-300" />
          </div>
          <div className="space-y-3">
            {order.items?.map((item: any, i: number) => (
              <div key={i} className="flex justify-between items-start text-xs font-bold">
                <span className="text-gray-600 max-w-[70%]">{item.quantity}x {item.name}</span>
                <span className="font-black italic">₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
            
            <div className="pt-4 border-t border-dashed border-gray-200 flex flex-col gap-2">
               <div className="flex justify-between items-center">
                  <span className="text-sm font-black uppercase italic text-gray-500">Amount Paid</span>
                  <span className="text-2xl font-black text-primary italic tracking-tighter">₹{order.total?.toFixed(2)}</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
