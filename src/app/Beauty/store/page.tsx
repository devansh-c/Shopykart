
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  LogOut,
  LayoutDashboard,
  Layers,
  CircleDollarSign,
  UserCircle2,
  Edit,
  ImageIcon,
  BellRing,
  Clock,
  Camera,
  History,
  Wallet,
  Store,
  XCircle,
  X,
  Loader2,
  ListPlus,
  Sparkles,
  ShieldCheck,
  Calendar,
  Tag,
  FileText,
  Printer,
  Download,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { compressImage } from '@/lib/image-utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { toJpeg } from 'html-to-image';
import { saveAs } from 'file-saver';

type MainTab = 'orders' | 'catalog' | 'payouts' | 'account';
type OrderFilter = 'NEW ORDERS' | 'DELIVERED' | 'CANCELLED';

export default function BeautyDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('NEW ORDERS');
  const [isMounted, setIsMounted] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile } = useDoc<any>(vendorRef);

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'orders'), where('vendorId', '==', user.uid));
  }, [firestore, user]);
  
  const { data: rawOrders } = useCollection<any>(ordersQuery);

  const orders = useMemo(() => {
    if (!rawOrders) return [];
    return [...rawOrders].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [rawOrders]);

  const handleDownload = async (order: any) => {
    const element = document.getElementById(`receipt-content-${order.id}`);
    if (!element) return;
    setDownloadingId(order.id);
    try {
      const dataUrl = await toJpeg(element, { quality: 0.95, backgroundColor: '#ffffff', pixelRatio: 2 });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      saveAs(blob, `Beauty_Bill_${order.orderDisplayId || order.id.slice(-5)}.jpg`);
      toast({ title: "Saved!" });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
    finally { setDownloadingId(null); }
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
      <div id={`receipt-content-${orderData.id}`} className="bg-white text-black p-5 font-mono text-[10px] uppercase leading-tight w-[280px] border shadow-none mx-auto">
        <div className="text-center mb-3">
          <h2 className="text-xl font-black italic tracking-tighter">SHOPYKART</h2>
          <p className="text-[7px] font-bold opacity-60 mb-1 uppercase">BEAUTY & COSMETICS</p>
          <p className="text-[8px] whitespace-pre-line leading-tight">{settings?.receiptHeader || vendorProfile?.storeName}</p>
        </div>
        <div className="border-t border-dashed border-black my-2" />
        <div className="space-y-0.5">
          <div className="flex justify-between"><span>ORDER ID:</span><span className="font-black">#{orderData.orderDisplayId || orderData.id.slice(-5)}</span></div>
          <div className="flex justify-between"><span>DATE:</span><span>{dateStr}</span></div>
          <div className="flex justify-between"><span>CUSTOMER:</span><span>{orderData.customerName?.slice(0,18)}</span></div>
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
           {orderData.couponDiscount > 0 && <div className="flex justify-between"><span>DISCOUNT:</span><span className="font-black">-₹{orderData.couponDiscount.toFixed(2)}</span></div>}
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
        <div className="text-center text-[7px] font-black opacity-60">POWERED BY SHOPYKART POS</div>
      </div>
    );
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative">
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b sticky top-0 z-50">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
              {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <Sparkles className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-sm font-black italic uppercase">{vendorProfile?.storeName || 'Beauty Hub'}</h1>
              <div className="flex items-center gap-1.5"><div className={cn("h-1.5 w-1.5 rounded-full", vendorProfile?.isOnline !== false ? "bg-green-500 animate-pulse" : "bg-red-500")} /><p className="text-[8px] font-bold text-muted-foreground uppercase">{vendorProfile?.isOnline !== false ? 'Accepting' : 'Closed'}</p></div>
            </div>
         </div>
         <Button variant="ghost" onClick={() => { localStorage.removeItem('shopykart_session_active'); signOut(auth!); }} className="text-red-500 h-10 w-10 p-0 rounded-xl bg-red-50"><LogOut className="h-4 w-4" /></Button>
      </header>

      <main className="flex-1 pb-32 overflow-y-auto no-scrollbar">
         {activeMainTab === 'orders' ? (
           <div className="p-4 space-y-4 animate-in fade-in duration-500">
              <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-4 border border-border/50">
                {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-rose-600 text-white" : "text-gray-400")}>{f}</button>
                ))}
              </div>
              {orders?.filter(o => {
                if(orderFilter === 'NEW ORDERS') return !['Delivered', 'Cancelled'].includes(o.status);
                if(orderFilter === 'CANCELLED') return o.status === 'Cancelled';
                return o.status === 'Delivered';
              }).map(o => (
                <div key={o.id} className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm relative overflow-hidden group">
                   <div className="flex justify-between items-center mb-4">
                      <div><span className="text-lg font-black italic tracking-tighter">#{o.orderDisplayId || o.id.slice(-4)}</span><div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase mt-0.5"><Clock className="h-2.5 w-2.5" />{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'MMM d, h:mm a')}</div></div>
                      <Badge className={cn("border-none text-[8px] font-black rounded-full px-2.5 py-1 uppercase", o.status === 'Cancelled' ? "bg-red-50 text-red-600" : o.status === 'Delivered' ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose-600")}>{o.status}</Badge>
                   </div>
                   <div className="bg-muted/30 rounded-2xl p-4 mb-4 space-y-2">
                      {o.items?.map((item:any, i:number) => (<div key={i} className="flex justify-between items-center text-xs font-bold"><span className="text-gray-700">{item.quantity}x {item.name}</span><span className="text-rose-600">₹{(item.price * item.quantity).toFixed(2)}</span></div>))}
                   </div>
                   
                   <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="flex-1 bg-white border-2 border-rose-200 text-rose-600 h-11 rounded-xl font-black text-[9px] uppercase active:scale-95 transition-all flex items-center justify-center gap-1.5"><Eye className="h-3.5 w-3.5" /> View Bill</button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[2.5rem] max-w-[340px] p-0 overflow-hidden bg-white flex flex-col max-h-[85vh] z-[11000]">
                          <DialogHeader className="sr-only">
                            <DialogTitle>Order Bill Details</DialogTitle>
                          </DialogHeader>
                          <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col items-center">
                            <div className="scale-[1.05] origin-top mb-4">{generateReceiptDOM(o)}</div>
                          </div>
                          <div className="p-4 bg-rose-50 border-t flex gap-2 shrink-0">
                             <Button onClick={() => handlePrint(o.id)} className="flex-1 bg-black h-12 rounded-xl text-white font-black text-[10px] uppercase shadow-lg"><Printer className="h-4 w-4 mr-2" /> PRINT</Button>
                             <Button onClick={() => handleDownload(o)} disabled={downloadingId === o.id} className="flex-1 bg-rose-600 h-12 rounded-xl text-white font-black text-[10px] uppercase shadow-lg">
                               {downloadingId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} SAVE
                             </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                   </div>
                </div>
              ))}
           </div>
         ) : null}
      </main>
    </div>
  );
}
