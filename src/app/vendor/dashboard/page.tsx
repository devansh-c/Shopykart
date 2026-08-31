
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
  Banknote
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
  
  const [activeMainTab, setActiveMainTab] = useState<'orders' | 'catalog' | 'payouts' | 'account'>('orders');
  const [isMounted, setIsMounted] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '', price: '', mrp: '', description: '', category: '', imageUrl: ''
  });

  useEffect(() => { setIsMounted(true); }, []);

  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);
  const { data: vendorProfile } = useDoc<any>(vendorRef);

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

  const handleSaveProduct = async () => {
    if (!firestore || !user || !productForm.name || !productForm.price) return;
    setIsSavingProduct(true);
    try {
      const newRef = doc(collection(firestore, 'products'));
      const pData = {
        ...productForm,
        id: newRef.id,
        vendorId: user.uid,
        price: parseFloat(productForm.price),
        mrp: parseFloat(productForm.mrp) || parseFloat(productForm.price),
        createdAt: serverTimestamp(),
        isAvailable: true,
        isDeleted: false
      };
      await setDoc(newRef, pData);
      setIsProductModalOpen(false);
      setProductForm({ name: '', price: '', mrp: '', description: '', category: '', imageUrl: '' });
      toast({ title: "Product Added!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed" });
    } finally {
      setIsSavingProduct(false);
    }
  };

  if (!isMounted || authLoading || !user) {
    return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col max-lg mx-auto shadow-2xl relative overflow-hidden">
      <header className="bg-white px-6 py-5 border-b flex items-center justify-between z-50">
        <div className="flex items-center gap-4">
           <Store className="h-6 w-6 text-primary" />
           <h1 className="font-black italic uppercase tracking-tighter">{vendorProfile?.storeName || 'Vendor Dashboard'}</h1>
        </div>
        <button onClick={() => { signOut(auth!); router.replace('/'); }} className="h-10 w-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center"><LogOut className="h-5 w-5" /></button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 p-4">
        {activeMainTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-black italic uppercase">Inventory</h2>
               <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
                  <DialogTrigger asChild><Button className="bg-primary text-white rounded-xl h-10 font-black uppercase text-[10px]"><Plus className="h-4 w-4 mr-1" /> ADD ITEM</Button></DialogTrigger>
                  <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
                     <DialogHeader className="p-8 pb-2">
                        <DialogTitle className="font-black italic uppercase text-center text-xl">New Product</DialogTitle>
                        <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest">List your product on the app</DialogDescription>
                     </DialogHeader>
                     <div className="p-8 space-y-6">
                        <div onClick={() => fileInputRef.current?.click()} className="h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer bg-muted/20 overflow-hidden">
                           {productForm.imageUrl ? <img src={productForm.imageUrl} className="h-full w-full object-cover" /> : <div className="text-center"><Camera className="h-8 w-8 text-gray-300 mb-1 mx-auto" /><span className="text-[10px] font-black uppercase text-gray-400">Add Photo</span></div>}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleProductImageSelect} />
                        <Input placeholder="Product Name" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="h-12 rounded-xl border-none bg-gray-50 font-bold" />
                        <Input type="number" placeholder="Price ₹" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} className="h-12 rounded-xl border-none bg-gray-50 font-bold" />
                        <Button onClick={handleSaveProduct} disabled={isSavingProduct} className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl">
                           {isSavingProduct ? <Loader2 className="h-6 w-6 animate-spin" /> : "PUBLISH NOW"}
                        </Button>
                     </div>
                  </DialogContent>
               </Dialog>
            </div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto w-full bg-[#0F172A] pt-4 pb-8 px-6 flex justify-around border-t border-white/5 z-[1000] rounded-t-[2.5rem] shadow-2xl">
        <button onClick={() => setActiveMainTab('orders')} className={cn("flex flex-col items-center gap-1", activeMainTab === 'orders' ? "text-primary" : "text-gray-500")}><LayoutDashboard className="h-5 w-5" /><span className="text-[9px] font-black uppercase">Orders</span></button>
        <button onClick={() => setActiveMainTab('catalog')} className={cn("flex flex-col items-center gap-1", activeMainTab === 'catalog' ? "text-primary" : "text-gray-500")}><Layers className="h-5 w-5" /><span className="text-[9px] font-black uppercase">Catalog</span></button>
        <button onClick={() => setActiveMainTab('payouts')} className={cn("flex flex-col items-center gap-1", activeMainTab === 'payouts' ? "text-primary" : "text-gray-500")}><CircleDollarSign className="h-5 w-5" /><span className="text-[9px] font-black uppercase">Payouts</span></button>
      </nav>
    </div>
  );
}
