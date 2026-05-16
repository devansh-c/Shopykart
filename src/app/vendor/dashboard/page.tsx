
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
  Lock
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

export default function VendorDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'profile'>('orders');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    storeName: '', category: '', imageUrl: '', bannerUrl: '', description: '', deliveryTime: '', address: '', town: 'Ranipur', lat: '', lng: '', phone: '', email: ''
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
    toast({ title: "Logged Out", description: "Come back soon!" });
    router.push('/vendor/login');
  };

  const handleUpdateProfile = () => {
    if (!vendorRef) return;
    const data = { 
      storeName: storeData.storeName,
      description: storeData.description,
      updatedAt: serverTimestamp() 
    };
    setDoc(vendorRef, data, { merge: true });
    toast({ title: "Updated", description: "Profile saved successfully." });
  };

  const updateStatus = (orderId: string, nextStatus: string) => {
    if (!firestore) return;
    setDoc(doc(firestore, 'orders', orderId), { status: nextStatus }, { merge: true });
    toast({ title: "Updated", description: `Order is now ${nextStatus}` });
  };

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', description: '', category: '', imageUrl: '', isVeg: true });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const reader = new FileReader();
    reader.onloadend = () => setNewProduct({ ...newProduct, imageUrl: reader.result as string });
    if (e.target.files?.[0]) reader.readAsDataURL(e.target.files[0]);
  };

  const handleAddProduct = () => {
    if (!firestore || !user || !newProduct.name || !newProduct.price || isSubmitting) return;
    setIsSubmitting(true);
    
    const productData = { 
      ...newProduct, 
      price: parseFloat(newProduct.price), 
      vendorId: user.uid, 
      town: vendorProfile?.town || storeData.town, 
      createdAt: serverTimestamp(), 
      restaurantName: vendorProfile?.storeName || storeData.storeName 
    };

    addDoc(collection(firestore, 'products'), productData).then(() => {
      setNewProduct({ name: '', price: '', description: '', category: '', imageUrl: '', isVeg: true });
      setIsSubmitting(false);
      setIsAddOpen(false);
      toast({ title: "Product Added" });
    });
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24 text-black">
      <header className="bg-white border-b p-6 sticky top-0 z-10">
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
            {orders?.map((order: any) => (
              <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase text-primary">{order.status}</span>
                    <h3 className="font-black italic text-lg mt-1">#ORD-{order.id.slice(-4)}</h3>
                    <p className="text-xs text-muted-foreground">Total: ₹{order.total}</p>
                  </div>
                </div>
                <div className="grid gap-2">
                  {order.status === 'Placed' && <Button onClick={() => updateStatus(order.id, 'Accepted')} className="bg-green-500 font-black uppercase rounded-xl h-12">Accept</Button>}
                  {order.status === 'Accepted' && <Button onClick={() => updateStatus(order.id, 'Preparing')} className="bg-primary font-black uppercase rounded-xl h-12">Start Prep</Button>}
                  {order.status === 'Preparing' && <Button onClick={() => updateStatus(order.id, 'Ready for Pickup')} className="bg-blue-500 font-black uppercase rounded-xl h-12">Mark Ready</Button>}
                </div>
              </div>
            ))}
            {(!orders || orders.length === 0) && (
              <div className="text-center py-20 opacity-30 flex flex-col items-center">
                <ShoppingBag className="h-16 w-16 mb-4 text-black" />
                <p className="font-black italic uppercase tracking-widest text-sm text-black">No orders yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border space-y-6">
               <div className="relative aspect-video rounded-3xl overflow-hidden bg-muted group">
                 {storeData.bannerUrl ? (
                   <img src={storeData.bannerUrl} className="w-full h-full object-cover" alt="Banner" />
                 ) : (
                   <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-black uppercase text-xs">No Banner Set</div>
                 )}
                 <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 text-white">
                   <Lock className="h-3 w-3" />
                   <span className="text-[8px] font-black uppercase tracking-widest">Locked Field</span>
                 </div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/20 rounded-2xl">
                    <span className="text-[8px] font-black text-muted-foreground uppercase block mb-1">Phone Number</span>
                    <p className="text-sm font-bold text-black">{storeData.phone || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-2xl">
                    <span className="text-[8px] font-black text-muted-foreground uppercase block mb-1">Email Address</span>
                    <p className="text-sm font-bold truncate text-black">{storeData.email || 'N/A'}</p>
                  </div>
               </div>

               <div className="space-y-4">
                 <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Store Name</label>
                   <Input placeholder="Store Name" value={storeData.storeName} onChange={(e) => setStoreData({...storeData, storeName: e.target.value})} className="text-black h-12 rounded-xl" />
                 </div>

                 <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-1">Town / Pincode <Lock className="h-2 w-2" /></label>
                   <Select value={storeData.town} disabled>
                      <SelectTrigger className="rounded-xl h-12 bg-muted/20 border-none text-black opacity-60"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Ranipur">Ranipur (284205)</SelectItem><SelectItem value="Mauranipur">Mauranipur (284204)</SelectItem></SelectContent>
                   </Select>
                 </div>

                 <div className="grid grid-cols-2 gap-3 p-4 bg-muted/10 rounded-2xl border border-dashed opacity-60">
                   <div><label className="text-[8px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-1">Latitude <Lock className="h-2 w-2" /></label><Input value={storeData.lat} readOnly className="bg-white border-none h-10 mt-1 text-black" /></div>
                   <div><label className="text-[8px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-1">Longitude <Lock className="h-2 w-2" /></label><Input value={storeData.lng} readOnly className="bg-white border-none h-10 mt-1 text-black" /></div>
                 </div>

                 <div className="space-y-1">
                   <label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Store Description</label>
                   <Textarea placeholder="Store Description" value={storeData.description} onChange={(e) => setStoreData({...storeData, description: e.target.value})} className="rounded-2xl text-black" />
                 </div>

                 <Button onClick={handleUpdateProfile} className="w-full h-14 bg-primary font-black uppercase italic rounded-2xl shadow-xl shadow-primary/10 text-white"><Save className="mr-2 h-5" /> SAVE SETTINGS</Button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'catalog' && (
           <div className="space-y-4">
              <div className="p-2">
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild><Button className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic"><Plus className="mr-2" /> Add Menu Item</Button></DialogTrigger>
                  <DialogContent className="rounded-[2.5rem] bg-white">
                    <DialogHeader><DialogTitle className="font-black uppercase italic text-black">New Product</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div onClick={() => fileInputRef.current?.click()} className="h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-muted/20 cursor-pointer overflow-hidden">{newProduct.imageUrl ? <img src={newProduct.imageUrl} className="h-full w-full object-cover" alt="Product" /> : <Camera className="text-black" />}</div>
                      <Input placeholder="Item Name *" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="text-black" />
                      <Input type="number" placeholder="Price (₹) *" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="text-black" />
                      <Button onClick={handleAddProduct} className="w-full h-12 bg-primary font-black uppercase italic rounded-xl text-white">Publish to Store</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="space-y-2">
                {products?.map((p: any) => (
                  <div key={p.id} className="bg-white p-4 rounded-2xl border flex items-center justify-between"><div className="flex items-center gap-4"><img src={p.imageUrl} className="h-12 w-12 rounded-xl object-cover" alt={p.name} /><div><h4 className="font-bold text-sm text-black">{p.name}</h4><p className="text-primary font-black text-xs">₹{p.price}</p></div></div><Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(firestore!, 'products', p.id))} className="text-red-500"><Trash2 className="h-4 w-4" /></Button></div>
                ))}
                {(!products || products.length === 0) && (
                  <div className="text-center py-20 opacity-20 flex flex-col items-center">
                    <Tag className="h-16 w-16 mb-4 text-black" />
                    <p className="font-black italic uppercase tracking-widest text-sm text-black">No items in catalog</p>
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
