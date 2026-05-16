
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, query, where, addDoc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { 
  Loader2, 
  ShoppingBag, 
  Store, 
  Tag, 
  PlusCircle, 
  UserCircle, 
  Trash2, 
  Plus, 
  Camera, 
  Globe, 
  Clock, 
  Info, 
  Save, 
  Upload, 
  Phone, 
  MessageCircle, 
  Mail,
  MapPin
} from 'lucide-react';
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
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'profile'>('orders');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);

  const { data: vendorProfile, loading: profileLoading } = useDoc<any>(vendorRef);

  useEffect(() => {
    if (!authLoading && !user) router.push('/vendor/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!profileLoading && user && (!vendorProfile || vendorProfile.status !== 'approved')) {
      if (vendorProfile?.status === 'pending') toast({ title: "Account Pending", description: "Reviewing your application." });
      router.push('/vendor/login');
    }
  }, [vendorProfile, profileLoading, user, router, toast]);

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

  const handleUpdateProfile = () => {
    if (!vendorRef) return;
    const data = { ...storeData, updatedAt: serverTimestamp() };
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
    const productData = { ...newProduct, price: parseFloat(newProduct.price), vendorId: user.uid, town: storeData.town, createdAt: serverTimestamp(), restaurantName: storeData.storeName };
    addDoc(collection(firestore, 'products'), productData).then(() => {
      setNewProduct({ name: '', price: '', description: '', category: '', imageUrl: '', isVeg: true });
      setIsSubmitting(false);
      setIsAddOpen(false);
      toast({ title: "Product Added" });
    });
  };

  if (authLoading || profileLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 animate-spin text-primary" /></div>;
  if (!user || !vendorProfile || vendorProfile.status !== 'approved') return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      <header className="bg-white border-b p-6 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Vendor Panel</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => window.open(`tel:${storeData.phone}`)} className="text-blue-500 bg-blue-50 rounded-xl"><Phone className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => window.open(`https://wa.me/91${storeData.phone}`)} className="text-green-500 bg-green-50 rounded-xl"><MessageCircle className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex bg-muted p-1 rounded-2xl mt-4">
          <button onClick={() => setActiveTab('orders')} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2", activeTab === 'orders' ? "bg-white shadow-sm" : "text-muted-foreground")}>Orders</button>
          <button onClick={() => setActiveTab('catalog')} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2", activeTab === 'catalog' ? "bg-white shadow-sm" : "text-muted-foreground")}>Catalog</button>
          <button onClick={() => setActiveTab('profile')} className={cn("flex-1 py-3 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-2", activeTab === 'profile' ? "bg-white shadow-sm" : "text-muted-foreground")}>Profile</button>
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
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border space-y-6">
               <div className="relative aspect-video rounded-3xl overflow-hidden bg-muted group">
                 <img src={storeData.bannerUrl} className="w-full h-full object-cover" />
                 <button onClick={() => bannerInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"><Upload className="h-6 w-6 mr-2" /> Change Banner</button>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted/20 rounded-2xl">
                    <span className="text-[8px] font-black text-muted-foreground uppercase block mb-1">Phone Number</span>
                    <p className="text-sm font-bold">{storeData.phone}</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-2xl">
                    <span className="text-[8px] font-black text-muted-foreground uppercase block mb-1">Email Address</span>
                    <p className="text-sm font-bold truncate">{storeData.email}</p>
                  </div>
               </div>

               <div className="space-y-4">
                 <Input placeholder="Store Name" value={storeData.storeName} onChange={(e) => setStoreData({...storeData, storeName: e.target.value})} />
                 <Select value={storeData.town} onValueChange={(val) => setStoreData({...storeData, town: val})}>
                    <SelectTrigger className="rounded-xl h-12 bg-muted/20 border-none"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Ranipur">Ranipur (284205)</SelectItem><SelectItem value="Mauranipur">Mauranipur (284204)</SelectItem></SelectContent>
                 </Select>
                 <div className="grid grid-cols-2 gap-3 p-4 bg-muted/10 rounded-2xl border border-dashed">
                   <div><label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Latitude</label><Input value={storeData.lat} onChange={(e) => setStoreData({...storeData, lat: e.target.value})} className="bg-white border-none h-10 mt-1" /></div>
                   <div><label className="text-[8px] font-black uppercase text-muted-foreground ml-1">Longitude</label><Input value={storeData.lng} onChange={(e) => setStoreData({...storeData, lng: e.target.value})} className="bg-white border-none h-10 mt-1" /></div>
                 </div>
                 <Textarea placeholder="Store Description" value={storeData.description} onChange={(e) => setStoreData({...storeData, description: e.target.value})} className="rounded-2xl" />
                 <Button onClick={handleUpdateProfile} className="w-full h-14 bg-primary font-black uppercase italic rounded-2xl shadow-xl shadow-primary/10"><Save className="mr-2 h-5" /> SAVE SETTINGS</Button>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'catalog' && (
           <div className="space-y-4">
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild><Button className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic"><Plus className="mr-2" /> Add Menu Item</Button></DialogTrigger>
                <DialogContent className="rounded-[2.5rem]">
                  <DialogHeader><DialogTitle className="font-black uppercase italic">New Product</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div onClick={() => fileInputRef.current?.click()} className="h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center bg-muted/20 cursor-pointer overflow-hidden">{newProduct.imageUrl ? <img src={newProduct.imageUrl} className="h-full w-full object-cover" /> : <Camera />}</div>
                    <Input placeholder="Item Name *" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
                    <Input type="number" placeholder="Price (₹) *" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
                    <Button onClick={handleAddProduct} className="w-full h-12 bg-primary font-black uppercase italic rounded-xl">Publish to Store</Button>
                  </div>
                </DialogContent>
              </Dialog>
              {products?.map((p: any) => (
                <div key={p.id} className="bg-white p-4 rounded-2xl border flex items-center justify-between"><div className="flex items-center gap-4"><img src={p.imageUrl} className="h-12 w-12 rounded-xl object-cover" /><div><h4 className="font-bold text-sm">{p.name}</h4><p className="text-primary font-black text-xs">₹{p.price}</p></div></div><Button variant="ghost" size="icon" onClick={() => deleteDoc(doc(firestore!, 'products', p.id))} className="text-red-500"><Trash2 className="h-4 w-4" /></Button></div>
              ))}
           </div>
        )}
      </main>
      <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => { const r = new FileReader(); r.onloadend = () => setStoreData({...storeData, bannerUrl: r.result as string}); if(e.target.files?.[0]) r.readAsDataURL(e.target.files[0]) }} />
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
    </div>
  );
}
