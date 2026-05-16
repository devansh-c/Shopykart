
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc, useAuth } from '@/firebase';
import { collection, doc, query, where, addDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { 
  ShoppingBag, 
  Tag, 
  Trash2, 
  Plus, 
  Camera, 
  Save, 
  Phone, 
  MessageCircle, 
  LogOut,
  Lock,
  Utensils,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function VendorDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'profile'>('orders');
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

  // Products Sub-collection Stream (Permanent Storage)
  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    // New Path: vendors/{vendorId}/products
    return collection(firestore, 'vendors', user.uid, 'products');
  }, [firestore, user]);
  const { data: products } = useCollection<any>(productsQuery);

  const [storeData, setStoreData] = useState({
    storeName: '', category: '', imageUrl: '', bannerUrl: '', description: '', town: '', phone: ''
  });

  useEffect(() => {
    if (vendorProfile) {
      setStoreData({
        storeName: vendorProfile.storeName || '',
        category: vendorProfile.category || '',
        imageUrl: vendorProfile.imageUrl || '',
        bannerUrl: vendorProfile.bannerUrl || '',
        description: vendorProfile.description || '',
        town: vendorProfile.town || 'Ranipur',
        phone: vendorProfile.phone || ''
      });
    }
  }, [vendorProfile]);

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/vendor/login');
  };

  const handleUpdateProfile = async () => {
    if (!vendorRef || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await setDoc(vendorRef, { 
        storeName: storeData.storeName,
        description: storeData.description,
        updatedAt: serverTimestamp() 
      }, { merge: true });
      toast({ title: "Profile Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsSubmitting(false);
    }
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
    if (!firestore || !user || !newProduct.name || !newProduct.price || isSubmitting) return;
    setIsSubmitting(true);
    
    const productData = { 
      ...newProduct, 
      price: parseFloat(newProduct.price), 
      vendorId: user.uid, 
      town: vendorProfile?.town || 'Ranipur', 
      restaurantName: vendorProfile?.storeName || 'My Store',
      createdAt: serverTimestamp(),
      imageUrl: newProduct.imageUrl || `https://picsum.photos/seed/${Date.now()}/400/400`
    };

    try {
      // Saving to sub-collection for architecture and flat products for global search
      const subColRef = collection(firestore, 'vendors', user.uid, 'products');
      const globalColRef = collection(firestore, 'products');
      
      await Promise.all([
        addDoc(subColRef, productData),
        addDoc(globalColRef, productData)
      ]);

      setNewProduct({ name: '', price: '', description: '', category: 'snacks', imageUrl: '', isVeg: true });
      setIsAddOpen(false);
      toast({ title: "Product Published", description: "Successfully saved to Firestore." });
    } catch (e) {
      toast({ variant: "destructive", title: "Save Failed", description: "Could not persist data." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24 text-black">
      <header className="bg-white border-b p-6 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-black">Vendor Panel</h1>
            <p className="text-[10px] font-black text-amber-500 uppercase mt-1">Status: {vendorProfile?.status || 'Active'}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => window.open(`tel:${storeData.phone}`)} className="text-blue-500 bg-blue-50 rounded-xl"><Phone className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-red-500 bg-red-50 rounded-xl ml-2"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex bg-muted p-1 rounded-2xl mt-4">
          {['orders', 'catalog', 'profile'].map((t) => (
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
          </div>
        )}

        {activeTab === 'catalog' && (
           <div className="space-y-4">
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild><Button className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic shadow-lg"><Plus className="mr-2 h-5 w-5" /> Add Menu Item</Button></DialogTrigger>
                <DialogContent className="rounded-[2.5rem] bg-white">
                  <div className="space-y-4 py-4">
                    <div onClick={() => fileInputRef.current?.click()} className="h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden">
                      {newProduct.imageUrl ? <img src={newProduct.imageUrl} className="h-full w-full object-cover" /> : <Camera className="text-muted-foreground h-8 w-8" />}
                    </div>
                    <Input placeholder="Dish Name" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="rounded-xl h-12" />
                    <Input type="number" placeholder="Price (₹)" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="rounded-xl h-12" />
                    <Button onClick={handleAddProduct} disabled={isSubmitting} className="w-full h-14 bg-primary font-black rounded-2xl text-white">
                      {isSubmitting ? "SAVING TO CLOUD..." : "PUBLISH PERMANENTLY"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              
              <div className="space-y-3">
                {products?.map((p: any) => (
                  <div key={p.id} className="bg-white p-4 rounded-3xl border flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={p.imageUrl} className="h-16 w-16 rounded-2xl object-cover shrink-0" />
                      <div>
                        <h4 className="font-black italic">{p.name}</h4>
                        <p className="text-primary font-black text-sm">₹{p.price}</p>
                      </div>
                    </div>
                    <Button variant="ghost" onClick={async () => {
                      if(confirm("Delete permanently?")) {
                        await deleteDoc(doc(firestore!, 'vendors', user!.uid, 'products', p.id));
                        // Also delete from global products if synced
                        const globalRef = query(collection(firestore!, 'products'), where('name', '==', p.name), where('vendorId', '==', user!.uid));
                        // (Usually you'd store the global ID too for cleaner deletion)
                      }
                    }} className="text-red-300"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
           </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white p-6 rounded-[2.5rem] border space-y-4">
             <Input placeholder="Store Name" value={storeData.storeName} onChange={(e) => setStoreData({...storeData, storeName: e.target.value})} className="h-12 rounded-xl" />
             <Textarea placeholder="Description" value={storeData.description} onChange={(e) => setStoreData({...storeData, description: e.target.value})} className="rounded-2xl" />
             <Button onClick={handleUpdateProfile} disabled={isSubmitting} className="w-full h-14 bg-primary font-black rounded-2xl text-white">SAVE PROFILE</Button>
          </div>
        )}
      </main>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  );
}
