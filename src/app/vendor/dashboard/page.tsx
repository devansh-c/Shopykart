
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  LogOut,
  Utensils,
  LayoutDashboard,
  Layers,
  ArrowLeftRight,
  CircleDollarSign,
  UserCircle2,
  Edit,
  ImageIcon,
  BellRing,
  Clock,
  Settings,
  Phone,
  Moon,
  Sun,
  Camera,
  Check,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  User,
  PhoneCall,
  MapPin,
  Navigation,
  Compass,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { compressImage } from '@/lib/image-utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

type MainTab = 'orders' | 'catalog' | 'payouts' | 'account';
type OrderFilter = 'NEW ORDERS' | 'DELIVERED' | 'CANCELLED';

export default function VendorDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('NEW ORDERS');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showOrderAlert, setShowOrderAlert] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isEditPhoneOpen, setIsEditPhoneOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    price: '', 
    description: '', 
    category: '', 
    imageUrl: '', 
    isVeg: true,
    options: [] as { name: string; price: number }[]
  });

  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile, loading: profileLoading } = useDoc<any>(vendorRef);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/vendor/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!authLoading && !profileLoading && user && !vendorProfile) {
      router.push('/vendor/login');
    }
  }, [vendorProfile, authLoading, profileLoading, user, router]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: dynamicCategories } = useCollection<any>(categoriesQuery);

  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    if (vendorProfile) setIsOnline(vendorProfile.isOnline !== false);
  }, [vendorProfile]);

  const handleOnlineToggle = async (checked: boolean) => {
    setIsOnline(checked);
    if (firestore && user) {
      updateDoc(doc(firestore, 'vendors', user.uid), { isOnline: checked });
    }
  };

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'orders'), where('vendorId', '==', user.uid));
  }, [firestore, user]);
  const { data: orders } = useCollection<any>(ordersQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'vendors', user.uid, 'products');
  }, [firestore, user]);
  const { data: products } = useCollection<any>(productsQuery);

  const payoutQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'vendors', user.uid, 'payout_history'), orderBy('date', 'desc'));
  }, [firestore, user]);
  const { data: payoutHistory } = useCollection<any>(payoutQuery);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasNewOrder = orders?.some(o => o.status === 'Placed');
    if (hasNewOrder) {
      setShowOrderAlert(true);
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(e => console.log("Audio play blocked"));
    } else {
      setShowOrderAlert(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, [orders]);

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/vendor/login');
  };

  const updateStatus = async (orderId: string, nextStatus: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'orders', orderId), { status: nextStatus });
    toast({ title: "Updated", description: `Order is now ${nextStatus}` });
  };

  const handleTrackLocation = (order: any) => {
    // Verified coordinate navigation for stores
    if (order.latitude && order.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${order.latitude},${order.longitude}`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address)}`;
      window.open(url, '_blank');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner' | 'product') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, field === 'banner' ? 1200 : 600, 600);
      if (field === 'product') {
        setNewProduct(prev => ({ ...prev, imageUrl: compressed }));
      } else {
        if (!firestore || !user) return;
        const updateData = field === 'logo' ? { imageUrl: compressed } : { bannerUrl: compressed };
        await updateDoc(doc(firestore, 'vendors', user.uid), updateData);
        toast({ title: "Updated" });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddOption = () => {
    if (newProduct.options.length < 5) {
      setNewProduct({ ...newProduct, options: [...newProduct.options, { name: '', price: 0 }] });
    } else {
      toast({ variant: "destructive", title: "Max 5 Options" });
    }
  };

  const handleRemoveOption = (idx: number) => {
    setNewProduct({ ...newProduct, options: newProduct.options.filter((_, i) => i !== idx) });
  };

  const handleUpdateOption = (idx: number, field: 'name' | 'price', value: any) => {
    const opts = [...newProduct.options];
    if (field === 'price') opts[idx].price = parseFloat(value) || 0;
    else opts[idx].name = value;
    setNewProduct({ ...newProduct, options: opts });
  };

  const handleAddProduct = async () => {
    if (!firestore || !user || !vendorProfile) return;
    if (!newProduct.name || !newProduct.price || !newProduct.imageUrl || !newProduct.category) {
      toast({ variant: "destructive", title: "Incomplete details" });
      return;
    }

    const productData = { 
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      description: newProduct.description,
      category: newProduct.category,
      isVeg: newProduct.isVeg,
      options: newProduct.options.filter(o => o.name.trim() !== ''),
      vendorId: user.uid, 
      zoneId: vendorProfile.zoneId || null, 
      town: vendorProfile.town, 
      restaurantName: vendorProfile.storeName,
      createdAt: serverTimestamp(),
      imageUrl: newProduct.imageUrl
    };

    setIsAddOpen(false);
    const tempId = editingId;
    setEditingId(null);
    setNewProduct({ name: '', price: '', description: '', category: '', imageUrl: '', isVeg: true, options: [] });

    if (tempId) {
      await updateDoc(doc(firestore, 'vendors', user.uid, 'products', tempId), productData);
      await updateDoc(doc(firestore, 'products', tempId), productData);
    } else {
      const rootRef = doc(collection(firestore, 'products'));
      await setDoc(doc(firestore, 'vendors', user.uid, 'products', rootRef.id), productData);
      await setDoc(rootRef, productData);
    }
    toast({ title: "Product Saved" });
  };

  const handleDeleteProduct = async (id: string) => {
    if (!firestore || !user) return;
    await deleteDoc(doc(firestore, 'vendors', user.uid, 'products', id));
    await deleteDoc(doc(firestore, 'products', id));
    toast({ title: "Removed" });
  };

  const sortedAndFilteredOrders = useMemo(() => {
    if (!orders) return [];
    
    const sorted = [...orders].sort((a, b) => {
      const timeA = a.createdAt?.seconds || 0;
      const timeB = b.createdAt?.seconds || 0;
      return timeB - timeA;
    });

    return sorted.filter(o => {
      if (orderFilter === 'NEW ORDERS') return !['Delivered', 'Cancelled'].includes(o.status);
      if (orderFilter === 'DELIVERED') return o.status === 'Delivered';
      if (orderFilter === 'CANCELLED') return o.status === 'Cancelled';
      return false;
    });
  }, [orders, orderFilter]);

  const renderContent = () => {
    if (activeMainTab === 'orders') {
      const pendingCount = orders?.filter(o => o.status === 'Placed').length || 0;

      return (
        <div className="flex flex-col flex-1">
          <div className="flex bg-white px-4 py-3 border-b border-gray-100 sticky top-0 z-10">
            {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map((filter) => (
              <button key={filter} onClick={() => setOrderFilter(filter as OrderFilter)} className={cn("flex-1 py-3 text-[10px] font-black tracking-widest relative uppercase", orderFilter === filter ? "text-primary" : "text-gray-400")}>
                {filter}
                {orderFilter === filter && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
              </button>
            ))}
          </div>
          <div className="px-4 py-6 space-y-4">
            {orderFilter === 'NEW ORDERS' && pendingCount > 0 && (
              <div className="bg-primary p-4 rounded-2xl flex items-center gap-4 animate-pulse shadow-lg mb-2">
                <BellRing className="h-6 w-6 text-white" />
                <div><h2 className="font-black italic text-sm text-white">{pendingCount} NEW ORDERS</h2><p className="text-[10px] font-bold text-white/80">Ringtone Active</p></div>
              </div>
            )}
            {sortedAndFilteredOrders.map((order: any) => (
              <div key={order.id} className={cn("bg-white rounded-3xl p-5 shadow-sm border", order.status === 'Placed' ? "border-primary shadow-lg" : "border-gray-100")}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-lg italic tracking-tight">#{order.orderDisplayId || order.id.slice(-5).toUpperCase()}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      <Clock className="h-3 w-3" />
                      {isMounted && order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'MMM d, hh:mm a') : 'Just now'}
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase px-3 py-1.5 rounded-full bg-primary/5 text-primary">{order.status}</span>
                </div>

                <div className="flex items-center justify-between bg-muted/20 p-4 rounded-2xl mb-4 border border-border/40">
                   <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-xl text-primary"><User className="h-5 w-5" /></div>
                      <div>
                        <p className="text-[10px] font-black text-muted-foreground uppercase leading-none mb-1">Customer Details</p>
                        <h4 className="text-sm font-black italic tracking-tight leading-none uppercase">{order.customerName || 'Premium User'}</h4>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      <button 
                        onClick={() => handleTrackLocation(order)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-3.5 rounded-xl shadow-xl shadow-blue-600/20 active:scale-90 transition-all"
                        title="Navigate to Verified Pin"
                      >
                        <Navigation className="h-5 w-5" />
                      </button>
                      {order.customerPhone && (
                        <button 
                          onClick={() => window.open(`tel:${order.customerPhone}`)}
                          className="bg-green-500 hover:bg-green-600 text-white p-3.5 rounded-xl shadow-xl shadow-green-500/20 active:scale-90 transition-all"
                        >
                          <PhoneCall className="h-5 w-5" />
                        </button>
                      )}
                   </div>
                </div>

                <div className="flex items-start gap-3 mb-4 px-1">
                   <div className="bg-primary/10 p-2 rounded-xl text-primary shrink-0">
                      <MapPin className="h-4 w-4" />
                   </div>
                   <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase leading-none mb-1">Delivery Address</p>
                      <span className="text-xs font-bold text-gray-700 leading-snug">{order.address || 'Address not provided'}</span>
                      {order.latitude && <p className="text-[8px] font-black text-green-600 mt-1 uppercase tracking-widest">PINPOINT GPS VERIFIED ✅</p>}
                   </div>
                </div>
                
                <div className="bg-muted/30 rounded-2xl p-4 mb-4 space-y-2">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex flex-col text-xs font-bold text-gray-600">
                      <div className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                      {item.selectedOption && (
                        <span className="text-[9px] text-primary italic">Option: {item.selectedOption.name} (+₹{item.selectedOption.price})</span>
                      )}
                    </div>
                  ))}
                  <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between">
                    <span className="text-[10px] font-black text-gray-400">TOTAL</span>
                    <span className="text-sm font-black">₹{order.total}</span>
                  </div>
                </div>

                {order.instructions && (
                  <div className="mb-4 bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                    <FileText className="h-4 w-4 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Customer Instructions:</p>
                      <p className="text-xs font-bold text-amber-900 leading-relaxed italic">"{order.instructions}"</p>
                    </div>
                  </div>
                )}

                {orderFilter === 'NEW ORDERS' && (
                  <div className="flex gap-3">
                    {order.status === 'Placed' && <Button onClick={() => updateStatus(order.id, 'Accepted')} className="flex-1 bg-black rounded-2xl h-12 font-black uppercase italic text-xs">ACCEPT</Button>}
                    {order.status === 'Accepted' && <Button onClick={() => updateStatus(order.id, 'Preparing')} className="flex-1 bg-primary rounded-2xl h-12 font-black uppercase italic text-xs">PREPARE</Button>}
                    {order.status === 'Preparing' && <Button onClick={() => updateStatus(order.id, 'Ready for Pickup')} className="flex-1 bg-green-600 rounded-2xl h-12 font-black uppercase italic text-xs">READY</Button>}
                    <Button variant="outline" onClick={() => updateStatus(order.id, 'Cancelled')} className="h-12 w-12 rounded-2xl border-red-100 text-red-500"><Trash2 className="h-5 w-5" /></Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeMainTab === 'payouts') {
       return (
         <div className="p-6 space-y-6">
           <div className="bg-black text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
             <div className="relative z-10">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Total Payout Received</span>
               <h3 className="text-5xl font-black italic tracking-tighter mt-2">₹{vendorProfile?.walletBalance?.toFixed(2) || '0.00'}</h3>
               <div className="mt-6 flex items-center gap-2 text-green-400">
                  <Check className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Settled by Admin</span>
               </div>
             </div>
             <div className="absolute top-0 right-0 h-full w-32 bg-primary/10 -skew-x-12 translate-x-10" />
           </div>

           <div className="space-y-4">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Recent Settlements</h4>
             {payoutHistory && payoutHistory.length > 0 ? (
               payoutHistory.map((tx: any) => (
                 <div key={tx.id} className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                     <div className="p-3 rounded-2xl bg-green-50 text-green-500">
                       <ArrowDownLeft className="h-5 w-5" />
                     </div>
                     <div>
                       <p className="text-sm font-black truncate max-w-[120px]">{tx.note || 'Settlement'}</p>
                       <p className="text-[10px] font-bold text-gray-400 uppercase">
                          {isMounted && tx.date?.seconds ? format(new Date(tx.date.seconds * 1000), 'MMM d, yyyy') : 'Recently'}
                       </p>
                     </div>
                   </div>
                   <div className="text-right">
                     <p className="text-sm font-black text-green-600">+ ₹{tx.amount}</p>
                     <p className="text-[9px] font-black uppercase text-green-500">{tx.status}</p>
                   </div>
                 </div>
               ))
             ) : (
               <div className="text-center py-20 opacity-30 flex flex-col items-center">
                  <CircleDollarSign className="h-12 w-12 mb-4" />
                  <p className="font-black italic uppercase tracking-widest text-[10px]">No payout history yet</p>
               </div>
             )}
           </div>
         </div>
       );
    }

    if (activeMainTab === 'catalog') {
      return (
        <div className="p-4 space-y-4 pb-32">
          <div className="flex items-center justify-between"><h2 className="text-xl font-black italic uppercase">Store Catalog</h2><Dialog open={isAddOpen} onOpenChange={setIsAddOpen}><DialogTrigger asChild><Button size="sm" className="bg-black rounded-xl font-black uppercase text-[10px]"><Plus className="h-3 w-3 mr-1" /> ADD ITEM</Button></DialogTrigger><DialogContent className="rounded-[2.5rem]"><DialogHeader><DialogTitle className="font-black italic uppercase">New Menu Item</DialogTitle></DialogHeader>
          <div className="space-y-5 pt-4">
            <div onClick={() => fileInputRef.current?.click()} className={cn("relative h-48 w-full border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center overflow-hidden bg-muted/20", newProduct.imageUrl ? "border-primary/50" : "border-gray-200")}>{newProduct.imageUrl ? <img src={newProduct.imageUrl} className="h-full w-full object-cover" alt="" /> : <ImageIcon className="h-8 w-8 text-gray-300" />}</div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'product')} />
            <Input placeholder="Dish name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="h-14 rounded-2xl bg-muted/10 border-none px-5 font-bold" />
            <div className="grid grid-cols-2 gap-4"><Input type="number" placeholder="Price (₹)" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="h-14 rounded-2xl bg-muted/10 border-none px-5 font-bold" /><Select value={newProduct.category} onValueChange={(v) => setNewProduct({...newProduct, category: v})}><SelectTrigger className="h-14 rounded-2xl bg-muted/10 border-none font-bold"><SelectValue placeholder="Category" /></SelectTrigger><SelectContent>{dynamicCategories?.map((c:any) => <SelectItem key={c.id} value={c.name.toLowerCase()}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            
            {/* VENDOR OPTIONS MANAGEMENT */}
            <div className="space-y-3 bg-muted/10 p-4 rounded-2xl border border-dashed">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary">Options (Max 5)</span>
                  <Button size="sm" variant="ghost" onClick={handleAddOption} className="h-7 text-[8px] font-black uppercase bg-primary/10 text-primary">Add</Button>
               </div>
               <div className="space-y-2">
                  {newProduct.options.map((opt, i) => (
                    <div key={i} className="flex gap-2 items-center">
                       <Input placeholder="Option" value={opt.name} onChange={e => handleUpdateOption(i, 'name', e.target.value)} className="h-9 text-[11px] rounded-lg" />
                       <Input type="number" placeholder="₹" value={opt.price || ''} onChange={e => handleUpdateOption(i, 'price', e.target.value)} className="h-9 w-16 text-[11px] rounded-lg" />
                       <Button size="icon" variant="ghost" onClick={() => handleRemoveOption(i)} className="h-8 w-8 text-red-500"><X className="h-4 w-4" /></Button>
                    </div>
                  ))}
               </div>
            </div>

            <Button onClick={handleAddProduct} className="w-full bg-primary rounded-2xl h-16 font-black uppercase italic shadow-xl">PUBLISH ITEM</Button>
          </div></DialogContent></Dialog></div>
          <div className="grid gap-3">{products?.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-[2rem] border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4"><div className="h-20 w-20 rounded-2xl overflow-hidden bg-muted"><img src={p.imageUrl} className="h-full w-full object-cover" alt="" /></div><div><h4 className="font-black italic text-lg">{p.name}</h4><p className="text-primary font-black">₹{p.price}</p></div></div>
              <div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)} className="text-red-500 bg-red-50 h-10 w-10"><Trash2 className="h-4 w-4" /></Button></div>
            </div>
          ))}</div>
        </div>
      );
    }
    
    if (activeMainTab === 'account') {
      return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
          <div className="relative">
            <div onClick={() => bannerInputRef.current?.click()} className="h-40 w-full rounded-[2rem] overflow-hidden bg-muted relative group border border-gray-100">
              <img src={vendorProfile.bannerUrl} className="w-full h-full object-cover" alt="Banner" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white h-8 w-8" /></div>
            </div>
            <div onClick={() => logoInputRef.current?.click()} className="absolute -bottom-6 left-6 h-20 w-20 rounded-2xl bg-white p-1 shadow-xl border border-gray-100 group cursor-pointer">
              <div className="h-full w-full rounded-xl overflow-hidden relative">
                <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="Logo" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="text-white h-4 w-4" /></div>
              </div>
            </div>
            <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'banner')} />
            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'logo')} />
          </div>

          <div className="pt-6">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">{vendorProfile.storeName}</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">{vendorProfile.category} Store • {vendorProfile.town}</p>
          </div>

          <div className="space-y-4">
             <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-2xl text-primary"><Phone className="h-5 w-5" /></div>
                  <div><span className="text-[10px] font-black text-muted-foreground uppercase">Phone Number</span><p className="text-sm font-bold">{vendorProfile.phone}</p></div>
                </div>
                <Dialog open={isEditPhoneOpen} onOpenChange={setIsEditPhoneOpen}>
                  <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-10 w-10 bg-muted/50 rounded-xl" onClick={() => setNewPhone(vendorProfile.phone)}><Edit className="h-4 w-4" /></Button></DialogTrigger>
                  <DialogContent className="rounded-[2.5rem] max-w-sm">
                    <DialogHeader><DialogTitle className="font-black italic uppercase text-center">Edit Contact</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input value={newPhone} onChange={e => setNewPhone(e.target.value.replace(/\D/g,'').slice(0, 10))} placeholder="Enter 10 digit phone" className="h-14 rounded-2xl text-center text-lg font-black" />
                      <Button onClick={async () => { await updateDoc(doc(firestore!, 'vendors', user!.uid), { phone: newPhone }); setIsEditPhoneOpen(false); toast({ title: "Updated" }); }} className="w-full bg-primary h-14 rounded-2xl font-black uppercase italic shadow-xl">SAVE</Button>
                    </div>
                  </DialogContent>
                </Dialog>
             </div>

             <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-2xl text-blue-500">{isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}</div>
                  <div><span className="text-[10px] font-black text-muted-foreground uppercase">Display Mode</span><p className="text-sm font-bold">{isDarkMode ? 'Dark' : 'Light'}</p></div>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} className="data-[state=checked]:bg-primary" />
             </div>
          </div>
        </div>
      );
    }
    
    return <div className="p-20 opacity-30 text-center uppercase font-black italic">Coming Soon</div>;
  };

  if (authLoading || profileLoading || !vendorProfile) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col max-w-lg mx-auto shadow-2xl relative">
      <Dialog open={showOrderAlert} onOpenChange={setShowOrderAlert}>
        <DialogContent className="rounded-[3rem] max-w-sm bg-[#0B0B0B] text-center border-primary/20">
          <div className="flex flex-col items-center gap-6 p-4">
            <BellRing className="h-12 w-12 text-primary animate-bounce" />
            <DialogTitle className="text-3xl font-black italic uppercase text-white">NEW ORDER!</DialogTitle>
            <DialogDescription className="text-gray-400 font-bold text-xs uppercase">Please check orders tab to accept now.</DialogDescription>
            <Button onClick={() => setShowOrderAlert(false)} className="w-full h-14 bg-white text-black rounded-2xl font-black italic text-lg shadow-xl">
              ACKNOWLEDGE
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted"><img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /></div>
          <div><h1 className="text-base font-black italic uppercase text-gray-800 leading-tight truncate max-w-[120px]">{vendorProfile.storeName}</h1><div className="flex items-center gap-1.5 mt-0.5"><div className={cn("h-2 w-2 rounded-full", isOnline ? "bg-green-500" : "bg-gray-300")} /><span className={cn("text-[10px] font-black uppercase tracking-widest", isOnline ? "text-green-500" : "text-gray-400")}>{isOnline ? 'Online' : 'Offline'}</span></div></div>
        </div>
        <div className="flex items-center gap-3">
           <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="bg-muted/50 rounded-xl h-10 w-10"><Settings className="h-5 w-5" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl p-2 w-48 border-none shadow-2xl">
                 <div className="flex items-center gap-3 p-3 mb-2 bg-muted/30 rounded-xl"><span className="text-[10px] font-black uppercase flex-1">{isOnline ? 'ONLINE' : 'OFFLINE'}</span><Switch checked={isOnline} onCheckedChange={handleOnlineToggle} className="scale-75" /></div>
                 <DropdownMenuItem onClick={handleSignOut} className="text-red-500 font-black uppercase text-[10px] tracking-widest focus:bg-red-50 focus:text-red-600 rounded-xl py-3"><LogOut className="h-3 w-3 mr-2" /> EXIT DASHBOARD</DropdownMenuItem>
              </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </header>
      <main className="flex-1 flex flex-col bg-[#F3F4F6] overflow-y-auto no-scrollbar pb-32">{renderContent()}</main>
      <nav className="fixed bottom-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-4 flex items-center justify-between border-t border-white/5 z-50">
        {[
          {id:'orders',label:'Orders',icon:LayoutDashboard},
          {id:'catalog',label:'Catalog',icon:Layers},
          {id:'payouts',label:'Payouts',icon:CircleDollarSign},
          {id:'account',label:'Account',icon:UserCircle2}
        ].map((item) => {
          const isActive = activeMainTab === item.id; const Icon = item.icon;
          return <button key={item.id} onClick={() => setActiveMainTab(item.id as MainTab)} className="flex flex-col items-center gap-1.5 flex-1 transition-all active:scale-90"><Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} /><span className={cn("text-[10px] font-bold tracking-tight uppercase", isActive ? "text-white" : "text-gray-500")}>{item.label}</span></button>
        })}
      </nav>
    </div>
  );
}
