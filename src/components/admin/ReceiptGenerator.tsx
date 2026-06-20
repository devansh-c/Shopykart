"use client"

import { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Printer, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  Banknote, 
  Receipt as ReceiptIcon, 
  Loader2,
  Package,
  PlusCircle,
  IndianRupee,
  RefreshCw,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { format } from 'date-fns';

type Item = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

export default function ReceiptGenerator() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [orderId, setOrderId] = useState(() => Math.floor(10000 + Math.random() * 90000).toString());
  const [items, setItems] = useState<Item[]>([
    { id: '1', name: '', quantity: 1, price: 0 }
  ]);

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [items]);

  const gst = useMemo(() => subtotal * 0.05, [subtotal]);
  const total = useMemo(() => subtotal + gst, [subtotal, gst]);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', quantity: 1, price: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof Item, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: field === 'name' ? value : parseFloat(value) || 0 } : item
    ));
  };

  const handleDownload = async () => {
    const element = document.getElementById('generated-receipt-dom');
    if (!element) return;

    setIsDownloading(true);
    try {
      const { toJpeg } = await import('html-to-image');
      const { saveAs } = await import('file-saver');
      
      const dataUrl = await toJpeg(element, { 
        quality: 0.95, 
        backgroundColor: '#ffffff',
        pixelRatio: 2
      });
      
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      saveAs(blob, `Manual_Receipt_${orderId}.jpg`);
      toast({ title: "Receipt Saved! ✅" });
    } catch (err) {
      toast({ variant: "destructive", title: "Download Failed" });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const element = document.getElementById('generated-receipt-dom');
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

  const resetForm = () => {
    setOrderId(Math.floor(10000 + Math.random() * 90000).toString());
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setItems([{ id: '1', name: '', quantity: 1, price: 0 }]);
  };

  const receiptPreview = (
    <div id="generated-receipt-dom" className="bg-white text-black p-6 font-mono text-[10px] uppercase leading-tight w-[300px] border border-gray-100 shadow-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black italic tracking-tighter leading-none mb-1">SHOPYKART</h2>
        <p className="text-[7px] font-bold opacity-60">PREMIUM DELIVERY NETWORK</p>
        <p className="text-[8px] whitespace-pre-line leading-tight mt-3">{settings?.receiptHeader || 'MAIN ROAD, MAURANIPUR\nGSTIN: 09ABCDE1234F1Z5'}</p>
      </div>

      <div className="border-t border-dashed border-black my-3" />

      <div className="space-y-1">
        <div className="flex justify-between"><span>ORDER ID:</span><span className="font-black">#{orderId}</span></div>
        <div className="flex justify-between"><span>DATE:</span><span>{format(new Date(), 'dd/MM/yy HH:mm')}</span></div>
        <div className="flex justify-between"><span>CUSTOMER:</span><span className="font-black truncate max-w-[150px]">{customerName || 'Walk-in Guest'}</span></div>
        <div className="flex justify-between"><span>PAYMENT:</span><span className="font-black">{paymentMethod === 'online' ? 'PREPAID UPI' : 'CASH ON DELIVERY'}</span></div>
      </div>

      <div className="border-t border-dashed border-black my-3" />
      
      {customerAddress && (
        <div className="space-y-1 mb-3">
           <span className="font-black block">ADDRESS:</span>
           <p className="text-[9px] leading-tight opacity-80">{customerAddress}</p>
        </div>
      )}

      <div className="border-t border-dashed border-black my-3" />

      <table className="w-full text-[9px]">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="text-left py-1" width="55%">ITEM</th>
            <th className="text-center py-1" width="15%">QTY</th>
            <th className="text-right py-1" width="30%">AMT</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            item.name && (
              <tr key={item.id} className="border-b border-dashed border-black/5">
                <td className="py-2 pr-1 font-black leading-tight">{item.name}</td>
                <td className="text-center">{item.quantity}</td>
                <td className="text-right">{(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            )
          ))}
        </tbody>
      </table>
      
      <div className="border-t border-dashed border-black my-3 pt-3 space-y-1.5">
         <div className="flex justify-between"><span>SUBTOTAL:</span><span className="font-black">₹{subtotal.toFixed(2)}</span></div>
         <div className="flex justify-between"><span>TAX (GST 5%):</span><span className="font-black">₹{gst.toFixed(2)}</span></div>
      </div>

      <div className="border-t-2 border-black mt-3 pt-3 flex justify-between items-center text-base font-black italic">
        <span>GRAND TOTAL</span>
        <span>₹{total.toFixed(2)}</span>
      </div>

      <div className="border-t border-dashed border-black my-4" />

      <div className="text-center space-y-3">
        <p className="font-black text-[11px] italic">{settings?.receiptThankYou || 'ENJOY YOUR DELICIOUS MEAL!'}</p>
        <p className="text-[7px] opacity-70 whitespace-pre-line uppercase leading-relaxed">{settings?.receiptFooter || 'THIS IS A COMPUTER GENERATED INVOICE'}</p>
        <div className="pt-2">
          <span className="text-[6px] font-black tracking-[0.3em] border border-black px-2 py-0.5">POWERED BY SHOPYKART POS</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl pb-32 animate-in fade-in duration-500">
      
      {/* 1. INPUT FORM */}
      <div className="space-y-8 bg-white p-8 rounded-[3rem] border border-border/50 shadow-sm">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary"><ReceiptIcon className="h-6 w-6" /></div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">Bill Composer</h2>
           </div>
           <Button variant="ghost" onClick={resetForm} className="h-10 w-10 p-0 rounded-full text-gray-400 hover:text-primary"><RefreshCw className="h-4 w-4" /></Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
           <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Order #</label>
              <Input value={orderId} onChange={e => setOrderId(e.target.value)} className="h-12 rounded-xl font-black bg-muted/20 border-none" />
           </div>
           <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Payment</label>
              <div className="flex gap-2 p-1 bg-muted/20 rounded-xl">
                 <button onClick={() => setPaymentMethod('online')} className={cn("flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all", paymentMethod === 'online' ? "bg-white shadow-sm text-primary" : "text-gray-400")}>UPI</button>
                 <button onClick={() => setPaymentMethod('cod')} className={cn("flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all", paymentMethod === 'cod' ? "bg-white shadow-sm text-primary" : "text-gray-400")}>CASH</button>
              </div>
           </div>
        </div>

        <div className="space-y-4 pt-2">
           <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="CUSTOMER NAME" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-14 pl-12 rounded-2xl bg-muted/20 border-none font-bold uppercase" />
           </div>
           <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="PHONE NUMBER" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="h-14 pl-12 rounded-2xl bg-muted/20 border-none font-bold" />
           </div>
           <div className="relative group">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="ADDRESS / AREA" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="h-14 pl-12 rounded-2xl bg-muted/20 border-none font-bold uppercase" />
           </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-dashed">
           <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Add Products</h3>
              <button onClick={handleAddItem} className="flex items-center gap-1.5 text-[10px] font-black text-primary bg-primary/5 px-4 py-2 rounded-full hover:bg-primary hover:text-white transition-all"><PlusCircle className="h-4 w-4" /> ADD ROW</button>
           </div>
           
           <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 bg-muted/10 p-3 rounded-2xl border border-border/50 group animate-in slide-in-from-right-2 duration-300">
                   <div className="flex-[2] space-y-1">
                      <label className="text-[8px] font-black text-gray-400 uppercase ml-1">Item Description</label>
                      <Input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="e.g. Veggie Burger" className="h-10 rounded-xl bg-white border-none font-bold text-xs uppercase" />
                   </div>
                   <div className="w-16 space-y-1">
                      <label className="text-[8px] font-black text-gray-400 uppercase ml-1">Qty</label>
                      <Input type="number" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', e.target.value)} className="h-10 rounded-xl bg-white border-none font-black text-center" />
                   </div>
                   <div className="w-24 space-y-1">
                      <label className="text-[8px] font-black text-gray-400 uppercase ml-1">Rate ₹</label>
                      <Input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} className="h-10 rounded-xl bg-white border-none font-black text-center text-primary" />
                   </div>
                   <div className="flex items-end pb-0.5">
                      <button onClick={() => handleRemoveItem(item.id)} className="h-10 w-10 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center active:scale-90"><Trash2 className="h-4 w-4" /></button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* 2. PREVIEW & ACTIONS */}
      <div className="flex flex-col gap-8">
        <div className="bg-[#0B0B0B] p-10 rounded-[3.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center">
           <div className="absolute top-0 right-0 p-8 opacity-10"><ReceiptIcon className="h-40 w-40 text-white" /></div>
           <div className="relative z-10 mb-8 w-full">
              <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-full inline-block border border-white/10 mb-6">
                 <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2"><Eye className="h-3.5 w-3.5 text-primary" /> Digital Preview</span>
              </div>
              <div className="scale-[0.9] md:scale-100 origin-top transform-gpu">
                {receiptPreview}
              </div>
           </div>

           <div className="relative z-10 w-full grid grid-cols-2 gap-4">
              <Button onClick={handlePrint} className="h-16 rounded-2xl bg-white text-black hover:bg-gray-100 font-black uppercase italic shadow-xl">
                 <Printer className="h-5 w-5 mr-3" /> PRINT
              </Button>
              <Button onClick={handleDownload} disabled={isDownloading} className="h-16 rounded-2xl bg-primary text-white hover:bg-primary/90 font-black uppercase italic shadow-xl">
                 {isDownloading ? <Loader2 className="h-5 w-5 animate-spin mr-3" /> : <Download className="h-5 w-5 mr-3" />} SAVE
              </Button>
           </div>
           
           <p className="mt-8 text-[8px] font-black text-gray-500 uppercase tracking-[0.5em] relative z-10">ShopyKart Enterprise POS</p>
        </div>
        
        <div className="bg-blue-50 p-6 rounded-[2.5rem] border-2 border-dashed border-blue-100 flex items-start gap-4">
           <div className="bg-blue-600 p-2.5 rounded-xl text-white"><ReceiptIcon className="h-5 w-5" /></div>
           <div>
              <h4 className="font-black italic uppercase text-blue-900 text-sm">Pro Tip</h4>
              <p className="text-[10px] font-bold text-blue-700/70 uppercase leading-relaxed mt-1">
                Aap ye receipts download karke WhatsApp par customers ko bhej sakte hain. Ye bills Firestore mein save nahi honge, ye sirf instant manual generation ke liye hain.
              </p>
           </div>
        </div>
      </div>

    </div>
  );
}
