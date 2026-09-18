"use client"

import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Download, 
  Printer, 
  User, 
  Phone, 
  MapPin, 
  Receipt as ReceiptIcon, 
  Loader2,
  PlusCircle,
  IndianRupee,
  RefreshCw,
  Eye,
  ListTree,
  StickyNote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { format } from 'date-fns';

type Item = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  variety?: string;
};

export default function ReceiptGenerator() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [specialNote, setSpecialNote] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('0');
  const [taxAmount, setTaxAmount] = useState('0');
  const [orderId, setOrderId] = useState('');
  const [items, setItems] = useState<Item[]>([
    { id: '1', name: '', quantity: 1, price: 0, variety: '' }
  ]);

  useEffect(() => {
    setOrderId(Math.floor(10000 + Math.random() * 90000).toString());
  }, []);

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  const total = useMemo(() => {
    const itemsTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    return itemsTotal + parseFloat(deliveryFee || '0') + parseFloat(taxAmount || '0');
  }, [items, deliveryFee, taxAmount]);

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', quantity: 1, price: 0, variety: '' }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof Item, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: field === 'name' || field === 'variety' ? value : parseFloat(value) || 0 } : item
    ));
  };

  const handleDownload = async () => {
    const element = document.getElementById('generated-receipt-dom');
    if (!element) return;
    setIsDownloading(true);
    try {
      const { toBlob } = await import('html-to-image');
      const FileSaver = await import('file-saver');
      const saveAs = FileSaver.saveAs || (FileSaver as any).default;
      const blob = await toBlob(element, { backgroundColor: '#ffffff', pixelRatio: 2 });
      if (blob && typeof saveAs === 'function') {
        saveAs(blob, `Receipt_${orderId}.jpg`);
        toast({ title: "Receipt Saved! ✅" });
      }
    } catch (err) { toast({ variant: "destructive", title: "Failed" }); }
    finally { setIsDownloading(false); }
  };

  const upiUrl = `upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${total.toFixed(2)}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

  const receiptPreview = (
    <div id="generated-receipt-dom" className="bg-white text-black p-8 font-mono text-[11px] uppercase w-[350px] border border-gray-100 shadow-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-4xl font-black italic tracking-tighter leading-none mb-1">SHOPYKART</h2>
        <p className="text-[8px] font-black opacity-60 tracking-[0.2em]">PREMIUM DELIVERY</p>
        <p className="text-[9px] mt-4 font-bold">{settings?.receiptHeader || 'MAURANIPUR, UP'}</p>
      </div>

      <div className="border-t border-dashed border-black my-4"></div>

      <div className="space-y-1.5 font-bold">
        <div className="flex justify-between"><span>BILL NO:</span><span>#${orderId}</span></div>
        <div className="flex justify-between"><span>DATE:</span><span>${format(new Date(), 'dd/MM/yy HH:mm')}</span></div>
        <div className="flex justify-between"><span>NAME:</span><span className="truncate max-w-[150px]">${customerName || 'GUEST'}</span></div>
        <div className="flex justify-between"><span className="shrink-0 mr-4">ADDRESS:</span><span className="text-right leading-tight">${customerAddress || 'N/A'}</span></div>
      </div>

      <div className="border-t border-dashed border-black my-4"></div>

      <table className="w-full text-[10px]">
        <thead><tr className="border-b border-black">
          <th className="text-left py-2">ITEM</th>
          <th className="text-center py-2">QTY</th>
          <th className="text-right py-2">AMT</th>
        </tr></thead>
        <tbody>
          {items.map((item) => (
            item.name && (
              <tr key={item.id} className="border-b border-dashed border-black/10">
                <td className="py-2.5">
                   <div className="font-black">${item.name}</div>
                   ${item.variety ? `<div style="font-size: 8px; color: #EF4444; font-weight: 900; margin-top: 1px;">VARIETY: ${item.variety}</div>` : ''}
                </td>
                <td className="text-center font-black">${item.quantity}</td>
                <td className="text-right font-black">${(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            )
          ))}
        </tbody>
      </table>

      {(parseFloat(deliveryFee) > 0 || parseFloat(taxAmount) > 0) && (
        <div className="mt-4 pt-4 border-t border-dashed border-black/20 space-y-1 font-bold text-[9px]">
           ${parseFloat(deliveryFee) > 0 ? `<div style="display: flex; justify-content: space-between;"><span>DELIVERY FEE:</span><span>₹${parseFloat(deliveryFee).toFixed(2)}</span></div>` : ''}
           ${parseFloat(taxAmount) > 0 ? `<div style="display: flex; justify-content: space-between;"><span>TAX & CHARGES:</span><span>₹${parseFloat(taxAmount).toFixed(2)}</span></div>` : ''}
        </div>
      )}
      
      <div className="border-t-2 border-black mt-5 pt-4 flex justify-between items-center text-2xl font-black italic">
        <span>TOTAL</span><span>₹${total.toFixed(2)}</span>
      </div>

      {specialNote && (
        <div className="mt-4 p-3 border-2 border-dashed border-black/20 rounded-lg">
           <div className="text-[8px] font-black mb-1">SPECIAL NOTES:</div>
           <div className="text-[10px] font-bold italic leading-tight">"${specialNote}"</div>
        </div>
      )}

      <div className="text-center mt-8 space-y-6 flex flex-col items-center">
        <div style="padding: 15px; border: 2px dashed #000; border-radius: 25px; background: #fafafa; display: inline-block;">
           <p style="font-size: 9px; font-weight: 900; margin-bottom: 12px;">SCAN TO PAY EXACT AMOUNT</p>
           <img src="${qrUrl}" style="width: 160px; height: 160px; display: block; margin: 0 auto;" />
           <p style="font-size: 8px; font-weight: 900; margin-top: 10px;">9450355709@axl</p>
        </div>
        <p className="font-black italic text-base">${settings?.receiptThankYou || 'ENJOY YOUR MEAL!'}</p>
        <div className="pt-4 border-t border-black w-full"><span className="text-[8px] font-black tracking-[0.4em]">POWERED BY SHOPYKART POS</span></div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 max-w-6xl pb-32">
      <div className="space-y-8 bg-white p-8 rounded-[3rem] border border-border/50 shadow-sm">
        <div className="flex items-center justify-between">
           <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">Manual POS</h2>
           <button onClick={() => { setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); setSpecialNote(''); setItems([{ id: '1', name: '', quantity: 1, price: 0, variety: '' }]); }} className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 active:scale-90"><RefreshCw className="h-4 w-4" /></button>
        </div>

        <div className="space-y-4">
           <Input placeholder="CUSTOMER NAME" value={customerName} onChange={e => setCustomerName(e.target.value.toUpperCase())} className="h-14 rounded-2xl bg-muted/20 border-none font-bold" />
           <div className="grid grid-cols-2 gap-4">
              <Input placeholder="PHONE NUMBER" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="h-14 rounded-2xl bg-muted/20 border-none font-bold" />
              <Input placeholder="DELIVERY FEE ₹" type="number" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} className="h-14 rounded-2xl bg-muted/20 border-none font-bold" />
           </div>
           <Input placeholder="COMPLETE ADDRESS" value={customerAddress} onChange={e => setCustomerAddress(e.target.value.toUpperCase())} className="h-14 rounded-2xl bg-muted/20 border-none font-bold" />
           
           <div className="relative">
              <StickyNote className="absolute left-4 top-4 h-4 w-4 text-gray-400" />
              <Textarea placeholder="SPECIAL INSTRUCTIONS (E.G. NO ONION)" value={specialNote} onChange={e => setSpecialNote(e.target.value.toUpperCase())} className="h-20 pl-12 rounded-2xl bg-muted/20 border-none font-bold text-xs uppercase" />
           </div>

           <div className="space-y-3 pt-4">
              <div className="flex justify-between items-center"><h3 className="text-sm font-black uppercase text-gray-800">Add Items</h3><button onClick={handleAddItem} className="bg-primary/10 text-primary px-4 py-2 rounded-xl text-[10px] font-black uppercase">+ ROW</button></div>
              {items.map((item) => (
                <div key={item.id} className="bg-muted/10 p-4 rounded-2xl flex gap-3 border border-border/50 group">
                   <div className="flex-[2] space-y-1">
                      <label className="text-[8px] font-black text-gray-400 uppercase ml-1">Name</label>
                      <Input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} className="h-10 rounded-xl bg-white border-none font-bold" />
                   </div>
                   <div className="flex-1 space-y-1">
                      <label className="text-[8px] font-black text-gray-400 uppercase ml-1">Variety</label>
                      <Input value={item.variety} onChange={e => updateItem(item.id, 'variety', e.target.value)} className="h-10 rounded-xl bg-white border-none font-black text-primary" />
                   </div>
                   <div className="w-16 space-y-1">
                      <label className="text-[8px] font-black text-gray-400 uppercase ml-1">Rate</label>
                      <Input type="number" value={item.price} onChange={e => updateItem(item.id, 'price', e.target.value)} className="h-10 rounded-xl bg-white border-none font-black text-center" />
                   </div>
                   <div className="flex items-end pb-1"><button onClick={() => handleRemoveItem(item.id)} className="h-10 w-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center active:scale-90"><Trash2 className="h-4 w-4" /></button></div>
                </div>
              ))}
           </div>
        </div>
        <Button onClick={handleDownload} disabled={isDownloading} className="w-full h-18 bg-primary text-white rounded-[2rem] font-black uppercase italic text-xl shadow-xl">{isDownloading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'GENERATE & SAVE BILL'}</Button>
      </div>

      <div className="bg-[#0B0B0B] p-10 rounded-[4rem] shadow-2xl flex flex-col items-center">
         <div className="bg-white/10 px-6 py-2 rounded-full mb-8"><span className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> DIGITAL PREVIEW</span></div>
         <div className="scale-[0.85] md:scale-100 origin-top transform-gpu">{receiptPreview}</div>
      </div>
    </div>
  );
}
