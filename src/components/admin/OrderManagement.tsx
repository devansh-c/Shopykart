"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import { 
  Package, 
  User, 
  MapPin, 
  PhoneCall, 
  XCircle, 
  Loader2, 
  FileText,
  Clock,
  IndianRupee,
  Phone,
  MessageSquare,
  ListTree
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';

const STATUS_FLOW = [
  "Placed", 
  "Accepted", 
  "Preparing", 
  "Ready for Pickup", 
  "Picked Up", 
  "Out for Delivery", 
  "Delivered"
];

export default function OrderManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
  }, [firestore]);
  const { data: orders, loading } = useCollection<any>(ordersQuery);

  const handleNextStatus = async (id: string, currentStatus: string) => {
    if (!firestore) return;
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex < STATUS_FLOW.length - 1) {
      const nextStatus = STATUS_FLOW[currentIndex + 1];
      await updateDoc(doc(firestore, 'orders', id), { 
        status: nextStatus,
        updatedAt: serverTimestamp()
      });
      toast({ title: `Order ${nextStatus}!` });
    }
  };

  const handleCancelOrder = async (id: string) => {
    if (!firestore) return;
    if (confirm("Are you sure?")) {
      await updateDoc(doc(firestore, 'orders', id), { status: 'Cancelled', updatedAt: serverTimestamp() });
      toast({ title: "Order Cancelled" });
    }
  };

  const generateReceipt = async (order: any) => {
    setIsDownloading(order.id);
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
      
      const itemsHtml = order.items?.map((item: any) => `
        <div style="margin-bottom: 12px; border-bottom: 1px dashed #eee; padding-bottom: 5px;">
          <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 900;">
            <span style="flex: 2;">${item.name}</span>
            <span style="flex: 0.5; text-align: center;">X${item.quantity}</span>
            <span style="flex: 1; text-align: right;">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
          ${item.selectedOption ? `<div style="font-size: 9px; color: #EF4444; font-weight: 900; margin-top: 2px;">VARIETY: ${item.selectedOption.name}</div>` : ''}
        </div>
      `).join('');

      const upiUrl = `upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${order.total?.toFixed(2)}&cu=INR`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

      receipt.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="margin: 0; font-size: 38px; font-weight: 900; font-style: italic;">SHOPYKART</h1>
          <p style="margin: 2px 0; font-size: 10px; font-weight: 900; letter-spacing: 2px;">PREMIUM DELIVERY</p>
          <div style="border-top: 2px dashed #000; margin: 15px 0;"></div>
        </div>
        <div style="margin-bottom: 25px; font-size: 11px; font-weight: 800;">
          <div style="display: flex; justify-content: space-between;"><span>ORDER:</span><span>#${order.customerOrderNumber}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>DATE:</span><span>${orderDate}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>USER:</span><span>${order.customerName}</span></div>
        </div>
        <div>${itemsHtml}</div>
        <div style="border-top: 2px solid #000; margin: 20px 0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 24px; font-weight: 900; font-style: italic;">
          <span>TOTAL</span><span>₹${order.total?.toFixed(2)}</span>
        </div>
        <div style="text-align: center; margin: 30px 0; padding: 20px; border: 2px dashed #000; border-radius: 25px;">
           <p style="font-size: 10px; font-weight: 900; margin-bottom: 15px;">SCAN TO PAY EXACT AMOUNT</p>
           <img src="${qrUrl}" style="width: 180px; height: 180px; margin: 0 auto; display: block;" />
           <p style="font-size: 9px; font-weight: 900; margin-top: 15px;">9450355709@axl</p>
        </div>
        <div style="text-align: center; font-size: 10px; font-weight: 900; margin-top: 40px; border: 2px solid #000; padding: 10px;">POWERED BY SHOPYKART</div>
      `;
      
      document.body.appendChild(receipt);
      const blob = await toBlob(receipt, { pixelRatio: 2 }); 
      document.body.removeChild(receipt);
      
      if (blob && typeof saveAs === 'function') {
        saveAs(blob, `Bill_${order.customerOrderNumber}.png`);
        toast({ title: "Receipt Saved!" });
      }
    } catch (err) { toast({ variant: "destructive", title: "Failed" }); }
    finally { setIsDownloading(null); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 pb-32">
      <div className="grid grid-cols-1 gap-6">
        {orders?.map((order: any) => (
          <div key={order.id} className="bg-white rounded-[2.5rem] p-6 border-2 border-border shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border-2 border-primary/10"><Package className="h-7 w-7" /></div>
                  <div>
                    <h3 className="font-black text-xl italic uppercase tracking-tighter">Order #{order.customerOrderNumber}</h3>
                    <Badge className="bg-primary text-white text-[8px] uppercase font-black px-2 mt-1">{order.status}</Badge>
                  </div>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => generateReceipt(order)} disabled={isDownloading === order.id} className="h-11 w-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center active:scale-90 transition-all"><FileText className="h-5 w-5" /></button>
                  <button onClick={() => window.open(`tel:${order.customerPhone}`)} className="h-11 w-11 bg-green-500 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all"><PhoneCall className="h-5 w-5" /></button>
                  {order.status === 'Placed' && <button onClick={() => handleCancelOrder(order.id)} className="h-11 w-11 bg-red-50 text-red-500 rounded-xl flex items-center justify-center active:scale-90 transition-all"><XCircle className="h-5 w-5" /></button>}
               </div>
            </div>

            <div className="bg-muted/30 rounded-[2rem] p-5 mb-6 space-y-4">
               <div className="flex items-center gap-3 border-b border-white pb-3 mb-1">
                  <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm text-primary"><User className="h-4 w-4" /></div>
                  <span className="text-sm font-black uppercase italic truncate">{order.customerName}</span>
               </div>
               <div className="space-y-3">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex flex-col gap-1 border-b border-white/50 pb-2 last:border-0">
                       <div className="flex justify-between text-xs font-black italic">
                          <span>{item.quantity}x {item.name}</span>
                          <span>₹{(item.price * item.quantity).toFixed(0)}</span>
                       </div>
                       {item.selectedOption && (
                         <div className="flex items-center gap-1.5 text-primary">
                            <ListTree className="h-3 w-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest bg-white px-2 py-0.5 rounded shadow-inner">VARIETY: {item.selectedOption.name}</span>
                         </div>
                       )}
                    </div>
                  ))}
               </div>
               <div className="flex justify-between items-center pt-2 font-black italic text-lg text-gray-900">
                  <span>Grand Total</span>
                  <span>₹{order.total?.toFixed(0)}</span>
               </div>
            </div>

            <div className="flex gap-2">
               <Button onClick={() => handleNextStatus(order.id, order.status)} disabled={['Delivered', 'Cancelled'].includes(order.status)} className="flex-1 h-14 bg-black hover:bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl">NEXT STATUS</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
