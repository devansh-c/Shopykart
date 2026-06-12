"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  LogOut,
  LayoutDashboard,
  Layers,
  CircleDollarSign,
  UserCircle2,
  Edit,
  ImageIcon,
  BellRing,
  Clock,
  Camera,
  History,
  Wallet,
  Store,
  XCircle,
  X,
  Loader2,
  ListPlus,
  HeartPulse,
  ShieldCheck,
  Calendar,
  Tag,
  FileText,
  Printer,
  Download,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { compressImage } from '@/lib/image-utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { toJpeg } from 'html-to-image';

type MainTab = 'orders' | 'catalog' | 'payouts' | 'account';
type OrderFilter = 'NEW ORDERS' | 'DELIVERED' | 'CANCELLED';

export default function MedicalDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('NEW ORDERS');
  const [isMounted, setIsMounted] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile } = useDoc<any>(vendorRef);

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'orders'), where('vendorId', '==', user.uid));
  }, [firestore, user]);
  
  const { data: rawOrders } = useCollection<any>(ordersQuery);

  const orders = useMemo(() => {
    if (!rawOrders) return [];
    return [...rawOrders].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [rawOrders]);

  const handleDownload = async (order: any) => {
    const element = document.getElementById(`receipt-temp-${order.id}`);
    if (!element) return;
    setDownloadingId(order.id);
    try {
      const dataUrl = await toJpeg(element, { quality: 0.95, backgroundColor: '#ffffff' });
      const link = document.createElement('a');
      link.download = `Medical_Bill_${order.orderDisplayId || order.id.slice(-5)}.jpg`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Saved!" });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
    finally { setDownloadingId(null); }
  };

  const handlePrint = (orderId: string) => {
    const element = document.getElementById(`receipt-temp-${orderId}`);
    if (!element) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write('<html><body>' + element.innerHTML + '</body></html>');
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
  };

  const generateReceiptDOM = (orderData: any) => {
    const upiUri = `upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${orderData.total.toFixed(2)}&cu=INR`;
    return (
      <div className="bg-white text-black p-5 font-mono text-[10px] uppercase w-[280px] border shadow-2xl mx-auto">
        <div className="text-center mb-3">
          <h2 className="text-xl font-black italic tracking-tighter">SHOPYKART</h2>
          <p className="text-[7px] font-bold opacity-60">MEDICAL & HEALTHCARE</p>
          <p className="text-[8px] whitespace-pre-line leading-tight">{settings?.receiptHeader || vendorProfile?.storeName}</p>
        </div>
        <div className="border-t border-dashed border-black my-2" />
        <div className="flex justify-between"><span>ORDER ID:</span><span className="font-black">#{orderData.orderDisplayId || orderData.id.slice(-5)}</span></div>
        <div className="flex justify-between"><span>CUSTOMER:</span><span>{orderData.customerName?.slice(0,18)}</span></div>
        <div className="border-t border-dashed border-black my-2" />
        <table className="w-full text-[9px]">
          <tbody>{orderData.items?.map((item: any, i: number) => (<tr key={i}><td width="70%" className="py-1 font-black">{item.name}</td><td className="text-center">X{item.quantity}</td><td className="text-right">{(item.price * item.quantity).toFixed(2)}</td></tr>))}</tbody>
        </table>
        <div className="border-t-2 border-black mt-2 pt-2 flex justify-between font-black text-sm italic"><span>GRAND TOTAL</span><span>₹{orderData.total?.toFixed(2)}</span></div>
        <div className="border-t border-dashed border-black my-3" />
        <div className="border border-dashed border-black p-2 text-center mb-4"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(upiUri)}`} className="w-24 h-24 mx-auto grayscale" alt="QR" /></div>
        <div className="text-center text-[7px] font-black opacity-60">POWERED BY SHOPYKART POS</div>
      </div>
    );
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative">
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b sticky top-0 z-50">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
              {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <HeartPulse className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-sm font-black italic uppercase">{vendorProfile?.storeName || 'Medical Hub'}</h1>
              <div className="flex items-center gap-1.5"><div className={cn("h-1.5 w-1.5 rounded-full", vendorProfile?.isOnline !== false ? "bg-green-500 animate-pulse" : "bg-red-500")} /><p className="text-[8px] font-bold text-muted-foreground uppercase">{vendorProfile?.isOnline !== false ? 'Accepting' : 'Closed'}</p></div>
            </div>
         </div>
         <Button variant="ghost" onClick={() => { localStorage.removeItem('shopykart_session_active'); signOut(auth!); }} className="text-red-500 h-10 w-10 p-0 rounded-xl bg-red-50"><LogOut className="h-4 w-4" /></Button>
      </header>

      <main className="flex-1 pb-32 overflow-y-auto no-scrollbar">
         {activeMainTab === 'orders' ? (
           <div className="p-4 space-y-4 animate-in fade-in duration-500">
              <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-4 border border-border/50">
                {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-teal-600 text-white" : "text-gray-400")}>{f}</button>
                ))}
              </div>
              {orders?.filter(o => {
                if(orderFilter === 'NEW ORDERS') return !['Delivered', 'Cancelled'].includes(o.status);
                if(orderFilter === 'CANCELLED') return o.status === 'Cancelled';
                return o.status === 'Delivered';
              }).map(o => (
                <div key={o.id} className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm relative overflow-hidden group">
                   <div className="flex justify-between items-center mb-4">
                      <div><span className="text-lg font-black italic tracking-tighter">#{o.orderDisplayId || o.id.slice(-4)}</span><div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase mt-0.5"><Clock className="h-2.5 w-2.5" />{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'MMM d, h:mm a')}</div></div>
                      <Badge className={cn("border-none text-[8px] font-black rounded-full px-2.5 py-1 uppercase", o.status === 'Cancelled' ? "bg-red-50 text-red-600" : o.status === 'Delivered' ? "bg-green-50 text-green-600" : "bg-teal-50 text-teal-600")}>{o.status}</Badge>
                   </div>
                   <div className="bg-muted/30 rounded-2xl p-4 mb-4 space-y-2">
                      {o.items?.map((item:any, i:number) => (<div key={i} className="flex justify-between items-center text-xs font-bold"><span className="text-gray-700">{item.quantity}x {item.name}</span><span className="text-teal-600">₹{(item.price * item.quantity).toFixed(2)}</span></div>))}
                   </div>
                   
                   <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="flex-1 h-12 rounded-2xl font-black text-[9px] uppercase border-teal-200 text-teal-600"><Eye className="h-3.5 w-3.5 mr-1.5" /> BILL</Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-[2.5rem] max-w-[340px] p-4 bg-white">
                          <DialogHeader className="sr-only">
                            <DialogTitle>Order Receipt View</DialogTitle>
                          </DialogHeader>
                          <div className="scale-[1.05] origin-top">{generateReceiptDOM(o)}</div>
                          <div className="flex gap-2 mt-4">
                             <Button onClick={() => handlePrint(o.id)} className="flex-1 bg-black h-12 rounded-xl text-white font-black text-[10px] uppercase"><Printer className="h-4 w-4 mr-2" /> PRINT</Button>
                             <Button onClick={() => handleDownload(o)} disabled={downloadingId === o.id} className="flex-1 bg-teal-600 h-12 rounded-xl text-white font-black text-[10px] uppercase">
                               {downloadingId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} SAVE
                             </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                   </div>
                   <div id={`receipt-temp-${o.id}`} className="hidden">{generateReceiptDOM(o)}</div>
                </div>
              ))}
           </div>
         ) : null}
      </main>
    </div>
  );
}
