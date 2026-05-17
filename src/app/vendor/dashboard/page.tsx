
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, addDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Camera, 
  Phone, 
  LogOut,
  Utensils,
  Loader2,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
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

export default function VendorDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog'>('orders');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    await setDoc(oRef, { status: nextStatus }, { merge: true });
    toast({ title: "Status Updated" });
  };

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', category: 'snacks', imageUrl: '', isVeg: true });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    reader.onloadend = () => setNewProduct({ ...newProduct, imageUrl: reader.result as string });
    if (e.target.files?.[0]) reader.readAsDataURL(e.target.files[0]);
  };

  const handleAddProduct = async () => {
    if (!firestore || !user || !vendorProfile || isSubmitting) {
      if (!vendorProfile) toast({ title: "Wait", description: "Loading store profile..." });
      return;
    }
    
    if (!newProduct.name || !newProduct.price) {
      toast({ variant: "destructive", title: "Missing Info", description: "Please enter name and price." });
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
      town: vendorProfile.town || 'Ranipur', 
      restaurantName: vendorProfile.storeName || 'My Store',
      createdAt: serverTimestamp(),
      imageUrl: newProduct.imageUrl || `https://picsum.photos/seed/${Date.now()}/400/400`
    };

    try {
      // 1. Save to Vendor's sub-collection
      const subColRef = collection(firestore, 'vendors', user.uid, 'products');
      await addDoc(subColRef, productData);

      // 2. Save to Global products collection for search
      const globalColRef = collection(firestore, 'products');
      await addDoc(globalColRef, productData);

      setNewProduct({ name: '', price: '', description: '', category: 'snacks', imageUrl: '', isVeg: true });
      setIsAddOpen(false);
      toast({ title: "Product Published", description: "Saved permanently to database." });
    } catch (e) {
      console.error("Error saving product:", e);
      toast({ variant: "destructive", title: "Save Failed", description: "Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24 text-black">
      <header className="bg-white border-b p-6 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-black">{vendorProfile?.storeName || 'Vendor Panel'}</h1>
            <p className="text-[10px] font-black text-green-500 uppercase mt-1">Live in {vendorProfile?.town || 'Local Area'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-red-500 bg-red-50 rounded-xl ml-2"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex bg-muted p-1 rounded-2xl mt-4">
          {['orders', 'catalog'].map((t) => (
            <button key={t} onClick={() => setActiveTab(t as any)} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all", activeTab === t ? "bg-white shadow-sm text-black" : "text-muted-foreground")}>{t}</button>
          ))}
        </div>
      </header>

      <main className="p-6">
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders?.map((order: any) => (
              <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border">
                <span className="text-[10px] font-black uppercase text-primary">{order.status}</span>
                <h3 className="font-black italic text-lg mt-1">#ORD-{order.id.slice(-4)}</h3>
                <div className="grid gap-2 mt-4">
                  {order.status === 'Placed' && <Button onClick={() => updateStatus(order.id, 'Accepted')} className="bg-green-500 font-black uppercase rounded-xl h-12">Accept</Button>}
                  {order.status === 'Accepted' && <Button onClick={() => updateStatus(order.id, 'Preparing')} className="bg-primary font-black uppercase rounded-xl h-12">Prepare</Button>}
                </div>
              </div>
            ))}
            {(!orders || orders.length === 0) && (
              <div className="text-center py-20 opacity-30 flex flex-col items-center">
                <ShoppingBag className="h-16 w-16 mb-4" />
                <p className="font-black italic uppercase tracking-widest text-sm">No orders yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'catalog' && (
           <div className="space-y-4">
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild><Button className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic shadow-lg"><Plus className="mr-2 h-5 w-5" /> Add Menu Item</Button></DialogTrigger>
                <DialogContent className="rounded-[2.5rem] bg-white">
                  <DialogHeader>
                    <DialogTitle className="font-black italic uppercase text-xl tracking-tighter">New Menu Item</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div onClick={() => fileInputRef.current?.click()} className="h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/20">
                      {newProduct.imageUrl ? <img src={newProduct.imageUrl} className="h-full w-full object-cover" alt="Preview" /> : <><Camera className="text-muted-foreground h-8 w-8" /><span className="text-[10px] font-black uppercase mt-2">Upload Photo</span></>}
                    </div>
                    <Input placeholder="Dish Name (e.g. Cheese Pizza)" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="rounded-xl h-12" />
                    <Input type="number" placeholder="Price (₹)" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="rounded-xl h-12" />
                    <Select value={newProduct.category} onValueChange={(val) => setNewProduct({...newProduct, category: val})}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select Category" /></SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        <SelectItem value="snacks">Snacks</SelectItem>
                        <SelectItem value="pizza">Pizza</SelectItem>
                        <SelectItem value="burgers">Burgers</SelectItem>
                        <SelectItem value="pasta">Pasta</SelectItem>
                        <SelectItem value="drinks">Drinks</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2 bg-muted/20 p-3 rounded-xl">
                      <input type="checkbox" id="isVeg" checked={newProduct.isVeg} onChange={(e) => setNewProduct({...newProduct, isVeg: e.target.checked})} className="h-4 w-4 accent-primary" />
                      <label htmlFor="isVeg" className="text-xs font-black uppercase italic">Pure Veg Item</label>
                    </div>
                    <Button onClick={handleAddProduct} disabled={isSubmitting} className="w-full h-14 bg-primary font-black rounded-2xl text-white shadow-xl shadow-primary/20">
                      {isSubmitting ? "SAVING TO CLOUD..." : "PUBLISH PERMANENTLY"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <div className="space-y-3">
                {products?.map((p: any) => (
                  <div key={p.id} className="bg-white p-4 rounded-3xl border flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <img src={p.imageUrl} className="h-16 w-16 rounded-2xl object-cover shrink-0" alt="" />
                      <div>
                        <h4 className="font-black italic text-sm">{p.name}</h4>
                        <p className="text-primary font-black text-xs">₹{p.price}</p>
                        <span className="text-[8px] font-bold uppercase text-muted-foreground">{p.category}</span>
                      </div>
                    </div>
                    <Button variant="ghost" onClick={async () => {
                      if(confirm("Delete permanently?")) {
                        await deleteDoc(doc(firestore!, 'vendors', user!.uid, 'products', p.id));
                      }
                    }} className="text-red-200 hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
           </div>
        )}
      </main>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  );
}
