
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Loader2, ShoppingBag, Store, Tag, PlusCircle, UserCircle, Save, Trash2, Plus, Image as ImageIcon, MapPin, Clock, Info, Check, Upload, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
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
    bannerUrl: '',
    description: '',
    deliveryTime: '',
    address: '',
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
    imageUrl: '',
    isVeg: true,
    badges: [] as string[]
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewProduct({ ...newProduct, imageUrl: reader.result as string });
      toast({ title: "Image Selected", description: "Product photo ready." });
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setStoreData({ ...storeData, imageUrl: reader.result as string });
      toast({ title: "Logo Uploaded", description: "Click save to apply changes." });
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setStoreData({ ...storeData, bannerUrl: reader.result as string });
      toast({ title: "Banner Uploaded", description: "Click save to apply changes." });
    };
    reader.readAsDataURL(file);
  };

  const handleAddProduct = () => {
    if (!firestore || !user || !newProduct.name || !newProduct.price) {
      toast({ variant: "destructive", title: "Error", description: "Please fill all required fields." });
      return;
    }

    const productData = {
      name: newProduct.name,
      price: parseFloat(newProduct.price),
      description: newProduct.description,
      category: newProduct.category || 'General',
      isVeg: newProduct.isVeg,
      vendorId: user.uid,
      imageUrl: newProduct.imageUrl || `https://picsum.photos/seed/${newProduct.name}/400/300`,
      createdAt: serverTimestamp(),
      restaurantName: storeData.storeName || 'My Store',
      badges: newProduct.badges
    };

    addDoc(collection(firestore, 'products'), productData)
      .then(() => {
        setIsAddOpen(false);
        setNewProduct({ name: '', price: '', description: '', category: '', imageUrl: '', isVeg: true, badges: [] });
        toast({ title: "Product Added", description: "Your item is now live." });
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

  if (!user) return <div className="min-h-screen flex items-center justify-center font-black uppercase">PLEASE SIGN IN TO ACCESS VENDOR PANEL</div>;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-24">
      <header className="bg-white border-b border-border/50 px-6 py-6 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Vendor Panel</h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">Real-time Multi-Vendor Sync</p>
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
              <div className="text-center py-20 opacity-30"><ShoppingBag className="mx-auto mb-4 h-12 w-12" /><p className="font-black italic uppercase">No live orders</p></div>
            )}
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black italic uppercase">Store Catalog</h2>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild><Button className="bg-primary rounded-xl font-black uppercase text-xs h-10"><Plus className="mr-1 h-4 w-4" /> Add Item</Button></DialogTrigger>
                <DialogContent className="rounded-[2.5rem] max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle className="font-black italic uppercase text-xl">Add New Product</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Product Image</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="h-40 w-full rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        {newProduct.imageUrl ? (
                          <img src={newProduct.imageUrl} className="h-full w-full object-cover" alt="Preview" />
                        ) : (
                          <>
                            <div className="bg-white p-3 rounded-xl shadow-sm mb-2 text-primary">
                              <Camera className="h-6 w-6" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Tap to open Gallery</span>
                          </>
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                      />
                    </div>

                    <Input placeholder="Product Name" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} />
                    <Input type="number" placeholder="Price (₹)" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} />
                    <Input placeholder="Category" value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} />
                    <Textarea placeholder="Description" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} />
                    
                    <div className="flex gap-2">
                      {['Bestseller', 'Featured', 'Trending'].map(badge => (
                        <button
                          key={badge}
                          onClick={() => {
                            const exists = newProduct.badges.includes(badge);
                            setNewProduct({
                              ...newProduct,
                              badges: exists 
                                ? newProduct.badges.filter(b => b !== badge)
                                : [...newProduct.badges, badge]
                            });
                          }}
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-black uppercase border transition-all",
                            newProduct.badges.includes(badge) ? "bg-primary text-white border-primary" : "bg-transparent text-muted-foreground border-border"
                          )}
                        >
                          {badge}
                        </button>
                      ))}
                    </div>
                    <Button onClick={handleAddProduct} className="w-full h-14 bg-primary rounded-2xl font-black uppercase italic">Publish Product</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {productsLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : products?.map((product: any) => (
                <div key={product.id} className="bg-white p-4 rounded-2xl border flex items-center gap-4 shadow-sm group">
                  <div className="h-16 w-16 bg-muted rounded-xl overflow-hidden shrink-0">
                    <img src={product.imageUrl} className="h-full w-full object-cover" alt="" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{product.name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm font-black text-primary italic">₹{product.price}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">• {product.category}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-8 max-w-lg mx-auto bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm">
            <div className="text-center">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Store Profile</h2>
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Real-time sync enabled</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Store Banner</label>
                  <div 
                    onClick={() => bannerInputRef.current?.click()}
                    className="relative aspect-video rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {storeData.bannerUrl ? (
                      <img src={storeData.bannerUrl} className="h-full w-full object-cover" alt="Banner" />
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="h-6 w-6 text-primary mx-auto mb-2" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Upload Banner from Gallery</span>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={handleBannerUpload} />
                  
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {PlaceHolderImages.filter(img => img.id.includes('hero')).slice(0, 4).map((img) => (
                      <button
                        key={img.id}
                        onClick={() => setStoreData({...storeData, bannerUrl: img.imageUrl})}
                        className={cn(
                          "relative aspect-video rounded-xl overflow-hidden border-2 transition-all",
                          storeData.bannerUrl === img.imageUrl ? "border-primary scale-95" : "border-transparent"
                        )}
                      >
                        <img src={img.imageUrl} className="h-full w-full object-cover" alt="" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Store Logo/Image</label>
                  <div className="flex gap-4 items-center">
                    <div 
                      onClick={() => logoInputRef.current?.click()}
                      className="h-24 w-24 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/30 hover:bg-muted/50 transition-colors shrink-0"
                    >
                      {storeData.imageUrl ? (
                        <img src={storeData.imageUrl} className="h-full w-full object-cover" alt="Logo" />
                      ) : (
                        <Camera className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    
                    <div className="grid grid-cols-4 gap-2 flex-1">
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
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Store className="h-3 w-3" /> Display Name
                  </label>
                  <Input placeholder="e.g. The Gourmet Kitchen" value={storeData.storeName} onChange={(e) => setStoreData({...storeData, storeName: e.target.value})} />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Categories
                  </label>
                  <Input placeholder="e.g. Italian • North Indian" value={storeData.category} onChange={(e) => setStoreData({...storeData, category: e.target.value})} />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Info className="h-3 w-3" /> Store Description
                  </label>
                  <Textarea placeholder="Tell customers about your store..." value={storeData.description} onChange={(e) => setStoreData({...storeData, description: e.target.value})} className="h-20" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Delivery Time
                    </label>
                    <Input placeholder="e.g. 20-30 min" value={storeData.deliveryTime} onChange={(e) => setStoreData({...storeData, deliveryTime: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> Address
                    </label>
                    <Input placeholder="e.g. Mumbai, India" value={storeData.address} onChange={(e) => setStoreData({...storeData, address: e.target.value})} />
                  </div>
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
