"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, setDoc, serverTimestamp, deleteDoc, updateDoc, orderBy, writeBatch, limit } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  ShoppingBag, 
  Plus, 
  LogOut,
  Utensils,
  LayoutDashboard,
  Layers,
  CircleDollarSign,
  UserCircle2,
  Clock,
  Camera,
  Store,
  X,
  Loader2,
  User,
  Phone,
  CheckCircle2,
  MapPin,
  Sparkles,
  Zap,
  ImageIcon,
  Trash2,
  Wallet,
  History,
  ArrowUpRight,
  ChevronRight,
  Eye,
  Save,
  ShieldCheck,
  CreditCard,
  Banknote,
  Timer,
  ListTree
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';
import { compressImage } from '@/lib/image-utils';

export default function VendorDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  
  const [activeMainTab, setActiveMainTab] = useState<'orders' | 'catalog' | 'payouts' | 'account'>('orders');
  const [isMounted, setIsMounted] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isVarietyRequired, setIsVarietyRequired] = useState(false);
  const [options, setOptions] = useState<{ name: string; price: number }[]>([]);
  const [productForm, setProductForm] = useState({
    name: '', price: '', mrp: '', description: '', category: '', imageUrl: '', preparingTime: ''
  });

  useEffect(() => { setIsMounted(true); }, []);

  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile } = useDoc<any>(vendorRef);

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'categories'), where('serviceType', '==', 'Food'));
  }, [firestore]);
  const { data: foodCategories } = useCollection<any>(categoriesQuery);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'products'), where('vendorId', '==', user.uid));
  }, [firestore, user]);
  const { data: myProducts } = useCollection<any>(productsQuery);

  const handleProductImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 600, 600);
      setProductForm(prev => ({ ...prev, imageUrl: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddOption = () => {
    setOptions([...options, { name: '', price: 0 }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...options];
    (newOptions[index] as any)[field] = field === 'price' ? parseFloat(value) || 0 : value;
    setOptions(newOptions);
  };

  const handleSaveProduct = async () => {
    if (!firestore || !user || !productForm.name || !productForm.price) {
      toast({ variant: "destructive", title: "Missing Info" });
      return;
    }

    setIsSavingProduct(true);
    try {
      const newRef = doc(collection(firestore, 'products'));
      const pData = {
        name: productForm.name.trim(),
        price: parseFloat(productForm.price),
        mrp: parseFloat(productForm.mrp) || parseFloat(productForm.price),
        description: productForm.description.trim(),
        category: productForm.category.toLowerCase().trim() || 'food',
        preparingTime: parseInt(productForm.preparingTime) || 15,
        imageUrl: productForm.imageUrl || 'https://picsum.photos/seed/food/400/400',
        vendorId: user.uid,
        id: newRef.id,
        options: options.filter(opt => opt.name.trim() !== ''),
        isVarietyRequired: isVarietyRequired,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isAvailable: true,
        isDeleted: false,
        restaurantName: vendorProfile?.storeName || 'Store'
      };

      await setDoc(newRef, pData);
      
      setIsProductModalOpen(false);
      resetForm();
      toast({ title: "Product Published!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSavingProduct(false);
    }
  };

  const resetForm = () => {
    setProductForm({ name: '', price: '', mrp: '', description: '', category: '', imageUrl: '', preparingTime: '' });
    setOptions([]);
    setIsVarietyRequired(false);
  };

  if (!isMounted || authLoading || !user) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground italic">AUTHENTICATING...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative overflow-hidden">
      <header className="bg-white px-6 py-5 border-b flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
           <Store className="h-6 w-6 text-primary" />
           <h1 className="font-black italic uppercase tracking-tighter">{vendorProfile?.storeName || 'Vendor Console'}</h1>
        </div>
        <button onClick={() => { signOut(auth!); router.replace('/'); }} className="h-10 w-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><LogOut className="h-5 w-5" /></button>
      </header>

      <main className={cn("flex-1 overflow-y-auto no-scrollbar pb-32 transition-opacity", isPending ? "opacity-50" : "opacity-100")}>
        {activeMainTab === 'orders' && (
           <div className="p-4 space-y-4">
              <h2 className="text-xl font-black italic uppercase ml-2 mt-2">Active Orders</h2>
              <div className="text-center py-20 opacity-30 flex flex-col items-center">
                 <ShoppingBag className="h-12 w-12 mb-4" />
                 <p className="font-black uppercase text-xs">Waiting for new orders...</p>
              </div>
           </div>
        )}

        {activeMainTab === 'catalog' && (
          <div className="p-4 space-y-6">
            <div className="flex justify-between items-center px-2">
               <h2 className="text-xl font-black italic uppercase">Inventory</h2>
               <Dialog open={isProductModalOpen} onOpenChange={(val) => { setIsProductModalOpen(val); if(!val) resetForm(); }}>
                  <DialogTrigger asChild><Button className="bg-primary text-white rounded-xl h-10 font-black uppercase text-[10px]"><Plus className="h-4 w-4 mr-1" /> ADD ITEM</Button></DialogTrigger>
                  <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl max-h-[85vh] flex flex-col">
                     <DialogHeader className="p-8 pb-2 shrink-0">
                        <DialogTitle className="font-black italic uppercase text-center text-xl">New Product</DialogTitle>
                        <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fill details to list on menu</DialogDescription>
                     </DialogHeader>
                     <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-0 space-y-6">
                        <div onClick={() => fileInputRef.current?.click()} className="h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer bg-muted/20 overflow-hidden relative group">
                           {productForm.imageUrl ? <img src={productForm.imageUrl} className="h-full w-full object-cover" alt="" /> : <div className="text-center"><Camera className="h-8 w-8 text-gray-300 mb-1 mx-auto" /><span className="text-[10px] font-black uppercase text-gray-400">Add Dish Photo</span></div>}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProductImageSelect} />
                        
                        <div className="space-y-4">
                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Product Name</label>
                              <Input placeholder="e.g. Special Thali" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="h-12 rounded-xl border-none bg-gray-50 font-bold" />
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Selling Price ₹</label>
                                 <Input type="number" placeholder="0.00" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="h-12 rounded-xl border-none bg-gray-50 font-black italic text-primary" />
                              </div>
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase text-primary ml-1 flex items-center gap-1"><Timer className="h-3 w-3" /> Prep Time (Min)</label>
                                 <Input type="number" placeholder="15" value={productForm.preparingTime} onChange={e => setProductForm({...productForm, preparingTime: e.target.value})} className="h-12 rounded-xl border-none bg-primary/5 font-black text-center" />
                              </div>
                           </div>

                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Category</label>
                              <Select value={productForm.category} onValueChange={v => setProductForm({...productForm, category: v})}>
                                 <SelectTrigger className="h-12 rounded-xl bg-gray-50 border-none font-bold"><SelectValue placeholder="Pick Category" /></SelectTrigger>
                                 <SelectContent className="rounded-2xl">
                                    {foodCategories?.map((c: any) => <SelectItem key={c.id} value={c.name.toLowerCase()} className="font-bold py-3 uppercase text-xs">{c.name}</SelectItem>)}
                                 </SelectContent>
                              </Select>
                           </div>

                           {/* VARIETY SECTION - RESTORED FOR VENDOR DASHBOARD */}
                           <div className="space-y-4 p-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                              <div className="flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                    <div className="bg-primary/10 p-2 rounded-xl text-primary"><ListTree className="h-4 w-4" /></div>
                                    <span className="text-[10px] font-black uppercase tracking-tight">Varieties / Sizes</span>
                                 </div>
                                 <Switch checked={isVarietyRequired} onCheckedChange={setIsVarietyRequired} className="scale-75 data-[state=checked]:bg-primary" />
                              </div>

                              <div className="space-y-2">
                                 {options.map((opt, idx) => (
                                   <div key={idx} className="flex gap-2">
                                      <Input placeholder="Name" value={opt.name} onChange={e => updateOption(idx, 'name', e.target.value)} className="h-10 rounded-xl bg-white border-none font-bold text-xs uppercase flex-[2]" />
                                      <Input type="number" placeholder="+₹" value={opt.price} onChange={e => updateOption(idx, 'price', e.target.value)} className="h-10 rounded-xl bg-white border-none font-black text-xs text-primary flex-1" />
                                      <button onClick={() => handleRemoveOption(idx)} className="bg-red-50 text-red-500 h-10 w-10 rounded-xl flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
                                   </div>
                                 ))}
                                 <button onClick={handleAddOption} className="w-full h-10 border-2 border-dashed border-primary/20 text-primary rounded-xl font-black uppercase text-[8px] flex items-center justify-center gap-2 hover:bg-primary/5 transition-all">
                                    <Plus className="h-3 w-3" /> ADD VARIETY OPTION
                                 </button>
                              </div>
                           </div>

                           <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Description</label>
                              <Textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} placeholder="What makes this dish special?" className="rounded-xl bg-gray-50 border-none p-4 min-h-[80px]" />
                           </div>
                        </div>
                     </div>
                     <div className="p-8 bg-muted/5 border-t">
                        <Button onClick={handleSaveProduct} disabled={isSavingProduct} className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl active:scale-95 transition-all">
                           {isSavingProduct ? <Loader2 className="h-6 w-6 animate-spin" /> : "PUBLISH TO MENU"}
                        </Button>
                     </div>
                  </DialogContent>
               </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-4">
               {myProducts?.filter(p => !p.isDeleted).map(p => (
                 <div key={p.id} className="bg-white p-4 rounded-[2rem] border border-border/50 flex items-center justify-between shadow-sm group">
                    <div className="flex items-center gap-4">
                       <div className="h-16 w-16 rounded-2xl overflow-hidden bg-muted border shrink-0">
                          <img src={p.imageUrl} className="h-full w-full object-cover" alt="" />
                       </div>
                       <div className="min-w-0">
                          <h4 className="font-black text-sm uppercase italic truncate pr-2">{p.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-xs font-black text-primary italic">₹{p.price}</span>
                             {p.preparingTime && <Badge className="bg-green-50 text-green-600 border-none font-black text-[7px] px-1.5 py-0"><Timer className="h-2 w-2 mr-1" />{p.preparingTime}M</Badge>}
                          </div>
                       </div>
                    </div>
                    <button className="h-10 w-10 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 className="h-4 w-4" /></button>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeMainTab === 'account' && (
           <div className="p-4 space-y-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-border/50 text-center space-y-4">
                 <div className="h-24 w-24 bg-muted rounded-3xl mx-auto overflow-hidden border-4 border-white shadow-xl">
                    <img src={vendorProfile?.imageUrl} className="h-full w-full object-cover" alt="" />
                 </div>
                 <h2 className="text-2xl font-black italic">{vendorProfile?.storeName}</h2>
                 <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Store ID: {vendorProfile?.storeId}</p>
              </div>
           </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-[1000] rounded-t-[2.5rem] shadow-2xl transform-gpu">
        {[
          {id:'orders',label:'Orders',icon:LayoutDashboard},
          {id:'catalog',label:'Catalog',icon:Layers},
          {id:'payouts',label:'Payouts',icon:CircleDollarSign},
          {id:'account',label:'Profile',icon:UserCircle2}
        ].map(item => (
          <button key={item.id} onClick={() => startTransition(() => setActiveMainTab(item.id as any))} className="flex flex-col items-center gap-1.5 active:scale-90 transition-none">
            <item.icon className={cn("h-5 w-5", activeMainTab === item.id ? "text-primary scale-110" : "text-gray-500")} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest", activeMainTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

const Edit3 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
);
