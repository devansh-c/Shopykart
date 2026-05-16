
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
  Utensils
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

  // Data flows in background
  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);

  const { data: vendorProfile } = useDoc<any>(vendorRef);

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'orders'), where('vendorId', '==', user.uid));
  }, [firestore, user]);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'products'), where('vendorId', '==', user.uid));
  }, [firestore, user]);

  const { data: orders } = useCollection<any>(ordersQuery);
  const { data: products } = useCollection<any>(productsQuery);

  const [storeData, setStoreData] = useState({
    storeName: '', category: '', imageUrl: '', bannerUrl: '', description: '', deliveryTime: '', address: '', town: '', lat: '', lng: '', phone: '', email: ''
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
        lat: vendorProfile.lat || '',
        lng: vendorProfile.lng || '',
        phone: vendorProfile.phone || '',
        email: vendorProfile.email || ''
      });
    }
  }, [vendorProfile]);

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/vendor/login');
  };

  const handleUpdateProfile = () => {
    if (!vendorRef) return;
    const data = { 
      storeName: storeData.storeName,
      description: storeData.description,
      updatedAt: serverTimestamp() 
    };
    setDoc(vendorRef, data, { merge: true }).catch(async (e) => {
      const err = new FirestorePermissionError({ path: vendorRef.path, operation: 'update', requestResourceData: data });
      errorEmitter.emit('permission-error', err);
    });
    toast({ title: "Profile Updated" });
  };

  const updateStatus = (orderId: string, nextStatus: string) => {
    if (!firestore) return;
    const oRef = doc(firestore, 'orders', orderId);
    setDoc(oRef, { status: nextStatus }, { merge: true }).catch(async (e) => {
      const err = new FirestorePermissionError({ path: oRef.path, operation: 'update', requestResourceData: { status: nextStatus } });
      errorEmitter.emit('permission-error', err);
    });
    toast({ title: "Order Status Updated" });
  };

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', category: 'snacks', imageUrl: '', isVeg: true });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    reader.onloadend = () => setNewProduct({ ...newProduct, imageUrl: reader.result as string });
    if (e.target.files?.[0]) reader.readAsDataURL(e.target.files[0]);
  };

  const handleAddProduct = () => {
    if (!firestore || !user || !newProduct.name || !newProduct.price || isSubmitting) return;
    setIsSubmitting(true);
    
    const currentTown = vendorProfile?.town || storeData.town || 'Ranipur';
    const currentStoreName = vendorProfile?.storeName || storeData.storeName || 'My Store';

    const productData = { 
      ...newProduct, 
      price: parseFloat(newProduct.price), 
      vendorId: user.uid, 
      town: currentTown, 
      restaurantName: currentStoreName,
      createdAt: serverTimestamp(),
      imageUrl: newProduct.imageUrl || `https://picsum.photos/seed/${Date.now()}/400/400`
    };

    addDoc(collection(firestore, 'products'), productData).then(() => {
      setNewProduct({ name: '', price: '', description: '', category: 'snacks', imageUrl: '', isVeg: true });
      setIsSubmitting(false);
      setIsAddOpen(false);
      toast({ title: "Product Published", description: "Your item is now live!" });
    }).catch(async (e) => {
      setIsSubmitting(false);
      const err = new FirestorePermissionError({ path: 'products', operation: 'create', requestResourceData: productData });
      errorEmitter.emit('permission-error', err);
    });
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
            <Button variant="ghost" size="icon" onClick={() => window.open(`https://wa.me/91${storeData.phone}`)} className="text-green-500 bg-green-50 rounded-xl"><MessageCircle className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-red-500 bg-red-50 rounded-xl ml-2"><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex bg-muted p-1 rounded-2xl mt-4">
          <button onClick={() => setActiveTab('orders')} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2", activeTab === 'orders' ? "bg-white shadow-sm text-black" : "text-muted-foreground")}>Orders</button>
          <button onClick={() => setActiveTab('catalog')} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2", activeTab === 'catalog' ? "bg-white shadow-sm text-black" : "text-muted-foreground")}>Catalog</button>
          <button onClick={() => setActiveTab('profile')} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2", activeTab === 'profile' ? "bg-white shadow-sm text-black" : "text-muted-foreground")}>Profile</button>
        </div>
      </header>

      <main className="p-6">
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders && orders.length > 0 ? orders.map((order: any) => (
              <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border animate-in fade-in duration-500">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-primary">{order.status}</span>
                    <h3 className="font-black italic text-lg mt-1">#ORD-{order.id.slice(-4)}</h3>
                    <p className="text-xs text-muted-foreground font-bold">Total: ₹{order.total}</p>
                  </div>
                </div>
                <div className="grid gap-2">
                  {order.status === 'Placed' && <Button onClick={() => updateStatus(order.id, 'Accepted')} className="bg-green-500 font-black uppercase rounded-xl h-12">Accept Order</Button>}
                  {order.status === 'Accepted' && <Button onClick={() => updateStatus(order.id, 'Preparing')} className="bg-primary font-black uppercase rounded-xl h-12">Start Preparing</Button>}
                  {order.status === 'Preparing' && <Button onClick={() => updateStatus(order.id, 'Ready for Pickup')} className="bg-blue-500 font-black uppercase rounded-xl h-12">Mark as Ready</Button>}
                </div>
              </div>
            )) : (
              <div className="text-center py-20 opacity-20 flex flex-col items-center">
                <ShoppingBag className="h-16 w-16 mb-4" />
                <p className="font-black italic uppercase text-sm">No orders yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-6 rounded-[2.5rem] border space-y-6 shadow-sm">
               <div className="relative aspect-video rounded-3xl overflow-hidden bg-muted group">
                 {storeData.bannerUrl ? (
                   <img src={storeData.bannerUrl} className="w-full h-full object-cover" alt="Banner" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-black uppercase text-xs">No Banner Set</div>
                 )}
                 <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 text-white">
                   <Lock className="h-3 w-3" />
                   <span className="text-[8px] font-black uppercase tracking-widest">Permanent ID</span>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/20 rounded-2xl">
                    <span className="text-[8px] font-black text-muted-foreground uppercase block mb-1">Mobile</span>
                    <p className="text-sm font-bold text-black">{storeData.phone || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-2xl">
                    <span className="text-[8px] font-black text-muted-foreground uppercase block mb-1">Area</span>
                    <p className="text-sm font-bold text-black">{storeData.town}</p>
                  </div>
               </div>

               <div className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Store Name</label>
                   <Input placeholder="Store Name" value={storeData.storeName} onChange={(e) => setStoreData({...storeData, storeName: e.target.value})} className="text-black h-12 rounded-xl" />
                 </div>

                 <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Description</label>
                   <Textarea placeholder="Tell customers about your store..." value={storeData.description} onChange={(e) => setStoreData({...storeData, description: e.target.value})} className="rounded-2xl text-black min-h-[100px]" />
                 </div>

                 <Button onClick={handleUpdateProfile} className="w-full h-14 bg-primary font-black uppercase italic rounded-2xl shadow-xl shadow-primary/10 text-white"><Save className="mr-2 h-5" /> SAVE PROFILE</Button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'catalog' && (
           <div className="space-y-4 animate-in fade-in duration-500">
              <div className="p-2">
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild><Button className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic shadow-lg shadow-primary/20"><Plus className="mr-2 h-5 w-5" /> Add Menu Item</Button></DialogTrigger>
                  <DialogContent className="rounded-[2.5rem] bg-white max-w-sm">
                    <DialogHeader><DialogTitle className="font-black uppercase italic text-black text-center">New Product</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div onClick={() => fileInputRef.current?.click()} className="h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-muted/20 cursor-pointer overflow-hidden relative">
                        {newProduct.imageUrl ? (
                          <img src={newProduct.imageUrl} className="h-full w-full object-cover" alt="Product" />
                        ) : (
                          <div className="text-center">
                            <Camera className="text-muted-foreground h-8 w-8 mx-auto mb-2" />
                            <span className="text-[10px] font-black uppercase text-muted-foreground">Upload Dish Photo</span>
                          </div>
                        )}
                      </div>
                      <Input placeholder="Dish Name (e.g. Paneer Roll)" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="text-black rounded-xl h-12" />
                      <Input type="number" placeholder="Price (₹)" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="text-black rounded-xl h-12" />
                      
                      <div className="space-y-1">
                        <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Category</label>
                        <Select value={newProduct.category} onValueChange={(val) => setNewProduct({...newProduct, category: val})}>
                          <SelectTrigger className="rounded-xl h-12">
                            <SelectValue placeholder="Select Category" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl">
                            <SelectItem value="snacks">Snacks</SelectItem>
                            <SelectItem value="pizza">Pizza</SelectItem>
                            <SelectItem value="burgers">Burgers</SelectItem>
                            <SelectItem value="pasta">Pasta</SelectItem>
                            <SelectItem value="drinks">Drinks</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-3 bg-muted/20 p-4 rounded-xl">
                        <input type="checkbox" id="isVegProd" checked={newProduct.isVeg} onChange={e => setNewProduct({...newProduct, isVeg: e.target.checked})} className="h-5 w-5 rounded-md accent-green-600" />
                        <label htmlFor="isVegProd" className="text-xs font-black uppercase text-gray-700">Pure Vegetarian</label>
                      </div>

                      <Button onClick={handleAddProduct} disabled={isSubmitting} className="w-full h-14 bg-primary font-black uppercase italic rounded-2xl text-white shadow-xl shadow-primary/20">
                        {isSubmitting ? "PUBLISHING..." : "PUBLISH TO STORE"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="space-y-3">
                {products && products.length > 0 ? products.map((p: any) => (
                  <div key={p.id} className="bg-white p-4 rounded-3xl border shadow-sm flex items-center justify-between group animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl overflow-hidden bg-muted border shrink-0">
                        <img src={p.imageUrl || `https://picsum.photos/seed/${p.id}/200/200`} className="h-full w-full object-cover" alt={p.name} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <h4 className="font-black text-base text-black italic">{p.name}</h4>
                           {p.isVeg && <div className="h-2 w-2 rounded-full bg-green-500" />}
                        </div>
                        <p className="text-primary font-black text-sm italic">₹{p.price.toFixed(2)}</p>
                        <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{p.category}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => {
                      if(confirm("Are you sure?")) deleteDoc(doc(firestore!, 'products', p.id));
                    }} className="text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )) : (
                  <div className="text-center py-20 opacity-20 flex flex-col items-center">
                    <Utensils className="h-16 w-16 mb-4" />
                    <p className="font-black italic uppercase text-sm">Catalog is empty</p>
                  </div>
                )}
              </div>
           </div>
        )}
      </main>
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  );
}
