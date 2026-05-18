
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  LogOut,
  Utensils,
  Package,
  LayoutDashboard,
  Layers,
  ArrowLeftRight,
  CircleDollarSign,
  UserCircle2,
  ChevronLeft,
  Star,
  ChevronRight,
  Edit,
  ImageIcon,
  ImagePlus,
  Loader2,
  XCircle,
  BellRing,
  Clock,
  Smartphone,
  Settings,
  Phone,
  Moon,
  Sun,
  Camera,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { compressImage } from '@/lib/image-utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

type MainTab = 'orders' | 'catalog' | 'business' | 'payouts' | 'account';
type OrderFilter = 'NEW ORDERS' | 'DELIVERED' | 'CANCELLED';

const BRAND_LOGO_URL = "https://picsum.photos/seed/shopykart-eats/200/200";

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
  
  // Edit Profile States
  const [isEditPhoneOpen, setIsEditPhoneOpen] = useState(false);
  const [newPhone, setNewPhone] = useState('');

  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    price: '', 
    description: '', 
    category: '', 
    imageUrl: '', 
    isVeg: true 
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
      toast({ 
        variant: "destructive", 
        title: "Access Denied", 
        description: "Your account is not registered as a Vendor." 
      });
      router.push('/vendor/login');
    }
  }, [vendorProfile, authLoading, profileLoading, user, router, toast]);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: dynamicCategories } = useCollection<any>(categoriesQuery);

  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    if (vendorProfile) {
      setIsOnline(vendorProfile.isOnline !== false);
    }
  }, [vendorProfile]);

  const handleOnlineToggle = async (checked: boolean) => {
    setIsOnline(checked);
    if (firestore && user) {
      const vRef = doc(firestore, 'vendors', user.uid);
      updateDoc(vRef, { isOnline: checked });
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasNewOrder = orders?.some(o => o.status === 'Placed');
    if (hasNewOrder) {
      setShowOrderAlert(true);
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(() => {});
    } else {
      setShowOrderAlert(false);
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    }
  }, [orders]);

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/vendor/login');
  };

  const updateStatus = async (orderId: string, nextStatus: string) => {
    if (!firestore) return;
    const oRef = doc(firestore, 'orders', orderId);
    updateDoc(oRef, { status: nextStatus });
    toast({ title: "Status Updated", description: `Order is now ${nextStatus}` });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'banner' | 'product') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, field === 'banner' ? 1200 : 600, 600);
      
      if (field === 'product') {
        setNewProduct(prev => ({ ...prev, imageUrl: compressed }));
      } else if (field === 'logo' || field === 'banner') {
        if (!firestore || !user) return;
        const vRef = doc(firestore, 'vendors', user.uid);
        const updateData = field === 'logo' ? { imageUrl: compressed } : { bannerUrl: compressed };
        await updateDoc(vRef, updateData);
        toast({ title: "Updated", description: `${field === 'logo' ? 'Logo' : 'Banner'} has been updated.` });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdatePhone = async () => {
    if (!firestore || !user || newPhone.length !== 10) return;
    const vRef = doc(firestore, 'vendors', user.uid);
    await updateDoc(vRef, { phone: newPhone });
    setIsEditPhoneOpen(false);
    toast({ title: "Phone Updated", description: "Your contact number has been updated." });
  };

  const handleAddProduct = () => {
    if (!firestore || !user || !vendorProfile) return;
    if (!newProduct.name || !newProduct.price || !newProduct.imageUrl || !newProduct.category) {
      toast({ variant: "destructive", title: "Incomplete", description: "Name, Price, Category and Photo are required." });
      return;
    }

    const productData = { 
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      description: newProduct.description,
      category: newProduct.category,
      isVeg: newProduct.isVeg,
      vendorId: user.uid, 
      town: vendorProfile.town || 'Local', 
      restaurantName: vendorProfile.storeName || 'My Store',
      createdAt: serverTimestamp(),
      imageUrl: newProduct.imageUrl
    };

    setIsAddOpen(false);
    const tempId = editingId;
    setEditingId(null);
    setNewProduct({ name: '', price: '', description: '', category: '', imageUrl: '', isVeg: true });

    if (tempId) {
      updateDoc(doc(firestore, 'vendors', user.uid, 'products', tempId), productData);
      updateDoc(doc(firestore, 'products', tempId), productData);
      toast({ title: "Product Updated" });
    } else {
      const rootRef = doc(collection(firestore, 'products'));
      setDoc(doc(firestore, 'vendors', user.uid, 'products', rootRef.id), productData);
      setDoc(rootRef, productData);
      toast({ title: "Product Published" });
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (!firestore || !user) return;
    deleteDoc(doc(firestore, 'vendors', user.uid, 'products', id));
    deleteDoc(doc(firestore, 'products', id));
    toast({ title: "Product Deleted" });
  };

  if (authLoading || profileLoading || !vendorProfile) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-black uppercase italic tracking-tighter">Verifying Access...</h2>
      </div>
    );
  }

  const renderContent = () => {
    if (activeMainTab === 'orders') {
      const filteredOrders = orders?.filter(o => {
        if (orderFilter === 'NEW ORDERS') return !['Delivered', 'Cancelled'].includes(o.status);
        if (orderFilter === 'DELIVERED') return o.status === 'Delivered';
        if (orderFilter === 'CANCELLED') return o.status === 'Cancelled';
        return false;
      }) || [];
      const pendingCount = orders?.filter(o => o.status === 'Placed').length || 0;

      return (
        <div className="flex flex-col flex-1">
          <div className="flex bg-white px-4 py-3 border-b border-gray-100 sticky top-0 z-10">
            {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map((filter) => (
              <button
                key={filter}
                onClick={() => setOrderFilter(filter as OrderFilter)}
                className={cn(
                  "flex-1 py-3 text-[10px] font-black tracking-widest transition-all relative uppercase",
                  orderFilter === filter ? "text-primary" : "text-gray-400"
                )}
              >
                {filter}
                {orderFilter === filter && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />}
              </button>
            ))}
          </div>
          <div className="flex-1 flex flex-col px-4 py-6 space-y-4">
            {orderFilter === 'NEW ORDERS' && pendingCount > 0 && (
              <div className="bg-primary p-4 rounded-2xl flex items-center gap-4 animate-pulse shadow-lg shadow-primary/20 mb-2">
                <BellRing className="h-6 w-6 text-white" />
                <div>
                  <h2 className="font-black italic uppercase text-sm text-white">{pendingCount} NEW ORDERS PENDING</h2>
                  <p className="text-[10px] font-bold text-white/80 uppercase">Acknowledge to stop Ringtone</p>
                </div>
              </div>
            )}
            {filteredOrders.length === 0 && (
               <div className="text-center py-20 opacity-20"><ShoppingBag className="mx-auto h-12 w-12 mb-2" /><p className="font-black uppercase text-xs">No orders in this list</p></div>
            )}
            {filteredOrders.map((order: any) => (
              <div key={order.id} className={cn("bg-white rounded-3xl p-5 shadow-sm border relative transition-all", order.status === 'Placed' ? "border-primary ring-2 ring-primary/30" : "border-gray-100")}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-lg italic leading-none mb-1">#ORD-{order.id.slice(-4).toUpperCase()}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      <Clock className="h-3 w-3" />
                      {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleTimeString() : 'Now'}
                    </div>
                  </div>
                  <span className={cn("text-[9px] font-black uppercase px-3 py-1.5 rounded-full", order.status === 'Delivered' ? "bg-green-50 text-green-600" : "bg-primary/5 text-primary")}>{order.status}</span>
                </div>
                <div className="bg-muted/30 rounded-2xl p-4 mb-4 space-y-2">
                  {order.items?.map((item: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs font-bold text-gray-600"><span>{item.quantity}x {item.name}</span><span>₹{item.price * item.quantity}</span></div>
                  ))}
                  <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between"><span className="text-[10px] font-black text-gray-400 uppercase">Total Bill</span><span className="text-sm font-black">₹{order.total}</span></div>
                </div>
                {orderFilter === 'NEW ORDERS' && (
                  <div className="flex gap-3">
                    {order.status === 'Placed' && <Button onClick={() => updateStatus(order.id, 'Accepted')} className="flex-1 bg-black text-white rounded-2xl h-12 font-black uppercase italic text-xs">ACCEPT ORDER</Button>}
                    {order.status === 'Accepted' && <Button onClick={() => updateStatus(order.id, 'Preparing')} className="flex-1 bg-primary text-white rounded-2xl h-12 font-black uppercase italic text-xs">START PREPARING</Button>}
                    {order.status === 'Preparing' && <Button onClick={() => updateStatus(order.id, 'Ready for Pickup')} className="flex-1 bg-green-600 text-white rounded-2xl h-12 font-black uppercase italic text-xs">MARK READY</Button>}
                    <Button variant="outline" onClick={() => updateStatus(order.id, 'Cancelled')} className="h-12 w-12 rounded-2xl border-red-100 text-red-500"><XCircle className="h-5 w-5" /></Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (activeMainTab === 'catalog') {
      return (
        <div className="p-4 space-y-4 pb-32">
          <div className="flex items-center justify-between"><h2 className="text-xl font-black italic uppercase tracking-tighter">Menu Catalog</h2><Dialog open={isAddOpen} onOpenChange={(v) => { setIsAddOpen(v); if(!v){setEditingId(null); setNewProduct({name:'', price:'', description:'', category:'', imageUrl:'', isVeg:true});} }}><DialogTrigger asChild><Button size="sm" className="bg-[#1E293B] rounded-xl font-black uppercase text-[10px]"><Plus className="h-3 w-3 mr-1" /> ADD ITEM</Button></DialogTrigger><DialogContent className="rounded-[2.5rem] max-w-lg"><DialogHeader><DialogTitle className="font-black italic uppercase text-center text-xl">New Menu Item</DialogTitle><DialogDescription className="text-center text-[10px] font-bold text-muted-foreground uppercase">Fill details to publish your dish.</DialogDescription></DialogHeader>
          <div className="space-y-5 pt-4">
            <div onClick={() => fileInputRef.current?.click()} className={cn("relative h-48 w-full border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center overflow-hidden bg-muted/20", newProduct.imageUrl ? "border-primary/50" : "border-gray-200")}>{newProduct.imageUrl ? <img src={newProduct.imageUrl} className="h-full w-full object-cover" alt="" /> : <><ImageIcon className="h-8 w-8 text-primary/40" /><span className="text-[10px] font-black uppercase">Tap to select photo</span></>}</div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageSelect(e, 'product')} />
            <Input placeholder="Enter dish name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="h-14 rounded-2xl bg-muted/10 border-none px-5 font-bold" />
            <div className="grid grid-cols-2 gap-4"><Input type="number" placeholder="Price (₹)" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="h-14 rounded-2xl bg-muted/10 border-none px-5 font-bold" /><Select value={newProduct.category} onValueChange={(v) => setNewProduct({...newProduct, category: v})}><SelectTrigger className="h-14 rounded-2xl bg-muted/10 border-none px-5 font-bold"><SelectValue placeholder="Category" /></SelectTrigger><SelectContent>{dynamicCategories?.map((c:any) => <SelectItem key={c.id} value={c.name.toLowerCase()}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <Textarea placeholder="Description..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="rounded-2xl bg-muted/10 border-none p-5" />
            <Button onClick={handleAddProduct} className="w-full bg-primary rounded-2xl h-16 font-black uppercase italic shadow-xl text-lg">{editingId ? 'UPDATE ITEM' : 'PUBLISH ITEM'}</Button>
          </div></DialogContent></Dialog></div>
          <div className="grid gap-3">{products?.map(p => (
            <div key={p.id} className="bg-white p-4 rounded-[2rem] border border-gray-100 flex items-center justify-between group">
              <div className="flex items-center gap-4"><div className="h-20 w-20 rounded-2xl overflow-hidden bg-muted"><img src={p.imageUrl} className="h-full w-full object-cover" alt="" /></div><div><h4 className="font-black italic text-lg tracking-tight leading-none">{p.name}</h4><p className="text-primary font-black text-xl italic tracking-tighter mt-1">₹{p.price}</p></div></div>
              <div className="flex gap-2"><Button variant="ghost" size="icon" onClick={() => { setNewProduct({ name: p.name, price: p.price.toString(), description: p.description || '', category: p.category || '', imageUrl: p.imageUrl || '', isVeg: p.isVeg !== false }); setEditingId(p.id); setIsAddOpen(true); }} className="text-blue-500 bg-blue-50 h-10 w-10"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)} className="text-red-500 bg-red-50 h-10 w-10"><Trash2 className="h-4 w-4" /></Button></div>
            </div>
          ))}</div>
        </div>
      );
    }
    if (activeMainTab === 'account') {
      return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500">
          <div className="relative">
            <div 
              onClick={() => bannerInputRef.current?.click()}
              className="h-40 w-full rounded-[2rem] overflow-hidden bg-muted relative group border border-gray-100"
            >
              <img src={vendorProfile.bannerUrl || `https://picsum.photos/seed/${vendorProfile.id}/800/400`} className="w-full h-full object-cover" alt="Banner" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white h-8 w-8" />
              </div>
            </div>
            <div 
              onClick={() => logoInputRef.current?.click()}
              className="absolute -bottom-6 left-6 h-20 w-20 rounded-2xl bg-white p-1 shadow-xl border border-gray-100 group cursor-pointer"
            >
              <div className="h-full w-full rounded-xl overflow-hidden relative">
                <img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="Logo" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white h-4 w-4" />
                </div>
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
                  <div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Phone Number</span>
                    <p className="text-sm font-bold">{vendorProfile.phone}</p>
                  </div>
                </div>
                <Dialog open={isEditPhoneOpen} onOpenChange={setIsEditPhoneOpen}>
                  <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-10 w-10 bg-muted/50 rounded-xl" onClick={() => setNewPhone(vendorProfile.phone)}><Edit className="h-4 w-4" /></Button></DialogTrigger>
                  <DialogContent className="rounded-[2.5rem] max-w-sm">
                    <DialogHeader><DialogTitle className="font-black italic uppercase text-center">Edit Contact</DialogTitle></DialogHeader>
                    <div className="space-y-4 pt-4">
                      <Input value={newPhone} onChange={e => setNewPhone(e.target.value.replace(/\D/g,'').slice(0, 10))} placeholder="Enter 10 digit phone" className="h-14 rounded-2xl text-center text-lg font-black" />
                      <Button onClick={handleUpdatePhone} className="w-full bg-primary h-14 rounded-2xl font-black uppercase italic shadow-xl">SAVE CHANGES</Button>
                    </div>
                  </DialogContent>
                </Dialog>
             </div>

             <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-2xl text-blue-500">{isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}</div>
                  <div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Display Mode</span>
                    <p className="text-sm font-bold">{isDarkMode ? 'Dark' : 'Light'} Mode</p>
                  </div>
                </div>
                <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} className="data-[state=checked]:bg-primary" />
             </div>
          </div>

          <div className="pt-4">
            <div className="bg-black text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <CircleDollarSign className="text-primary h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Total Wallet</span>
                </div>
                <h3 className="text-4xl font-black italic tracking-tighter leading-none mb-4">₹{vendorProfile.walletBalance || '0.00'}</h3>
                <Button className="w-full bg-white text-black h-12 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">WITHDRAW FUNDS</Button>
              </div>
              <div className="absolute top-0 right-0 h-full w-32 bg-primary/10 -skew-x-12 translate-x-10" />
            </div>
          </div>
        </div>
      );
    }
    return <div className="flex flex-col items-center justify-center p-20 opacity-30"><Utensils className="h-12 w-12 mb-4" /><p className="font-black italic uppercase tracking-tighter text-sm">Module Coming Soon</p></div>;
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col max-w-lg mx-auto shadow-2xl relative">
      <Dialog open={showOrderAlert} onOpenChange={setShowOrderAlert}>
        <DialogContent className="rounded-[3rem] max-w-sm bg-[#0B0B0B] border-primary/30 p-8 text-center"><div className="flex flex-col items-center gap-6"><div className="relative"><div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20" /><div className="relative bg-primary p-6 rounded-full shadow-2xl"><BellRing className="h-12 w-12 text-white animate-bounce" /></div></div><div className="space-y-2"><DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-white leading-none">NEW ORDER<br />RECEIVED!</DialogTitle><DialogDescription className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Ringing & Vibration Active</DialogDescription></div><div className="w-full bg-white/5 rounded-3xl p-6 border border-white/10"><p className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-4">Action Required</p><Button onClick={() => setShowOrderAlert(false)} className="w-full h-14 bg-white text-black hover:bg-gray-200 rounded-2xl font-black uppercase italic tracking-tighter text-lg shadow-xl">ACKNOWLEDGE</Button></div></div></DialogContent>
      </Dialog>
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted border border-gray-100"><img src={vendorProfile.imageUrl} className="h-full w-full object-cover" alt="" /></div>
          <div><h1 className="text-base font-black italic uppercase tracking-tighter text-gray-800 leading-tight">{vendorProfile.storeName}</h1><div className="flex items-center gap-1.5 mt-0.5"><div className={cn("h-2 w-2 rounded-full", isOnline ? "bg-green-500" : "bg-gray-300")} /><span className={cn("text-[10px] font-black uppercase tracking-widest", isOnline ? "text-green-500" : "text-gray-400")}>{isOnline ? 'Online' : 'Offline'}</span></div></div>
        </div>
        <div className="flex items-center gap-3">
           {activeMainTab === 'account' ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="bg-muted/50 rounded-xl h-10 w-10"><Settings className="h-5 w-5" /></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 w-48">
                   <DropdownMenuItem onClick={handleSignOut} className="text-red-500 font-black uppercase text-[10px] tracking-widest focus:bg-red-50 focus:text-red-600 rounded-xl py-3"><LogOut className="h-3 w-3 mr-2" /> EXIT DASHBOARD</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
           ) : (
              <div className="flex items-center gap-3 bg-[#F1F5F9] px-3 py-1.5 rounded-full"><span className={cn("text-[10px] font-black uppercase tracking-widest", isOnline ? "text-green-600" : "text-gray-500")}>{isOnline ? 'On' : 'Off'}</span><Switch checked={isOnline} onCheckedChange={handleOnlineToggle} className="data-[state=checked]:bg-green-500 scale-90" /></div>
           )}
        </div>
      </header>
      <main className="flex-1 flex flex-col bg-[#F3F4F6] overflow-y-auto no-scrollbar pb-32">{renderContent()}</main>
      <nav className="fixed bottom-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-4 flex items-center justify-between border-t border-white/5 z-50">
        {[
          {id:'orders',label:'Orders',icon:LayoutDashboard},
          {id:'catalog',label:'Catalog',icon:Layers},
          {id:'business',label:'Business',icon:ArrowLeftRight},
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

