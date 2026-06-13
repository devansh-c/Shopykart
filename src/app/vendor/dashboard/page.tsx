
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, deleteDoc, updateDoc, orderBy, getDocs, writeBatch, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  LogOut,
  Utensils,
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
  FileText,
  CheckCircle2,
  ShieldCheck,
  Printer,
  Download,
  Eye,
  Package,
  User,
  Power,
  PowerOff,
  MapPin,
  Phone,
  Save,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ListTree
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, useMemo, memo, useTransition } from 'react';
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

export default function VendorDashboard() {
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

  // Form states for Catalog
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductProductForm] = useState({
    name: '', 
    price: '', 
    mrp: '', 
    description: '', 
    category: '', 
    isVeg: true, 
    imageUrl: '',
    options: [] as { name: string; price: number }[]
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Form state for Profile
  const [profileForm, setProfileForm] = useState({
    storeName: '',
    address: '',
    phone: '',
    fullName: ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => { 
    setIsMounted(true); 
  }, []);

  // Vendor Profile
  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile } = useDoc<any>(vendorRef);

  // Categories from Admin
  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: allCategories } = useCollection<any>(categoriesQuery);

  const filteredCategories = useMemo(() => {
    if (!allCategories || !vendorProfile) return [];
    return allCategories.filter((cat: any) => 
      (cat.serviceType || 'Food').toLowerCase() === (vendorProfile.category || 'Food').toLowerCase()
    );
  }, [allCategories, vendorProfile]);

  // Sync profile data to form once
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

  // App Settings (for branding/receipts)
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  /**
   * BULLETPROOF QUERY: Fetch most recent orders and filter by participation.
   * Supports both 'vendorId' (string) and 'vendorIds' (array) schemas.
   */
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // We fetch all non-delivered/non-cancelled orders first, or recent delivered ones
    return query(
      collection(firestore, 'orders'), 
      orderBy('createdAt', 'desc'),
      limit(100)
    );
  }, [firestore, user]);
  
  const { data: rawOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  // Products Query
  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'products'), where('vendorId', '==', user.uid));
  }, [firestore, user]);
  const { data: myProducts, loading: productsLoading } = useCollection<any>(productsQuery);

  // Payout History Query
  const payoutQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'vendors', user.uid, 'payout_history'), orderBy('date', 'desc'));
  }, [firestore, user]);
  const { data: payouts, loading: payoutsLoading } = useCollection<any>(payoutQuery);

  // GREEDY FILTERING: Ensure orders where the vendor is involved show up
  const orders = useMemo(() => {
    if (!rawOrders || !user) return [];
    return rawOrders.filter((o: any) => {
      // Check if current user is the main vendor
      const isMainVendor = o.vendorId === user.uid;
      // Check if current user is in the multi-vendor participation list
      const isInVendorIds = Array.isArray(o.vendorIds) && o.vendorIds.includes(user.uid);
      // Check if any item in the order belongs to this vendor
      const hasMyItems = o.items?.some((item: any) => item.vendorId === user.uid);
      
      return isMainVendor || isInVendorIds || hasMyItems;
    });
  }, [rawOrders, user]);

  const handleToggleStore = async (online: boolean) => {
    if (!firestore || !user) return;
    try {
      const batch = writeBatch(firestore);
      batch.update(doc(firestore, 'vendors', user.uid), { isOnline: online, updatedAt: serverTimestamp() });
      
      // Also sync all products status
      if (myProducts) {
        myProducts.forEach(p => {
          batch.update(doc(firestore, 'products', p.id), { isAvailable: online });
        });
      }
      
      await batch.commit();
      toast({ title: online ? "Store is Now Open! 🟢" : "Store is Now Closed 🔴" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleAddOption = () => {
    setProductProductForm(prev => ({
      ...prev,
      options: [...prev.options, { name: '', price: 0 }]
    }));
  };

  const handleRemoveOption = (index: number) => {
    setProductProductForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const handleOptionChange = (index: number, field: 'name' | 'price', value: string) => {
    const updated = [...productForm.options];
    if (field === 'price') updated[index].price = parseFloat(value) || 0;
    else updated[index].name = value;
    setProductProductForm(prev => ({ ...prev, options: updated }));
  };

  const handleSaveProduct = async () => {
    if (!firestore || !user || !vendorProfile) return;
    if (!productForm.name || !productForm.price || !productForm.category) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Name, Price, and Category are required." });
      return;
    }
    
    setIsSavingProduct(true);
    
    const productData = {
      name: productForm.name,
      price: parseFloat(productForm.price),
      mrp: parseFloat(productForm.mrp || productForm.price),
      description: productForm.description,
      category: productForm.category.toLowerCase(),
      isVeg: productForm.isVeg,
      imageUrl: productForm.imageUrl || 'https://picsum.photos/seed/food/400/300',
      vendorId: user.uid,
      restaurantName: vendorProfile.storeName,
      zoneId: vendorProfile.zoneId || null,
      town: vendorProfile.town || 'Local',
      serviceMode: vendorProfile.category || 'Food',
      options: productForm.options.filter(o => o.name.trim() !== ''),
      updatedAt: serverTimestamp(),
      isAvailable: vendorProfile.isOnline !== false
    };

    try {
      if (editingProduct) {
        await updateDoc(doc(firestore, 'products', editingProduct.id), productData);
      } else {
        const newRef = doc(collection(firestore, 'products'));
        await setDoc(newRef, { ...productData, id: newRef.id, createdAt: serverTimestamp() });
      }
      setIsProductModalOpen(false);
      setEditingProduct(null);
      setProductProductForm({ name: '', price: '', mrp: '', description: '', category: '', isVeg: true, imageUrl: '', options: [] });
      toast({ title: "Product Saved!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error Saving" });
    } finally {
      setIsSavingProduct(false);
    }
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
      toast({ title: "Profile Updated", description: "Your changes are now live." });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDownload = async (order: any) => {
    const element = document.getElementById(`receipt-content-${order.id}`);
    if (!element) return;
    setDownloadingId(order.id);
    try {
      const dataUrl = await toJpeg(element, { quality: 0.95, backgroundColor: '#ffffff', pixelRatio: 2 });
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      saveAs(blob, `ShopyKart_Bill_${order.orderDisplayId || order.id.slice(-5)}.jpg`);
      toast({ title: "Saved!" });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
    finally { setDownloadingId(null); }
  };

  const handlePrint = (orderId: string) => {
    const element = document.getElementById(`receipt-content-${orderId}`);
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
            body { margin: 0; padding: 0; display: flex; justify-content: center; }
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

  const generateReceiptDOM = (orderData: any) => {
    const upiUri = `upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${orderData.total.toFixed(2)}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
    const subtotal = orderData.subtotal || orderData.items?.reduce((acc:any, it:any) => acc + (it.price * it.quantity), 0) || 0;
    const dateStr = orderData.createdAt?.seconds ? format(new Date(orderData.createdAt.seconds * 1000), 'dd/MM/yy HH:mm') : '--';
    
    return (
      <div id={`receipt-content-${orderData.id}`} className="bg-white text-black p-5 font-mono text-[10px] uppercase leading-tight w-[280px] mx-auto border border-gray-100">
        <div className="text-center mb-3">
          <h2 className="text-xl font-black italic tracking-tighter">SHOPYKART</h2>
          <p className="text-[7px] font-bold opacity-60 mb-1">PREMIUM DELIVERY NETWORK</p>
          <p className="text-[8px] whitespace-pre-line leading-tight mt-1">{settings?.receiptHeader || vendorProfile?.storeName}</p>
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
           {orderData.charges?.map((c: any, i: number) => (
             <div key={i} className="flex justify-between"><span>{c.name}:</span><span className="font-black">₹{c.amount.toFixed(2)}</span></div>
           ))}
           {orderData.couponDiscount > 0 && <div className="flex justify-between"><span>COUPON:</span><span className="font-black">-₹{orderData.couponDiscount.toFixed(2)}</span></div>}
           {orderData.coinDiscount > 0 && <div className="flex justify-between"><span>COINS:</span><span className="font-black">-₹{orderData.coinDiscount.toFixed(2)}</span></div>}
           {orderData.deliveryTip > 0 && <div className="flex justify-between"><span>TIP:</span><span className="font-black">₹{orderData.deliveryTip.toFixed(2)}</span></div>}
        </div>

        <div className="border-t-2 border-black mt-2 pt-2 flex justify-between font-black text-sm italic"><span>GRAND TOTAL</span><span>₹{orderData.total?.toFixed(2)}</span></div>
        <div className="border-t border-dashed border-black my-3" />
        <div className="border border-dashed border-black p-3 text-center mb-3">
           <p className="text-[7px] font-black tracking-widest mb-1">PAYMENT QR</p>
           <img src={qrUrl} className="w-24 h-24 mx-auto grayscale" alt="QR" />
           <p className="text-[8px] font-black mt-1">PAYABLE: ₹{orderData.total?.toFixed(2)}</p>
        </div>
        <div className="text-center text-[7px] font-black tracking-widest opacity-60">POWERED BY SHOPYKART POS</div>
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
      <header className="bg-white px-4 py-4 flex flex-col gap-3 border-b sticky top-0 z-50">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted border border-border/50">
                 {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <Utensils className="h-5 w-5" />}
               </div>
               <div>
                 <h1 className="text-sm font-black italic uppercase leading-none">{vendorProfile?.storeName || 'Business Portal'}</h1>
                 <div className="flex items-center gap-1.5 mt-1">
                    <div className={cn("h-1.5 w-1.5 rounded-full", vendorProfile?.isOnline !== false ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">{vendorProfile?.isOnline !== false ? 'Accepting' : 'Closed'}</p>
                 </div>
               </div>
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
               <span className={cn("text-[9px] font-black uppercase tracking-widest", vendorProfile?.isOnline !== false ? "text-green-600" : "text-red-500")}>
                 {vendorProfile?.isOnline !== false ? 'OPEN' : 'OFFLINE'}
               </span>
               <Switch 
                checked={vendorProfile?.isOnline !== false} 
                onCheckedChange={handleToggleStore}
                className="scale-75 data-[state=checked]:bg-green-500"
               />
            </div>
         </div>
      </header>

      <main className={cn("flex-1 pb-44 transition-opacity duration-300", isPending ? "opacity-50" : "opacity-100")}>
         {/* 1. ORDERS TAB */}
         {activeMainTab === 'orders' && (
           <div className="p-4 space-y-4 animate-in fade-in duration-500">
              <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-4 border border-border/50">
                {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all whitespace-nowrap px-1", orderFilter === f ? "bg-black text-white" : "text-gray-400")}>{f}</button>
                ))}
              </div>

              {ordersLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filteredOrders && filteredOrders.length > 0 ? (
                filteredOrders.map(o => {
                  const myItems = o.items?.filter((item: any) => item.vendorId === user?.uid) || [];
                  return (
                    <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm relative overflow-hidden group">
                       <div className="flex justify-between items-center mb-4">
                          <div><span className="text-lg font-black italic">#{o.orderDisplayId || o.id.slice(-4)}</span><div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase mt-0.5"><Clock className="h-2.5 w-2.5" />{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'MMM d, h:mm a')}</div></div>
                          <Badge className={cn("border-none text-[8px] font-black rounded-full px-2.5 py-1 uppercase", o.status === 'Cancelled' ? "bg-red-50 text-red-600" : o.status === 'Delivered' ? "bg-green-50 text-green-600" : "bg-primary/10 text-primary")}>{o.status}</Badge>
                       </div>
                       <div className="bg-muted/30 rounded-2xl p-4 mb-4 space-y-3">
                          <div className="flex items-center gap-2 border-b border-white pb-2 mb-1">
                             <User className="h-3.5 w-3.5 text-primary" />
                             <span className="text-xs font-black uppercase italic">{o.customerName}</span>
                          </div>
                          <div className="space-y-1.5">
                             {myItems.map((item:any, i:number) => (
                               <div key={i} className="flex justify-between items-center text-[11px] font-bold">
                                  <span className="text-gray-700">{item.quantity}x {item.name}</span>
                                  <span className="text-primary font-black">₹{(item.price * item.quantity).toFixed(2)}</span>
                               </div>
                             ))}
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="flex-1 bg-white border-2 border-primary/20 text-primary h-11 rounded-xl font-black text-[9px] uppercase active:scale-95 transition-all flex items-center justify-center gap-1.5"><Eye className="h-3.5 w-3.5" /> View Full Bill</button>
                            </DialogTrigger>
                            <DialogContent className="rounded-[2.5rem] max-w-[340px] p-0 overflow-hidden bg-white flex flex-col max-h-[85vh] z-[11000]">
                              <DialogHeader className="sr-only"><DialogTitle>Order Bill Receipt</DialogTitle></DialogHeader>
                              <div className="flex-1 overflow-y-auto no-scrollbar p-4 flex flex-col items-center">
                                <div className="w-full scale-[1.05] origin-top mb-4">{generateReceiptDOM(o)}</div>
                              </div>
                              <div className="p-4 bg-gray-50 border-t flex gap-2 shrink-0">
                                 <Button onClick={() => handlePrint(o.id)} className="flex-1 bg-black h-12 rounded-xl text-white font-black text-[10px] uppercase shadow-lg"><Printer className="h-4 w-4 mr-2" /> PRINT</Button>
                                 <Button onClick={() => handleDownload(o)} disabled={downloadingId === o.id} className="flex-1 bg-primary h-12 rounded-xl text-white font-black text-[10px] uppercase shadow-lg">
                                   {downloadingId === o.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} SAVE
                                 </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                       </div>
                    </div>
                  )
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                   <ShoppingBag className="h-16 w-16 mb-4" />
                   <p className="font-black italic uppercase tracking-widest text-xs">No orders in this category</p>
                </div>
              )}
           </div>
         )}

         {/* 2. CATALOG TAB */}
         {activeMainTab === 'catalog' && (
           <div className="p-4 space-y-4 animate-in fade-in duration-500">
              <div className="flex items-center justify-between mb-2">
                 <h2 className="text-xl font-black italic uppercase tracking-tighter">My Inventory</h2>
                 <Button onClick={() => { setEditingProduct(null); setProductProductForm({ name: '', price: '', mrp: '', description: '', category: '', isVeg: true, imageUrl: '', options: [] }); setIsProductModalOpen(true); }} className="bg-black rounded-xl h-10 font-black uppercase text-[10px]"><Plus className="h-3.5 w-3.5 mr-1" /> ADD ITEM</Button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                 {productsLoading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> : 
                  myProducts?.length === 0 ? <div className="text-center py-20 opacity-30 italic font-black uppercase text-[10px]">No items in your store</div> :
                  myProducts?.map(p => (
                    <div key={p.id} className="bg-white p-4 rounded-3xl border border-border/50 flex items-center justify-between shadow-sm">
                       <div className="flex items-center gap-4">
                          <img src={p.imageUrl} className="h-16 w-16 rounded-xl object-cover" alt="" />
                          <div>
                             <h4 className="font-black text-sm uppercase italic leading-none mb-1">{p.name}</h4>
                             <div className="flex items-center gap-2 mb-1">
                                <span className={cn("h-2 w-2 rounded-full", p.isAvailable !== false ? "bg-green-500" : "bg-red-500")} />
                                <span className="text-[8px] font-black text-muted-foreground uppercase">{p.isAvailable !== false ? 'In Stock' : 'Out of Stock'}</span>
                             </div>
                             <p className="text-xs font-black text-primary italic">₹{p.price}</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => { setEditingProduct(p); setProductProductForm({ name: p.name, price: p.price.toString(), mrp: (p.mrp || p.price).toString(), description: p.description || '', category: p.category || '', isVeg: p.isVeg !== false, imageUrl: p.imageUrl, options: p.options || [] }); setIsProductModalOpen(true); }} className="h-10 w-10 bg-muted rounded-xl flex items-center justify-center text-blue-600"><Edit className="h-4 w-4" /></button>
                          <button onClick={() => { if(confirm("Delete item?")) deleteDoc(doc(firestore!, 'products', p.id)); }} className="h-10 w-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500"><Trash2 className="h-4 w-4" /></button>
                       </div>
                    </div>
                  ))
                 }
              </div>
           </div>
         )}

         {/* 3. PAYOUTS TAB */}
         {activeMainTab === 'payouts' && (
           <div className="p-4 space-y-6 animate-in fade-in duration-500">
              <div className="bg-[#0B0B0B] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
                 <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                       <Wallet className="h-4 w-4 text-primary" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Available Balance</span>
                    </div>
                    <h3 className="text-5xl font-black italic tracking-tighter">₹{vendorProfile?.walletBalance?.toFixed(2) || '0.00'}</h3>
                    <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mt-6">Updated every successful settlement</p>
                 </div>
                 <div className="absolute top-0 right-0 h-full w-32 bg-white/5 -skew-x-12 translate-x-10" />
              </div>

              <div className="space-y-4">
                 <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 ml-1">Payout History</h2>
                 <div className="space-y-3">
                    {payoutsLoading ? <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div> :
                     payouts?.length === 0 ? <div className="text-center py-20 opacity-20 font-black italic text-[10px] uppercase">No payout records found</div> :
                     payouts?.map(p => (
                        <div key={p.id} className="bg-white p-5 rounded-3xl border border-border/50 flex items-center justify-between group shadow-sm">
                           <div className="flex items-center gap-4">
                              <div className="h-11 w-11 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                                 <ArrowUpRight className="h-6 w-6" />
                              </div>
                              <div>
                                 <h4 className="font-black text-sm italic uppercase">{p.note || 'Settlement'}</h4>
                                 <p className="text-[9px] font-bold text-muted-foreground uppercase">{p.date?.seconds ? format(new Date(p.date.seconds * 1000), 'MMM d, yyyy') : 'Recent'}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <span className="text-lg font-black text-green-600">+₹{p.amount}</span>
                              <div className="flex items-center gap-1 justify-end mt-0.5">
                                 <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />
                                 <span className="text-[7px] font-black text-green-500 uppercase">Settled</span>
                              </div>
                           </div>
                        </div>
                     ))
                    }
                 </div>
              </div>
           </div>
         )}

         {/* 4. ACCOUNT TAB */}
         {activeMainTab === 'account' && (
           <div className="p-4 space-y-6 animate-in fade-in duration-500">
              <div className="flex flex-col items-center py-8">
                 <div className="relative group">
                    <div className="h-32 w-32 rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden bg-muted">
                       {vendorProfile?.imageUrl ? <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /> : <Store className="h-12 w-12 m-auto text-gray-300" />}
                    </div>
                    <button className="absolute bottom-[-10px] right-[-10px] bg-white p-3 rounded-2xl shadow-xl border border-border text-primary active:scale-90 transition-all"><Camera className="h-5 w-5" /></button>
                 </div>
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter mt-6">{vendorProfile?.storeName}</h2>
                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{vendorProfile?.category} Store • {vendorProfile?.town}</p>
              </div>

              <div className="space-y-4">
                 <div className="bg-white p-6 rounded-[2.5rem] border border-border/50 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                       <UserCircle2 className="h-5 w-5 text-primary" />
                       <h3 className="font-black italic uppercase text-sm">Business Identity</h3>
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Store Owner</label>
                       <Input 
                        value={profileForm.fullName} 
                        onChange={e => setProfileForm({...profileForm, fullName: e.target.value})}
                        className="h-12 rounded-xl bg-gray-50 border-none font-bold" 
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Phone Number</label>
                       <Input 
                        value={profileForm.phone} 
                        onChange={e => setProfileForm({...profileForm, phone: e.target.value})}
                        className="h-12 rounded-xl bg-gray-50 border-none font-bold" 
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Store Address</label>
                       <Input 
                        value={profileForm.address} 
                        onChange={e => setProfileForm({...profileForm, address: e.target.value})}
                        placeholder="Update store address" 
                        className="h-12 rounded-xl bg-gray-50 border-none font-bold" 
                       />
                    </div>
                    <Button 
                      onClick={handleSaveProfile}
                      disabled={isSavingProfile}
                      className="w-full h-14 bg-black rounded-2xl font-black uppercase italic shadow-xl shadow-gray-200 mt-2"
                    >
                      {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      SAVE UPDATES
                    </Button>
                 </div>

                 <div className="bg-red-50 p-6 rounded-[2.5rem] border border-red-100 flex flex-col items-center text-center gap-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-red-900 leading-none">Security Zone</h3>
                    <p className="text-[9px] font-bold text-red-700 uppercase leading-relaxed">Closing your session will require a re-login to access orders.</p>
                    <Button variant="ghost" onClick={() => { localStorage.removeItem('shopykart_session_active'); signOut(auth!); }} className="w-full h-14 rounded-2xl bg-white border border-red-200 text-red-600 font-black uppercase italic shadow-lg"><LogOut className="h-4 w-4 mr-2" /> DISCONNECT ACCOUNT</Button>
                 </div>
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
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-primary scale-110" : "text-gray-500")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Product Modal for Catalog */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-sm max-h-[85vh] overflow-y-auto no-scrollbar focus:outline-none border-none p-0">
           <DialogHeader className="p-6 pb-2 border-b"><DialogTitle className="font-black italic uppercase text-center text-xl">Product Manager</DialogTitle></DialogHeader>
           <div className="p-6 space-y-6">
              <div onClick={() => fileInputRef.current?.click()} className="h-44 border-2 border-dashed rounded-3xl flex items-center justify-center bg-gray-50 overflow-hidden cursor-pointer group hover:border-primary/40 transition-all">
                 {productForm.imageUrl ? <img src={productForm.imageUrl} className="h-full w-full object-cover" /> : <div className="text-center opacity-30"><ImageIcon className="h-8 w-8 mx-auto mb-2" /><span className="text-[10px] font-black uppercase">Upload Photo</span></div>}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = async () => setProductProductForm({...productForm, imageUrl: await compressImage(r.result as string, 800, 800)}); r.readAsDataURL(f); } }} />
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Basic Details</label>
                  <Input placeholder="Item Name" value={productForm.name} onChange={e => setProductProductForm({...productForm, name: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/30 border-none" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">MRP (₹)</label>
                      <Input placeholder="0" type="number" value={productForm.mrp} onChange={e => setProductProductForm({...productForm, mrp: e.target.value})} className="h-12 rounded-xl bg-muted/30 border-none font-bold" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-primary ml-1">Sale Price (₹)</label>
                      <Input placeholder="0" type="number" value={productForm.price} onChange={e => setProductProductForm({...productForm, price: e.target.value})} className="h-12 rounded-xl border-primary/40 font-bold" />
                   </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Select Category (From Admin)</label>
                  <Select value={productForm.category} onValueChange={(val) => setProductProductForm({...productForm, category: val})}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none font-bold">
                       <SelectValue placeholder="Assign Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                       {filteredCategories.map((cat: any) => (
                         <SelectItem key={cat.id} value={cat.name.toLowerCase()} className="font-bold py-3 uppercase text-[10px]">{cat.name}</SelectItem>
                       ))}
                    </SelectContent>
                  </Select>
                </div>

                <Textarea placeholder="Short Description" value={productForm.description} onChange={e => setProductProductForm({...productForm, description: e.target.value})} className="rounded-xl bg-muted/30 border-none font-medium h-24 p-4 text-xs" />
                
                {/* VARIATIONS SECTION */}
                <div className="space-y-3 pt-2">
                   <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                         <ListTree className="h-4 w-4 text-primary" />
                         <span className="text-[10px] font-black uppercase tracking-widest">Product Varieties</span>
                      </div>
                      <button onClick={handleAddOption} className="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg">Add Variety</button>
                   </div>
                   
                   <div className="space-y-2">
                      {productForm.options.map((opt, idx) => (
                        <div key={idx} className="flex gap-2 animate-in slide-in-from-right-2 duration-300">
                           <Input 
                            placeholder="e.g. 500ml / Medium" 
                            value={opt.name} 
                            onChange={(e) => handleOptionChange(idx, 'name', e.target.value)}
                            className="h-10 rounded-lg bg-gray-50 border-none font-bold text-[10px] flex-[2]" 
                           />
                           <Input 
                            type="number" 
                            placeholder="+₹" 
                            value={opt.price} 
                            onChange={(e) => handleOptionChange(idx, 'price', e.target.value)}
                            className="h-10 rounded-lg bg-gray-50 border-none font-bold text-[10px] flex-1 text-center" 
                           />
                           <button onClick={() => handleRemoveOption(idx)} className="h-10 w-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0"><X className="h-4 w-4" /></button>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                   <div className="flex flex-col">
                      <span className="text-xs font-black uppercase">Vegetarian?</span>
                      <span className="text-[8px] font-bold text-muted-foreground">Is this a veg item?</span>
                   </div>
                   <Switch checked={productForm.isVeg} onCheckedChange={v => setProductProductForm({...productForm, isVeg: v})} />
                </div>
              </div>

              <Button onClick={handleSaveProduct} disabled={isSavingProduct} className="w-full h-16 bg-primary rounded-3xl font-black uppercase italic shadow-xl shadow-primary/20 text-lg">
                {isSavingProduct ? <Loader2 className="h-6 w-6 animate-spin" /> : editingProduct ? 'UPDATE ITEM' : 'PUBLISH ITEM'}
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
