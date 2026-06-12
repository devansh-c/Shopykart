
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, deleteDoc, updateDoc, orderBy, getDocs, writeBatch } from 'firebase/firestore';
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
  CheckCircle2
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

type MainTab = 'orders' | 'catalog' | 'payouts' | 'account';
type OrderFilter = 'NEW ORDERS' | 'DELIVERED' | 'CANCELLED';

// Form localized to fix input lag
const ProductForm = memo(({ initialData, categories, onSave, onCancel, isSubmitting }: any) => {
  const [formData, setFormData] = useState(initialData || { 
    name: '', mrp: '', price: '', description: '', category: '', imageUrl: '', isVeg: true, options: [] 
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpdateOption = (index: number, field: string, value: string) => {
    const updated = [...formData.options];
    if (field === 'price') updated[index].price = parseFloat(value) || 0;
    else updated[index].name = value;
    setFormData({ ...formData, options: updated });
  };

  return (
    <div className="space-y-5 pt-4 transform-gpu">
      <div onClick={() => fileRef.current?.click()} className="h-44 border-2 border-dashed border-border rounded-[2rem] flex flex-col items-center justify-center bg-muted/20 cursor-pointer overflow-hidden group">
        {formData.imageUrl ? <img src={formData.imageUrl} className="h-full w-full object-cover" alt="" /> : <div className="flex flex-col items-center gap-2"><ImageIcon className="h-8 w-8 opacity-10" /><span className="text-[10px] font-black uppercase text-muted-foreground">Dish Photo</span></div>}
      </div>
      <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = async () => setFormData({...formData, imageUrl: await compressImage(r.result as string, 800, 800)}); r.readAsDataURL(f); } }} />
      <div className="space-y-4">
        <Input placeholder="Dish Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/10 border-none" />
        <Textarea placeholder="Description..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="rounded-xl bg-muted/10 h-24 font-medium text-xs border-none" />
        <div className="grid grid-cols-2 gap-4">
          <Input placeholder="MRP ₹" type="number" value={formData.mrp} onChange={e => setFormData({...formData, mrp: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-none font-bold" />
          <Input placeholder="Price ₹" type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="h-12 rounded-xl border-primary/20 bg-primary/5 font-black text-primary" />
        </div>
        <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
          <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold text-xs"><SelectValue placeholder="Select Section" /></SelectTrigger>
          <SelectContent className="rounded-2xl">{categories?.map((cat: any) => (<SelectItem key={cat.id} value={cat.name.toLowerCase()} className="font-bold py-3 text-xs uppercase">{cat.name}</SelectItem>))}</SelectContent>
        </Select>
        <div className="space-y-3 pt-2">
           <div className="flex items-center justify-between"><label className="text-[10px] font-black uppercase text-muted-foreground">Variants</label><Button type="button" onClick={() => setFormData({...formData, options: [...formData.options, {name:'', price: 0}]})} variant="ghost" className="h-7 text-[8px] font-black uppercase border border-primary/20 text-primary rounded-lg">+ ADD</Button></div>
           {formData.options.map((opt:any, i:number) => (
             <div key={i} className="flex gap-2">
               <Input placeholder="Size" value={opt.name} onChange={e => handleUpdateOption(i, 'name', e.target.value)} className="h-11 rounded-xl text-[10px] font-bold bg-muted/10 border-none" />
               <Input type="number" placeholder="₹" value={opt.price} onChange={e => handleUpdateOption(i, 'price', e.target.value)} className="h-11 w-20 rounded-xl text-[10px] font-black text-center bg-primary/5 border-none text-primary" />
               <Button onClick={() => { const u = [...formData.options]; u.splice(i, 1); setFormData({...formData, options: u}) }} variant="ghost" size="icon" className="h-11 w-11 text-red-400 bg-red-50 rounded-xl shrink-0"><X className="h-4 w-4" /></Button>
             </div>
           ))}
        </div>
      </div>
      <Button onClick={() => onSave(formData)} disabled={isSubmitting} className="w-full h-16 bg-primary text-white rounded-3xl font-black uppercase italic shadow-xl text-lg">{isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : 'PUBLISH TO MENU'}</Button>
    </div>
  );
});
ProductForm.displayName = "ProductForm";

export default function VendorDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('orders');
  const [isPending, startTransition] = useTransition();
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('NEW ORDERS');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile } = useDoc<any>(vendorRef);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);
  const { data: globalCategories } = useCollection<any>(categoriesQuery);

  useEffect(() => {
    if (!authLoading && isMounted && !user) {
        const hasSessionFlag = localStorage.getItem('shopykart_session_active');
        if (!hasSessionFlag) router.push('/vendor/login');
    }
  }, [user, authLoading, router, isMounted]);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'orders'), where('vendorId', '==', user.uid));
  }, [firestore, user]);
  const { data: rawOrders } = useCollection<any>(ordersQuery);

  const orders = useMemo(() => {
    if (!rawOrders) return [];
    return [...rawOrders].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [rawOrders]);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'vendors', user.uid, 'products');
  }, [firestore, user]);
  const { data: products } = useCollection<any>(productsQuery);

  const handleTabSwitch = (id: MainTab) => {
    startTransition(() => {
      setActiveMainTab(id);
    });
  };

  const handleAddProduct = async (formData: any) => {
    if (!firestore || !user || !vendorProfile) return;
    if (!formData.name || !formData.price || !formData.imageUrl) {
      toast({ variant: "destructive", title: "Missing Info" });
      return;
    }
    setIsSubmitting(true);
    const targetId = editingId || doc(collection(firestore, 'products')).id;
    const productData = {
      id: targetId,
      name: formData.name.trim(),
      mrp: parseFloat(formData.mrp) || parseFloat(formData.price),
      price: parseFloat(formData.price),
      description: formData.description.trim() || '',
      category: formData.category.toLowerCase().trim() || 'general',
      serviceMode: 'Food',
      isAvailable: true,
      options: formData.options.filter((o:any) => o.name.trim() !== ''),
      vendorId: user.uid,
      restaurantName: vendorProfile.storeName,
      imageUrl: formData.imageUrl,
      updatedAt: serverTimestamp(),
      createdAt: editingId ? (products?.find(p => p.id === editingId)?.createdAt || serverTimestamp()) : serverTimestamp()
    };
    try {
      await setDoc(doc(firestore, 'products', targetId), productData, { merge: true });
      await setDoc(doc(firestore, 'vendors', user.uid, 'products', targetId), productData, { merge: true });
      setIsAddOpen(false);
      setEditingId(null);
      toast({ title: "Product Synced!" });
    } catch (e) { toast({ variant: "destructive", title: "Error Saving" }); }
    finally { setIsSubmitting(false); }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative transform-gpu">
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b sticky top-0 z-50">
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
         <Button variant="ghost" onClick={() => { localStorage.removeItem('shopykart_session_active'); signOut(auth!); }} className="text-red-500 h-10 w-10 p-0 rounded-xl bg-red-50"><LogOut className="h-4 w-4" /></Button>
      </header>

      <main className={cn("flex-1 pb-32 transition-opacity duration-300", isPending ? "opacity-50" : "opacity-100")}>
         {activeMainTab === 'orders' ? (
           <div className="p-4 space-y-4 animate-in fade-in duration-500">
              <div className="flex bg-white rounded-2xl p-1 shadow-sm mb-4 border border-border/50">
                {['NEW ORDERS', 'DELIVERED', 'CANCELLED'].map(f => (
                  <button key={f} onClick={() => setOrderFilter(f as OrderFilter)} className={cn("flex-1 py-3 text-[9px] font-black rounded-xl transition-all", orderFilter === f ? "bg-black text-white" : "text-gray-400")}>{f}</button>
                ))}
              </div>
              {orders?.filter(o => {
                if(orderFilter === 'NEW ORDERS') return !['Delivered', 'Cancelled'].includes(o.status);
                if(orderFilter === 'CANCELLED') return o.status === 'Cancelled';
                return o.status === 'Delivered';
              }).map(o => (
                <div key={o.id} className="bg-white p-5 rounded-[2rem] border border-border/50 shadow-sm relative overflow-hidden group">
                   <div className="flex justify-between items-center mb-4">
                      <div><span className="text-lg font-black italic">#{o.orderDisplayId || o.id.slice(-4)}</span><div className="flex items-center gap-1 text-[8px] font-black text-gray-400 uppercase mt-0.5"><Clock className="h-2.5 w-2.5" />{format(new Date(o.createdAt?.seconds * 1000 || Date.now()), 'MMM d, h:mm a')}</div></div>
                      <Badge className={cn("border-none text-[8px] font-black rounded-full px-2.5 py-1 uppercase", o.status === 'Cancelled' ? "bg-red-50 text-red-600" : o.status === 'Delivered' ? "bg-green-50 text-green-600" : "bg-primary/10 text-primary")}>{o.status}</Badge>
                   </div>
                   <div className="bg-muted/30 rounded-2xl p-4 mb-4 space-y-2 border border-border/20">
                      {o.items?.map((item:any, i:number) => (<div key={i} className="flex justify-between items-center text-xs font-bold"><span className="text-gray-700">{item.quantity}x {item.name}</span><span className="text-primary font-black">₹{(item.price * item.quantity).toFixed(2)}</span></div>))}
                   </div>
                </div>
              ))}
           </div>
         ) : activeMainTab === 'catalog' ? (
           <div className="p-4 space-y-4 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-4 px-1">
                 <h2 className="text-xl font-black italic uppercase">Inventory</h2>
                 <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild><Button onClick={() => setEditingId(null)} className="bg-black text-white rounded-xl h-10 font-black uppercase text-[9px]"><Plus className="mr-1 h-3.5 w-3.5" /> ADD NEW</Button></DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] max-w-lg border-none shadow-2xl">
                       <DialogHeader><DialogTitle className="font-black italic uppercase text-center text-xl">Dish Configuration</DialogTitle></DialogHeader>
                       <ProductForm 
                         categories={globalCategories} 
                         onSave={handleAddProduct} 
                         isSubmitting={isSubmitting}
                         initialData={editingId ? products?.find(p => p.id === editingId) : null}
                       />
                    </DialogContent>
                 </Dialog>
              </div>
              <div className="grid grid-cols-1 gap-3 content-visibility-auto">
                 {products?.map(p => (
                   <div key={p.id} className={cn("bg-white p-4 rounded-[2rem] border border-border/50 flex items-center justify-between group", p.isAvailable === false && "opacity-60")}>
                      <div className="flex items-center gap-4">
                        <img src={p.imageUrl} className="h-16 w-16 rounded-2xl object-cover" alt="" />
                        <div><h4 className="font-black text-sm uppercase italic truncate max-w-[120px]">{p.name}</h4><p className="text-primary font-black text-xs italic">₹{p.price}</p></div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => { setEditingId(p.id); setIsAddOpen(true); }} size="icon" variant="ghost" className="h-10 w-10 bg-blue-50 text-blue-600 rounded-xl"><Edit className="h-4 w-4" /></Button>
                        <Button onClick={() => { if(confirm("Delete?")) { deleteDoc(doc(firestore!, 'products', p.id)); } }} size="icon" variant="ghost" className="h-10 w-10 bg-red-50 text-red-600 rounded-xl"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
         ) : null}
      </main>

      <nav className="fixed bottom-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-10 px-6 flex justify-around border-t border-white/5 z-50 rounded-t-[3rem] shadow-2xl">
        {[
          {id:'orders',label:'Orders',icon:LayoutDashboard},
          {id:'catalog',label:'Catalog',icon:Layers},
          {id:'payouts',label:'Payouts',icon:CircleDollarSign},
          {id:'account',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => handleTabSwitch(item.id as MainTab)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-primary scale-110" : "text-gray-500")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
