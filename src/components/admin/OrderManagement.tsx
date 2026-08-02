
"use client"

import { useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, deleteDoc, serverTimestamp } from 'firebase/firestore';
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
  CheckCircle2, 
  MessageSquareQuote, 
  Crown, 
  Bike, 
  Camera, 
  ImageIcon,
  Edit3,
  Trash2,
  FileText,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';

const statusOptions = ["Placed", "Accepted", "Preparing", "Ready for Pickup", "Picked Up", "Out for Delivery", "Delivered", "Cancelled"];

export default function OrderManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Vendor Receipt State
  const [isVendorDialogOpen, setIsVendorDialogOpen] = useState(false);
  const [editingVendorOrder, setEditingVendorOrder] = useState<any>(null);

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

  const openVendorReceipt = (order: any) => {
    setEditingVendorOrder({
      ...order,
      items: Array.isArray(order.items) ? order.items.map((item: any) => ({ ...item })) : []
    });
    setIsVendorDialogOpen(true);
  };

  const updateVendorItem = (index: number, field: string, value: any) => {
    if (!editingVendorOrder) return;
    const newItems = [...editingVendorOrder.items];
    newItems[index] = { ...newItems[index], [field]: field === 'name' ? value : parseFloat(value) || 0 };
    setEditingVendorOrder({ ...editingVendorOrder, items: newItems });
  };

  const removeVendorItem = (index: number) => {
    if (!editingVendorOrder) return;
    const newItems = editingVendorOrder.items.filter((_: any, i: number) => i !== index);
    setEditingVendorOrder({ ...editingVendorOrder, items: newItems });
  };

  const handleDownload = async (id: string, type: 'customer' | 'vendor') => {
    const element = document.getElementById(`receipt-content-${type}-${id}`);
    if (!element || !id) return;
    setDownloadingId(id);
    try {
      const { toBlob } = await import('html-to-image');
      const FileSaver = await import('file-saver');
      const saveAs = FileSaver.saveAs || (FileSaver as any).default;
      
      const blob = await toBlob(element, { 
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });
      
      if (blob && typeof saveAs === 'function') {
        saveAs(blob, `ShopyKart_${type === 'vendor' ? 'Vendor' : 'Admin'}_Bill_${id.slice(-5)}.jpg`);
        toast({ title: "Receipt Saved!" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Download Failed" });
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrint = (id: string, type: 'customer' | 'vendor') => {
    const element = document.getElementById(`receipt-content-${type}-${id}`);
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
            body { margin: 0; padding: 0; display: flex; justify-content: center; font-family: monospace; }
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

  const generateVendorReceiptDOM = (orderData: any) => {
    if (!orderData) return null;
    const subtotal = orderData.items?.reduce((acc: any, it: any) => acc + (Number(it.price) * Number(it.quantity)), 0) || 0;
    const dateStr = orderData.createdAt?.seconds ? format(new Date(orderData.createdAt.seconds * 1000), 'dd/MM/yy HH:mm') : format(new Date(), 'dd/MM/yy HH:mm');
    
    return (
      <div id={`receipt-content-vendor-${orderData.id}`} className="bg-white text-black p-6 font-mono text-[10px] uppercase leading-tight w-[300px] border border-gray-100 shadow-xl">
        <div className="text-center mb-4">
          <h2 className="text-xl font-black italic tracking-tighter leading-none mb-1">VENDOR COPY</h2>
          <p className="text-[7px] font-bold opacity-60">SHOPYKART PARTNER NETWORK</p>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="space-y-1">
          <div className="flex justify-between"><span>ORDER ID:</span><span className="font-black">#{orderData.orderDisplayId || orderData.id.slice(-5)}</span></div>
          <div className="flex justify-between"><span>DATE:</span><span>{dateStr}</span></div>
          <div className="flex justify-between"><span>CUSTOMER:</span><span className="font-black">{orderData.customerName?.slice(0,18)}</span></div>
          <div className="flex justify-between"><span>ADDRESS:</span><span className="font-black text-right max-w-[120px]">{orderData.address}</span></div>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <table className="w-full text-[9px]">
          <thead>
            <tr className="border-b border-dashed border-black">
              <th className="text-left py-1" width="60%">ITEM</th>
              <th className="text-center py-1" width="15%">QTY</th>
              <th className="text-right py-1" width="25%">AMT</th>
            </tr>
          </thead>
          <tbody>
            {orderData.items?.map((item: any, i: number) => (
              <tr key={i}>
                <td className="py-2 pr-1 font-black leading-tight">
                  {item.name}
                  {item.selectedOption && <span className="block text-[7px] font-bold opacity-60">[{item.selectedOption.name}]</span>}
                </td>
                <td className="text-center">X{item.quantity}</td>
                <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="border-t border-dashed border-black my-2 pt-2">
           <div className="flex justify-between font-black text-xs"><span>ITEMS TOTAL</span><span>₹{subtotal.toFixed(2)}</span></div>
        </div>

        <div className="border-t border-dashed border-black my-3" />
        
        {orderData.instructions && (
           <div className="bg-gray-50 p-2 rounded border border-dashed border-black/10">
              <span className="font-black block text-[8px]">INSTRUCTIONS:</span>
              <p className="text-[9px] leading-tight italic font-black">{orderData.instructions}</p>
           </div>
        )}

        <div className="text-center text-[7px] font-black tracking-widest opacity-60 mt-6">POWERED BY SHOPYKART</div>
      </div>
    );
  };

  const generateCustomerReceiptDOM = (orderData: any) => {
    if (!orderData) return null;
    const upiUri = `upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${orderData.total?.toFixed(2)}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
    const subtotal = orderData.subtotal || orderData.items?.reduce((acc:any, it:any) => acc + (it.price * it.quantity), 0) || 0;
    const dateStr = orderData.createdAt?.seconds ? format(new Date(orderData.createdAt.seconds * 1000), 'dd/MM/yy HH:mm') : '--';
    
    return (
      <div id={`receipt-content-customer-${orderData.id}`} className="bg-white text-black p-6 font-mono text-[10px] uppercase leading-tight w-[300px] border border-gray-100 shadow-xl">
        <div className="text-center mb-4">
          <h2 className="text-xl font-black italic tracking-tighter leading-none mb-1">SHOPYKART</h2>
          <p className="text-[8px] whitespace-pre-line leading-tight">{settings?.receiptHeader || 'MAURANIPUR, UP'}</p>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="space-y-1">
          <div className="flex justify-between"><span>ORDER ID:</span><span className="font-black">#{orderData.orderDisplayId || orderData.id.slice(-5)}</span></div>
          <div className="flex justify-between"><span>DATE:</span><span>{dateStr}</span></div>
          <div className="flex justify-between"><span>CUSTOMER:</span><span>{orderData.customerName?.slice(0,18)}</span></div>
          <div className="flex justify-between"><span>ADDRESS:</span><span className="font-black text-right max-w-[120px]">{orderData.address}</span></div>
          <div className="flex justify-between"><span>PAYMENT:</span><span className="font-black">{orderData.paymentMethod === 'online' ? 'ONLINE' : 'CASH'}</span></div>
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
              <tr key={i}>
                <td className="py-2 pr-1 font-black leading-tight">{item.name} {item.selectedOption && `[${item.selectedOption.name}]`}</td>
                <td className="text-center">X{item.quantity}</td>
                <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="border-t border-dashed border-black my-2 pt-2 space-y-1">
           <div className="flex justify-between"><span>SUBTOTAL:</span><span className="font-black">₹{subtotal.toFixed(2)}</span></div>
           {orderData.couponDiscount > 0 && <div className="flex justify-between"><span>COUPON:</span><span className="font-black">-₹{orderData.couponDiscount.toFixed(2)}</span></div>}
           {orderData.coinDiscount > 0 && <div className="flex justify-between"><span>COINS:</span><span className="font-black">-₹{orderData.coinDiscount.toFixed(2)}</span></div>}
        </div>

        <div className="border-t-2 border-black mt-2 pt-2 flex justify-between font-black text-sm italic"><span>TOTAL</span><span>₹{orderData.total?.toFixed(2)}</span></div>
        
        <div className="border-t border-dashed border-black my-3" />
        <div className="border border-dashed border-black p-3 text-center mb-3">
           <img src={qrUrl} className="w-24 h-24 mx-auto grayscale" alt="QR" crossOrigin="anonymous" />
        </div>
        <div className="text-center text-[7px] font-black tracking-widest opacity-60">POWERED BY SHOPYKART</div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">ORDER OPERATIONS</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Real-time order dashboard</p>
        </div>
        <Badge variant="outline" className="rounded-full border-primary/20 text-primary font-black uppercase text-xs px-4 py-1.5 shadow-sm">
          {orders?.length || 0} TOTAL
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-8 pb-32">
        {orders?.map((order: any) => {
          const isCancelled = order.status === 'Cancelled';
          const isDelivered = order.status === 'Delivered';

          return (
            <div key={order.id} className="bg-white rounded-[3rem] p-8 border border-border/40 shadow-sm transition-all hover:shadow-xl group transform-gpu">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-6">
                  <div className={cn(
                    "h-20 w-20 rounded-[1.75rem] flex items-center justify-center border-2 shrink-0 transition-colors",
                    isCancelled ? "bg-red-50 border-red-100 text-red-600" : isDelivered ? "bg-green-50 border-green-100 text-green-600" : "bg-primary/5 border-primary/10 text-primary"
                  )}>
                    <Package className="h-10 w-10" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <h3 className="font-black text-3xl italic uppercase tracking-tighter">#{order.orderDisplayId || order.id.slice(-4)}</h3>
                       <Badge className={cn(
                         "border-none text-[8px] font-black uppercase px-2.5 py-1 rounded-full",
                         isCancelled ? "bg-red-100 text-red-600" : isDelivered ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"
                       )}>{order.status.toUpperCase()}</Badge>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 flex items-center gap-1.5">
                          <Banknote className="h-3.5 w-3.5 text-amber-700" />
                          <span className="text-[10px] font-black text-amber-800 uppercase tracking-tight">{order.paymentMethod === 'online' ? 'PREPAID ONLINE' : 'CASH ON DELIVERY'}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase mt-3 tracking-widest italic">
                       <Clock className="h-3.5 w-3.5" />
                       {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Recently'}
                    </div>
                  </div>
                </div>
              </div>

              {/* DETAILS BOX */}
              <div className="bg-[#F9FAFB] rounded-[2rem] p-6 mb-8 border border-border/50 shadow-inner">
                 <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                          <User className="h-5 w-5" />
                       </div>
                       <span className="font-black text-lg italic uppercase tracking-tight text-gray-800">{order.customerName}</span>
                    </div>
                    <button 
                      onClick={() => window.open(`tel:${order.customerPhone}`)}
                      className="h-12 w-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-green-100 active:scale-90 transition-all"
                    >
                       <PhoneCall className="h-6 w-6" />
                    </button>
                 </div>

                 <div className="space-y-4 pt-1">
                    <div className="bg-white/60 p-1.5 rounded-full inline-flex items-center gap-2 border border-white pr-4">
                       <div className="bg-red-50 p-1.5 rounded-full text-red-500"><Store className="h-3.5 w-3.5" /></div>
                       <span className="text-[10px] font-black uppercase text-red-800 tracking-tight">{order.restaurantName || 'Gourmet Store'}</span>
                    </div>

                    <div className="space-y-2.5 px-1">
                       {order.items?.map((item: any, i: number) => (
                         <div key={i} className="flex justify-between items-center text-sm font-bold italic">
                            <span className="text-gray-600">{item.quantity}x <span className="uppercase">{item.name}</span> {item.selectedOption && <span className="text-[10px] font-black text-primary">({item.selectedOption.name})</span>}</span>
                            <span className="text-primary font-black">₹{(item.price * item.quantity).toFixed(0)}</span>
                         </div>
                       ))}
                    </div>

                    <div className="pt-4 mt-2 border-t border-dashed border-gray-200 flex items-center gap-3">
                       <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center text-primary shadow-sm shrink-0">
                          <MapPin className="h-4 w-4" />
                       </div>
                       <p className="text-[10px] font-black text-gray-500 uppercase leading-relaxed tracking-tight">{order.address}</p>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-4">
                <Select defaultValue={order.status} onValueChange={(val) => handleStatusUpdate(order.id, val)}>
                  <SelectTrigger className="w-full h-14 rounded-2xl font-black text-xs uppercase bg-gray-50 border-none shadow-none text-gray-900"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-[1.5rem] border-none shadow-2xl">{statusOptions.map(s => <SelectItem key={s} value={s} className="font-bold text-xs py-3 uppercase">{s}</SelectItem>)}</SelectContent>
                </Select>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="w-full bg-white border-2 border-primary/20 text-primary h-14 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 active:scale-[0.98] transition-all">
                      <Eye className="h-4 w-4" /> VIEW BILL
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[340px] rounded-[2.5rem] p-0 overflow-hidden bg-white flex flex-col max-h-[85vh] z-[11000] border-none">
                     <DialogHeader className="sr-only">
                       <DialogTitle>Receipt Preview</DialogTitle>
                       <DialogDescription>Administrative copy of the order bill.</DialogDescription>
                     </DialogHeader>
                     <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col items-center">
                        {generateCustomerReceiptDOM(order)}
                     </div>
                     <div className="p-4 bg-gray-50 border-t flex gap-3 shrink-0">
                        <Button onClick={() => handlePrint(order.id, 'customer')} className="flex-1 bg-black text-white h-12 rounded-xl font-black uppercase text-[10px]">PRINT</Button>
                        <Button onClick={() => handleDownload(order.id, 'customer')} disabled={downloadingId === order.id} className="flex-1 bg-primary text-white h-12 rounded-xl font-black uppercase text-[10px]">SAVE</Button>
                     </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          );
        })}
      </div>

      {/* VENDOR RECEIPT DIALOG - FULL SCREEN MODE */}
      <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
        <DialogContent className="rounded-t-[3rem] sm:rounded-[3rem] max-w-7xl w-[95vw] p-0 overflow-hidden border-none shadow-2xl bg-[#F9FAFB] flex flex-col h-[90vh] z-[12000] focus:outline-none">
          <DialogHeader className="p-6 bg-white border-b shrink-0 flex flex-row items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="bg-black p-2.5 rounded-xl text-primary"><Edit3 className="h-5 w-5" /></div>
                <DialogTitle className="font-black italic uppercase text-xl text-black">Vendor Bill Portal</DialogTitle>
             </div>
             <button onClick={() => setIsVendorDialogOpen(false)} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 active:scale-90"><X className="h-5 w-5" /></button>
          </DialogHeader>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
             {/* LEFT: EDITING PANEL */}
             <div className="flex-1 overflow-y-auto no-scrollbar p-6 lg:p-10 space-y-8 pointer-events-auto">
                {editingVendorOrder && (
                  <>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm space-y-6">
                       <h4 className="text-[11px] font-black uppercase text-primary tracking-[0.2em] ml-1">Order Summary</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Customer Identity</label>
                             <Input 
                              value={editingVendorOrder.customerName || ''} 
                              onChange={e => setEditingVendorOrder({...editingVendorOrder, customerName: e.target.value})} 
                              className="h-14 rounded-2xl bg-gray-50 border-none font-bold text-lg uppercase focus-visible:ring-1 focus-visible:ring-primary/20" 
                             />
                          </div>
                          <div className="space-y-1.5">
                             <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Delivery Address</label>
                             <Input 
                              value={editingVendorOrder.address || ''} 
                              onChange={e => setEditingVendorOrder({...editingVendorOrder, address: e.target.value})} 
                              className="h-14 rounded-2xl bg-gray-50 border-none font-bold text-sm uppercase focus-visible:ring-1 focus-visible:ring-primary/20" 
                             />
                          </div>
                       </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-border shadow-sm space-y-6">
                       <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[11px] font-black uppercase text-primary tracking-[0.2em] ml-1">Items & Rates</h4>
                          <Button variant="ghost" onClick={() => {
                            const newItems = [...editingVendorOrder.items, { name: 'New Item', quantity: 1, price: 0 }];
                            setEditingVendorOrder({...editingVendorOrder, items: newItems});
                          }} className="h-9 text-[10px] font-black text-primary bg-primary/5 hover:bg-primary hover:text-white rounded-full transition-all px-4"><Plus className="h-3.5 w-3.5 mr-1" /> ADD ITEM</Button>
                       </div>
                       
                       <div className="space-y-4">
                          {editingVendorOrder.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex flex-col md:flex-row gap-3 bg-gray-50 p-4 rounded-3xl border border-border group animate-in slide-in-from-right-2">
                               <div className="flex-1">
                                  <label className="text-[7px] font-black uppercase text-gray-400 ml-2 mb-1 block">Item Name</label>
                                  <Input 
                                    value={item.name} 
                                    onChange={e => updateVendorItem(idx, 'name', e.target.value)} 
                                    className="h-12 rounded-xl bg-white border-none font-bold text-sm" 
                                  />
                               </div>
                               <div className="grid grid-cols-2 md:flex gap-3">
                                  <div className="w-full md:w-20">
                                     <label className="text-[7px] font-black uppercase text-gray-400 ml-2 mb-1 block">Qty</label>
                                     <Input 
                                      type="number" 
                                      value={item.quantity} 
                                      onChange={e => updateVendorItem(idx, 'quantity', e.target.value)} 
                                      className="h-12 rounded-xl bg-white border-none font-black text-center" 
                                     />
                                  </div>
                                  <div className="w-full md:w-28">
                                     <label className="text-[7px] font-black uppercase text-gray-400 ml-2 mb-1 block">Rate (₹)</label>
                                     <Input 
                                      type="number" 
                                      value={item.price} 
                                      onChange={e => updateVendorItem(idx, 'price', e.target.value)} 
                                      className="h-12 rounded-xl bg-white border-none font-black text-center text-primary" 
                                     />
                                  </div>
                               </div>
                               <div className="flex items-end pb-1 justify-end md:justify-start">
                                  <button onClick={() => removeVendorItem(idx)} className="h-10 w-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center active:scale-90 transition-all hover:bg-red-500 hover:text-white"><Trash2 className="h-4.5 w-4.5" /></button>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  </>
                )}
             </div>

             {/* RIGHT: LIVE PREVIEW PANEL */}
             <div className="w-full lg:w-[450px] bg-white border-l border-border p-10 flex flex-col items-center shrink-0">
                <div className="bg-primary/10 px-6 py-2 rounded-full mb-10 border border-primary/20 flex items-center gap-2">
                   <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                   <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Live Thermal Preview</span>
                </div>
                
                <div className="scale-[1.1] origin-top transform-gpu shadow-[0_30px_60px_rgba(0,0,0,0.1)] mb-10">
                   {editingVendorOrder && generateVendorReceiptDOM(editingVendorOrder)}
                </div>

                <div className="w-full mt-auto space-y-4 pt-10">
                   {editingVendorOrder && (
                    <div className="grid grid-cols-2 gap-4">
                      <Button onClick={() => handlePrint(editingVendorOrder.id, 'vendor')} className="h-16 bg-black hover:bg-gray-900 text-white rounded-[2rem] font-black uppercase italic text-lg shadow-xl shadow-gray-200">
                        <Printer className="h-5 w-5 mr-2" /> PRINT
                      </Button>
                      <Button 
                        onClick={() => handleDownload(editingVendorOrder.id, 'vendor')} 
                        disabled={downloadingId === editingVendorOrder.id} 
                        className="h-16 bg-primary hover:bg-red-600 text-white rounded-[2rem] font-black uppercase italic text-lg shadow-xl shadow-primary/20"
                      >
                        {downloadingId === editingVendorOrder.id ? <Loader2 className="h-6 w-6 animate-spin mr-2" /> : <Download className="h-5 w-5 mr-2" />} SAVE
                      </Button>
                    </div>
                   )}
                   <p className="text-center text-[8px] font-black text-gray-300 uppercase tracking-[0.5em]">Optimized for Thermal Print</p>
                </div>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
