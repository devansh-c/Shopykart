"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy, serverTimestamp, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { 
  Package, 
  User, 
  MapPin, 
  PhoneCall, 
  Navigation, 
  X, 
  Loader2, 
  Banknote, 
  RotateCcw,
  Crown, 
  Trash2,
  Coins,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Compass,
  Sparkles,
  Clock,
  MessageSquare,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

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
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [selectedOrderForNote, setSelectedOrderForNote] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

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
      updateDoc(doc(firestore, 'orders', id), { 
        status: nextStatus,
        updatedAt: serverTimestamp()
      });
      toast({ title: `Order ${nextStatus}!` });
    }
  };

  const handlePrevStatus = async (id: string, currentStatus: string) => {
    if (!firestore) return;
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex > 0) {
      const prevStatus = STATUS_FLOW[currentIndex - 1];
      updateDoc(doc(firestore, 'orders', id), { 
        status: prevStatus,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Status Reversed", description: `Back to ${prevStatus}` });
    }
  };

  const handleCancelOrder = async (id: string) => {
    if (!firestore) return;
    if (confirm("Are you sure you want to CANCEL this order?")) {
      updateDoc(doc(firestore, 'orders', id), {
        status: 'Cancelled',
        updatedAt: serverTimestamp()
      });
      toast({ title: "Order Cancelled" });
    }
  };

  const handleSaveNote = async () => {
    if (!firestore || !selectedOrderForNote || isSavingNote) return;
    setIsSavingNote(true);
    try {
      await updateDoc(doc(firestore, 'orders', selectedOrderForNote.id), {
        adminNote: adminNote.trim(),
        updatedAt: serverTimestamp()
      });
      setIsNoteOpen(false);
      setAdminNote('');
      setSelectedOrderForNote(null);
      toast({ title: "Note Shared with Customer! 📝" });
    } catch (err) {
      toast({ variant: "destructive", title: "Note Save Failed" });
    } finally {
      setIsSavingNote(false);
    }
  };

  const startNavigation = (order: any) => {
    const lat = order.customerLat;
    const lng = order.customerLng;
    if (lat && lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      toast({ variant: "destructive", title: "Location Missing" });
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
      const upiUrl = `upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${order.total?.toFixed(2)}&cu=INR`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

      const itemsHtml = order.items?.map((item: any) => `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 800;">
            <span style="flex: 2;">${item.name}</span>
            <span style="flex: 0.5; text-align: center;">X${item.quantity}</span>
            <span style="flex: 1; text-align: right;">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
          <div style="font-size: 8px; color: #555; font-weight: 700; margin-top: 2px;">FROM: ${item.restaurantName || 'PARTNER STORE'}</div>
        </div>
      `).join('');

      let taxHtml = '';
      if (order.deliveryFee > 0) taxHtml += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>DELIVERY FEE:</span><span>₹${order.deliveryFee.toFixed(2)}</span></div>`;
      if (order.chargesBreakdown) {
        order.chargesBreakdown.forEach((c: any) => {
          taxHtml += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>${c.name}:</span><span>₹${c.value.toFixed(2)}</span></div>`;
        });
      }
      if (order.isPremiumPacking) taxHtml += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>PREMIUM PACKING:</span><span>₹10.00</span></div>`;
      if (order.deliveryTip > 0) taxHtml += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>DELIVERY TIP:</span><span>₹${order.deliveryTip.toFixed(2)}</span></div>`;
      if (order.redeemCoins) taxHtml += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #16a34a;"><span>COINS REDEEMED:</span><span>- ₹5.00</span></div>`;

      receipt.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="margin: 0; font-size: 38px; font-weight: 900; letter-spacing: -2px; font-style: italic;">SHOPYKART</h1>
          <div style="border-top: 1.5px dashed #000; margin: 15px auto 0; width: 100%;"></div>
        </div>
        <div style="margin-bottom: 25px; line-height: 1.8; font-size: 11px; font-weight: 800;">
          <div style="display: flex; justify-content: space-between;"><span>ORDER NO:</span><span>#${order.customerOrderNumber || '1'}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>TIME:</span><span>${orderDate}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>CUSTOMER:</span><span>${order.customerName}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>ADDRESS:</span><span style="text-align: right; max-width: 200px;">${order.address}</span></div>
        </div>
        <div style="border-top: 1.5px dashed #000; margin-bottom: 15px;"></div>
        <div>${itemsHtml}</div>
        <div style="border-top: 1.5px dashed #000; margin: 15px 0; padding-top: 10px; font-size: 9px;">
          <div style="font-weight: 900; margin-bottom: 5px;">TAX & EXTRA CHARGES:</div>
          ${taxHtml || '<div>NO EXTRA CHARGES</div>'}
        </div>
        <div style="border-top: 2px solid #000; margin: 15px 0;"></div>
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 24px; font-weight: 900; font-style: italic;">
          <span>GRAND TOTAL</span><span>₹${order.total?.toFixed(2)}</span>
        </div>
        <div style="text-align: center; margin-top: 20px;">
          <img src="${qrCodeUrl}" style="width: 150px; height: 150px;" />
          <p style="font-size: 9px; margin-top: 5px;">SCAN TO PAY</p>
        </div>
      `;
      
      document.body.appendChild(receipt);
      const blob = await toBlob(receipt, { pixelRatio: 2 }); 
      document.body.removeChild(receipt);
      
      if (blob && typeof saveAs === 'function') {
        saveAs(blob, `Receipt_${order.customerOrderNumber}.png`);
        toast({ title: "Receipt Saved! ✅" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Download Failed" });
    } finally {
      setIsDownloading(null);
    }
  };

  const getButtonLabel = (status: string) => {
    switch (status) {
      case 'Placed': return 'ACCEPT ORDER';
      case 'Accepted': return 'START PREPARING';
      case 'Preparing': return 'READY FOR PICKUP';
      case 'Ready for Pickup': return 'MARK PICKED UP';
      case 'Picked Up': return 'OUT FOR DELIVERY';
      case 'Out for Delivery': return 'MARK DELIVERED';
      default: return 'UPDATE STATUS';
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-3xl font-black italic uppercase tracking-tighter">ORDER LOGISTICS</h2>
        <Badge variant="outline" className="rounded-full border-primary text-primary font-black uppercase">{orders?.length || 0} TOTAL</Badge>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {orders?.map((order: any) => {
          const isCancelled = order.status === 'Cancelled';
          const isDelivered = order.status === 'Delivered';
          const currentIndex = STATUS_FLOW.indexOf(order.status);
          const hasNext = currentIndex < STATUS_FLOW.length - 1 && !isCancelled;
          const hasPrev = currentIndex > 0 && !isCancelled;

          return (
            <div key={order.id} className={cn(
              "bg-white rounded-[3rem] p-6 border-2 transition-all relative overflow-hidden",
              isCancelled ? "border-red-100 opacity-60" : "border-border shadow-sm hover:shadow-xl"
            )}>
              <div className="flex justify-between items-start mb-8">
                 <div className="flex items-center gap-4">
                    <div className={cn("h-16 w-16 rounded-[1.25rem] flex items-center justify-center border-2 shrink-0", isCancelled ? "bg-red-50 text-red-500" : "bg-primary/5 text-primary")}>
                       <Package className="h-8 w-8" />
                    </div>
                    <div>
                       <h3 className="font-black text-2xl italic uppercase tracking-tighter">ORDER #{order.customerOrderNumber || '...'}</h3>
                       <Badge className={cn("border-none text-[8px] font-black uppercase px-2 py-0.5 rounded-full mt-1", isCancelled ? "bg-red-500 text-white" : "bg-primary text-white animate-pulse")}>{order.status}</Badge>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => generateReceipt(order)} disabled={isDownloading === order.id} className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center text-blue-600 shadow-sm"><FileText className="h-5 w-5" /></button>
                    <button onClick={() => { setSelectedOrderForNote(order); setAdminNote(order.adminNote || ''); setIsNoteOpen(true); }} className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm"><MessageSquare className="h-5 w-5" /></button>
                    {!isCancelled && !isDelivered && (
                      <button onClick={() => handleCancelOrder(order.id)} className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 shadow-sm"><XCircle className="h-5 w-5" /></button>
                    )}
                 </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-[2rem] border border-border shadow-inner mb-6 relative">
                 <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                    {order.redeemCoins && <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[7px] uppercase px-2 py-0.5">COINS REDEEMED</Badge>}
                    {order.isPremiumPacking && <Badge className="bg-primary/10 text-primary border-none font-black text-[7px] uppercase px-2 py-0.5">PREMIUM PACKING</Badge>}
                 </div>

                 <div className="flex items-center gap-4 mb-6">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm border shrink-0"><User className="h-5 w-5" /></div>
                    <div className="min-w-0 pr-20">
                       <span className="font-black text-xl italic uppercase tracking-tighter truncate block">{order.customerName}</span>
                       <span className="text-[9px] font-bold text-gray-400 uppercase">{order.customerPhone}</span>
                    </div>
                 </div>

                 <div className="space-y-3 mb-6">
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-sm font-black italic border-b border-white pb-2 last:border-0">
                         <span className="text-gray-400 truncate"><span className="text-gray-900">{item.quantity}x</span> {item.name}</span>
                         <span className="text-primary shrink-0">₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                    ))}
                 </div>

                 <div className="flex items-start gap-3 pt-3 border-t border-dashed border-gray-300">
                    <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-gray-600 uppercase leading-relaxed tracking-tight">{order.address}</p>
                 </div>
              </div>

              <div className="flex gap-3">
                 <Button onClick={() => handleNextStatus(order.id, order.status)} disabled={isDelivered || isCancelled} className="flex-1 h-16 bg-[#0B0B0B] text-white rounded-2xl font-black uppercase italic shadow-xl">
                    {getButtonLabel(order.status)}
                 </Button>
                 <button onClick={() => startNavigation(order)} className="h-16 w-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-transform"><Compass className="h-7 w-7" /></button>
                 {hasPrev && (
                   <button onClick={() => handlePrevStatus(order.id, order.status)} className="h-16 w-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center border active:scale-90 transition-transform"><RotateCcw className="h-7 w-7" /></button>
                 )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
         <DialogContent className="rounded-[3rem] max-w-sm p-8 border-none shadow-2xl bg-white focus:outline-none">
            <DialogHeader className="mb-4">
               <DialogTitle className="font-black italic uppercase text-center text-xl">Order Memo</DialogTitle>
               <DialogDescription className="text-center text-[10px] font-bold uppercase">Visible to the customer</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
               <Textarea 
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="e.g. Preparing fresh, might take 10 mins more."
                className="min-h-[120px] rounded-2xl bg-gray-50 border-none font-bold p-4 text-xs italic"
               />
               <Button onClick={handleSaveNote} disabled={isSavingNote} className="w-full h-14 bg-black text-white rounded-xl font-black uppercase italic">
                 {isSavingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : 'SHARE NOTE'}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
