
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
  Plus,
  Eye,
  Trash2,
  Store,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
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

/**
 * @fileOverview OrderManagement with Enhanced Visibility: Address, Time, and Store Names.
 */
export default function OrderManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  
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
      toast({ title: "Note Updated!" });
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
      
      const itemsHtml = order.items?.map((item: any) => `
        <div style="margin-bottom: 12px; border-bottom: 1px dashed #eee; padding-bottom: 5px;">
           <div style="font-size: 8px; font-weight: 900; color: #666; margin-bottom: 2px;">FROM: ${item.restaurantName || order.restaurantName || 'SHopyKart'}</div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 900;">
            <span style="flex: 2;">${item.name}</span>
            <span style="flex: 0.5; text-align: center;">X${item.quantity}</span>
            <span style="flex: 1; text-align: right;">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        </div>
      `).join('');

      receipt.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="margin: 0; font-size: 38px; font-weight: 900; font-style: italic; letter-spacing: -2px;">SHOPYKART</h1>
          <p style="margin: 2px 0; font-size: 10px; font-weight: 900; letter-spacing: 2px;">PREMIUM DELIVERY NETWORK</p>
        </div>
        <div>${itemsHtml}</div>
        <div style="border-top: 2px solid #000; margin: 20px 0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 26px; font-weight: 900;">
          <span>TOTAL</span><span>₹${order.total?.toFixed(2)}</span>
        </div>
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
        {orders?.map((order: any) => {
          const orderDate = order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000) : new Date();
          
          return (
            <div key={order.id} className="bg-white rounded-[2.5rem] p-6 border-2 border-border shadow-sm hover:shadow-xl transition-all relative overflow-hidden">
              {/* HEADER: ORDER #, STATUS, TIME */}
              <div className="flex flex-wrap justify-between items-start mb-6 gap-4">
                 <div className="flex items-center gap-4 min-w-0">
                    <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border-2 border-primary/10 shrink-0"><Package className="h-7 w-7" /></div>
                    <div className="min-w-0">
                      <h3 className="font-black text-xl italic uppercase tracking-tighter leading-none mb-1 truncate">Order #{order.customerOrderNumber}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-primary text-white text-[8px] uppercase font-black px-2 py-0.5">{order.status}</Badge>
                        <div className="flex items-center gap-1 text-[9px] font-black text-muted-foreground uppercase">
                           <Clock className="h-3 w-3 text-primary" />
                           {isMounted ? format(orderDate, 'hh:mm a') : '--:--'}
                        </div>
                      </div>
                    </div>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => { setNoteOrderId(order.id); setNoteText(order.adminNote || ''); setIsNoteOpen(true); }} 
                      className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-amber-100"
                    >
                      <StickyNote className="h-5 w-5" />
                    </button>
                    <button onClick={() => generateReceipt(order)} disabled={isDownloading === order.id} className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-blue-100">
                      {isDownloading === order.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                    </button>
                    <button onClick={() => window.open(`tel:${order.customerPhone}`)} className="h-10 w-10 bg-green-500 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-green-100"><PhoneCall className="h-5 w-5" /></button>
                    <button onClick={() => handleCancelOrder(order.id)} className="h-10 w-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center active:scale-90 transition-all border border-red-100"><XCircle className="h-5 w-5" /></button>
                 </div>
              </div>

              {/* LOGISTICS BLOCK: CUSTOMER & ADDRESS */}
              <div className="bg-muted/30 rounded-[2rem] p-6 mb-6 space-y-5 border border-border/40">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white pb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-primary shrink-0"><User className="h-5 w-5" /></div>
                      <div>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Customer</span>
                        <span className="text-sm font-black uppercase italic text-gray-900">{order.customerName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-green-500 shrink-0"><Phone className="h-5 w-5" /></div>
                       <div>
                         <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Contact</span>
                         <span className="text-sm font-black text-gray-900">{order.customerPhone}</span>
                       </div>
                    </div>
                 </div>

                 {/* NEW: ADDRESS BLOCK */}
                 <div className="flex items-start gap-3 pt-1">
                    <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-blue-500 shrink-0"><MapPin className="h-5 w-5" /></div>
                    <div className="min-w-0">
                       <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Delivery Destination</span>
                       <p className="text-[11px] font-bold text-gray-700 leading-relaxed uppercase italic mt-0.5 line-clamp-2">
                          {order.address}
                       </p>
                    </div>
                 </div>
              </div>

              {/* PRODUCT ITEMS: GROUPED OR LABELLED WITH STORE NAMES */}
              <div className="bg-gray-50 rounded-[2.5rem] p-6 mb-6 space-y-4 border border-border/20">
                 <div className="flex items-center gap-2 mb-2 px-1">
                    <ShoppingBag className="h-4 w-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Order Contents</span>
                 </div>
                 
                 <div className="space-y-4">
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="bg-white/60 p-4 rounded-2xl border border-white relative overflow-hidden group">
                         {/* NEW: STORE NAME ABOVE PRODUCT */}
                         <div className="flex items-center gap-1.5 mb-2 opacity-60">
                            <Store className="h-2.5 w-2.5 text-primary" />
                            <span className="text-[8px] font-black uppercase tracking-tighter text-gray-500">Store: {item.restaurantName || order.restaurantName || 'ShopyKart'}</span>
                         </div>
                         
                         <div className="flex justify-between items-center text-xs font-black italic">
                            <span className="text-gray-800"><span className="text-primary">{item.quantity}x</span> {item.name}</span>
                            <span className="text-gray-900">₹{(item.price * item.quantity).toFixed(0)}</span>
                         </div>
                         
                         {item.selectedOption && (
                           <div className="mt-1 flex items-center gap-1.5">
                              <ListTree className="h-2.5 w-2.5 text-primary opacity-50" />
                              <span className="text-[8px] font-black text-primary uppercase tracking-widest">Variety: {item.selectedOption.name}</span>
                           </div>
                         )}
                      </div>
                    ))}
                 </div>
                 
                 <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-gray-200 font-black italic text-2xl text-gray-900 px-2">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black uppercase tracking-tighter text-gray-400 not-italic">Order Total</span>
                       <span>₹{order.total?.toFixed(0)}</span>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-none font-black text-[9px] uppercase">{order.paymentMethod || 'COD'}</Badge>
                 </div>
              </div>

              {/* ACTION BUTTON */}
              <Button 
                onClick={() => handleNextStatus(order.id, order.status)} 
                disabled={['Delivered', 'Cancelled'].includes(order.status)} 
                className="w-full h-16 bg-[#0B0B0B] hover:bg-primary text-white rounded-[1.75rem] font-black uppercase italic shadow-xl transition-all active:scale-95"
              >
                 {['Delivered', 'Cancelled'].includes(order.status) ? 'COMPLETED' : 'MOVE TO NEXT STAGE'}
              </Button>
            </div>
          );
        })}
      </div>

      {/* ADMIN NOTE DIALOG */}
      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
         <DialogContent className="rounded-[2.5rem] max-w-sm p-8 border-none shadow-2xl bg-white focus:outline-none">
            <div className="flex flex-col items-center text-center space-y-4">
               <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100 shadow-inner">
                  <StickyNote className="h-8 w-8" />
               </div>
               <DialogHeader>
                  <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Admin Note</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                    Visible to customer on tracking page
                  </DialogDescription>
               </DialogHeader>
            </div>

            <div className="space-y-6 mt-6">
               <Textarea 
                 placeholder="E.G. RIDER ASSIGNED" 
                 value={noteText}
                 onChange={e => setNoteText(e.target.value.toUpperCase())}
                 className="min-h-[120px] rounded-[1.5rem] bg-gray-50 border-none font-black text-xs uppercase p-4"
               />
               <Button onClick={handleSaveNote} disabled={isSavingNote || !noteText.trim()} className="w-full h-16 bg-black hover:bg-amber-600 text-white rounded-[2rem] font-black uppercase italic shadow-xl transition-all">
                 {isSavingNote ? <Loader2 className="h-6 w-6 animate-spin" /> : "PUBLISH NOTE"}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
