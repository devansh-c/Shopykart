
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, deleteDoc, updateDoc, orderBy, writeBatch, limit } from 'firebase/firestore';
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
  Eye,
  User,
  Save,
  ArrowUpRight,
  ListTree
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, useMemo, useTransition } from 'react';
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
import { saveAs } from 'file-saver';

type MainTab = 'orders' | 'catalog' | 'payouts' | 'account';
type OrderFilter = 'NEW ORDERS' | 'DELIVERED' | 'CANCELLED';

export default function MedicalDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [isPending, startTransition] = useTransition();
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('NEW ORDERS');
  const [isMounted, setIsMounted] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Form states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductProductForm] = useState({
    name: '', price: '', mrp: '', description: '', category: '', isVeg: true, imageUrl: '', options: [] as any[]
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  
  const [profileForm, setProfileForm] = useState({ storeName: '', address: '', phone: '', fullName: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile } = useDoc<any>(vendorRef);

  useEffect(() => {
    if (vendorProfile) {
      setProfileForm({
        storeName: vendorProfile.storeName || '',
        address: vendorProfile.address || '',
        phone: vendorProfile.phone || '',
        fullName: vendorProfile.fullName || ''
      });
    }
  }, [vendorProfile]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'), where('serviceType', '==', 'Medical'));
  }, [firestore]);
  const { data: medicalCategories } = useCollection<any>(categoriesQuery);

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'), limit(100));
  }, [firestore, user]);
  const { data: rawOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'products'), where('vendorId', '==', user.uid));
  }, [firestore, user]);
  const { data: myProducts, loading: productsLoading } = useCollection<any>(productsQuery);

  const payoutQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'vendors', user.uid, 'payout_history'), orderBy('date', 'desc'));
  }, [firestore, user]);
  const { data: payouts, loading: payoutsLoading } = useCollection<any>(payoutQuery);

  const orders = useMemo(() => {
    if (!rawOrders || !user) return [];
    return rawOrders.filter((o: any) => o.vendorId === user.uid || (Array.isArray(o.vendorIds) && o.vendorIds.includes(user.uid)) || o.items?.some((it:any) => it.vendorId === user.uid));
  }, [rawOrders, user]);

  const handleToggleStore = async (online: boolean) => {
    if (!firestore || !user) return;
    try {
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, 'vendors', user.uid), { isOnline: online, updatedAt: serverTimestamp() });
      if (myProducts) {
        myProducts.forEach(p => { batch.set(doc(firestore, 'products', p.id), { isAvailable: online }, { merge: true }); });
      }
      await batch.commit();
      toast({ title: online ? "Pharmacy is Open! 🟢" : "Pharmacy is Closed 🔴" });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const handleSaveProduct = async () => {
    if (!firestore || !user || !vendorProfile) return;
    setIsSavingProduct(true);
    const productData = {
      name: productForm.name,
      price: parseFloat(productForm.price),
      mrp: parseFloat(productForm.mrp || productForm.price),
      description: productForm.description,
      category: productForm.category.toLowerCase(),
      vendorId: user.uid,
      restaurantName: vendorProfile.storeName,
      zoneId: vendorProfile.zoneId || null,
      town: vendorProfile.town || 'Local',
      serviceMode: 'Medical',
      imageUrl: productForm.imageUrl || 'https://picsum.photos/seed/medical/400/300',
      options: productForm.options.filter(o => o.name.trim() !== ''),
      isAvailable: vendorProfile.isOnline !== false,
      updatedAt: serverTimestamp()
    };
    try {
      if (editingProduct) { await updateDoc(doc(firestore, 'products', editingProduct.id), productData); }
      else { const newRef = doc(collection(firestore, 'products')); await setDoc(newRef, { ...productData, id: newRef.id, createdAt: serverTimestamp() }); }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      toast({ title: "Product Saved!" });
    } catch (e) { toast({ variant: "destructive", title: "Error Saving" }); }
    finally { setIsSavingProduct(false); }
  };

  const handleSaveProfile = async () => {
    if (!firestore || !user) return;
    setIsSavingProfile(true);
    try {
      await updateDoc(doc(firestore, 'vendors', user.uid), {
        storeName: profileForm.storeName,
        address: profileForm.address,
        phone: profileForm.phone,
        fullName: profileForm.fullName,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Profile Updated" });
    } catch (err) { toast({ variant: "destructive", title: "Update Failed" }); }
    finally { setIsSavingProfile(false); }
  };

  const handleDownload = async (order: any) => {
    const element = document.getElementById(`receipt-content-${order.id}`);
    if (!element) return;
    setDownloadingId(order.id);
    try {
      const dataUrl = await toJpeg(element, { quality: 0.95, backgroundColor: '#ffffff', pixelRatio: 2 });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      saveAs(blob, `Medical_Bill_${order.orderDisplayId || order.id.slice(-5)}.jpg`);
      toast({ title: "Saved!" });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
    finally { setDownloadingId(null); }
  };

  const handlePrint = (orderId: string) => {
    const element = document.getElementById(`receipt-content-${orderId}`);
    if (!element) return;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;
    doc.write(`<html><head><style>@page { margin: 0; size: 80mm auto; } body { margin: 0; padding: 0; }</style></head><body>${element.outerHTML}</body></html>`);
    doc.close();
    iframe.contentWindow?.focus();
    setTimeout(() => { iframe.contentWindow?.print(); document.body.removeChild(iframe); }, 500);
  };

  const generateReceiptDOM = (orderData: any) => {
    const upiUri = `upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${orderData.total.toFixed(2)}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
    const subtotal = orderData.subtotal || orderData.items?.reduce((acc:any, it:any) => acc + (it.price * it.quantity), 0) || 0;
    const dateStr = orderData.createdAt?.seconds ? format(new Date(orderData.createdAt.seconds * 1000), 'dd/MM/yy HH:mm') : '--';
    
    return (
      <div id={`receipt-content-${orderData.id}`} className="bg-white text-black p-5 font-mono text-[10px] uppercase leading-tight w-[280px] border shadow-none mx-auto">
        <div className="text-center mb-3">
          <h2 className="text-xl font-black italic tracking-tighter">SHOPYKART</h2>
          <p className="text-[7px] font-bold opacity-60 mb-1 uppercase">MEDICAL & HEALTHCARE</p>
          <p className="text-[8px] whitespace-pre-line leading-tight">{settings?.receiptHeader || vendorProfile?.storeName}</p>
        </div>
        <div className="border-t border-dashed border-black my-2" />
        <div className="space-y-0.5">
          <div className="flex justify-between"><span>ORDER ID:</span><span className="font-black">#{orderData.orderDisplayId || orderData.id.slice(-5)}</span></div>
          <div className="flex justify-between"><span>DATE:</span><span>{dateStr}</span></div>
          <div className="flex justify-between"><span>CUSTOMER:</span><span>{orderData.customerName?.slice(0,18)}</span></div>
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
              <tr key={i}><td className="py-2 pr-1 font-black leading-tight">{item.name}</td><td className="text-center">X{item.quantity}</td><td className="text-right">{(item.price * item.quantity).toFixed(2)}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-dashed border-black my-2 pt-2 space-y-1">
           <div className="flex justify-between"><span>SUBTOTAL:</span><span className="font-black">₹{subtotal.toFixed(2)}</span></div>
           {orderData.charges?.map((c: any, i: number) => (<div key={i} className="flex justify-between"><span>{c.name}:</span><span className="font-black">₹{c.amount.toFixed(2)}</span></div>))}
           {orderData.couponDiscount > 0 && <div className="flex justify-between"><span>DISCOUNT:</span><span className="font-black">-₹{orderData.couponDiscount.toFixed(2)}</span></div>}
           {orderData.deliveryTip > 0 && <div className="flex justify-between"><span>TIP:</span><span className="font-black">₹{orderData.deliveryTip.toFixed(2)}</span></div>}
        </div>
        <div className="border-t-2 border-black mt-2 pt-2 flex justify-between font-black text-sm italic"><span>GRAND TOTAL</span><span>₹{orderData.total?.toFixed(2)}</span></div>
        <div className="border-t border-dashed border-black my-3" />
        <div className="border border-dashed border-black p-3 text-center mb-3">
           <p className="text-[7px] font-black tracking-widest mb-1">PAYMENT QR</p>
           <img src={qrUrl} className="w-24 h-24 mx-auto grayscale" alt="QR" />
           <p className="text-[8px] font-black mt-1">PAYABLE: ₹{orderData.total?.toFixed(2)}</p>
        </div>
        <div className="text-center text-[7px] font-black opacity-60">POWERED BY SHOPYKART POS</div>
      </div>
    );
  };

  const filteredOrders = useMemo(() => {
    return orders?.filter(o => {
      if(orderFilter === 'NEW ORDERS') return !['Delivered', 'Cancelled'].includes(o.status);
      if(orderFilter === 'CANCELLED') return o.status === 'Cancelled';
      return o.status === 'Delivered';
    });
  }, [orders, orderFilter]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative transform-gpu">
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
         <div className="flex items-center gap-2">
            <Switch checked={vendorProfile?.isOnline !== false} onCheckedChange={handleToggleStore} className="scale-75 data-[state=checked]:bg-green-500" />
            <Button variant="ghost" onClick={() => { localStorage.removeItem('shopykart_session_active'); signOut(auth!); }} className="text-red-500 h-10 w-10 p-0 rounded-xl bg-red-50"><LogOut className="h-4 w-4" /></Button>
         </div>
      </header>

      <main className={cn("flex-1 pb-44 overflow-y-auto no-scrollbar transition-opacity duration-300", isPending ? "opacity-50" : "opacity-100")}>
         {activeMainTab === 'orders' && (
           <div className="p-4 space-y-4 animate-in fade-in duration-500">
              <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-4 border border-border/50">
                {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-teal-600 text-white" : "text-gray-400")}>{f}</button>
                ))}
              </div>
              {ordersLoading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div> :
               filteredOrders?.map(o => (
                <div key={o.id} className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm relative overflow-hidden group">
                   <div className="flex justify-between items-center mb-4">
                      <div><span className="text-lg font-black italic">#{o.orderDisplayId || o.id.slice(-4)}</span><div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase mt-0.5"><Clock className="h-2.5 w-2.5" />{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'MMM d, h:mm a')}</div></div>
                      <Badge className={cn("border-none text-[8px] font-black rounded-full px-2.5 py-1 uppercase", o.status === 'Cancelled' ? "bg-red-50 text-red-600" : o.status === 'Delivered' ? "bg-green-50 text-green-600" : "bg-teal-50 text-teal-600")}>{o.status}</Badge>
                   </div>
                   <div className="bg-muted/30 rounded-2xl p-4 mb-4 space-y-2">
                      <div className="flex items-center gap-2 border-b border-white pb-2 mb-1"><User className="h-3.5 w-3.5 text-teal-600" /><span className="text-xs font-black uppercase italic">{o.customerName}</span></div>
                      {o.items?.filter((it:any) => it.vendorId === user?.uid).map((item:any, i:number) => (<div key={i} className="flex justify-between items-center text-xs font-bold"><span className="text-gray-700">{item.quantity}x {item.name}</span><span className="text-teal-600">₹{(item.price * item.quantity).toFixed(2)}</span></div>))}
                   </div>
                   <Dialog>
                    <DialogTrigger asChild><button className="w-full bg-white border-2 border-teal-200 text-teal-600 h-11 rounded-xl font-black text-[9px] uppercase active:scale-95 transition-all flex items-center justify-center gap-1.5"><Eye className="h-3.5 w-3.5" /> View Bill</button></DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] max-w-[340px] p-0 overflow-hidden bg-white flex flex-col max-h-[85vh] z-[11000]"><DialogHeader className="sr-only"><DialogTitle>Order Bill</DialogTitle></DialogHeader><div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col items-center"><div className="scale-[1.05] origin-top mb-4">{generateReceiptDOM(o)}</div></div><div className="p-4 bg-teal-50 border-t flex gap-2 shrink-0"><Button onClick={() => handlePrint(o.id)} className="flex-1 bg-black h-12 rounded-xl text-white font-black text-[10px] uppercase shadow-lg"><Printer className="h-4 w-4 mr-2" /> PRINT</Button><Button onClick={() => handleDownload(o)} disabled={downloadingId === o.id} className="flex-1 bg-teal-600 h-12 rounded-xl text-white font-black text-[10px] uppercase shadow-lg">{downloadingId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} SAVE</Button></div></DialogContent>
                   </Dialog>
                </div>
              ))}
           </div>
         )}

         {activeMainTab === 'catalog' && (
           <div className="p-4 space-y-4 animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-2">
                 <h2 className="text-xl font-black italic uppercase tracking-tighter">Pharmacy Inventory</h2>
                 <Button onClick={() => { setEditingProduct(null); setProductProductForm({ name: '', price: '', mrp: '', description: '', category: '', isVeg: true, imageUrl: '', options: [] }); setIsProductModalOpen(true); }} className="bg-black rounded-xl h-10 font-black uppercase text-[10px]"><Plus className="h-3.5 w-3.5 mr-1" /> ADD PRODUCT</Button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                 {productsLoading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div> : 
                  myProducts?.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-3xl border border-border/50 flex items-center justify-between shadow-sm">
                       <div className="flex items-center gap-4">
                          <img src={p.imageUrl} className="h-16 w-16 rounded-xl object-cover bg-muted" alt="" />
                          <div>
                             <h4 className="font-black text-sm uppercase italic leading-none mb-1">{p.name}</h4>
                             <div className="flex items-center gap-2 mb-1"><span className={cn("h-2 w-2 rounded-full", p.isAvailable !== false ? "bg-green-500" : "bg-red-500")} /><span className="text-[8px] font-black text-muted-foreground uppercase">{p.isAvailable !== false ? 'Live' : 'OFF'}</span></div>
                             <p className="text-xs font-black text-teal-600 italic">₹{p.price}</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => { setEditingProduct(p); setProductProductForm({ name: p.name, price: p.price.toString(), mrp: (p.mrp || p.price).toString(), description: p.description || '', category: p.category || '', isVeg: true, imageUrl: p.imageUrl, options: p.options || [] }); setIsProductModalOpen(true); }} className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center text-blue-600"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => { if(confirm("Delete item?")) deleteDoc(doc(firestore!, 'products', p.id)); }} className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500"><Trash2 className="h-4 w-4" /></button>
                       </div>
                    </div>
                  ))
                 }
              </div>
           </div>
         )}

         {activeMainTab === 'payouts' && (
           <div className="p-4 space-y-6 animate-in fade-in duration-500">
              <div className="bg-[#0B0B0B] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                 <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1"><Wallet className="h-4 w-4 text-teal-500" /><span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Pharmacy Wallet</span></div>
                    <h3 className="text-5xl font-black italic tracking-tighter">₹{vendorProfile?.walletBalance?.toFixed(2) || '0.00'}</h3>
                 </div>
                 <div className="absolute top-0 right-0 h-full w-32 bg-white/5 -skew-x-12 translate-x-10" />
              </div>
              <div className="space-y-4">
                 <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 ml-1">Settlement History</h2>
                 {payoutsLoading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div> :
                  payouts?.map(p => (
                    <div key={p.id} className="bg-white p-5 rounded-3xl border border-border/50 flex items-center justify-between shadow-sm">
                       <div className="flex items-center gap-4"><div className="h-11 w-11 bg-green-50 rounded-2xl flex items-center justify-center text-green-600"><ArrowUpRight className="h-6 w-6" /></div><div><h4 className="font-black text-sm italic uppercase">{p.note || 'Settlement'}</h4><p className="text-[9px] font-bold text-muted-foreground uppercase">{p.date?.seconds ? format(new Date(p.date.seconds * 1000), 'MMM d, yyyy') : 'Recent'}</p></div></div>
                       <div className="text-right"><span className="text-lg font-black text-green-600">+₹{p.amount}</span></div>
                    </div>
                  ))
                 }
              </div>
           </div>
         )}

         {activeMainTab === 'account' && (
           <div className="p-4 space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col items-center py-8">
                 <div className="relative group"><div className="h-32 w-32 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden bg-muted">{vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <HeartPulse className="h-12 w-12 m-auto text-gray-300" />}</div><button className="absolute bottom-[-10px] right-[-10px] bg-white p-3 rounded-2xl shadow-xl border border-border text-teal-600"><Camera className="h-5 w-5" /></button></div>
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter mt-6">{vendorProfile?.storeName}</h2>
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Healthcare Provider • {vendorProfile?.town}</p>
              </div>
              <div className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm space-y-5">
                 <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 ml-1">Pharmacy Name</label><Input value={profileForm.storeName} onChange={e => setProfileForm({...profileForm, storeName: e.target.value})} className="h-12 rounded-xl bg-gray-50 border-none font-bold" /></div>
                 <div className="space-y-1"><label className="text-[9px] font-black uppercase text-gray-400 ml-1">Store Address</label><Input value={profileForm.address} onChange={e => setProfileForm({...profileForm, address: e.target.value})} className="h-12 rounded-xl bg-gray-50 border-none font-bold" /></div>
                 <Button onClick={handleSaveProfile} disabled={isSavingProfile} className="w-full h-14 bg-black rounded-2xl font-black uppercase italic shadow-xl">{isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} SAVE UPDATES</Button>
              </div>
           </div>
         )}
      </main>

      <nav className="fixed bottom-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-10 px-6 flex justify-around border-t border-white/5 z-50 rounded-t-[3rem] shadow-2xl">
        {[
          {id:'orders',label:'Orders',icon:LayoutDashboard},
          {id:'catalog',label:'Catalog',icon:Layers},
          {id:'payouts',label:'Payouts',icon:CircleDollarSign},
          {id:'account',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => startTransition(() => setActiveMainTab(item.id as MainTab))} className="flex flex-col items-center gap-1.5 active:scale-90 transition-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-teal-500 scale-110" : "text-gray-500")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Product Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-sm max-h-[85vh] overflow-y-auto no-scrollbar focus:outline-none border-none p-0">
           <DialogHeader className="p-6 pb-2 border-b"><DialogTitle className="font-black italic uppercase text-center text-xl">Medicine Manager</DialogTitle></DialogHeader>
           <div className="p-6 space-y-6">
              <div onClick={() => fileInputRef.current?.click()} className="h-44 border-2 border-dashed rounded-3xl flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer">{productForm.imageUrl ? <img src={productForm.imageUrl} className="h-full w-full object-cover" /> : <div className="text-center opacity-30"><ImageIcon className="h-8 w-8 mx-auto mb-2" /><span className="text-[10px] font-black uppercase">Upload Photo</span></div>}</div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = async () => setProductProductForm({...productForm, imageUrl: await compressImage(r.result as string, 800, 800)}); r.readAsDataURL(f); } }} />
              <div className="space-y-4">
                <Input placeholder="Medicine Name" value={productForm.name} onChange={e => setProductProductForm({...productForm, name: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/30 border-none" />
                <div className="grid grid-cols-2 gap-3">
                   <Input placeholder="MRP ₹" type="number" value={productForm.mrp} onChange={e => setProductProductForm({...productForm, mrp: e.target.value})} className="h-12 rounded-xl bg-muted/30 border-none" />
                   <Input placeholder="Price ₹" type="number" value={productForm.price} onChange={e => setProductProductForm({...productForm, price: e.target.value})} className="h-12 rounded-xl border-teal-400/40" />
                </div>
                <Select value={productForm.category} onValueChange={(val) => setProductProductForm({...productForm, category: val})}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none font-bold"><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent className="rounded-2xl">{medicalCategories?.map((cat: any) => (<SelectItem key={cat.id} value={cat.name.toLowerCase()} className="font-bold py-3 uppercase text-[10px]">{cat.name}</SelectItem>))}</SelectContent>
                </Select>
                <Textarea placeholder="Dosage/Instructions" value={productForm.description} onChange={e => setProductProductForm({...productForm, description: e.target.value})} className="rounded-xl bg-muted/30 border-none h-24 p-4 text-xs" />
              </div>
              <Button onClick={handleSaveProduct} disabled={isSavingProduct} className="w-full h-16 bg-teal-600 rounded-3xl font-black uppercase italic shadow-xl text-white">{isSavingProduct ? <Loader2 className="h-6 w-6 animate-spin" /> : editingProduct ? 'UPDATE PRODUCT' : 'PUBLISH PRODUCT'}</Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
