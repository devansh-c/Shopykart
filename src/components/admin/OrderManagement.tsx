"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { ShoppingBag, ChevronRight, Clock, Package, User, MapPin, ReceiptText, Sparkles, Store, PhoneCall, Navigation, Compass, Map as MapIcon, ShieldCheck, X, ExternalLink, Printer, Download, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';
import { toJpeg } from 'html-to-image';

const OrderMapViewer = dynamic(() => import('@/components/shared/OrderMapViewer'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-3xl" />
});

const statusOptions = ["Placed", "Accepted", "Preparing", "Ready for Pickup", "Picked Up", "Out for Delivery", "Delivered", "Cancelled"];

export function OrderManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedOrderCoords, setSelectedOrderCoords] = useState<{lat: number, lng: number} | null>(null);
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

  const handleDownload = async (order: any) => {
    const element = document.getElementById(`receipt-temp-${order.id}`);
    if (!element) return;
    setDownloadingId(order.id);
    try {
      const dataUrl = await toJpeg(element, { quality: 0.95, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `Bill_${order.orderDisplayId || order.id.slice(-5)}.jpg`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Saved!" });
    } catch (err) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrint = (orderId: string) => {
    const element = document.getElementById(`receipt-temp-${orderId}`);
    if (!element) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write('<html><body>' + element.innerHTML + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  const generateReceiptDOM = (orderData: any) => {
    const upiUri = `upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${orderData.total.toFixed(2)}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
    return (
      <div className="bg-white text-black p-5 font-mono text-[10px] uppercase w-[280px] border border-gray-100 shadow-xl mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-xl font-black italic tracking-tighter">SHOPYKART</h2>
          <p className="text-[7px] font-bold opacity-60 mb-2">PREMIUM DELIVERY</p>
          <p className="text-[8px] whitespace-pre-line leading-tight">{settings?.receiptHeader || 'MAIN ROAD, MAURANIPUR'}</p>
        </div>
        <div className="border-t border-dashed border-black my-2" />
        <div className="flex justify-between"><span>ID:</span><span className="font-black">#{orderData.orderDisplayId || orderData.id.slice(-5)}</span></div>
        <div className="flex justify-between"><span>CUST:</span><span>{orderData.customerName?.slice(0,15)}</span></div>
        <div className="border-t border-dashed border-black my-2" />
        <table className="w-full text-[9px]">
          <tbody>
            {orderData.items?.map((item: any, i: number) => (
              <tr key={i}><td width="70%" className="py-1 font-black">{item.name}</td><td className="text-center">X{item.quantity}</td><td className="text-right">{(item.price * item.quantity).toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="border-t-2 border-black mt-2 pt-2 flex justify-between font-black text-sm italic"><span>TOTAL</span><span>₹{orderData.total?.toFixed(2)}</span></div>
        <div className="border-t border-dashed border-black my-3" />
        <div className="border border-dashed border-black p-2 text-center mb-4">
           <p className="text-[6px] font-black mb-1">PAYMENT QR</p>
           <img src={qrUrl} className="w-24 h-24 mx-auto grayscale" alt="QR" />
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

      <div className="grid grid-cols-1 gap-6">
        {orders?.map((order) => (
          <div key={order.id} className="bg-white p-6 rounded-[2.5rem] border border-border/50 hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="flex flex-col lg:flex-row justify-between gap-6">
              <div className="flex-1 flex items-start space-x-5">
                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0", order.status === 'Delivered' ? 'bg-green-50 text-green-600' : 'bg-primary/5 text-primary')}>
                  <Package className="h-7 w-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-black text-lg italic uppercase">#{order.orderDisplayId || order.id.slice(-5)}</h3>
                    <Badge className={cn("text-[8px] font-black uppercase rounded-full border-none px-2", order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary')}>{order.status}</Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-4"><Clock className="h-3 w-3" />{isMounted && order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Now'}</div>
                  
                  <div className="bg-muted/20 rounded-2xl p-4 space-y-3 mb-4">
                     <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                        <span className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-primary" />{order.customerName}</span>
                        <div className="flex gap-2">
                           <button onClick={() => window.open(`tel:${order.customerPhone}`)} className="p-2 bg-green-500 text-white rounded-lg"><PhoneCall className="h-3.5 w-3.5" /></button>
                           <button onClick={() => handleStatusUpdate(order.id, 'Cancelled')} className="p-2 bg-red-50 text-red-500 rounded-lg"><X className="h-3.5 w-3.5" /></button>
                        </div>
                     </div>
                     <div className="flex items-start gap-2 text-[10px] text-gray-500"><MapPin className="h-3.5 w-3.5 text-primary shrink-0" /><span className="truncate">{order.address}</span></div>
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
                      <Button variant="outline" className="flex-1 rounded-xl h-10 border-primary/20 text-primary font-black text-[9px] uppercase"><Eye className="h-3.5 w-3.5 mr-1" /> VIEW BILL</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[340px] rounded-[2.5rem] p-4 bg-white">
                       <DialogHeader className="sr-only">
                         <DialogTitle>Order Bill View</DialogTitle>
                       </DialogHeader>
                       <div className="scale-[1.05] origin-top">{generateReceiptDOM(order)}</div>
                       <div className="flex gap-2 mt-4">
                          <Button onClick={() => handlePrint(order.id)} className="flex-1 bg-black text-white rounded-xl h-12 font-black text-[10px]"><Printer className="h-4 w-4 mr-2" /> PRINT</Button>
                          <Button onClick={() => handleDownload(order)} disabled={downloadingId === order.id} className="flex-1 bg-primary text-white rounded-xl h-12 font-black text-[10px]">{downloadingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} SAVE</Button>
                       </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
            
            {/* Hidden template for capture */}
            <div id={`receipt-temp-${order.id}`} className="hidden">{generateReceiptDOM(order)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
