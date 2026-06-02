
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
  X,
  Loader2
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
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('NEW ORDERS');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState({ 
    name: '', price: '', description: '', category: '', imageUrl: '', isVeg: true,
    options: [] as { name: string; price: number }[]
  });

  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile, loading: profileLoading } = useDoc<any>(vendorRef);

  useEffect(() => {
    if (!authLoading && (!user || (user && !profileLoading && !vendorProfile))) {
      router.push('/vendor/login');
    }
  }, [user, authLoading, vendorProfile, profileLoading, router]);

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

  const handleAddProduct = async () => {
    if (!firestore || !user || !vendorProfile) return;
    if (!newProduct.name || !newProduct.price || !newProduct.imageUrl || !newProduct.category) {
      toast({ variant: "destructive", title: "Missing Info" });
      return;
    }

    setIsSubmitting(true);
    const targetId = editingId || doc(collection(firestore, 'products')).id;
    
    // Strict Zone Inheritance from Vendor Profile
    const productData = {
      name: newProduct.name.trim(),
      price: parseFloat(newProduct.price),
      description: newProduct.description,
      category: newProduct.category.toLowerCase().trim(),
      isVeg: newProduct.isVeg,
      isAvailable: true,
      options: newProduct.options.filter(o => o.name.trim() !== ''),
      vendorId: user.uid,
      zoneId: vendorProfile.zoneId || null,
      town: vendorProfile.town || 'Local',
      restaurantName: vendorProfile.storeName,
      imageUrl: newProduct.imageUrl,
      updatedAt: serverTimestamp(),
      createdAt: editingId ? (products?.find(p => p.id === editingId)?.createdAt || serverTimestamp()) : serverTimestamp()
    };

    try {
      await setDoc(doc(firestore, 'products', targetId), productData, { merge: true });
      await setDoc(doc(firestore, 'vendors', user.uid, 'products', targetId), productData, { merge: true });
      setIsAddOpen(false);
      setEditingId(null);
      setNewProduct({ name: '', price: '', description: '', category: '', imageUrl: '', isVeg: true, options: [] });
      toast({ title: "Live Sync Complete" });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
    finally { setIsSubmitting(false); }
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id);
    setNewProduct({
      name: p.name, price: p.price.toString(), description: p.description || '',
      category: p.category, imageUrl: p.imageUrl, isVeg: p.isVeg !== false,
      options: p.options || []
    });
    setIsAddOpen(true);
  };

  if (authLoading || profileLoading || !vendorProfile) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col max-w-lg mx-auto shadow-2xl relative">
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b">
         <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl overflow-hidden bg-muted"><img src={vendorProfile.imageUrl} className="h-full w-full object-cover" /></div>
            <div><h1 className="text-sm font-black italic uppercase">{vendorProfile.storeName}</h1><p className="text-[8px] font-bold text-muted-foreground uppercase">{vendorProfile.town}</p></div>
         </div>
         <Button variant="ghost" onClick={() => signOut(auth!)} className="text-red-500 h-10 w-10 p-0 rounded-xl bg-red-50"><LogOut className="h-4 w-4" /></Button>
      </header>

      <main className="flex-1 pb-32 overflow-y-auto no-scrollbar">
         {activeMainTab === 'orders' ? (
           <div className="p-4 space-y-4">
              <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-4">
                {['NEW ORDERS', 'DELIVERED'].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[10px] font-black rounded-xl", orderFilter === f ? "bg-primary text-white" : "text-gray-400")}>{f}</button>
                ))}
              </div>
              {orders?.filter(o => {
                if(orderFilter === 'NEW ORDERS') return !['Delivered', 'Cancelled'].includes(o.status);
                return o.status === 'Delivered';
              }).map(o => (
                <div key={o.id} className="bg-white p-5 rounded-[2rem] border shadow-sm">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-black italic">#{o.orderDisplayId || o.id.slice(-4)}</span>
                      <Badge className="bg-primary/10 text-primary border-none uppercase text-[8px]">{o.status}</Badge>
                   </div>
                   <div className="space-y-1 mb-4">
                      {o.items?.map((item:any, i:number) => <p key={i} className="text-xs font-bold">{item.quantity}x {item.name}</p>)}
                   </div>
                   <div className="flex gap-2">
                      {o.status === 'Placed' && <Button onClick={() => updateDoc(doc(firestore!, 'orders', o.id), { status: 'Accepted' })} className="flex-1 bg-black h-12 rounded-2xl font-black uppercase text-xs">Accept</Button>}
                      {o.status === 'Accepted' && <Button onClick={() => updateDoc(doc(firestore!, 'orders', o.id), { status: 'Preparing' })} className="flex-1 bg-primary h-12 rounded-2xl font-black uppercase text-xs">Prepare</Button>}
                      {o.status === 'Preparing' && <Button onClick={() => updateDoc(doc(firestore!, 'orders', o.id), { status: 'Ready for Pickup' })} className="flex-1 bg-green-600 h-12 rounded-2xl font-black uppercase text-xs">Ready</Button>}
                   </div>
                </div>
              ))}
           </div>
         ) : activeMainTab === 'catalog' ? (
           <div className="p-4 space-y-4">
              <div className="flex justify-between items-center mb-4">
                 <h2 className="text-xl font-black italic uppercase">Store Catalog</h2>
                 <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild><Button className="bg-black rounded-xl h-10 font-black uppercase text-[10px]"><Plus className="mr-1 h-3 w-3" /> ADD ITEM</Button></DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] max-w-sm">
                       <DialogHeader><DialogTitle className="font-black italic uppercase">Manage Dish</DialogTitle></DialogHeader>
                       <div className="space-y-4 pt-4">
                          <Input placeholder="Dish name" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="h-12 rounded-xl" />
                          <Input placeholder="Price (₹)" type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="h-12 rounded-xl" />
                          <Input placeholder="Category" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="h-12 rounded-xl" />
                          <div onClick={() => fileInputRef.current?.click()} className="h-32 border-2 border-dashed rounded-2xl flex items-center justify-center bg-muted/20 cursor-pointer overflow-hidden">
                             {newProduct.imageUrl ? <img src={newProduct.imageUrl} className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8 opacity-20" />}
                          </div>
                          <input type="file" ref={fileInputRef} className="hidden" onChange={async (e) => {
                             const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = async () => setNewProduct({...newProduct, imageUrl: await compressImage(r.result as string, 800, 800)}); r.readAsDataURL(f); }
                          }} />
                          <Button onClick={handleAddProduct} disabled={isSubmitting} className="w-full h-14 bg-primary rounded-2xl font-black uppercase italic shadow-lg">{isSubmitting ? 'Syncing...' : 'Publish Item'}</Button>
                       </div>
                    </DialogContent>
                 </Dialog>
              </div>
              <div className="grid grid-cols-1 gap-3">
                 {products?.map(p => (
                   <div key={p.id} className="bg-white p-4 rounded-3xl border flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <img src={p.imageUrl} className="h-14 w-14 rounded-xl object-cover" />
                         <div><h4 className="font-black text-xs uppercase italic">{p.name}</h4><p className="text-primary font-black text-xs">₹{p.price}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleEdit(p)} size="icon" variant="ghost" className="h-9 w-9 bg-blue-50 text-blue-600 rounded-xl"><Edit className="h-4 w-4" /></Button>
                        <Button onClick={() => { if(confirm("Delete?")) { deleteDoc(doc(firestore!, 'products', p.id)); deleteDoc(doc(firestore!, 'vendors', user!.uid, 'products', p.id)); }}} size="icon" variant="ghost" className="h-9 w-9 bg-red-50 text-red-600 rounded-xl"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
         ) : <div className="p-20 text-center opacity-30 uppercase font-black">Coming Soon</div>}
      </main>

      <nav className="fixed bottom-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-50">
        {[
          {id:'orders',label:'Orders',icon:LayoutDashboard},
          {id:'catalog',label:'Catalog',icon:Layers},
          {id:'account',label:'Account',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => setActiveMainTab(item.id as MainTab)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-all">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-white" : "text-gray-500")} />
            <span className={cn("text-[9px] font-black uppercase", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
