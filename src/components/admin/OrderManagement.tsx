
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy, serverTimestamp, getDocs } from 'firebase/firestore';
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
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
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
        <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 11px; font-weight: 800;">
          <span style="flex: 2; pr: 10px;">${item.name}</span>
          <span style="flex: 0.5; text-align: center;">X${item.quantity}</span>
          <span style="flex: 1; text-align: right;">${(item.price * item.quantity).toFixed(2)}</span>
        </div>
      `).join('');

      receipt.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px;">
          <h1 style="margin: 0; font-size: 38px; font-weight: 900; letter-spacing: -2px; font-style: italic;">SHOPYKART</h1>
          <p style="margin: 2px 0; font-size: 10px; font-weight: 900; letter-spacing: 2px;">PREMIUM DELIVERY NETWORK</p>
          <div style="margin-top: 15px; font-size: 9px; font-weight: 800;">SHOPYKART PREMIUM DELIVERY</div>
          <div style="font-size: 9px; font-weight: 800;">POWERED BY DEVANSH GUPTA</div>
          <div style="border-top: 1.5px dashed #000; margin: 15px auto 0; width: 100%;"></div>
        </div>

        <div style="margin-bottom: 25px; line-height: 1.8; font-size: 11px; font-weight: 800;">
          <div style="display: flex; justify-content: space-between;"><span>ORDER NO:</span><span style="font-weight: 900;">#${order.customerOrderNumber || '1'}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>TIME:</span><span>${orderDate}</span></div>
          <div style="display: flex; justify-content: space-between;"><span>STORES:</span><span style="text-align: right; max-width: 200px;">${order.restaurantName || 'ShopyKart Hub'}</span></div>
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

        <div style="font-size: 11px; font-weight: 800; space-y: 6px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>ITEMS SUBTOTAL:</span><span>₹${(order.total - 10).toFixed(2)}</span></div>
          <div style="display: flex; justify-content: space-between; font-style: italic;"><span>DELHIVERY FEE:</span><span>₹10.00</span></div>
        </div>

        <div style="border-top: 2px solid #000; margin: 15px 0;"></div>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 24px; font-weight: 900; font-style: italic;">GRAND TOTAL</span>
          <span style="font-size: 24px; font-weight: 900; font-style: italic;">₹${order.total?.toFixed(2)}</span>
        </div>
        <div style="border-top: 1.5px dashed #000; margin: 15px 0;"></div>

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
      const blob = await toBlob(receipt, { pixelRatio: 2 }); 
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
      <div className="flex items-center justify-between">
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
            <div key={order.id} className="bg-white rounded-[3rem] p-8 border border-border/60 shadow-sm text-gray-900 transform-gpu transition-all hover:shadow-xl">
              
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "h-20 w-20 rounded-[1.75rem] flex items-center justify-center border-2 shrink-0",
                    isCancelled ? "bg-red-50 border-red-100 text-red-500" : isDelivered ? "bg-green-50 border-green-100 text-green-600" : "bg-primary/5 border-primary/10 text-primary"
                  )}>
                    <Package className="h-10 w-10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <h3 className="font-black text-4xl italic uppercase tracking-tighter leading-none">ORDER #{order.customerOrderNumber || '...'}</h3>
                       <Badge className={cn(
                         "border-none text-[8px] font-black uppercase px-3 py-1 rounded-full",
                         isCancelled ? "bg-red-500 text-white" : isDelivered ? "bg-green-600 text-white" : "bg-primary text-white animate-pulse"
                       )}>{order.status.toUpperCase()}</Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                       <button onClick={() => generateReceipt(order)} disabled={isDownloading === order.id} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-xl border border-border flex items-center gap-2 transition-all active:scale-95">
                          {isDownloading === order.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5 text-blue-600" />}
                          <span className="text-[10px] font-black uppercase tracking-tight">RECEIPT</span>
                       </button>

                       <div className="bg-gray-50 px-3 py-1.5 rounded-xl border border-border flex items-center gap-2">
                          <Banknote className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight">{order.paymentMethod?.toUpperCase()}</span>
                       </div>
                       
                       {order.deliveryPartnerName && (
                         <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-xl border border-green-200 flex items-center gap-2">
                            <Bike className="h-3.5 w-3.5" />
                            <span className="text-[9px] font-black uppercase">{order.deliveryPartnerName}</span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Partner Store</p>
                   <span className="text-xl font-black italic uppercase text-primary tracking-tighter">{order.restaurantName || 'ShopyKart'}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-[2.5rem] p-7 mb-8 border border-border shadow-inner">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-5">
                       <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border"><User className="h-6 w-6" /></div>
                       <span className="font-black text-2xl italic uppercase tracking-tighter text-gray-900">{order.customerName}</span>
                    </div>
                    <button onClick={() => window.open(`tel:${order.customerPhone}`)} className="h-14 w-14 bg-green-600 rounded-2xl flex items-center justify-center text-white shadow-xl active:scale-90 transition-all border-b-4 border-green-800"><PhoneCall className="h-7 w-7" /></button>
                 </div>

                 <div className="space-y-4">
                    <div className="space-y-3">
                       {order.items?.map((item: any, i: number) => (
                         <div key={i} className="flex justify-between items-center text-lg font-black italic">
                            <span className="text-gray-400"><span className="text-gray-900">{item.quantity}x</span> <span className="uppercase text-gray-700">{item.name}</span></span>
                            <span className="text-primary">₹{(item.price * item.quantity).toFixed(0)}</span>
                         </div>
                       ))}
                    </div>
                    <div className="pt-6 mt-4 border-t border-dashed border-border flex items-start gap-3">
                       <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                       <p className="text-xs font-bold text-gray-600 uppercase leading-relaxed tracking-tight">{order.address}</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">Workflow Status Control</label>
                 <div className="flex gap-3">
                    <Button onClick={() => handleNextStatus(order.id, order.status)} disabled={isDelivered || isCancelled} className={cn(
                        "flex-1 h-18 py-8 rounded-[1.75rem] font-black uppercase italic text-lg tracking-tighter transition-all active:scale-95 border-b-4",
                        isDelivered ? "bg-green-600 border-green-800 text-white" : "bg-white text-black hover:bg-primary hover:text-white border-gray-200"
                      )}>
                      {isDelivered ? <CheckCircle2 className="mr-2 h-6 w-6" /> : null}
                      {getButtonLabel(order.status)}
                    </Button>
                    
                    {isReadyForPickup && !order.deliveryPartnerId && (
                      <button 
                        onClick={() => { setSelectedOrderForPartner(order); setIsAssignOpen(true); }}
                        className="h-18 px-6 bg-amber-500 rounded-[1.75rem] flex items-center justify-center text-white hover:bg-amber-600 transition-all border-b-4 border-amber-700 active:translate-y-1 active:border-b-0"
                      >
                         <UserPlus className="h-6 w-6 mr-2" />
                         <span className="text-[10px] font-black uppercase">Assign</span>
                      </button>
                    )}

                    {hasPrev && (
                      <button onClick={() => handlePrevStatus(order.id, order.status)} className="h-18 w-18 bg-gray-100 rounded-[1.75rem] flex items-center justify-center text-gray-400 hover:text-primary hover:bg-primary/5 transition-all border border-border active:scale-90"><RotateCcw className="h-7 w-7" /></button>
                    )}
                 </div>
              </div>
            </div>
          );
        })}
      </div>

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
                      <div className="h-12 w-12 rounded-2xl overflow-hidden bg-white border shrink-0">
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
               {(!partners || partners.length === 0) && (
                 <div className="text-center py-20 opacity-30 uppercase font-black text-xs">No active partners found</div>
               )}
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
