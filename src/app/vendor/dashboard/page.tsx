
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
  MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';

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
  const [isOnline, setIsOnline] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', category: 'snacks', imageUrl: '', isVeg: true });

  // Vendor Profile Stream
  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile } = useDoc<any>(vendorRef);

  // Orders Stream
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'orders'), where('vendorId', '==', user.uid));
  }, [firestore, user]);
  const { data: orders } = useCollection<any>(ordersQuery);

  // Products Sub-collection Stream
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
    await updateDoc(oRef, { status: nextStatus });
    toast({ title: "Status Updated" });
  };

  const handleAddProduct = async () => {
    if (!firestore || !user || !vendorProfile || isSubmitting) return;
    if (!newProduct.name || !newProduct.price) {
      toast({ variant: "destructive", title: "Missing Info", description: "Name and price required." });
      return;
    }

    setIsSubmitting(true);
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
      imageUrl: newProduct.imageUrl || `https://picsum.photos/seed/${Date.now()}/400/400`
    };

    try {
      await addDoc(collection(firestore, 'vendors', user.uid, 'products'), productData);
      await addDoc(collection(firestore, 'products'), productData);
      setNewProduct({ name: '', price: '', description: '', category: 'snacks', imageUrl: '', isVeg: true });
      setIsAddOpen(false);
      toast({ title: "Product Added" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error Saving" });
    } finally {
      setIsSubmitting(false);
    }
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
          {/* Status Pills */}
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
                <div className="relative w-64 h-64 mb-6">
                  {/* Kitchen Stove SVG Illustration */}
                  <svg viewBox="0 0 400 400" className="w-full h-full text-gray-200 fill-current">
                    <circle cx="200" cy="200" r="150" fill="#f3f4f6" />
                    <rect x="120" y="160" width="160" height="120" rx="10" fill="#e5e7eb" />
                    <rect x="130" y="170" width="140" height="100" rx="5" fill="#fff" />
                    <circle cx="165" cy="200" r="25" fill="#f3f4f6" />
                    <circle cx="235" cy="200" r="25" fill="#f3f4f6" />
                    <circle cx="165" cy="250" r="25" fill="#f3f4f6" />
                    <circle cx="235" cy="250" r="25" fill="#f3f4f6" />
                    <path d="M150 160 L150 130 Q150 110 180 110 L220 110 Q250 110 250 130 L250 160" stroke="#d1d5db" strokeWidth="8" fill="none" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-600">No orders are currently being {orderFilter.toLowerCase()}!</h3>
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
            <h2 className="text-xl font-bold">Menu Catalog</h2>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-[#1E293B] rounded-xl"><Plus className="h-4 w-4 mr-1" /> ADD ITEM</Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2rem]">
                <DialogHeader><DialogTitle>New Menu Item</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input placeholder="Dish Name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                  <Input type="number" placeholder="Price (₹)" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                  <Button onClick={handleAddProduct} disabled={isSubmitting} className="w-full bg-primary rounded-xl h-12 font-bold">PUBLISH ITEM</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-3">
            {products?.map(p => (
              <div key={p.id} className="bg-white p-3 rounded-2xl border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={p.imageUrl} className="h-14 w-14 rounded-xl object-cover bg-muted" alt="" />
                  <div>
                    <h4 className="font-bold text-sm">{p.name}</h4>
                    <p className="text-primary font-black text-xs">₹{p.price}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(firestore!, 'vendors', user!.uid, 'products', p.id))} className="text-red-300"><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center p-20 opacity-30">
        <Utensils className="h-12 w-12 mb-4" />
        <p className="font-bold text-sm">Module coming soon</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col max-w-lg mx-auto shadow-2xl relative">
      {/* Top System Icons Bar */}
      <div className="bg-black text-white px-4 py-2 flex items-center justify-between text-sm">
         <div className="flex items-center gap-4">
            <X className="h-5 w-5" />
            <ChevronLeft className="h-5 w-5" />
         </div>
         <span className="font-medium tracking-tight">pppp.zepio.io</span>
         <div className="flex items-center gap-4">
            <Share2 className="h-4 w-4" />
            <MoreVertical className="h-4 w-4" />
         </div>
      </div>

      {/* Header Section */}
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
            <h1 className="text-base font-bold text-gray-800 leading-tight">{vendorProfile?.storeName || 'Restaurant Name'}</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={cn("h-2 w-2 rounded-full", isOnline ? "bg-green-500" : "bg-gray-300")} />
              <span className={cn("text-[10px] font-bold uppercase", isOnline ? "text-green-500" : "text-gray-400")}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-[#F1F5F9] px-3 py-1.5 rounded-full">
           <span className={cn("text-[10px] font-black uppercase", isOnline ? "text-green-600" : "text-gray-500")}>
             {isOnline ? 'Online' : 'Offline'}
           </span>
           <Switch 
            checked={isOnline} 
            onCheckedChange={setIsOnline} 
            className="data-[state=checked]:bg-green-500 scale-90"
           />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-[#F3F4F6]">
        {renderContent()}
      </main>

      {/* Dark Bottom Navigation Bar */}
      <nav className="bg-[#0F172A] pt-4 pb-8 px-4 flex items-center justify-between">
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
              className="flex flex-col items-center gap-1.5 flex-1 transition-all"
            >
              <Icon className={cn("h-5 w-5", isActive ? "text-white" : "text-gray-500")} />
              <span className={cn("text-[10px] font-bold tracking-tight", isActive ? "text-white" : "text-gray-500")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
