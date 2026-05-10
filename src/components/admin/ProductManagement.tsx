
"use client"

import { useState } from 'react';
import { Plus, Edit, Trash2, Search, Package, Image as ImageIcon, Check, Store, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function ProductManagement() {
  const firestore = useFirestore();
  const { data: products, loading } = useCollection(firestore ? collection(firestore, 'products') : null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { toast } = useToast();

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [isVeg, setIsVeg] = useState(true);

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'products', id);
    deleteDoc(docRef).catch(async (e) => {
      const err = new FirestorePermissionError({ path: docRef.path, operation: 'delete' });
      errorEmitter.emit('permission-error', err);
    });
    toast({ title: "Product Deleted", description: "The product was successfully removed." });
  };

  const handleSave = () => {
    if (!firestore || !name || !price) return;
    
    const productData = {
      name,
      price: parseFloat(price),
      category: category.toLowerCase(),
      restaurantName,
      isVeg,
      imageUrl: selectedImage || 'https://picsum.photos/seed/food/300/300',
      badges: ['Featured'],
      createdAt: serverTimestamp(),
    };

    addDoc(collection(firestore, 'products'), productData)
      .then(() => {
        setIsAddOpen(false);
        resetForm();
        toast({ title: "Product Saved", description: "Your product has been added successfully." });
      })
      .catch(async (e) => {
        const err = new FirestorePermissionError({ path: 'products', operation: 'create', requestResourceData: productData });
        errorEmitter.emit('permission-error', err);
      });
  };

  const resetForm = () => {
    setName('');
    setPrice('');
    setCategory('');
    setRestaurantName('');
    setIsVeg(true);
    setSelectedImage(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-10 h-10 bg-muted/50 border-none rounded-xl" />
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-xl ml-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-black text-xl italic uppercase">Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Product Name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Enter name" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Price (₹)</label>
                  <Input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="0.00" className="rounded-xl" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Category</label>
                  <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Burgers, Pizza" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Restaurant Name</label>
                  <Input value={restaurantName} onChange={e => setRestaurantName(e.target.value)} placeholder="e.g. Bun Burst" className="rounded-xl" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Product Image</label>
                <div className="flex gap-3">
                  <div className="h-20 w-20 rounded-xl bg-muted border flex items-center justify-center overflow-hidden">
                    {selectedImage ? (
                      <img src={selectedImage} alt="Preview" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </div>
                  <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1 h-20 rounded-xl border-dashed border-2 hover:bg-muted/50 flex flex-col gap-1">
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-[10px] font-black uppercase tracking-tight">Open Gallery</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl rounded-3xl">
                      <DialogHeader>
                        <DialogTitle className="font-black italic uppercase">Select From Gallery</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                        {PlaceHolderImages.map((img) => (
                          <button
                            key={img.id}
                            onClick={() => {
                              setSelectedImage(img.imageUrl);
                              setIsGalleryOpen(false);
                            }}
                            className={cn(
                              "relative aspect-square rounded-2xl overflow-hidden border-2 transition-all group",
                              selectedImage === img.imageUrl ? "border-primary scale-95" : "border-transparent"
                            )}
                          >
                            <img src={img.imageUrl} alt={img.description} className="h-full w-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-[10px] text-white font-black uppercase">Select</span>
                            </div>
                            {selectedImage === img.imageUrl && (
                              <div className="absolute top-1 right-1 bg-primary text-white p-1 rounded-full shadow-lg">
                                <Check className="h-3 w-3" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isVeg" checked={isVeg} onChange={e => setIsVeg(e.target.checked)} className="rounded-sm accent-primary" />
                <label htmlFor="isVeg" className="text-sm font-bold">Vegetarian Item</label>
              </div>
              <Button onClick={handleSave} className="w-full bg-primary font-black uppercase italic py-6 rounded-2xl">Save Product</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products && products.length > 0 ? (
          products.map((product: any) => (
            <div key={product.id} className="bg-white p-5 rounded-2xl border flex items-center justify-between hover:shadow-md transition-shadow group">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-muted rounded-xl flex items-center justify-center overflow-hidden border">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} className="h-full w-full object-cover" alt={product.name} />
                  ) : (
                    <Package className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-base">{product.name}</h3>
                    {product.isVeg && <div className="h-2 w-2 rounded-full bg-green-500" title="Veg" />}
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex items-center text-[10px] font-bold text-muted-foreground uppercase">
                      <Store className="h-3 w-3 mr-1 text-primary" />
                      {product.restaurantName}
                    </div>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase">{product.category}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-black text-primary italic">₹{product.price}</span>
                    <div className="flex gap-1 ml-2">
                      {product.badges?.map((b: string) => (
                        <Badge key={b} variant="secondary" className="text-[9px] font-black uppercase px-2 py-0">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl text-blue-500">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(product.id)} className="h-10 w-10 rounded-xl text-red-500">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}
