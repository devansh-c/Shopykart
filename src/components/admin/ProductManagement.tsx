"use client"

import { useState } from 'react';
import { Plus, Edit, Trash2, Search, Package, Image as ImageIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

const initialProducts = [
  { id: 'p1', name: 'Cheese loaded French fries', price: 199, category: 'Fries', badges: ['Best Seller'], isVeg: true, imageUrl: 'https://picsum.photos/seed/fries1/300/300' },
  { id: 'p2', name: 'Chilli Attack Pasta', price: 249, category: 'Pasta', badges: ['Trending'], isVeg: true, imageUrl: 'https://picsum.photos/seed/pasta1/300/300' },
  { id: 'p3', name: 'Classic Veggie Burger', price: 149, category: 'Burgers', badges: ['Featured'], isVeg: true, imageUrl: 'https://picsum.photos/seed/burg1/300/300' },
];

export function ProductManagement() {
  const [products, setProducts] = useState(initialProducts);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast({ title: "Product Deleted", description: "The product was successfully removed." });
  };

  const handleSave = () => {
    toast({ title: "Product Saved", description: "Your changes have been updated successfully." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-10 h-10 bg-muted/50 border-none rounded-xl" />
        </div>
        <Dialog>
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
                  <Input placeholder="Enter name" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Price (₹)</label>
                  <Input type="number" placeholder="0.00" className="rounded-xl" />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Category</label>
                <Input placeholder="e.g. Burgers, Pizza" className="rounded-xl" />
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
                <input type="checkbox" id="isVeg" className="rounded-sm accent-primary" defaultChecked />
                <label htmlFor="isVeg" className="text-sm font-bold">Vegetarian Item</label>
              </div>
              <Button onClick={handleSave} className="w-full bg-primary font-black uppercase italic py-6 rounded-2xl">Save Product</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {products.map((product) => (
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
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">{product.category}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-sm font-black text-primary italic">₹{product.price}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {product.badges.map(b => (
                    <Badge key={b} variant="secondary" className="text-[9px] font-black uppercase px-2 py-0">
                      {b}
                    </Badge>
                  ))}
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
        ))}
      </div>
    </div>
  );
}
