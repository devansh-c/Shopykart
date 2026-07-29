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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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

  const handleOpenGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    window.open(url, '_blank');
  };

  const openVendorReceipt = (order: any) => {
    setEditingVendorOrder({
      ...order,
      items: order.items.map((item: any) => ({ ...item }))
    });
    setIsVendorDialogOpen(true);
  };

  const updateVendorItem = (index: number, field: string, value: any) => {
    if (!editingVendorOrder) return;
    const newItems = [...editingVendorOrder.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditingVendorOrder({ ...editingVendorOrder, items: newItems });
  };

  const removeVendorItem = (index: number) => {
    if (!editingVendorOrder) return;
    const newItems = editingVendorOrder.items.filter((_: any, i: number) => i !== index);
    setEditingVendorOrder({ ...editingVendorOrder, items: newItems });
  };

  const handleDownload = async (id: string, type: 'customer' | 'vendor') => {
    const element = document.getElementById(`receipt-content-${type}-${id}`);
    if (!element) return;
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

  // VENDOR RECEIPT DOM (NO QR, NO TAX)
  const generateVendorReceiptDOM = (orderData: any) => {
    if (!orderData) return null;
    const subtotal = orderData.items?.reduce((acc: any, it: any) => acc + (Number(it.price) * Number(it.quantity)), 0) || 0;
    const dateStr = orderData.createdAt?.seconds ? format(new Date(orderData.createdAt.seconds * 1000), 'dd/MM/yy HH:mm') : format(new Date(), 'dd/MM/yy HH:mm');
    
    return (
      <div id={`receipt-content-vendor-${orderData.id}`} className="bg-white text-black p-5 font-mono text-[10px] uppercase leading-tight w-[280px] mx-auto border border-gray-100">
        <div className="text-center mb-4">
          <h2 className="text-xl font-black italic tracking-tighter leading-none">VENDOR COPY</h2>
          <p className="text-[7px] font-bold opacity-60 mb-2">SHOPYKART PARTNER NETWORK</p>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="space-y-1">
          <div className="flex justify-between"><span>ORDER ID:</span><span className="font-black">#{orderData.orderDisplayId || orderData.id.slice(-5)}</span></div>
          <div className="flex justify-between"><span>DATE:</span><span>{dateStr}</span></div>
          <div className="flex justify-between"><span>CUSTOMER:</span><span className="font-black">{orderData.customerName?.slice(0,18)}</span></div>
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
                  {item.instructions && <span className="block text-[7px] text-primary italic lowercase">Note: {item.instructions}</span>}
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
           <div className="bg-gray-50 p-2 rounded border border-dashed border-black/10 mb-2">
              <span className="font-black block text-[8px]">PREPARATION NOTE:</span>
              <p className="text-[9px] leading-tight italic font-black">{orderData.instructions}</p>
           </div>
        )}

        <div className="text-center text-[7px] font-black tracking-widest opacity-60 mt-4">POWERED BY SHOPYKART FOR VENDORS</div>
      </div>
    );
  };

  // CUSTOMER/ADMIN RECEIPT DOM (WITH QR & TAX)
  const generateCustomerReceiptDOM = (orderData: any) => {
    if (!orderData) return null;
    const upiUri = `upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${orderData.total?.toFixed(2)}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
    const subtotal = orderData.subtotal || orderData.items?.reduce((acc:any, it:any) => acc + (it.price * it.quantity), 0) || 0;
    const dateStr = orderData.createdAt?.seconds ? format(new Date(orderData.createdAt.seconds * 1000), 'dd/MM/yy HH:mm') : '--';
    
    return (
      <div id={`receipt-content-customer-${orderData.id}`} className="bg-white text-black p-5 font-mono text-[10px] uppercase leading-tight w-[280px] mx-auto border border-gray-100">
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
                <td className="py-2 pr-1 font-black leading-tight">
                  {item.name}
                  {item.selectedOption && <span className="block text-[7px] font-bold opacity-60">[{item.selectedOption.name}]</span>}
                  {item.instructions && <span className="block text-[7px] text-primary italic lowercase">Note: {item.instructions}</span>}
                </td>
                <td className="text-center">X{item.quantity}</td>
                <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
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
           {orderData.deliveryTip > 0 && <div className="flex justify-between"><span>RIDER TIP:</span><span className="font-black">₹{orderData.deliveryTip.toFixed(2)}</span></div>}
        </div>

        <div className="border-t-2 border-black mt-2 pt-2 flex justify-between font-black text-sm italic"><span>GRAND TOTAL</span><span>₹{orderData.total?.toFixed(2)}</span></div>
        
        <div className="border-t border-dashed border-black my-3" />
        <div className="border border-dashed border-black p-3 text-center mb-3">
           <p className="text-[7px] font-black tracking-widest mb-1">PAYMENT QR</p>
           <img src={qrUrl} className="w-24 h-24 mx-auto grayscale" alt="QR" crossOrigin="anonymous" />
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
          const isElite = order.isPremiumOrder === true;

          return (
            <div key={order.id} className={cn(
              "bg-white p-6 rounded-[2.5rem] border border-border/50 hover:shadow-xl transition-all group relative overflow-hidden",
              isElite && "border-amber-200 shadow-lg shadow-amber-50"
            )}>
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                <div className="flex-1 flex items-start space-x-5">
                  <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shrink-0", order.status === 'Delivered' ? 'bg-green-50 text-green-600' : isElite ? 'bg-amber-50 text-amber-600' : 'bg-primary/5 text-primary')}>
                    <Package className="h-7 w-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <h3 className="font-black text-lg italic uppercase">#{order.orderDisplayId || order.id.slice(-5)}</h3>
                      <Badge className={cn("text-[8px] font-black uppercase rounded-full border-none px-2", order.status === 'Delivered' ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary")}>{order.status}</Badge>
                      <Badge className="bg-blue-50 text-blue-600 border border-blue-100 text-[8px] font-black uppercase px-2">{order.paymentMethod === 'online' ? 'PREPAID' : 'CASH'}</Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground font-bold uppercase tracking-widest mb-4"><Clock className="h-3 w-3" />{isMounted && order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Now'}</div>
                    
                    <div className="bg-muted/20 rounded-2xl p-4 space-y-3 mb-4 border border-border/30">
                       <div className="flex items-center justify-between text-xs font-bold text-gray-700 border-b border-white pb-2 mb-1">
                          <span className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-primary" />{order.customerName}</span>
                          <button onClick={() => window.open(`tel:${order.customerPhone}`)} className="p-2 bg-green-500 text-white rounded-xl shadow-md active:scale-90 transition-all"><PhoneCall className="h-3.5 w-3.5" /></button>
                       </div>
                       <div className="pt-1 space-y-1">
                          {order.items?.map((item: any, i: number) => (
                            <div key={i} className="flex flex-col text-[10px] font-bold text-gray-600 italic mb-1.5">
                               <div className="flex justify-between">
                                  <span>{item.quantity}x {item.name} {item.selectedOption && <span className="text-primary font-black uppercase text-[8px]">({item.selectedOption.name})</span>}</span>
                                  <span className="text-primary">₹{item.price * item.quantity}</span>
                               </div>
                               {item.instructions && (
                                 <div className="flex items-center gap-1 mt-0.5 text-[8px] text-red-500 lowercase font-black">
                                    <MessageSquareQuote className="h-2 w-2" /> Note: {item.instructions}
                                 </div>
                               )}
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Select defaultValue={order.status} onValueChange={(val) => handleStatusUpdate(order.id, val)}>
                    <SelectTrigger className="w-[180px] rounded-xl font-black text-[10px] uppercase h-11 bg-muted/30 border-none shadow-none"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">{statusOptions.map(s => <SelectItem key={s} value={s} className="font-bold text-xs">{s}</SelectItem>)}</SelectContent>
                  </Select>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="bg-white border-2 border-primary/20 text-primary h-11 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Customer Bill</button>
                      </DialogTrigger>
                      <DialogContent className="max-w-[340px] rounded-[2.5rem] p-0 overflow-hidden bg-white flex flex-col max-h-[85vh] z-[11000]">
                         <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col items-center">
                            <div className="w-full scale-[1.05] origin-top mb-4">
                              {generateCustomerReceiptDOM(order)}
                            </div>
                         </div>
                         <div className="p-4 bg-gray-50 border-t flex gap-3 shrink-0">
                            <Button onClick={() => handlePrint(order.id, 'customer')} className="flex-1 bg-black text-white h-12 rounded-xl font-black uppercase text-[10px]">PRINT</Button>
                            <Button onClick={() => handleDownload(order.id, 'customer')} disabled={downloadingId === order.id} className="flex-1 bg-primary text-white h-12 rounded-xl font-black uppercase text-[10px]">SAVE</Button>
                         </div>
                      </DialogContent>
                    </Dialog>

                    <button 
                      onClick={() => openVendorReceipt(order)}
                      className="bg-black text-white h-11 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg"
                    >
                      <Store className="h-3.5 w-3.5 text-primary" /> Vendor Receipt
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* VENDOR RECEIPT DIALOG - EDITABLE PORTAL */}
      <Dialog open={isVendorDialogOpen} onOpenChange={setIsVendorDialogOpen}>
        <DialogContent className="rounded-t-[3rem] sm:rounded-[3rem] max-w-4xl p-0 overflow-hidden border-none shadow-2xl bg-[#F9FAFB] flex flex-col h-[90vh] z-[12000] focus:outline-none">
          <DialogHeader className="p-6 bg-white border-b shrink-0">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="bg-black p-2.5 rounded-xl text-primary"><Edit3 className="h-5 w-5" /></div>
                   <DialogTitle className="font-black italic uppercase text-xl">Vendor Bill Portal</DialogTitle>
                </div>
                <button onClick={() => setIsVendorDialogOpen(false)} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400"><X className="h-5 w-5" /></button>
             </div>
          </DialogHeader>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
             {/* LEFT: EDITING PANEL */}
             <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
                {editingVendorOrder && (
                  <>
                    <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm space-y-4">
                       <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Order Summary</h4>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="text-[8px] font-black uppercase text-gray-400">Order ID</label>
                             <Input value={editingVendorOrder.orderDisplayId} onChange={e => setEditingVendorOrder({...editingVendorOrder, orderDisplayId: e.target.value})} className="h-10 rounded-xl bg-gray-50 border-none font-bold" />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[8px] font-black uppercase text-gray-400">Customer</label>
                             <Input value={editingVendorOrder.customerName} onChange={e => setEditingVendorOrder({...editingVendorOrder, customerName: e.target.value})} className="h-10 rounded-xl bg-gray-50 border-none font-bold" />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase text-gray-400">Vendor Instructions</label>
                          <Input value={editingVendorOrder.instructions} onChange={e => setEditingVendorOrder({...editingVendorOrder, instructions: e.target.value})} className="h-10 rounded-xl bg-gray-50 border-none font-bold" placeholder="Chef instructions..." />
                       </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-border shadow-sm space-y-4">
                       <div className="flex items-center justify-between mb-2">
                          <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">Items to Cook</h4>
                          <Button variant="ghost" onClick={() => {
                            const newItems = [...editingVendorOrder.items, { name: 'New Item', quantity: 1, price: 0 }];
                            setEditingVendorOrder({...editingVendorOrder, items: newItems});
                          }} className="h-8 text-[9px] font-black text-primary hover:bg-primary/5 rounded-full"><Plus className="h-3 w-3 mr-1" /> ADD ITEM</Button>
                       </div>
                       
                       <div className="space-y-3">
                          {editingVendorOrder.items.map((item: any, idx: number) => (
                            <div key={idx} className="flex gap-2 bg-gray-50 p-3 rounded-2xl border border-border group animate-in slide-in-from-right-2">
                               <div className="flex-1">
                                  <Input value={item.name} onChange={e => updateVendorItem(idx, 'name', e.target.value)} className="h-9 rounded-lg bg-white border-none font-bold text-[11px]" />
                               </div>
                               <div className="w-16">
                                  <Input type="number" value={item.quantity} onChange={e => updateVendorItem(idx, 'quantity', e.target.value)} className="h-9 rounded-lg bg-white border-none font-black text-center text-xs" />
                               </div>
                               <div className="w-20">
                                  <Input type="number" value={item.price} onChange={e => updateVendorItem(idx, 'price', e.target.value)} className="h-9 rounded-lg bg-white border-none font-black text-center text-xs text-primary" />
                               </div>
                               <button onClick={() => removeVendorItem(idx)} className="h-9 w-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          ))}
                       </div>
                    </div>
                  </>
                )}
             </div>

             {/* RIGHT: LIVE PREVIEW */}
             <div className="w-full lg:w-[360px] bg-white border-l border-border p-6 flex flex-col items-center">
                <div className="bg-primary/10 px-4 py-1.5 rounded-full mb-6 border border-primary/20">
                   <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><Eye className="h-3 w-3" /> Live Vendor Preview</span>
                </div>
                
                <div className="scale-[0.95] origin-top transform-gpu shadow-2xl">
                   {editingVendorOrder && generateVendorReceiptDOM(editingVendorOrder)}
                </div>

                <div className="w-full mt-auto space-y-3 pt-10">
                   {editingVendorOrder && (
                    <div className="grid grid-cols-2 gap-3">
                      <Button onClick={() => handlePrint(editingVendorOrder.id, 'vendor')} className="h-14 bg-black text-white rounded-2xl font-black uppercase italic shadow-xl">
                        <Printer className="h-4 w-4 mr-2" /> PRINT
                      </Button>
                      <Button onClick={() => handleDownload(editingVendorOrder.id, 'vendor')} disabled={downloadingId === editingVendorOrder.id} className="h-14 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl">
                        {downloadingId === editingVendorOrder.id ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />} SAVE
                      </Button>
                    </div>
                   )}
                   <p className="text-center text-[7px] font-black text-muted-foreground uppercase tracking-[0.4em]">Optimized for Thermal Print</p>
                </div>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
