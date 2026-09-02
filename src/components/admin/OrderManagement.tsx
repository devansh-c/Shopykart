"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy, serverTimestamp, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { 
  Package, 
  User, 
  MapPin, 
  PhoneCall, 
  Navigation, 
  Map as MapIcon, 
  X, 
  ExternalLink, 
  Loader2, 
  Banknote, 
  RotateCcw,
  Crown, 
  Bike, 
  Trash2,
  Coins,
  Truck,
  Check,
  CheckCircle2,
  Printer,
  Download,
  FileText,
  ShieldCheck,
  Building2,
  UserPlus,
  Plus,
  Compass,
  Sparkles,
  Clock,
  MessageSquare,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import dynamic from 'next/dynamic';

const OrderMapViewer = dynamic(() => import('@/components/shared/OrderMapViewer'), { 
  ssr: false,
  loading: () => <div className="h-44 w-full bg-muted animate-pulse rounded-2xl" />
});

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
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedOrderForPartner, setSelectedOrderForPartner] = useState<any>(null);
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

  const partnersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'delivery_partners');
  }, [firestore]);
  const { data: partners } = useCollection<any>(partnersQuery);

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

  const handlePrevStatus = async (id: string, currentStatus: string) => {
    if (!firestore) return;
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    if (currentIndex > 0) {
      const prevStatus = STATUS_FLOW[currentIndex - 1];
      await updateDoc(doc(firestore, 'orders', id), { 
        status: prevStatus,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Status Reversed", description: `Back to ${prevStatus}` });
    }
  };

  const handleCancelOrder = async (id: string) => {
    if (!firestore) return;
    if (confirm("Are you sure you want to CANCEL this order? This cannot be undone.")) {
      await updateDoc(doc(firestore, 'orders', id), {
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

  const handleAssignPartner = async (partner: any) => {
    if (!firestore || !selectedOrderForPartner) return;
    try {
      await updateDoc(doc(firestore, 'orders', selectedOrderForPartner.id), {
        deliveryPartnerId: partner.id,
        deliveryPartnerName: partner.fullName,
        deliveryPartnerPhone: partner.phone,
        status: 'Picked Up', 
        updatedAt: serverTimestamp()
      });
      setIsAssignOpen(false);
      setSelectedOrderForPartner(null);
      toast({ title: "Partner Assigned!", description: `${partner.fullName} is on the task.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Assignment Failed" });
    }
  };

  const startNavigation = (order: any) => {
    const lat = order.customerLat;
    const lng = order.customerLng;
    if (lat && lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      toast({ variant: "destructive", title: "Location Missing", description: "Customer hasn't pinned their exact house." });
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
      receipt.style.fontFamily = "'Inter', sans-serif";
      receipt.style.textTransform = 'uppercase';
      
      const parseOrderDate = (date: any) => {
        if (!date) return format(new Date(), 'dd MMM yyyy, hh:mm a');
        if (typeof date === 'string') return format(new Date(date), 'dd MMM yyyy, hh:mm a');
        if (date.seconds) return format(new Date(date.seconds * 1000), 'dd MMM yyyy, hh:mm a');
        return format(new Date(), 'dd MMM yyyy, hh:mm a');
      };

      const orderDate = parseOrderDate(order.createdAt);
      const upiUrl = `upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${order.total?.toFixed(2)}&cu=INR`;
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

      const itemsHtml = order.items?.map((item: any) => `
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 800;">
            <span style="flex: 2; padding-right: 10px;">${item.name}</span>
            <span style="flex: 0.5; text-align: center;">X${item.quantity}</span>
            <span style="flex: 1; text-align: right;">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
          ${item.restaurantName ? `<div style="font-size: 8px; color: #555; font-weight: 700; margin-top: 2px;">FROM: ${item.restaurantName}</div>` : ''}
        </div>
      `).join('');

      let taxHtml = '';
      if (order.deliveryFee > 0) {
        taxHtml += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>DELIVERY FEE:</span><span>₹${order.deliveryFee.toFixed(2)}</span></div>`;
      }
      if (order.chargesBreakdown && Array.isArray(order.chargesBreakdown)) {
        order.chargesBreakdown.forEach((charge: any) => {
          taxHtml += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>${charge.name}:</span><span>₹${charge.value.toFixed(2)}</span></div>`;
        });
      }
      if (order.isPremiumPacking) {
        taxHtml += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>PREMIUM PACKING:</span><span>₹10.00</span></div>`;
      }
      if (order.deliveryTip > 0) {
        taxHtml += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span>DELIVERY TIP:</span><span>₹${order.deliveryTip.toFixed(2)}</span></div>`;
      }
      if (order.redeemCoins) {
        taxHtml += `<div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: #16a34a;"><span>COINS REDEEMED:</span><span>- ₹5.00</span></div>`;
      }

      receipt.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="margin: 0; font-size: 38px; font-weight: 900; letter-spacing: -2px; font-style: italic;">SHOPYKART</h1>
          <p style="margin: 2px 0; font-size: 10px; font-weight: 900; letter-spacing: 2px;">PREMIUM DELIVERY NETWORK</p>
          <div style="margin-top: 15px; font-size: 9px; font-weight: 800;">SHOPYKART PREMIUM DELIVERY</div>
          <div style="border-top: 1.5px dashed #000; margin: 15px auto 0; width: 100%;"></div>
        </div>

        <div style="margin-bottom: 25px; line-height: 1.8; font-size: 11px; font-weight: 800;">
          <div style="display: flex; justify-content: space-between;"><span>ORDER NO:</span><span style="font-weight: 900;">#${order.customerOrderNumber || '1'}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>TIME:</span><span>${orderDate}</span></div>
          <div style="display: flex; justify-content: space-between; margin-top: 10px;"><span>CUSTOMER:</span><span>${order.customerName}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>PHONE:</span><span>${order.customerPhone}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>ADDRESS:</span><span style="text-align: right; max-width: 200px;">${order.address}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>PAYMENT:</span><span>${order.paymentMethod === 'ONLINE' ? 'ONLINE PREPAID' : 'CASH ON DELIVERY'}</span></div>
        </div>

        <div style="border-top: 1.5px dashed #000; margin-bottom: 10px;"></div>
        <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 900; margin-bottom: 10px;">
          <span style="flex: 2;">ITEM DESCRIPTION</span>
          <span style="flex: 0.5; text-align: center;">QTY</span>
          <span style="flex: 1; text-align: right;">PRICE</span>
        </div>
        <div style="border-top: 1.5px dashed #000; margin-bottom: 15px;"></div>

        <div style="margin-bottom: 20px;">
          ${itemsHtml}
        </div>

        <div style="border-top: 1.5px dashed #000; margin-bottom: 15px;"></div>
        
        <div style="font-size: 9px; font-weight: 800; margin-bottom: 15px; border-bottom: 1.5px dashed #000; padding-bottom: 10px;">
          <div style="font-size: 10px; font-weight: 900; margin-bottom: 8px;">TAX & EXTRA CHARGES:</div>
          ${taxHtml || '<div>NO EXTRA CHARGES</div>'}
        </div>

        <div style="font-size: 14px; font-weight: 900; font-style: italic;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>GRAND TOTAL:</span><span>₹${order.total?.toFixed(2)}</span></div>
        </div>

        <div style="border-top: 2px solid #000; margin: 15px 0;"></div>
        <div style="text-align: center; margin: 25px 0;">
          <div style="border: 1.5px dotted #000; display: inline-block; padding: 10px; margin-bottom: 8px;">
            <img src="${qrCodeUrl}" style="width: 150px; height: 140px; display: block;" />
          </div>
          <p style="font-size: 9px; font-weight: 900; letter-spacing: 2px; margin: 0;">SCAN TO PAY</p>
        </div>

        <div style="text-align: center; margin-top: 25px;">
          <p style="font-size: 16px; font-weight: 900; font-style: italic; margin-bottom: 5px;">ENJOY YOUR DELICIOUS MEAL!</p>
          <p style="font-size: 8px; font-weight: 700; color: #555; line-height: 1.4;">THANK YOU FOR CHOOSING SHOPYKART! THIS IS A COMPUTER GENERATED INVOICE.</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <div style="border: 1.5px solid #000; display: inline-block; padding: 4px 15px; font-size: 10px; font-weight: 900; letter-spacing: 2px;">
            POWERED BY SHOPYKART
          </div>
        </div>
      `;
      
      document.body.appendChild(receipt);
      const blob = await toBlob(receipt, { pixelRatio: 2, skipFonts: true }); 
      document.body.removeChild(receipt);
      
      if (blob && typeof saveAs === 'function') {
        saveAs(blob, `ShopyKart_Receipt_${order.customerOrderNumber || order.id.slice(-4)}.png`);
        toast({ title: "Receipt Downloaded! ✅" });
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
      case 'Delivered': return 'ORDER COMPLETED';
      default: return 'UPDATE STATUS';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">ORDER LOGISTICS</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Management Console</p>
        </div>
        <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase text-xs px-4 py-1.5 shadow-sm">
          {orders?.length || 0} TOTAL
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-8 pb-32">
        {orders?.map((order: any) => {
          const isCancelled = order.status === 'Cancelled';
          const isDelivered = order.status === 'Delivered';
          const isReadyForPickup = order.status === 'Ready for Pickup';
          const currentIndex = STATUS_FLOW.indexOf(order.status);
          const hasNext = currentIndex < STATUS_FLOW.length - 1 && !isCancelled;
          const hasPrev = currentIndex > 0 && !isCancelled;

          return (
            <div key={order.id} className={cn(
              "bg-white rounded-[3rem] p-6 md:p-8 border border-border/60 shadow-sm text-gray-900 transform-gpu transition-all hover:shadow-xl relative overflow-hidden",
              isCancelled && "opacity-60 grayscale-[0.5]"
            )}>
              
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "h-20 w-20 rounded-[1.75rem] flex items-center justify-center border-2 shrink-0 shadow-inner",
                    isCancelled ? "bg-red-50 border-red-100 text-red-500" : isDelivered ? "bg-green-50 border-green-100 text-green-600" : "bg-primary/5 border-primary/10 text-primary"
                  )}>
                    <Package className="h-10 w-10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                       <h3 className="font-black text-3xl md:text-4xl italic uppercase tracking-tighter leading-none">ORDER #{order.customerOrderNumber || '...'}</h3>
                       <Badge className={cn(
                         "border-none text-[8px] font-black uppercase px-3 py-1 rounded-full shadow-sm",
                         isCancelled ? "bg-red-500 text-white" : isDelivered ? "bg-green-600 text-white" : "bg-primary text-white animate-pulse"
                       )}>{order.status.toUpperCase()}</Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                       <button onClick={() => generateReceipt(order)} disabled={isDownloading === order.id} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-xl border border-border flex items-center gap-2 transition-all active:scale-95 shadow-sm">
                          {isDownloading === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-blue-600" />}
                          <span className="text-[10px] font-black uppercase tracking-tight">RECEIPT</span>
                       </button>

                       <button 
                        onClick={() => { setSelectedOrderForNote(order); setAdminNote(order.adminNote || ''); setIsNoteOpen(true); }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl border flex items-center gap-2 transition-all active:scale-95 shadow-sm",
                          order.adminNote ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-gray-100 border-border text-gray-500"
                        )}
                       >
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-tight">{order.adminNote ? 'EDIT NOTE' : 'ADD NOTE'}</span>
                       </button>

                       {!isCancelled && !isDelivered && (
                         <button onClick={() => handleCancelOrder(order.id)} className="bg-red-50 text-red-500 px-3 py-1.5 rounded-xl border border-red-100 flex items-center gap-2 shadow-sm active:scale-95 transition-all">
                            <XCircle className="h-3.5 w-3.5" />
                            <span className="text-[10px] font-black uppercase tracking-tight">CANCEL</span>
                         </button>
                       )}
                    </div>
                  </div>
                </div>
                <div className="text-left md:text-right flex flex-col md:items-end">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Source Hub</p>
                   <span className="text-xl font-black italic uppercase text-primary tracking-tighter drop-shadow-sm">{order.restaurantName || 'ShopyKart Hub'}</span>
                </div>
              </div>

              {order.adminNote && (
                <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-xl mb-6 flex items-start gap-3">
                   <MessageSquare className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                   <div>
                      <p className="text-[8px] font-black text-amber-700 uppercase tracking-widest mb-0.5">Admin Note to Customer</p>
                      <p className="text-xs font-bold text-amber-900 italic leading-tight">"{order.adminNote}"</p>
                   </div>
                </div>
              )}

              <div className="bg-gray-50/80 rounded-[2.5rem] p-6 md:p-8 mb-8 border border-border shadow-inner relative">
                 {/* Premium Badges Overlay */}
                 <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                    {order.redeemCoins && (
                      <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[7px] uppercase tracking-widest px-2 py-0.5">
                        <Coins className="h-2 w-2 mr-1 fill-amber-700" /> COINS REDEEMED
                      </Badge>
                    )}
                    {order.isPremiumPacking && (
                      <Badge className="bg-primary/10 text-primary border-none font-black text-[7px] uppercase tracking-widest px-2 py-0.5">
                        <Sparkles className="h-2 w-2 mr-1 fill-primary" /> PREMIUM PACKING
                      </Badge>
                    )}
                 </div>

                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-5">
                       <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-gray-100 shrink-0"><User className="h-6 w-6" /></div>
                       <div className="min-w-0">
                          <span className="font-black text-2xl italic uppercase tracking-tighter text-gray-900 truncate block pr-20">{order.customerName}</span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase">{order.customerPhone}</span>
                       </div>
                    </div>
                    <div className="flex gap-3">
                       <button onClick={() => startNavigation(order)} className="flex-1 md:flex-none h-14 px-6 bg-blue-600 text-white rounded-2xl flex items-center justify-center gap-3 shadow-xl active:scale-90 transition-all border-b-4 border-blue-800" title="Navigate to Customer">
                          <Compass className="h-6 w-6 animate-pulse" />
                          <span className="text-[10px] font-black uppercase tracking-widest md:hidden">NAVIGATE</span>
                       </button>
                       <button onClick={() => window.open(`tel:${order.customerPhone}`)} className="flex-1 md:flex-none h-14 px-6 bg-green-600 rounded-2xl flex items-center justify-center gap-3 text-white shadow-xl active:scale-90 transition-all border-b-4 border-green-800">
                          <PhoneCall className="h-6 w-6" />
                          <span className="text-[10px] font-black uppercase tracking-widest md:hidden">CALL</span>
                       </button>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <div className="space-y-4">
                       {order.items?.map((item: any, i: number) => (
                         <div key={i} className="flex justify-between items-center text-lg font-black italic border-b border-white pb-3 last:border-0 group/item">
                            <div className="flex flex-col min-w-0 pr-4">
                               <span className="text-gray-400 truncate"><span className="text-gray-900">{item.quantity}x</span> <span className="uppercase text-gray-700">{item.name}</span></span>
                               {item.restaurantName && <span className="text-[8px] font-bold text-primary uppercase tracking-widest mt-1">{item.restaurantName}</span>}
                            </div>
                            <span className="text-primary shrink-0">₹{(item.price * item.quantity).toFixed(0)}</span>
                         </div>
                       ))}
                    </div>
                    <div className="pt-6 mt-4 border-t border-dashed border-gray-300 flex items-start gap-4">
                       <div className="bg-primary/10 p-2 rounded-xl text-primary shrink-0"><MapPin className="h-5 w-5" /></div>
                       <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-gray-600 uppercase leading-relaxed tracking-tight break-words">{order.address || 'SET DELIVERY LOCATION'}</p>
                          <div className="flex items-center gap-1.5 mt-2 text-[8px] font-black text-gray-400 uppercase italic">
                             <Navigation className="h-2.5 w-2.5" />
                             {order.customerLat ? `Pinned: ${order.customerLat.toFixed(4)}, ${order.customerLng.toFixed(4)}` : 'MANUAL ADDRESS ONLY'}
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Workflow Status Control</label>
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase italic">
                       <Clock className="h-2.5 w-2.5" /> {format(new Date(order.createdAt?.seconds * 1000 || Date.now()), 'dd MMM, hh:mm a')}
                    </div>
                 </div>
                 <div className="flex flex-col md:flex-row gap-3">
                    <Button onClick={() => handleNextStatus(order.id, order.status)} disabled={isDelivered || isCancelled} className={cn(
                        "flex-1 h-20 py-8 rounded-[1.75rem] font-black uppercase italic text-xl tracking-tighter transition-all active:scale-95 border-b-[6px] shadow-2xl",
                        isDelivered ? "bg-green-600 border-green-800 text-white" : "bg-[#0B0B0B] text-white hover:bg-primary border-black/20"
                      )}>
                      {isDelivered ? <CheckCircle2 className="mr-2 h-7 w-7" /> : null}
                      {getButtonLabel(order.status)}
                    </Button>
                    
                    <div className="flex gap-3">
                      {isReadyForPickup && !order.deliveryPartnerId && (
                        <button 
                          onClick={() => { setSelectedOrderForPartner(order); setIsAssignOpen(true); }}
                          className="flex-1 md:flex-none h-20 px-8 bg-amber-500 rounded-[1.75rem] flex flex-col items-center justify-center text-white hover:bg-amber-600 transition-all border-b-[6px] border-amber-700 active:translate-y-1 active:border-b-0 shadow-xl"
                        >
                           <UserPlus className="h-6 w-6 mb-1" />
                           <span className="text-[8px] font-black uppercase tracking-widest">ASSIGN</span>
                        </button>
                      )}

                      {hasPrev && (
                        <button onClick={() => handlePrevStatus(order.id, order.status)} className="h-20 w-20 bg-gray-100 rounded-[1.75rem] flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all border border-border active:scale-90 shadow-sm shrink-0"><RotateCcw className="h-7 w-7" /></button>
                      )}
                    </div>
                 </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALS */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
         <DialogContent className="rounded-[3rem] max-w-md p-0 overflow-hidden border-none shadow-2xl bg-white flex flex-col max-h-[85vh]">
            <DialogHeader className="p-8 pb-4 shrink-0">
               <DialogTitle className="font-black italic uppercase text-center text-2xl tracking-tighter">Assign Delivery Hero</DialogTitle>
               <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest mt-1">Select from active partners in zone</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3">
               {partners?.filter((p: any) => p.isOnline).map((partner: any) => (
                 <button 
                   key={partner.id}
                   onClick={() => handleAssignPartner(partner)}
                   className="w-full p-4 rounded-[1.5rem] border-2 border-gray-50 bg-gray-50/50 hover:bg-primary/5 hover:border-primary/20 transition-all flex items-center justify-between text-left group"
                 >
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl overflow-hidden bg-white border border-gray-100 shrink-0 shadow-sm">
                         <img src={partner.photoUrl} className="h-full w-full object-cover" alt="" />
                      </div>
                      <div>
                         <h4 className="font-black italic uppercase text-sm leading-none mb-1">{partner.fullName}</h4>
                         <p className="text-[10px] font-bold text-muted-foreground uppercase">{partner.phone}</p>
                      </div>
                   </div>
                   <div className="h-8 w-8 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center text-gray-300 group-hover:text-primary group-hover:border-primary transition-all"><Plus className="h-4 w-4" /></div>
                 </button>
               ))}
               {(!partners || partners.filter((p:any) => p.isOnline).length === 0) && (
                 <div className="text-center py-20 opacity-30 uppercase font-black text-xs italic">No active partners found</div>
               )}
            </div>
         </DialogContent>
      </Dialog>

      <Dialog open={isNoteOpen} onOpenChange={setIsNoteOpen}>
         <DialogContent className="rounded-[3rem] max-w-sm p-8 border-none shadow-2xl bg-white focus:outline-none">
            <DialogHeader className="mb-4">
               <DialogTitle className="font-black italic uppercase text-center text-xl">Order Memo</DialogTitle>
               <DialogDescription className="text-center text-[10px] font-bold uppercase">This note is visible to the customer</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
               <Textarea 
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="e.g. Preparing fresh, might take 10 mins more."
                className="min-h-[120px] rounded-2xl bg-gray-50 border-none font-bold p-4 text-xs italic"
               />
               <Button 
                onClick={handleSaveNote}
                disabled={isSavingNote}
                className="w-full h-14 bg-black text-white rounded-xl font-black uppercase italic active:scale-95 transition-all shadow-xl"
               >
                 {isSavingNote ? <Loader2 className="h-5 w-5 animate-spin" /> : 'SHARE NOTE'}
               </Button>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
