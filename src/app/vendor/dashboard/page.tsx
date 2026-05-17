
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, addDoc, setDoc, serverTimestamp, deleteDoc, updateDoc } from 'firebase/firestore';
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
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  BellRing
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type MainTab = 'orders' | 'catalog' | 'business' | 'payouts' | 'account';
type OrderFilter = 'NEW ORDERS' | 'DELIVERED' | 'CANCELLED';

export default function VendorDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('NEW ORDERS');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  
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
  const { data: vendorProfile } = useDoc<any>(vendorRef);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: dynamicCategories, loading: categoriesLoading } = useCollection<any>(categoriesQuery);

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

  // Ringing & Vibration Logic
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if any order is in 'Placed' status (New and not yet accepted)
    const hasNewOrder = orders?.some(o => o.status === 'Placed');

    if (hasNewOrder && isAudioEnabled) {
      // Start Ringing
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(() => console.log("Autoplay blocked by browser policy"));

      // Start Vibration (repeating pattern)
      if ("vibrate" in navigator) {
        const vibrateInterval = setInterval(() => {
          if (!orders?.some(o => o.status === 'Placed')) {
            clearInterval(vibrateInterval);
            return;
          }
          navigator.vibrate([500, 200, 500, 200, 500]);
        }, 2000);
        return () => {
          clearInterval(vibrateInterval);
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
        };
      }
    } else {
      // Stop Ringing
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if ("vibrate" in navigator) {
        navigator.vibrate(0);
      }
    }
  }, [orders, isAudioEnabled]);

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

  const handleOpenEdit = (product: any) => {
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      category: product.category || '',
      imageUrl: product.imageUrl || '',
      isVeg: product.isVeg !== false
    });
    setEditingId(product.id);
    setIsAddOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProduct(prev => ({ ...prev, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
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
    const tempEditingId = editingId;
    setEditingId(null);
    setNewProduct({ name: '', price: '', description: '', category: '', imageUrl: '', isVeg: true });

    if (tempEditingId) {
      const vProdRef = doc(firestore, 'vendors', user.uid, 'products', tempEditingId);
      const rootProdRef = doc(firestore, 'products', tempEditingId);
      updateDoc(vProdRef, productData);
      updateDoc(rootProdRef, productData);
      toast({ title: "Product Updated" });
    } else {
      const rootProdRef = doc(collection(firestore, 'products'));
      const productId = rootProdRef.id;
      const vProdRef = doc(firestore, 'vendors', user.uid, 'products', productId);
      
      setDoc(vProdRef, productData);
      setDoc(rootProdRef, productData);
      toast({ title: "Product Published" });
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (!firestore || !user) return;
    deleteDoc(doc(firestore, 'vendors', user.uid, 'products', id));
    deleteDoc(doc(firestore, 'products', id));
    toast({ title: "Product Deleted" });
  };

  const renderContent = () => {
    if (activeMainTab === 'orders') {
      const filteredOrders = orders?.filter(o => {
        if (orderFilter === 'NEW ORDERS') return !['Delivered', 'Cancelled'].includes(o.status);
        if (orderFilter === 'DELIVERED') return o.status === 'Delivered';
        if (orderFilter === 'CANCELLED') return o.status === 'Cancelled';
        return false;
      }) || [];

      const pendingOrdersCount = orders?.filter(o => o.status === 'Placed').length || 0;

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
                {orderFilter === filter && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col px-4 py-6 space-y-4">
            {orderFilter === 'NEW ORDERS' && pendingOrdersCount > 0 && (
              <div className="bg-primary p-4 rounded-2xl flex items-center gap-4 animate-pulse shadow-lg shadow-primary/20 mb-2">
                <div className="bg-white/20 p-2 rounded-xl">
                  <BellRing className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-black italic uppercase text-sm leading-tight text-white">{pendingOrdersCount} NEW ORDERS PENDING</h2>
                  <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Action Required to stop Ringtone</p>
                </div>
              </div>
            )}

            {filteredOrders.length > 0 ? (
              filteredOrders.map((order: any) => (
                <div key={order.id} className={cn(
                  "bg-white rounded-3xl p-5 shadow-sm border overflow-hidden relative transition-all",
                  order.status === 'Placed' ? "border-primary ring-1 ring-primary/20 scale-[1.02]" : "border-gray-100"
                )}>
                  {order.status === 'Cancelled' && (
                    <div className="absolute top-0 right-0 p-3">
                       <XCircle className="h-5 w-5 text-red-500 opacity-20" />
                    </div>
                  )}
                  {order.status === 'Delivered' && (
                    <div className="absolute top-0 right-0 p-3">
                       <CheckCircle2 className="h-5 w-5 text-green-500 opacity-20" />
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-lg italic tracking-tight leading-none mb-1">#ORD-{order.id.slice(-4).toUpperCase()}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <Clock className="h-3 w-3" />
                        {order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </div>
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full",
                      order.status === 'Delivered' ? "bg-green-50 text-green-600" :
                      order.status === 'Cancelled' ? "bg-red-50 text-red-600" :
                      "bg-primary/5 text-primary"
                    )}>
                      {order.status}
                    </span>
                  </div>

                  <div className="bg-muted/30 rounded-2xl p-4 mb-4 space-y-2">
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between items-center text-xs font-bold text-gray-600">
                        <span>{item.quantity}x {item.name}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="pt-2 mt-2 border-t border-dashed border-gray-200 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-gray-400">Total Bill</span>
                      <span className="text-sm font-black text-gray-800">₹{order.total}</span>
                    </div>
                  </div>

                  {orderFilter === 'NEW ORDERS' && (
                    <div className="flex gap-3">
                      {order.status === 'Placed' && (
                        <Button 
                          onClick={() => updateStatus(order.id, 'Accepted')} 
                          className="flex-1 bg-black text-white rounded-2xl h-12 font-black uppercase italic tracking-tighter text-xs"
                        >
                          ACCEPT ORDER
                        </Button>
                      )}
                      {order.status === 'Accepted' && (
                        <Button 
                          onClick={() => updateStatus(order.id, 'Preparing')} 
                          className="flex-1 bg-primary text-white rounded-2xl h-12 font-black uppercase italic tracking-tighter text-xs"
                        >
                          START PREPARING
                        </Button>
                      )}
                      {order.status === 'Preparing' && (
                        <Button 
                          onClick={() => updateStatus(order.id, 'Ready for Pickup')} 
                          className="flex-1 bg-green-600 text-white rounded-2xl h-12 font-black uppercase italic tracking-tighter text-xs"
                        >
                          MARK READY
                        </Button>
                      )}
                      
                      {!['Ready for Pickup', 'Picked Up', 'Out for Delivery'].includes(order.status) && (
                        <Button 
                          variant="outline"
                          onClick={() => updateStatus(order.id, 'Cancelled')}
                          className="h-12 w-12 rounded-2xl border-red-100 text-red-500 hover:bg-red-50 shrink-0"
                        >
                          <XCircle className="h-5 w-5" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 opacity-30">
                <ShoppingBag className="h-16 w-16 mb-4 text-gray-300" />
                <h3 className="text-lg font-black italic uppercase tracking-tighter text-gray-600">No {orderFilter}</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Keep your app online to receive orders.</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (activeMainTab === 'catalog') {
      return (
        <div className="p-4 space-y-4 pb-32">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Menu Catalog</h2>
            <Dialog open={isAddOpen} onOpenChange={(val) => {
              setIsAddOpen(val);
              if(!val) {
                setEditingId(null);
                setNewProduct({ name: '', price: '', description: '', category: '', imageUrl: '', isVeg: true });
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#1E293B] rounded-xl font-black uppercase text-[10px] tracking-widest"><Plus className="h-3 w-3 mr-1" /> ADD ITEM</Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar">
                <DialogHeader>
                  <DialogTitle className="font-black italic uppercase text-center text-xl tracking-tighter">
                    {editingId ? 'Edit Item' : 'New Menu Item'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 pt-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Upload from Phone Gallery *</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "relative h-48 w-full border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-muted/20",
                        newProduct.imageUrl ? "border-primary/50" : "border-gray-200"
                      )}
                    >
                      {newProduct.imageUrl ? (
                        <>
                          <img src={newProduct.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                             <div className="bg-white p-3 rounded-full text-primary"><ImagePlus className="h-6 w-6" /></div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <div className="bg-white p-4 rounded-3xl shadow-sm border border-border/50">
                            <ImageIcon className="h-8 w-8 text-primary/40" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest">Tap to select photo</span>
                        </div>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Dish Name *</label>
                    <Input placeholder="Enter dish name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="h-14 rounded-2xl bg-muted/10 border-none px-5 text-base font-bold focus-visible:ring-1 focus-visible:ring-primary/20" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Price (₹) *</label>
                      <Input type="number" placeholder="0.00" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="h-14 rounded-2xl bg-muted/10 border-none px-5 text-base font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Collection *</label>
                      <Select 
                        key={dynamicCategories?.length || 0}
                        value={newProduct.category} 
                        onValueChange={(val) => setNewProduct({...newProduct, category: val})}
                      >
                        <SelectTrigger className="h-14 rounded-2xl bg-muted/10 border-none px-5 text-base font-bold focus:ring-1 focus:ring-primary/20">
                          <SelectValue placeholder={categoriesLoading ? "Loading..." : "Select Category"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          {dynamicCategories && dynamicCategories.length > 0 ? (
                            dynamicCategories.map((cat: any) => (
                              <SelectItem key={cat.id} value={cat.name.toLowerCase()} className="font-bold uppercase tracking-tight">
                                {cat.name}
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="snacks" className="font-bold">Snacks</SelectItem>
                              <SelectItem value="burgers" className="font-bold">Burgers</SelectItem>
                              <SelectItem value="pizza" className="font-bold">Pizza</SelectItem>
                              <SelectItem value="drinks" className="font-bold">Drinks</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Description (Optional)</label>
                    <Textarea placeholder="Tell users about your delicious dish..." value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} className="rounded-2xl bg-muted/10 border-none p-5 text-sm font-medium min-h-[100px]" />
                  </div>
                  
                  <div className="flex items-center space-x-3 bg-muted/10 p-4 rounded-2xl">
                    <Switch checked={newProduct.isVeg} onCheckedChange={(val) => setNewProduct({...newProduct, isVeg: val})} className="data-[state=checked]:bg-green-500" />
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pure Vegetarian</label>
                  </div>

                  <Button onClick={handleAddProduct} className="w-full bg-primary rounded-2xl h-16 font-black uppercase italic shadow-xl shadow-primary/20 text-lg tracking-tighter active:scale-95 transition-all">
                    {editingId ? 'UPDATE ITEM' : 'PUBLISH ITEM'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="grid gap-3">
            {products?.map(p => (
              <div key={p.id} className="bg-white p-4 rounded-[2rem] border border-gray-100 flex items-center justify-between shadow-sm group">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-muted shadow-sm">
                    <img src={p.imageUrl} className="h-full w-full object-cover" alt="" />
                    {p.isVeg && <div className="absolute top-1.5 left-1.5 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white" />}
                  </div>
                  <div>
                    <h4 className="font-black italic text-lg tracking-tight leading-none">{p.name}</h4>
                    <p className="text-primary font-black text-xl italic tracking-tighter mt-1">₹{p.price}</p>
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1 opacity-60">{p.category}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(p)} className="text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-xl h-10 w-10"><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(p.id)} className="text-red-500 bg-red-50 hover:bg-red-100 rounded-xl h-10 w-10"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            {(!products || products.length === 0) && (
               <div className="text-center py-20 opacity-30">
                  <Package className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">Catalog is empty</p>
               </div>
            )}
          </div>
        </div>
      );
    }

    if (activeMainTab === 'account') {
      return (
        <div className="flex flex-col bg-[#F3F4F6] min-h-full pb-32">
          <div className="bg-white p-4 flex items-center gap-4 mb-4 border-b border-gray-100">
            <button onClick={() => setActiveMainTab('orders')} className="p-2 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-black italic uppercase tracking-tighter">Account</h2>
          </div>

          <div className="px-4 space-y-4">
            <div className="relative h-48 w-full rounded-[2.5rem] overflow-hidden shadow-sm bg-muted border border-gray-200">
              <img 
                src={vendorProfile?.bannerUrl || 'https://picsum.photos/seed/resto/800/400'} 
                className="w-full h-full object-cover" 
                alt="Banner" 
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent">
                <h3 className="text-white text-2xl font-black italic uppercase tracking-tighter">{vendorProfile?.storeName || 'Store Name'}</h3>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 flex items-center justify-between shadow-sm border border-gray-100">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-black italic tracking-tighter flex items-center gap-2">
                  {vendorProfile?.rating || '4.5'} <Star className="h-6 w-6 text-amber-500 fill-amber-500" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none">Total Ratings</span>
                </div>
              </div>
              <button className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-1">
                Details <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">Account Details</h3>
                <button className="text-[10px] font-black uppercase text-primary tracking-widest">Edit</button>
              </div>
              
              <div className="space-y-6">
                <div className="flex">
                  <span className="w-24 text-[10px] font-black uppercase text-gray-400 tracking-widest">Name</span>
                  <span className="text-sm font-bold text-gray-800">{vendorProfile?.storeName || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-[10px] font-black uppercase text-gray-400 tracking-widest">Email</span>
                  <span className="text-sm font-bold text-gray-800">{vendorProfile?.email || '-'}</span>
                </div>
                <div className="flex">
                  <span className="w-24 text-[10px] font-black uppercase text-gray-400 tracking-widest">Phone</span>
                  <span className="text-sm font-bold text-gray-800">+91 {vendorProfile?.phone || '-'}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSignOut}
              className="w-full h-16 bg-red-50 text-red-500 rounded-3xl font-black uppercase italic tracking-tighter text-lg mt-4 border border-red-100 active:scale-[0.98] transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-20 opacity-30">
        <Utensils className="h-12 w-12 mb-4" />
        <p className="font-black italic uppercase tracking-tighter text-sm">Coming Soon</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col max-w-lg mx-auto shadow-2xl relative">
      {activeMainTab !== 'account' && (
        <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted border border-gray-100 shadow-sm">
              <img 
                src={vendorProfile?.imageUrl || 'https://picsum.photos/seed/resto/200/200'} 
                className="w-full h-full object-cover" 
                alt="Logo" 
              />
            </div>
            <div>
              <h1 className="text-base font-black italic uppercase tracking-tighter text-gray-800 leading-tight">{vendorProfile?.storeName || 'Restaurant'}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={cn("h-2 w-2 rounded-full", isOnline ? "bg-green-500" : "bg-gray-300")} />
                <span className={cn("text-[10px] font-black uppercase tracking-widest", isOnline ? "text-green-500" : "text-gray-400")}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={cn(
                "p-2.5 rounded-xl border-2 transition-all active:scale-90",
                isAudioEnabled ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-gray-50 text-gray-400 border-gray-100"
              )}
            >
              {isAudioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>

            <div className="flex items-center gap-3 bg-[#F1F5F9] px-3 py-1.5 rounded-full shadow-inner">
               <span className={cn("text-[10px] font-black uppercase tracking-widest", isOnline ? "text-green-600" : "text-gray-500")}>
                 {isOnline ? 'On' : 'Off'}
               </span>
               <Switch 
                checked={isOnline} 
                onCheckedChange={handleOnlineToggle} 
                className="data-[state=checked]:bg-green-500 scale-90"
               />
            </div>
          </div>
        </header>
      )}

      <main className="flex-1 flex flex-col bg-[#F3F4F6] overflow-y-auto no-scrollbar">
        {renderContent()}
      </main>

      <nav className="bg-[#0F172A] pt-4 pb-8 px-4 flex items-center justify-between border-t border-white/5">
        {[
          { id: 'orders', label: 'Orders', icon: LayoutDashboard },
          { id: 'catalog', label: 'Catalog', icon: Layers },
          { id: 'business', label: 'Business', icon: ArrowLeftRight },
          { id: 'payouts', label: 'Payouts', icon: CircleDollarSign },
          { id: 'account', label: 'Account', icon: UserCircle2 },
        ].map((item) => {
          const isActive = activeMainTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveMainTab(item.id as MainTab)}
              className="flex flex-col items-center gap-1.5 flex-1 transition-all active:scale-90"
            >
              <Icon className={cn("h-5 w-5 transition-colors", isActive ? "text-white" : "text-gray-500")} />
              <span className={cn("text-[10px] font-bold tracking-tight uppercase", isActive ? "text-white" : "text-gray-500")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
