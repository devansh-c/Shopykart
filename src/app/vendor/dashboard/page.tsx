
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, query, where, addDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Loader2, ShoppingBag, Store, Tag, PlusCircle, UserCircle, Trash2, Plus, Camera, Globe, Clock, Info, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function VendorDashboard() {
  const firestore = useFirestore();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'profile'>('orders');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vendor Profile Data
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
    if (!profileLoading && user && (!vendorProfile || vendorProfile.status !== 'approved')) {
      if (vendorProfile?.status === 'pending') {
        toast({ title: "Account Pending", description: "Your store is under review." });
      }
      router.push('/vendor/login');
    }
  }, [vendorProfile, profileLoading, user, router, toast]);

  // Orders Query (Simplified for compatibility)
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'orders'), where('vendorId', '==', user.uid));
  }, [firestore, user]);

  // Products Query
  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'products'), where('vendorId', '==', user.uid));
  }, [firestore, user]);

  const { data: orders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: products, loading: productsLoading } = useCollection<any>(productsQuery);

  const [storeData, setStoreData] = useState({
    storeName: '', category: '', imageUrl: '', bannerUrl: '', description: '', deliveryTime: '', address: '', town: 'Ranipur',
  });

  useEffect(() => {
    if (vendorProfile) {
      setStoreData({
        storeName: vendorProfile.storeName || '',
        category: vendorProfile.category || '',
        imageUrl: vendorProfile.imageUrl || '',
        bannerUrl: vendorProfile.bannerUrl || '',
        description: vendorProfile.description || '',
        deliveryTime: vendorProfile.deliveryTime || '',
        address: vendorProfile.address || '',
        town: vendorProfile.town || 'Ranipur',
      });
    }
  }, [vendorProfile]);

  const handleUpdateProfile = () => {
    if (!vendorRef) return;
    const data = { ...storeData, updatedAt: serverTimestamp() };
    setDoc(vendorRef, data, { merge: true }).catch(async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: vendorRef.path, operation: 'write', requestResourceData: data
      }));
    });
    toast({ title: "Updated", description: "Profile saved successfully." });
  };

  const updateStatus = (orderId: string, nextStatus: string) => {
    if (!firestore) return;
    const ref = doc(firestore, 'orders', orderId);
    setDoc(ref, { status: nextStatus }, { merge: true });
    toast({ title: "Updated", description: `Order is now ${nextStatus}` });
  };

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', category: '', imageUrl: '', isVeg: true, badges: [] as string[] });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    reader.onloadend = () => setNewProduct({ ...newProduct, imageUrl: reader.result as string });
    if (e.target.files?.[0]) reader.readAsDataURL(e.target.files[0]);
  };

  const handleAddProduct = () => {
    if (!firestore || !user || !newProduct.name || !newProduct.price || isSubmitting) return;
    setIsSubmitting(true);
    setIsAddOpen(false);

    const productData = {
      ...newProduct,
      price: parseFloat(newProduct.price),
      vendorId: user.uid,
      town: storeData.town,
      createdAt: serverTimestamp(),
      restaurantName: storeData.storeName || 'My Store'
    };

    addDoc(collection(firestore, 'products'), productData)
      .then(() => {
        setNewProduct({ name: '', price: '', description: '', category: '', imageUrl: '', isVeg: true, badges: [] });
        setIsSubmitting(false);
      })
      .catch((e) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'products', operation: 'create', requestResourceData: productData
        }));
        setIsSubmitting(false);
      });
  };

  if (authLoading || profileLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 animate-spin text-primary" /></div>;
  if (!user || !vendorProfile || vendorProfile.status !== 'approved') return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      <header className="bg-white border-b p-6 sticky top-0 z-10">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Vendor Panel</h1>
        <div className="flex bg-muted p-1 rounded-2xl mt-4">
          <button onClick={() => setActiveTab('orders')} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2", activeTab === 'orders' ? "bg-white shadow-sm" : "text-muted-foreground")}>
            <ShoppingBag className="h-4" /> Orders
          </button>
          <button onClick={() => setActiveTab('catalog')} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2", activeTab === 'catalog' ? "bg-white shadow-sm" : "text-muted-foreground")}>
            <PlusCircle className="h-4" /> Catalog
          </button>
          <button onClick={() => setActiveTab('profile')} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2", activeTab === 'profile' ? "bg-white shadow-sm" : "text-muted-foreground")}>
            <UserCircle className="h-4" /> Profile
          </button>
        </div>
      </header>

      <main className="p-6">
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders?.map((order: any) => (
              <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-primary">{order.status}</span>
                    <h3 className="font-black italic text-lg mt-1">Order #{order.id.slice(-4)}</h3>
                    <p className="text-xs text-muted-foreground">₹{order.total} • {order.items?.length} Items</p>
                  </div>
                </div>
                <div className="grid gap-2">
                  {order.status === 'Placed' && <Button onClick={() => updateStatus(order.id, 'Accepted')} className="bg-green-500 font-black uppercase h-12 rounded-xl">Accept Order</Button>}
                  {order.status === 'Accepted' && <Button onClick={() => updateStatus(order.id, 'Preparing')} className="bg-primary font-black uppercase h-12 rounded-xl">Start Preparing</Button>}
                  {order.status === 'Preparing' && <Button onClick={() => updateStatus(order.id, 'Ready for Pickup')} className="bg-blue-500 font-black uppercase h-12 rounded-xl">Mark Ready</Button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black italic uppercase">Catalog</h2>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild><Button className="bg-primary rounded-xl h-10 font-black uppercase text-xs"><Plus className="mr-1 h-4" /> Add Item</Button></DialogTrigger>
                <DialogContent className="rounded-[2.5rem] max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle className="font-black italic uppercase">Add Product</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div onClick={() => fileInputRef.current?.click()} className="h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/30">
                      {newProduct.imageUrl ? <img src={newProduct.imageUrl} className="h-full w-full object-cover" /> : <><Camera className="h-8 text-primary" /><span className="text-[10px] font-black uppercase">Gallery</span></>}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                    <Input placeholder="Name" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
                    <Input type="number" placeholder="Price (₹)" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
                    <Input placeholder="Category" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} />
                    <Textarea placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
                    <Button onClick={handleAddProduct} disabled={isSubmitting} className="w-full h-14 bg-primary rounded-2xl font-black uppercase italic">{isSubmitting ? "Publishing..." : "Publish Product"}</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {products?.map((p: any) => (
              <div key={p.id} className="bg-white p-4 rounded-2xl border flex items-center gap-4">
                <div className="h-16 w-16 bg-muted rounded-xl overflow-hidden shrink-0"><img src={p.imageUrl} className="h-full w-full object-cover" /></div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm">{p.name}</h3>
                  <div className="text-sm font-black text-primary italic">₹{p.price}</div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(firestore!, 'products', p.id))} className="text-red-500"><Trash2 className="h-4" /></Button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6 bg-white p-6 rounded-[2.5rem] border">
             <div className="text-center mb-6"><h2 className="text-2xl font-black italic uppercase">Profile</h2></div>
             <div className="space-y-4">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Banner</label>
               <div onClick={() => bannerInputRef.current?.click()} className="relative aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/30">
                 {storeData.bannerUrl ? <img src={storeData.bannerUrl} className="h-full w-full object-cover" /> : <Upload className="h-6 text-primary" />}
               </div>
               <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => { const reader = new FileReader(); reader.onloadend = () => setStoreData({...storeData, bannerUrl: reader.result as string}); if(e.target.files?.[0]) reader.readAsDataURL(e.target.files[0])}} />
               
               <Input placeholder="Display Name" value={storeData.storeName} onChange={(e) => setStoreData({...storeData, storeName: e.target.value})} />
               <Select value={storeData.town} onValueChange={(val) => setStoreData({...storeData, town: val})}>
                 <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                 <SelectContent><SelectItem value="Ranipur">Ranipur (284205)</SelectItem><SelectItem value="Mauranipur">Mauranipur (284204)</SelectItem></SelectContent>
               </Select>
               <Input placeholder="Categories" value={storeData.category} onChange={(e) => setStoreData({...storeData, category: e.target.value})} />
               <Textarea placeholder="Description" value={storeData.description} onChange={(e) => setStoreData({...storeData, description: e.target.value})} />
               <Button onClick={handleUpdateProfile} className="w-full h-14 bg-primary font-black uppercase italic rounded-2xl"><Save className="mr-2 h-5" /> SAVE PROFILE</Button>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
