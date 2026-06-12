
"use client"

import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, Clock, CheckCircle2, Circle, Loader2, XCircle, AlertTriangle, Download, ReceiptText, Printer } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useState, useRef } from 'react';
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
  const receiptRef = useRef<HTMLDivElement>(null);

  const orderRef = useMemoFirebase(() => {
    if (!firestore || !orderId) return null;
    return doc(firestore, 'orders', String(orderId));
  }, [firestore, orderId]);

  const { data: order, loading } = useDoc<any>(orderRef);

  // Fetch Receipt Settings
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  const handlePrintReceipt = () => {
    if (typeof window === 'undefined') return;
    
    const printContent = receiptRef.current;
    if (!printContent) return;

    // Create a hidden iframe for better mobile compatibility
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
    docRef.write('<html><head><title>Order Receipt - ShopyKart</title>');
    docRef.write('<style>');
    docRef.write('@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap");');
    docRef.write('body { font-family: "Inter", sans-serif; padding: 20px; color: #000; background: white; text-transform: uppercase; -webkit-print-color-adjust: exact; }');
    docRef.write('.receipt { max-width: 100%; margin: 0 auto; border-top: 8px solid #000; padding-top: 25px; }');
    docRef.write('.center { text-align: center; }');
    docRef.write('.header-main { font-size: 28px; font-weight: 900; letter-spacing: -1.5px; line-height: 1; margin-bottom: 5px; }');
    docRef.write('.header-sub { font-size: 10px; font-weight: 700; color: #555; letter-spacing: 2px; margin-bottom: 15px; }');
    docRef.write('.branding-info { font-size: 10px; line-height: 1.5; margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px; }');
    docRef.write('.order-id-box { border: 2px solid #000; padding: 10px; margin: 20px 0; font-weight: 900; font-size: 14px; display: inline-block; width: auto; }');
    docRef.write('.meta-details { font-size: 11px; margin-bottom: 25px; line-height: 1.6; text-align: left; background: #f9f9f9; padding: 15px; border-radius: 12px; }');
    docRef.write('.table { width: 100%; margin: 20px 0; border-collapse: collapse; }');
    docRef.write('.table th { text-align: left; font-size: 11px; font-weight: 900; border-bottom: 2px solid #000; padding: 10px 5px; }');
    docRef.write('.table td { padding: 12px 5px; font-size: 12px; font-weight: 700; border-bottom: 1px dashed #eee; }');
    docRef.write('.total-section { margin-top: 15px; border-top: 2px solid #000; padding-top: 15px; }');
    docRef.write('.total-row { display: flex; justify-content: space-between; align-items: center; font-weight: 900; font-size: 20px; letter-spacing: -0.5px; }');
    docRef.write('.qr-container { margin: 35px 0; padding: 20px; border: 2px dashed #ddd; border-radius: 20px; background: #fff; }');
    docRef.write('.qr-label { font-size: 10px; font-weight: 900; margin-bottom: 12px; color: #666; letter-spacing: 1px; }');
    docRef.write('.qr-image { width: 180px; height: 180px; border: 8px solid #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }');
    docRef.write('.qr-footer { font-size: 11px; font-weight: 900; margin-top: 12px; }');
    docRef.write('.thankyou { font-size: 18px; font-weight: 900; color: #ef4444; margin: 30px 0 10px 0; }');
    docRef.write('.footer-note { font-size: 9px; font-weight: 600; color: #888; line-height: 1.4; margin-top: 40px; }');
    docRef.write('.system-tag { font-size: 8px; font-weight: 900; color: #ccc; margin-top: 20px; letter-spacing: 1px; }');
    docRef.write('</style></head><body>');
    
    // Process content for QR injection
    const htmlContent = printContent.innerHTML.replace('<div id="qr-marker"></div>', `
      <div class="center qr-container">
        <div class="qr-label">▼ SCAN TO PAY VIA UPI ▼</div>
        <img src="${qrUrl}" class="qr-image" />
        <div class="qr-footer">PAYABLE AMOUNT: ₹${amount}</div>
        <div style="font-size: 8px; color: #999; margin-top: 4px;">UPI ID: ${upiId}</div>
      </div>
    `);
    
    docRef.write(htmlContent);
    docRef.write('</body></html>');
    docRef.close();
    
    setTimeout(() => {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => {
          if (document.body.contains(iframe)) document.body.removeChild(iframe);
        }, 1000);
      }
    }, 800);
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <Clock className="h-12 w-12 text-primary mb-4 animate-pulse" />
        <h2 className="text-xl font-black italic uppercase">No Order ID</h2>
        <p className="text-muted-foreground text-xs mt-2">Please select an order from your history.</p>
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
        <p className="text-muted-foreground text-xs mt-2">The order ID might be invalid or deleted.</p>
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
              <Download className="h-3 w-3" />
              Receipt
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
            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Status ID: #{order.orderDisplayId || orderId.slice(-5).toUpperCase()}</span>
            <div className="font-black text-lg italic uppercase tracking-tighter">
              {isCancelled ? "Order Terminated" : order.status}
            </div>
          </div>
        </div>

        {isCancelled ? (
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 text-center space-y-4 animate-in fade-in zoom-in duration-300">
             <div className="bg-red-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto text-red-500">
                <AlertTriangle className="h-8 w-8" />
             </div>
             <h3 className="font-black text-xl italic uppercase text-gray-800">Payment Void</h3>
             <p className="text-xs text-muted-foreground font-medium leading-relaxed px-4">
               This order was cancelled. If any amount was deducted, it will be refunded within 3-5 business days.
             </p>
             <Button onClick={() => router.push('/menu')} className="w-full h-12 rounded-xl bg-black font-black uppercase italic text-xs tracking-widest shadow-xl">REORDER SOMETHING ELSE</Button>
          </div>
        ) : (
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
               {order.deliveryTip > 0 && (
                 <div className="flex justify-between text-[10px] font-black uppercase text-amber-600">
                    <span>Partner Tip</span>
                    <span>₹{order.deliveryTip.toFixed(2)}</span>
                 </div>
               )}
               <div className="flex justify-between items-center">
                  <span className="text-sm font-black uppercase italic text-gray-500">Net Amount Paid</span>
                  <span className="text-2xl font-black text-primary italic tracking-tighter">₹{order.total?.toFixed(2)}</span>
               </div>
            </div>
          </div>
        </div>

        {!isCancelled && (
           <div className="bg-primary/5 p-6 rounded-[2rem] border-2 border-dashed border-primary/10 flex flex-col items-center text-center gap-3">
              <Printer className="h-8 w-8 text-primary opacity-40" />
              <div>
                 <h4 className="font-black text-sm uppercase italic tracking-tight">Need a digital copy?</h4>
                 <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed mt-1">
                   Download your order receipt for records and reimbursement.
                 </p>
              </div>
              <Button onClick={handlePrintReceipt} variant="outline" className="h-10 rounded-xl border-primary/20 text-primary font-black uppercase text-[10px] tracking-widest px-8 mt-2">
                 GENERATE RECEIPT
              </Button>
           </div>
        )}
      </div>

      {/* HIDDEN RECEIPT TEMPLATE FOR PRINTING */}
      <div className="hidden">
        <div ref={receiptRef}>
           <div className="receipt">
              <div className="center">
                 <div className="header-main">SHOPYKART</div>
                 <div className="header-sub">PREMIUM DELIVERY NETWORK</div>
                 
                 <div className="branding-info">
                   {settings?.receiptHeader || 'ShopyKart Main Branch\nGSTIN: 09ABCDE1234F1Z5'}
                 </div>

                 <div className="order-id-box">
                    ORDER ID: #{order.orderDisplayId || orderId.slice(-5).toUpperCase()}
                 </div>
              </div>
              
              <div className="meta-details">
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: '#666' }}>DATE:</span>
                    <span>{order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'MMM d, yyyy HH:mm') : 'N/A'}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>CUSTOMER:</span>
                    <span>{order.customerName}</span>
                 </div>
              </div>

              <table className="table">
                 <thead>
                    <tr>
                       <th>ITEM DESCRIPTION</th>
                       <th style={{ textAlign: 'center' }}>QTY</th>
                       <th style={{ textAlign: 'right' }}>PRICE</th>
                    </tr>
                 </thead>
                 <tbody>
                    {order.items?.map((item: any, i: number) => (
                       <tr key={i}>
                          <td>{item.name}</td>
                          <td style={{ textAlign: 'center' }}>x{item.quantity}</td>
                          <td style={{ textAlign: 'right' }}>₹{(item.price * item.quantity).toFixed(2)}</td>
                       </tr>
                    ))}
                    {order.deliveryTip > 0 && (
                       <tr>
                          <td>PARTNER APPRECIATION (TIP)</td>
                          <td style={{ textAlign: 'center' }}>-</td>
                          <td style={{ textAlign: 'right' }}>₹{order.deliveryTip.toFixed(2)}</td>
                       </tr>
                    )}
                 </tbody>
              </table>

              {/* QR CODE PLACEHOLDER - INJECTED DYNAMICALLY BY handlePrintReceipt */}
              <div id="qr-marker"></div>

              <div className="total-section">
                 <div className="total-row">
                    <span>GRAND TOTAL</span>
                    <span>₹{order.total?.toFixed(2)}</span>
                 </div>
              </div>

              <div className="center thankyou">
                 {settings?.receiptThankYou || 'ENJOY YOUR DELICIOUS MEAL!'}
              </div>

              <div className="center footer-note">
                 {settings?.receiptFooter || 'Thank you for choosing ShopyKart!\nThis is a computer generated invoice and does not require a physical signature.'}
              </div>

              <div className="center system-tag">
                 E-RECEIPT GENERATED BY SHOPYKART ENGINE v2.0
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
