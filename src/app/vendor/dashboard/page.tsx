
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Loader2, ShoppingBag, CheckCircle, Flame, Clock, Truck, Plus, Package, Trash2, Store, Tag, PlusCircle, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function VendorDashboard() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog'>('orders');

  // Orders Query - Only show orders for this vendor
  const ordersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'orders'), 
      where('vendorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  // Products Query - Only show products for this vendor
  const productsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'products'),
      where('vendorId', '==', user.uid)
    );
  }, [firestore, user]);

  const { data: orders, loading: ordersLoading } = useCollection<any>(ordersQuery);
  const { data: products, loading: productsLoading } = useCollection<any>(productsQuery);

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
      restaurantName: 'My Store' // In real app, fetch from vendor profile
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
            Live Orders ({orders?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab('catalog')}
            className={cn(
              "flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              activeTab === 'catalog' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground"
            )}
          >
            <PlusCircle className="h-4 w-4" />
            My Catalog ({products?.length || 0})
          </button>
        </div>
      </header>

      <main className="p-6">
        {activeTab === 'orders' ? (
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
                    <div className="bg-muted p-3 rounded-2xl"><ShoppingBag className="h-5 w-5 text-muted-foreground" /></div>
                  </div>

                  <div className="space-y-2 mb-6 bg-muted/30 p-4 rounded-2xl">
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="text-sm font-bold flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="text-muted-foreground">₹{item.price}</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {order.status === 'Placed' && (
                      <Button onClick={() => updateStatus(order.id, 'Accepted')} className="w-full bg-green-500 hover:bg-green-600 rounded-xl font-black uppercase italic h-12">Accept Order</Button>
                    )}
                    {order.status === 'Accepted' && (
                      <Button onClick={() => updateStatus(order.id, 'Preparing')} className="w-full bg-primary rounded-xl font-black uppercase italic h-12"><Flame className="mr-2 h-4 w-4" /> Start Preparing</Button>
                    )}
                    {order.status === 'Preparing' && (
                      <Button onClick={() => updateStatus(order.id, 'Ready for Pickup')} className="w-full bg-blue-500 hover:bg-blue-600 rounded-xl font-black uppercase italic h-12">Mark Ready</Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-muted-foreground/20">
                <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No live orders</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black italic uppercase tracking-tight">Product Catalog</h2>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 rounded-xl font-black uppercase italic text-xs h-10">
                    <Plus className="h-4 w-4 mr-1" /> Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-black italic uppercase text-xl tracking-tighter">Add New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Product Name</label>
                      <Input 
                        placeholder="e.g. Exotic Paneer Pizza" 
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Price (₹)</label>
                        <Input 
                          type="number"
                          placeholder="0.00"
                          value={newProduct.price}
                          onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</label>
                        <Input 
                          placeholder="e.g. Pizza"
                          value={newProduct.category}
                          onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</label>
                      <Textarea 
                        placeholder="Brief details about the dish..." 
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                      />
                    </div>
                    <div className="flex items-center gap-3 bg-muted/50 p-4 rounded-2xl">
                      <input 
                        type="checkbox" 
                        id="isVeg" 
                        checked={newProduct.isVeg}
                        onChange={(e) => setNewProduct({...newProduct, isVeg: e.target.checked})}
                        className="h-5 w-5 rounded-md accent-primary"
                      />
                      <label htmlFor="isVeg" className="text-sm font-black uppercase italic tracking-tighter">Pure Vegetarian</label>
                    </div>
                    <Button onClick={handleAddProduct} className="w-full h-14 bg-primary rounded-2xl font-black uppercase italic tracking-tighter shadow-lg shadow-primary/20">
                      Publish Product
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {productsLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : products && products.length > 0 ? (
                products.map((product: any) => (
                  <div key={product.id} className="bg-white p-4 rounded-2xl border border-border/40 flex items-center gap-4 shadow-sm">
                    <div className="h-16 w-16 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                      <img src={product.imageUrl} className="h-full w-full object-cover" alt={product.name} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-bold text-sm truncate">{product.name}</h3>
                        {product.isVeg && <div className="h-2 w-2 rounded-full bg-green-500" />}
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{product.category}</p>
                      <p className="text-sm font-black text-primary italic mt-1">₹{product.price}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-muted-foreground/20">
                  <LayoutDashboard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No products in catalog</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

