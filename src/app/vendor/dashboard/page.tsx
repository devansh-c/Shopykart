
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy, addDoc, serverTimestamp, deleteDoc, setDoc } from 'firebase/firestore';
import { Loader2, ShoppingBag, CheckCircle, Flame, Clock, Truck, Plus, Package, Trash2, Store, Tag, PlusCircle, LayoutDashboard, UserCircle, Image as ImageIcon, Check, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function VendorDashboard() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'profile'>('orders');

  // Vendor Profile Data
  const vendorRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'vendors', user.uid);
  }, [firestore, user]);

  const { data: vendorProfile, loading: profileLoading } = useDoc<any>(vendorRef);

  // Orders Query
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'orders'), 
      where('vendorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  // Products Query
  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'products'),
      where('vendorId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: orders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: products, loading: productsLoading } = useCollection<any>(productsQuery);

  // Store Profile State
  const [storeData, setStoreData] = useState({
    storeName: '',
    category: '',
    imageUrl: '',
  });

  useEffect(() => {
    if (vendorProfile) {
      setStoreData({
        storeName: vendorProfile.storeName || '',
        category: vendorProfile.category || '',
        imageUrl: vendorProfile.imageUrl || '',
      });
    }
  }, [vendorProfile]);

  const handleUpdateProfile = () => {
    if (!vendorRef) return;
    updateDoc(vendorRef, {
      ...storeData,
      updatedAt: serverTimestamp()
    }).then(() => {
      toast({ title: "Profile Updated", description: "Your store details are now live." });
    });
  };

  const updateStatus = (orderId: string, nextStatus: string) => {
    if (!firestore) return;
    const ref = doc(firestore, 'orders', orderId);
    updateDoc(ref, { status: nextStatus })
      .then(() => toast({ title: "Status Updated", description: `Order is now ${nextStatus}` }));
  };

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    description: '',
    category: '',
    isVeg: true
  });

  const handleAddProduct = () => {
    if (!firestore || !user || !newProduct.name || !newProduct.price) return;

    const productData = {
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      description: newProduct.description,
      category: newProduct.category || 'General',
      isVeg: newProduct.isVeg,
      vendorId: user.uid,
      imageUrl: `https://picsum.photos/seed/${newProduct.name}/400/300`,
      createdAt: serverTimestamp(),
      restaurantName: storeData.storeName || 'My Store'
    };

    addDoc(collection(firestore, 'products'), productData)
      .then(() => {
        setIsAddOpen(false);
        setNewProduct({ name: '', price: '', description: '', category: '', isVeg: true });
        toast({ title: "Product Added", description: "Your item is now live for customers." });
      })
      .catch((e) => {
        const err = new FirestorePermissionError({ path: 'products', operation: 'create', requestResourceData: productData });
        errorEmitter.emit('permission-error', err);
      });
  };

  const handleDeleteProduct = (id: string) => {
    if (!firestore) return;
    deleteDoc(doc(firestore, 'products', id))
      .then(() => toast({ title: "Removed", description: "Product deleted successfully." }));
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center font-black">PLEASE SIGN IN TO ACCESS VENDOR PANEL</div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      <header className="bg-white border-b border-border/50 px-6 py-6 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Vendor Panel</h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Live Store Management</p>
          </div>
          <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Store className="h-6 w-6 text-primary" />
          </div>
        </div>

        <div className="flex bg-muted p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab('orders')}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              activeTab === 'orders' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
            )}
          >
            <ShoppingBag className="h-4 w-4" />
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('catalog')}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              activeTab === 'catalog' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
            )}
          >
            <PlusCircle className="h-4 w-4" />
            Catalog
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              activeTab === 'profile' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
            )}
          >
            <UserCircle className="h-4 w-4" />
            Profile
          </button>
        </div>
      </header>

      <main className="p-6">
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : orders && orders.length > 0 ? (
              orders.map((order: any) => (
                <div key={order.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-border/40">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase text-primary tracking-widest">{order.status}</span>
                      <h3 className="font-black italic text-lg leading-none mt-1">Order #{order.id.slice(-4)}</h3>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">{order.items?.length} Items • ₹{order.total}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {order.status === 'Placed' && <Button onClick={() => updateStatus(order.id, 'Accepted')} className="w-full bg-green-500 rounded-xl font-black uppercase h-12">Accept Order</Button>}
                    {order.status === 'Accepted' && <Button onClick={() => updateStatus(order.id, 'Preparing')} className="w-full bg-primary rounded-xl font-black uppercase h-12">Start Preparing</Button>}
                    {order.status === 'Preparing' && <Button onClick={() => updateStatus(order.id, 'Ready for Pickup')} className="w-full bg-blue-500 rounded-xl font-black uppercase h-12">Mark Ready</Button>}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 opacity-30"><Package className="mx-auto mb-4" /><p className="font-black">No live orders</p></div>
            )}
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black italic uppercase">Product Catalog</h2>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild><Button className="bg-primary rounded-xl font-black uppercase text-xs h-10"><Plus className="mr-1" /> Add Item</Button></DialogTrigger>
                <DialogContent className="rounded-[2.5rem]">
                  <DialogHeader><DialogTitle className="font-black italic uppercase text-xl">Add New Product</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <Input placeholder="Product Name" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
                    <Input type="number" placeholder="Price (₹)" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
                    <Input placeholder="Category" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} />
                    <Textarea placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
                    <Button onClick={handleAddProduct} className="w-full h-14 bg-primary rounded-2xl font-black uppercase italic">Publish Product</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {products?.map((product: any) => (
                <div key={product.id} className="bg-white p-4 rounded-2xl border flex items-center gap-4 shadow-sm">
                  <div className="h-16 w-16 bg-muted rounded-xl overflow-hidden shrink-0"><img src={product.imageUrl} className="h-full w-full object-cover" /></div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{product.name}</h3>
                    <p className="text-sm font-black text-primary italic">₹{product.price}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)} className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-8 max-w-lg mx-auto bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Store Profile</h2>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Manage your brand presence</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Store Image</label>
                <div className="grid grid-cols-4 gap-2">
                  {PlaceHolderImages.filter(img => img.id.includes('store')).map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setStoreData({...storeData, imageUrl: img.imageUrl})}
                      className={cn(
                        "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                        storeData.imageUrl === img.imageUrl ? "border-primary scale-95" : "border-transparent"
                      )}
                    >
                      <img src={img.imageUrl} className="h-full w-full object-cover" alt="" />
                      {storeData.imageUrl === img.imageUrl && <div className="absolute inset-0 bg-primary/20 flex items-center justify-center"><Check className="text-white h-5 w-5" /></div>}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Display Name</label>
                  <Input placeholder="e.g. The Gourmet Kitchen" value={storeData.storeName} onChange={(e) => setStoreData({...storeData, storeName: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Categories (e.g. Italian • Fast Food)</label>
                  <Input placeholder="e.g. Italian • North Indian" value={storeData.category} onChange={(e) => setStoreData({...storeData, category: e.target.value})} />
                </div>
              </div>

              <Button onClick={handleUpdateProfile} className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic tracking-tighter shadow-lg shadow-primary/20">
                <Save className="mr-2 h-5 w-5" />
                SAVE STORE PROFILE
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
