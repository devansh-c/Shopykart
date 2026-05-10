
"use client"

import { useState } from 'react';
import { Plus, Edit, Trash2, Search, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const initialProducts = [
  { id: 'p1', name: 'Cheese loaded French fries', price: 199, category: 'Fries', badges: ['Best Seller'], isVeg: true },
  { id: 'p2', name: 'Chilli Attack Pasta', price: 249, category: 'Pasta', badges: ['Trending'], isVeg: true },
  { id: 'p3', name: 'Classic Veggie Burger', price: 149, category: 'Burgers', badges: ['Featured'], isVeg: true },
];

export function ProductManagement() {
  const [products, setProducts] = useState(initialProducts);
  const { toast } = useToast();

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast({ title: "Product Deleted", description: "The product was successfully removed." });
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
              <DialogTitle className="font-black text-xl italic">ADD NEW PRODUCT</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Product Name</label>
                  <Input placeholder="Enter name" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Price (₹)</label>
                  <Input type="number" placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Category</label>
                <Input placeholder="e.g. Burgers, Pizza" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Image URL</label>
                <Input placeholder="https://..." />
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id="isVeg" className="rounded" defaultChecked />
                <label htmlFor="isVeg" className="text-sm font-bold">Vegetarian Item</label>
              </div>
              <Button className="w-full bg-primary font-bold">Save Product</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {products.map((product) => (
          <div key={product.id} className="bg-white p-5 rounded-2xl border flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-muted rounded-xl flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-bold text-base">{product.name}</h3>
                  {product.isVeg && <div className="h-2 w-2 rounded-full bg-green-500" title="Veg" />}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase">{product.category}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-sm font-black text-primary">₹{product.price}</span>
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
            <div className="flex items-center space-x-2">
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
