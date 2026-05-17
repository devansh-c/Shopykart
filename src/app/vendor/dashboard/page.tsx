
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, addDoc, setDoc, serverTimestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Camera, 
  LogOut,
  Utensils,
  Package,
  LayoutDashboard,
  Layers,
  ArrowLeftRight,
  CircleDollarSign,
  UserCircle2,
  ChevronLeft,
  X,
  Share2,
  MoreVertical,
  Star,
  ChevronRight,
  Phone,
  Mail,
  Store,
  Edit,
  Check,
  ImageIcon,
  ImagePlus
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
type OrderStatus = 'Preparing' | 'Ready' | 'Out for Delivery' | 'Delivered';

export default function VendorDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderStatus>('Preparing');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    price: '', 
    description: '', 
    category: 'snacks', 
    imageUrl: '', 
    isVeg: true 
  });

  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile } = useDoc<any>(vendorRef);

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

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/vendor/login');
  };

  const updateStatus = async (orderId: string, nextStatus: string) => {
    if (!firestore) return;
    const oRef = doc(firestore, 'orders', orderId);
    updateDoc(oRef, { status: nextStatus });
  };

  const handleOpenEdit = (product: any) => {
    setNewProduct({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      category: product.category || 'snacks',
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
    if (!newProduct.name || !newProduct.price || !newProduct.imageUrl) {
      toast({ variant: "destructive", title: "Missing Info", description: "Name, Price and Photo are required." });
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

    // INSTANT FEEDBACK: Close dialog immediately
    setIsAddOpen(false);
    const tempEditingId = editingId;
    setEditingId(null);
    setNewProduct({ name: '', price: '', description: '', category: 'snacks', imageUrl: '', isVeg: true });

    if (tempEditingId) {
      const vProdRef = doc(firestore, 'vendors', user.uid, 'products', tempEditingId);
      updateDoc(vProdRef, productData);
      toast({ title: "Product Updated" });
    } else {
      addDoc(collection(firestore, 'vendors', user.uid, 'products'), productData);
      addDoc(collection(firestore, 'products'), productData);
      toast({ title: "Product Published" });
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (!firestore || !user) return;
    deleteDoc(doc(firestore, 'vendors', user.uid, 'products', id));
    toast({ title: "Product Deleted" });
  };

  const statusOptions: OrderStatus[] = ['Preparing', 'Ready', 'Out for Delivery', 'Delivered'];

  const renderContent = () => {
    if (activeMainTab === 'orders') {
      const filteredOrders = orders?.filter(o => {
        if (orderFilter === 'Preparing') return o.status === 'Accepted' || o.status === 'Preparing';
        if (orderFilter === 'Ready') return o.status === 'Ready for Pickup';
        return o.status === orderFilter;
      }) || [];

      return (
        <div className="flex flex-col flex-1">
          <div className="flex overflow-x-auto gap-3 px-4 py-4 no-scrollbar">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setOrderFilter(status)}
                className={cn(
                  "px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border",
                  orderFilter === status 
                    ? "bg-[#1E293B] text-white border-[#1E293B]" 
                    : "bg-white text-gray-500 border-gray-200"
                )}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-col px-4 py-8">
            {filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order: any) => (
                  <div key={order.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-base">#ORD-{order.id.slice(-4)}</h3>
                        <p className="text-xs text-muted-foreground">{order.items?.length} Items • ₹{order.total}</p>
                      </div>
                      <span className="text-[10px] font-black uppercase text-primary bg-primary/5 px-2 py-1 rounded-md">{order.status}</span>
                    </div>
                    <div className="flex gap-2">
                       {order.status === 'Accepted' && <Button onClick={() => updateStatus(order.id, 'Preparing')} className="flex-1 bg-[#1E293B] text-white rounded-xl h-10 text-xs font-bold">START PREPARING</Button>}
                       {order.status === 'Preparing' && <Button onClick={() => updateStatus(order.id, 'Ready for Pickup')} className="flex-1 bg-green-600 text-white rounded-xl h-10 text-xs font-bold">MARK READY</Button>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-80 mt-10">
                <Utensils className="h-16 w-16 mb-4 text-gray-200" />
                <h3 className="text-lg font-bold text-gray-600">No orders here!</h3>
                <p className="text-sm text-gray-400 mt-1">Keep your app online to receive new requests.</p>
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
            <h2 className="text-xl font-bold text-gray-800">Menu Catalog</h2>
            <Dialog open={isAddOpen} onOpenChange={(val) => {
              setIsAddOpen(val);
              if(!val) {
                setEditingId(null);
                setNewProduct({ name: '', price: '', description: '', category: 'snacks', imageUrl: '', isVeg: true });
              }
            }}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#1E293B] rounded-xl"><Plus className="h-4 w-4 mr-1" /> ADD ITEM</Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar">
                <DialogHeader>
                  <DialogTitle className="font-black italic uppercase text-center text-xl tracking-tighter">
                    {editingId ? 'Edit Item' : 'New Menu Item'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-5 pt-4">
                  {/* Gallery Upload Section */}
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
                      <Select value={newProduct.category} onValueChange={(val) => setNewProduct({...newProduct, category: val})}>
                        <SelectTrigger className="h-14 rounded-2xl bg-muted/10 border-none px-5 text-base font-bold focus:ring-1 focus:ring-primary/20"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="rounded-2xl">
                          <SelectItem value="snacks" className="font-bold">Snacks</SelectItem>
                          <SelectItem value="burgers" className="font-bold">Burgers</SelectItem>
                          <SelectItem value="pizza" className="font-bold">Pizza</SelectItem>
                          <SelectItem value="pasta" className="font-bold">Pasta</SelectItem>
                          <SelectItem value="fries" className="font-bold">Fries</SelectItem>
                          <SelectItem value="drinks" className="font-bold">Drinks</SelectItem>
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
            <h2 className="text-lg font-bold">Account</h2>
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
        <p className="font-bold text-sm">Coming Soon</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col max-w-lg mx-auto shadow-2xl relative">
      <div className="bg-black text-white px-4 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-widest">
         <div className="flex items-center gap-4">
            <X className="h-4 w-4" />
            <ChevronLeft className="h-4 w-4" />
         </div>
         <span className="tracking-tighter italic">partner.shopykart.com</span>
         <div className="flex items-center gap-4">
            <Share2 className="h-4 w-4" />
            <MoreVertical className="h-4 w-4" />
         </div>
      </div>

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
              <h1 className="text-base font-bold text-gray-800 leading-tight">{vendorProfile?.storeName || 'Restaurant'}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={cn("h-2 w-2 rounded-full", isOnline ? "bg-green-500" : "bg-gray-300")} />
                <span className={cn("text-[10px] font-black uppercase tracking-widest", isOnline ? "text-green-500" : "text-gray-400")}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-[#F1F5F9] px-3 py-1.5 rounded-full shadow-inner">
             <span className={cn("text-[10px] font-black uppercase tracking-widest", isOnline ? "text-green-600" : "text-gray-500")}>
               {isOnline ? 'Online' : 'Offline'}
             </span>
             <Switch 
              checked={isOnline} 
              onCheckedChange={handleOnlineToggle} 
              className="data-[state=checked]:bg-green-500 scale-90"
             />
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
