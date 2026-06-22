
"use client"

import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { 
  ShoppingBag, 
  ChevronRight, 
  Clock, 
  Package, 
  User, 
  MapPin, 
  ReceiptText, 
  Sparkles, 
  Store, 
  PhoneCall, 
  Navigation, 
  Compass, 
  Map as MapIcon, 
  ShieldCheck, 
  X, 
  ExternalLink, 
  Printer, 
  Download, 
  Eye, 
  Loader2, 
  ListPlus, 
  CreditCard, 
  Banknote,
  Copy,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const statusOptions = ["Placed", "Accepted", "Preparing", "Ready for Pickup", "Picked Up", "Out for Delivery", "Delivered", "Cancelled"];

export default function OrderManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: orders, loading } = useCollection<any>(ordersQuery);

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  const handleStatusUpdate = async (id: string, status: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'orders', id), { status });
    toast({ title: "Status Updated", description: `Order #${id.slice(-4)} is now ${status}.` });
  };

  const handleOpenGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const handleCopyUTR = (utr: string) => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(utr);
      toast({ title: "UTR Copied! ✅", description: "Ready to verify in bank app." });
    }
  };

  const handleDownload = async (order: any) => {
    const element = document.getElementById(`receipt-content-${order.id}`);
    if (!element) return;
    setDownloadingId(order.id);
    try {
      const { toJpeg } = await import('html-to-image');
      const { saveAs } = await import('file-saver');
      const dataUrl = await toJpeg(element, { quality: 0.95, backgroundColor: '#ffffff', pixelRatio: 2 });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      saveAs(blob, `ShopyKart_Admin_Bill_${order.orderDisplayId || order.id.slice(-5)}.jpg`);
      toast({ title: "Saved!" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrint = (orderId: string) => {
    const element = document.getElementById(`receipt-content-${orderId}`);
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

  const generateReceiptDOM = (orderData: any) => {
    const upiUri = `upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${orderData.total.toFixed(2)}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
    const subtotal = orderData.subtotal || orderData.items?.reduce((acc:any, it:any) => acc + (it.price * it.quantity), 0) || 0;
    const dateStr = orderData.createdAt?.seconds ? format(new Date(orderData.createdAt.seconds * 1000), 'dd/MM/yy HH:mm') : '--';
    
    return (
      <div id={`receipt-content-${orderData.id}`} className="bg-white text-black p-5 font-mono text-[10px] uppercase leading-tight w-[280px] mx-auto border border-gray-100">
        <div className="text-center mb-4">
          <h2 className="text-xl font-black italic tracking-tighter leading-none">SHOPYKART</h2>
          <p className="text-[7px] font-bold opacity-60 mb-2">PREMIUM DELIVERY NETWORK</p>
          <p className="text-[8px] whitespace-pre-line leading-tight mt-2">{settings?.receiptHeader || 'MAIN ROAD, MAURANIPUR'}</p>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="space-y-1">
          <div className="flex justify-between"><span>ORDER ID:</span><span className="font-black">#{orderData.orderDisplayId || orderData.id.slice(-5)}</span></div>
          <div className="flex justify-between"><span>DATE:</span><span>{dateStr}</span></div>
          <div className="flex justify-between"><span>CUSTOMER:</span><span>{orderData.customerName?.slice(0,18)}</span></div>
          <div className="flex justify-between border-t border-dashed border-black/10 pt-1 mt-1">
            <span className="shrink-0">PAYMENT:</span>
            <span className="font-black text-right">{orderData.paymentMethod === 'online' ? 'PREPAID ONLINE' : 'CASH ON DELIVERY'}</span>
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
              <tr key={i}><td className="py-2 pr-1 font-black leading-tight">{item.name}</td><td className="text-center">X{item.quantity}</td><td className="text-right">{(item.price * item.quantity).toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
        
        <div className="border-t border-dashed border-black my-2 pt-2 space-y-1">
           <div className="flex justify-between"><span>SUBTOTAL:</span><span className="font-black">₹{subtotal.toFixed(2)}</span></div>
           {orderData.charges?.map((c: any, i: number) => (
             <div key={i} className="flex justify-between"><span>{c.name}:</span><span className="font-black">₹{c.amount.toFixed(2)}</span></div>
           ))}
           {orderData.couponDiscount > 0 && <div className="flex justify-between"><span>COUPON:</span><span className="font-black">-₹{orderData.couponDiscount.toFixed(2)}</span></div>}
           {orderData.coinDiscount > 0 && <div className="flex justify-between"><span>COINS:</span><span className="font-black">-₹{orderData.coinDiscount.toFixed(2)}</span></div>}
           {orderData.deliveryTip > 0 && <div className="flex justify-between"><span>TIP:</span><span className="font-black">₹{orderData.deliveryTip.toFixed(2)}</span></div>}
        </div>

        <div className="border-t-2 border-black mt-2 pt-2 flex justify-between font-black text-sm italic"><span>GRAND TOTAL</span><span>₹{orderData.total?.toFixed(2)}</span></div>
        <div className="border-t border-dashed border-black my-3" />
        <div className="border border-dashed border-black p-3 text-center mb-3">
           <p className="text-[7px] font-black tracking-widest mb-1">PAYMENT QR</p>
           <img src={qrUrl} className="w-24 h-24 mx-auto grayscale" alt="QR" />
           <p className="text-[8px] font-black mt-1">PAYABLE: ₹{orderData.total?.toFixed(2)}</p>
        </div>
        <div className="text-center text-[7px] font-black tracking-widest opacity-60">POWERED BY SHOPYKART POS</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div><h2 className="text-xl font-black italic uppercase">Order Operations</h2><p className="text-xs text-muted-foreground font-bold">Real-time order dashboard</p></div>
        <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase text-[10px] px-3">{orders?.length || 0} TOTAL</Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 pb-20">
        {orders?.map((order: any) => {
          const storeNames = Array.from(new Set(order.items?.map((i: any) => i.restaurantName).filter(Boolean)));
          if (storeNames.length === 0 && order.restaurantName) {
            storeNames.push(order.restaurantName);
          }
          if (storeNames.length === 0) storeNames.push('ShopyKart Select');

          const isPrepaid = order.paymentMethod === 'online';
          const needsVerification = isPrepaid && order.paymentStatus === 'UTR_Pending_Verification';

          return (
            <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border border-border/50 hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex-1 flex items-start space-x-5">
                  <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0", order.status === 'Delivered' ? 'bg-green-50 text-green-600' : 'bg-primary/5 text-primary')}>
                    <Package className="h-7 w-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <h3 className="font-black text-lg italic uppercase">#{order.orderDisplayId || order.id.slice(-5)}</h3>
                      <Badge className={cn("text-[8px] font-black uppercase rounded-full border-none px-2", order.status === 'Delivered' ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary")}>{order.status}</Badge>
                      <Badge className={cn(
                        "text-[8px] font-black uppercase rounded-full px-2 py-1 flex items-center gap-1",
                        isPrepaid ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                      )}>
                        {isPrepaid ? <CreditCard className="h-2 w-2" /> : <Banknote className="h-2 w-2" />}
                        {isPrepaid ? "PREPAID" : "CASH ON DELIVERY"}
                      </Badge>
                      {needsVerification && (
                        <Badge className="bg-red-50 text-red-600 border border-red-100 text-[8px] font-black uppercase px-2 animate-pulse">
                          <ShieldAlert className="h-2 w-2 mr-1" /> UTR PENDING
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-4"><Clock className="h-3 w-3" />{isMounted && order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Now'}</div>
                    
                    {/* PREPAID UTR BOX */}
                    {isPrepaid && order.utrNumber && (
                      <div className="mb-4 bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between group/utr hover:bg-blue-50 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Transaction ID (UTR)</span>
                          <span className="text-sm font-black text-blue-800 tracking-[0.15em] italic">{order.utrNumber}</span>
                        </div>
                        <button 
                          onClick={() => handleCopyUTR(order.utrNumber)}
                          className="h-10 w-10 bg-white border border-blue-200 rounded-xl flex items-center justify-center text-blue-600 shadow-sm active:scale-90 transition-all hover:bg-blue-600 hover:text-white"
                          title="Copy UTR"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    <div className="bg-muted/20 rounded-2xl p-4 space-y-3 mb-4 border border-border/30">
                       <div className="flex items-center justify-between text-xs font-bold text-gray-700 border-b border-white pb-2 mb-1">
                          <span className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-primary" />{order.customerName}</span>
                          <div className="flex gap-2">
                             <button onClick={() => window.open(`tel:${order.customerPhone}`)} className="p-2.5 bg-green-500 text-white rounded-xl shadow-lg shadow-green-500/20 active:scale-90 transition-all"><PhoneCall className="h-3.5 w-3.5" /></button>
                             {order.latitude && order.longitude && (
                                <button 
                                  onClick={() => handleOpenGoogleMaps(Number(order.latitude), Number(order.longitude))} 
                                  className="p-2.5 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-200 active:scale-90 transition-all flex items-center gap-2"
                                  title="Open in Google Maps"
                                >
                                  <Navigation className="h-3.5 w-3.5" />
                                  <span className="text-[8px] font-black uppercase">Open Maps</span>
                                </button>
                             )}
                          </div>
                       </div>
                       
                       <div className="pt-1 space-y-3">
                          <div className="flex flex-wrap gap-1.5">
                             {storeNames.map((name: any, idx) => (
                               <Badge key={idx} variant="secondary" className="bg-primary/5 text-primary text-[7px] font-black border-primary/10 uppercase tracking-widest">
                                  <Store className="h-2 w-2 mr-1" /> {name}
                                </Badge>
                             ))}
                          </div>
                          <div className="space-y-1 bg-white/50 p-2 rounded-xl border border-white">
                             {order.items?.map((item: any, i: number) => (
                               <div key={i} className="flex justify-between text-[10px] font-bold text-gray-600 italic leading-tight">
                                  <span className="flex-1 truncate mr-2">{item.quantity}x {item.name}</span>
                                  <span className="shrink-0 text-primary">₹{item.price * item.quantity}</span>
                               </div>
                             ))}
                          </div>
                       </div>

                       <div className="flex items-start gap-2 text-[10px] text-gray-500 pt-2 border-t border-white"><MapPin className="h-3.5 w-3.5 text-primary shrink-0" /><span className="truncate">{order.address}</span></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Select defaultValue={order.status} onValueChange={(val) => handleStatusUpdate(order.id, val)}>
                    <SelectTrigger className="w-[180px] rounded-xl font-black text-[10px] uppercase h-11 bg-muted/30 border-none shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">{statusOptions.map(s => <SelectItem key={s} value={s} className="font-bold text-xs">{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="flex-1 bg-white border-2 border-primary/20 text-primary h-11 rounded-xl font-black text-[9px] uppercase active:scale-95 transition-all flex items-center justify-center gap-1.5"><Eye className="h-3.5 w-3.5" /> View Bill</button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[340px] rounded-[2.5rem] p-0 overflow-hidden bg-white flex flex-col max-h-[85vh] z-[11000]">
                         <DialogHeader className="sr-only">
                           <DialogTitle>Order Bill View</DialogTitle>
                         </DialogHeader>
                         <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col items-center">
                            <div className="w-full scale-[1.05] origin-top mb-4">
                              {generateReceiptDOM(order)}
                            </div>
                         </div>
                         <div className="p-4 bg-gray-50 border-t flex gap-3 shrink-0">
                            <Button onClick={() => handlePrint(order.id)} className="flex-1 bg-black text-white h-12 rounded-xl font-black uppercase text-[10px] shadow-lg">
                              <Printer className="h-4 w-4 mr-2" /> PRINT
                            </Button>
                            <Button onClick={() => handleDownload(order)} disabled={downloadingId === order.id} className="flex-1 bg-primary text-white h-12 rounded-xl font-black uppercase text-[10px] shadow-lg">
                              {downloadingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} SAVE
                            </Button>
                         </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
