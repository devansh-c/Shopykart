"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
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
  ListTree,
  CalendarDays,
  StickyNote,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

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
  
  // Note States
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteOrderId, setNoteOrderId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
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
      await updateDoc(doc(firestore, 'orders', id), { 
        status: nextStatus,
        updatedAt: serverTimestamp()
      });
      toast({ title: `Order ${nextStatus}!` });
    }
  };

  const handleCancelOrder = async (id: string) => {
    if (!firestore) return;
    if (confirm("🚨 WARNING: Are you sure you want to CANCEL this order?")) {
      await updateDoc(doc(firestore, 'orders', id), { 
        status: 'Cancelled', 
        updatedAt: serverTimestamp() 
      });
      toast({ title: "Order Cancelled" });
    }
  };

  const handleSaveNote = async () => {
    if (!firestore || !noteOrderId || isSavingNote) return;
    setIsSavingNote(true);
    try {
      await updateDoc(doc(firestore, 'orders', noteOrderId), {
        adminNote: noteText.trim().toUpperCase(),
        noteUpdatedAt: serverTimestamp()
      });
      setIsNoteOpen(false);
      setNoteText('');
      setNoteOrderId(null);
      toast({ title: "Note Updated!", description: "Customer can now see this on their tracking page." });
    } catch (err) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSavingNote(false);
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
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 900;">
            <span style="flex: 2;">${item.name}</span>
            <span style="flex: 0.5; text-align: center;">X${item.quantity}</span>
            <span style="flex: 1; text-align: right;">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
          ${item.selectedOption ? `<div style="font-size: 9px; color: #EF4444; font-weight: 900; margin-top: 2px;">VARIETY: ${item.selectedOption.name}</div>` : ''}
          ${item.instructions ? `<div style="font-size: 8px; color: #555; font-weight: 700; margin-top: 2px; font-style: italic;">NOTE: ${item.instructions}</div>` : ''}
        </div>
      `).join('');

      let taxHtml = '';
      if (order.deliveryFee > 0) {
        taxHtml += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>DELIVERY FEE:</span><span>₹${order.deliveryFee.toFixed(2)}</span></div>`;
      }
      if (order.packingFee > 0) {
        taxHtml += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>SAFETY PACK:</span><span>₹${order.packingFee.toFixed(2)}</span></div>`;
      }
      if (order.coinDiscount > 0) {
        taxHtml += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #16a34a;"><span>COIN REWARD:</span><span>- ₹${order.coinDiscount.toFixed(2)}</span></div>`;
      }
      if (order.couponDiscount > 0) {
        taxHtml += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #4f46e5;"><span>PROMO DISCOUNT:</span><span>- ₹${order.couponDiscount.toFixed(2)}</span></div>`;
      }

      const upiUrl = `upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${order.total?.toFixed(2)}&cu=INR`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

      receipt.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="margin: 0; font-size: 38px; font-weight: 900; font-style: italic; letter-spacing: -2px;">SHOPYKART</h1>
          <p style="margin: 2px 0; font-size: 10px; font-weight: 900; letter-spacing: 2px;">PREMIUM DELIVERY NETWORK</p>
          <div style="border-top: 2px dashed #000; margin: 15px 0;"></div>
        </div>
        <div style="margin-bottom: 25px; font-size: 11px; font-weight: 800; line-height: 1.6;">
          <div style="display: flex; justify-content: space-between;"><span>BILL NO:</span><span>#${order.customerOrderNumber || 'N/A'}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>DATE:</span><span>${orderDate}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>CUSTOMER:</span><span>${order.customerName}</span></div>
          <div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
            <div style="font-weight: 900; margin-bottom: 4px;">DELIVERY ADDRESS:</div>
            <div style="font-size: 10px; color: #333; line-height: 1.4; text-transform: uppercase;">${order.address}</div>
          </div>
        </div>
        <div>${itemsHtml}</div>
        
        ${order.deliveryInstructions ? `
        <div style="margin-top: 15px; background: #fffbeb; padding: 10px; border: 1px solid #fef3c7; border-radius: 8px;">
          <div style="font-size: 9px; font-weight: 900; margin-bottom: 4px; color: #92400e;">CUSTOMER NOTE:</div>
          <div style="font-size: 10px; font-weight: 700; color: #000;">"${order.deliveryInstructions}"</div>
        </div>
        ` : ''}

        <div style="margin-top: 15px; font-size: 10px; font-weight: 700;">
          ${taxHtml}
        </div>
        <div style="border-top: 2px solid #000; margin: 20px 0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 26px; font-weight: 900; font-style: italic;">
          <span>TOTAL</span><span>₹${order.total?.toFixed(2)}</span>
        </div>
        <div style="text-align: center; margin: 30px 0; padding: 20px; border: 2px dashed #000; border-radius: 25px; background: #fafafa;">
           <p style="font-size: 9px; font-weight: 900; margin-bottom: 15px;">SCAN TO PAY EXACT AMOUNT</p>
           <img src="${qrUrl}" style="width: 180px; height: 180px; margin: 0 auto; display: block;" />
           <p style="font-size: 8px; font-weight: 900; margin-top: 15px;">ID: 9450355709@axl</p>
        </div>
        <div style="text-align: center; font-size: 10px; font-weight: 900; margin-top: 40px; border: 2px solid #000; padding: 10px;">POWERED BY SHOPYKART POS</div>
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
                    <h3 className="font-black text-xl italic uppercase tracking-tighter leading-none mb-1">Order #{order.customerOrderNumber}</h3>
                    <div className="flex items-center gap-2">
                       <Badge className="bg-primary text-white text-[8px] uppercase font-black px-2 py-0.5">{order.status}</Badge>
                       <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-[10px] font-black text-gray-600 italic">
                             {isMounted && order.createdAt ? format(new Date(order.createdAt.seconds * 1000 || order.createdAt), 'hh:mm a') : '--:--'}
                          </span>
                       </div>
                    </div>
                  </div>
               </div>
               <div className="flex gap-2">
                  {/* ADD NOTE BUTTON */}
                  <button 
                    onClick={() => { setNoteOrderId(order.id); setNoteText(order.adminNote || ''); setIsNoteOpen(true); }} 
                    className="h-11 w-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-amber-100"
                    title="Add Update Note"
                  >
                    <StickyNote className="h-5 w-5" />
                  </button>

                  <button onClick={() => generateReceipt(order)} disabled={isDownloading === order.id} title="Generate Receipt" className="h-11 w-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-blue-100">
                    {isDownloading === order.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                  </button>
                  <button onClick={() => window.open(`tel:${order.customerPhone}`)} className="h-11 w-11 bg-green-500 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-green-100"><PhoneCall className="h-5 w-5" /></button>
                  
                  {/* ALWAYS VISIBLE CANCEL BUTTON FOR ADMIN */}
                  <button 
                    onClick={() => handleCancelOrder(order.id)} 
                    className="h-11 w-11 bg-red-50 text-red-500 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-red-100"
                    title="Cancel Order"
                  >
                    <XCircle className="h-5 w-5" />
                  </button>
               </div>
            </div>

            <div className="bg-muted/30 rounded-[2rem] p-5 mb-6 space-y-4">
               <div className="flex items-center justify-between border-b border-white pb-3 mb-1">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm text-primary"><User className="h-4 w-4" /></div>
                    <span className="text-sm font-black uppercase italic truncate max-w-[150px]">{order.customerName}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                     <CalendarDays className="h-3 w-3" />
                     {isMounted && order.createdAt ? format(new Date(order.createdAt.seconds * 1000 || order.createdAt), 'MMM d, yyyy') : 'N/A'}
                  </div>
               </div>

               {/* ADMIN NOTE DISPLAY (If exists) */}
               {order.adminNote && (
                 <div className="bg-amber-100 border-2 border-amber-400 p-4 rounded-2xl animate-in zoom-in duration-300">
                    <div className="flex items-center gap-2 text-amber-700 mb-1">
                       <MessageSquare className="h-3.5 w-3.5" />
                       <span className="text-[8px] font-black uppercase tracking-widest">Live Admin Note</span>
                    </div>
                    <p className="text-xs font-black italic text-amber-900 leading-tight uppercase">"{order.adminNote}"</p>
                 </div>
               )}
               
               <div className="space-y-1">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Drop Location</span>
                  <div className="flex items-start gap-2 bg-white/50 p-3 rounded-2xl border border-white">
                     <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                     <p className="text-[10px] font-bold text-gray-700 leading-tight uppercase italic">{order.address}</p>
                  </div>
               </div>

               {order.deliveryInstructions && (
                 <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-1">
                    <div className="flex items-center gap-2 text-amber-700">
                       <StickyNote className="h-3.5 w-3.5" />
                       <span className="text-[8px] font-black uppercase tracking-widest">Customer Note</span>
                    </div>
                    <p className="text-xs font-black italic text-amber-900 leading-tight uppercase">"{order.deliveryInstructions}"</p>
                 </div>
               )}

               <div className="space-y-3 pt-2">
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Items Summary</span>
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex flex-col gap-1 border-b border-white/50 pb-2 last:border-0">
                       <div className="flex justify-between text-xs font-black italic">
                          <span className="text-gray-800"><span className="text-primary">{item.quantity}x</span> {item.name}</span>
                          <span className="text-gray-900">₹{(item.price * item.quantity).toFixed(0)}</span>
                       </div>
                       {item.selectedOption && (
                         <div className="flex items-center gap-1.5 text-primary">
                            <ListTree className="h-3 w-3" />
                            <span className="text-[9px] font-black uppercase tracking-widest bg-white px-2 py-0.5 rounded shadow-inner">VARIETY: {item.selectedOption.name}</span>
                         </div>
                       )}
                       {item.instructions && (
                         <div className="flex items-center gap-1.5 text-gray-500">
                            <MessageSquare className="h-3 w-3" />
                            <span className="text-[9px] font-bold italic uppercase">Note: {item.instructions}</span>
                         </div>
                       )}
                    </div>
                  ))}
               </div>
               
               <div className="flex justify-between items-center pt-2 border-t border-white font-black italic text-lg text-gray-900">
                  <span className="text-sm uppercase tracking-tighter text-gray-500">Total Collection</span>
                  <span>₹{order.total?.toFixed(0)}</span>
               </div>
            </div>

            <div className="flex gap-2">
               <Button onClick={() => handleNextStatus(order.id, order.status)} disabled={['Delivered', 'Cancelled'].includes(order.status)} className="flex-1 h-14 bg-black hover:bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl transition-all">
                  NEXT LOGISTICS STEP
               </Button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD NOTE DIALOG */}
      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
         <DialogContent className="rounded-[2.5rem] max-w-sm p-8 border-none shadow-2xl bg-white focus:outline-none">
            <div className="flex flex-col items-center text-center space-y-4">
               <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100 shadow-inner">
                  <StickyNote className="h-8 w-8" />
               </div>
               <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Broadcast Note</DialogTitle>
               </DialogHeader>
               <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed tracking-widest">
                  This note will be visible to the customer on their live tracking page.
               </p>
            </div>

            <div className="space-y-6 mt-6">
               <div className="relative">
                  <MessageSquare className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
                  <Textarea 
                    placeholder="e.g. RIDER ON THE WAY / STORE BUSY" 
                    value={noteText}
                    onChange={e => setNoteText(e.target.value.toUpperCase())}
                    className="min-h-[120px] pl-12 rounded-[1.5rem] bg-gray-50 border-none font-black text-xs uppercase focus-visible:ring-1 focus-visible:ring-amber-500/20 p-4"
                  />
               </div>

               <Button 
                onClick={handleSaveNote}
                disabled={isSavingNote || !noteText.trim()}
                className="w-full h-16 bg-black hover:bg-amber-600 text-white rounded-[2rem] font-black uppercase italic shadow-xl transition-all"
               >
                 {isSavingNote ? <Loader2 className="h-6 w-6 animate-spin" /> : "PUBLISH TO CUSTOMER"}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
