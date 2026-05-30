
"use client"

import { useState, useRef, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Package, Image as ImageIcon, Check, Store, Loader2, X, Power, PowerOff, Star, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, writeBatch, query, getDocs } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { compressImage } from '@/lib/image-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function ProductManagement() {
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [options, setOptions] = useState<{ name: string; price: number }[]>([]);

  // Fetch Products
  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  const { data: products, loading } = useCollection<any>(productsQuery);

  // Fetch Vendors for bulk control
  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  // Fetch Zones
  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'zones');
  }, [firestore]);
  const { data: zones } = useCollection<any>(zonesQuery);

  const handleBulkStatus = async (online: boolean) => {
    if (!firestore || !vendors) return;
    const confirmMsg = online ? "OPEN ALL stores?" : "CLOSE ALL stores?";
    if (!confirm(confirmMsg)) return;

    setIsBulkUpdating(true);
    try {
      const batch = writeBatch(firestore);
      vendors.forEach((store) => {
        batch.update(doc(firestore, 'vendors', store.id), { isOnline: online, updatedAt: serverTimestamp() });
      });
      if (products) {
        products.forEach((product) => {
          batch.update(doc(firestore, 'products', product.id), { isAvailable: online });
        });
      }
      await batch.commit();
      toast({ title: online ? "All Systems Online" : "Network Closed" });
    } catch (err) {
      toast({ variant: "destructive", title: "Bulk Update Failed" });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleToggleTopTen = async (id: string, current: boolean) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'products', id), { isTopTen: !current });
    toast({ title: !current ? "Added to Top 10" : "Removed" });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 800, 800);
      setSelectedImage(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    deleteDoc(doc(firestore, 'products', id));
    toast({ title: "Product Deleted" });
  };

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, { name: '', price: 0 }]);
    } else {
      toast({ variant: "destructive", title: "Limit Reached", description: "Max 5 options allowed." });
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleUpdateOption = (index: number, field: 'name' | 'price', value: any) => {
    const newOptions = [...options];
    if (field === 'price') {
      newOptions[index].price = parseFloat(value) || 0;
    } else {
      newOptions[index].name = value;
    }
    setOptions(newOptions);
  };

  const handleSave = () => {
    if (!firestore || !name || !price || !selectedZoneId) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Name, Price, and Zone are required." });
      return;
    }
    
    const zone = zones?.find(z => z.id === selectedZoneId);
    
    const productData = {
      name,
      price: parseFloat(price),
      category: category.toLowerCase() || 'general',
      restaurantName: restaurantName || 'ShopyKart Select',
      zoneId: selectedZoneId,
      town: zone?.name || 'Local',
      isVeg,
      imageUrl: selectedImage || 'https://picsum.photos/seed/food/300/300',
      badges: ['New'],
      isAvailable: true,
      isTopTen: false,
      options: options.filter(opt => opt.name.trim() !== ''),
      createdAt: serverTimestamp(),
    };

    addDoc(collection(firestore, 'products'), productData)
      .then(() => {
        setIsAddOpen(false);
        resetForm();
        toast({ title: "Product Saved" });
      })
      .catch(async (e) => {
        const err = new FirestorePermissionError({ path: 'products', operation: 'create', requestResourceData: productData });
        errorEmitter.emit('permission-error', err);
      });
  };

  const resetForm = () => {
    setName(''); setPrice(''); setCategory(''); setRestaurantName(''); setSelectedZoneId('');
    setIsVeg(true); setSelectedImage(null); setIsGalleryOpen(false); setOptions([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-3xl border shadow-sm items-center">
        <div className="relative flex-1 w-full lg:max-w-xs">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search catalog..." className="pl-12 h-12 bg-muted/30 border-none rounded-2xl font-bold" />
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
          <Button disabled={isBulkUpdating} onClick={() => handleBulkStatus(false)} variant="destructive" className="flex-1 h-12 rounded-2xl font-black uppercase text-[10px]">
            {isBulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PowerOff className="h-4 w-4 mr-2" />}
            CLOSE ALL
          </Button>
          <Button disabled={isBulkUpdating} onClick={() => handleBulkStatus(true)} className="flex-1 h-12 rounded-2xl bg-green-600 hover:bg-green-700 font-black uppercase text-[10px]">
            {isBulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4 mr-2" />}
            OPEN ALL
          </Button>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="w-full lg:w-auto bg-[#0B0B0B] hover:bg-black rounded-2xl h-12 px-6 font-black uppercase italic shadow-xl">
              <Plus className="h-5 w-5 mr-2" />
              NEW PRODUCT
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] max-w-lg overflow-hidden flex flex-col max-h-[92vh] border-none shadow-2xl">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="font-black text-2xl italic uppercase tracking-tighter">Inventory Update</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-6 no-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Dish Identity</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Maharaja Burger" className="h-12 rounded-xl bg-muted/20 border-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Price (₹)</label>
                  <Input value={price} onChange={e => setPrice(e.target.value)} type="number" placeholder="0.00" className="h-12 rounded-xl bg-muted/20 border-none font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Serving Zone *</label>
                 <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                   <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold">
                      <SelectValue placeholder="Assign Area" />
                   </SelectTrigger>
                   <SelectContent className="rounded-2xl">
                      {zones?.map((zone: any) => (
                        <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                      ))}
                   </SelectContent>
                 </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category</label>
                  <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Burgers, Pizza" className="h-12 rounded-xl bg-muted/20 border-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Store Name</label>
                  <Input value={restaurantName} onChange={e => setRestaurantName(e.target.value)} placeholder="e.g. Bun Burst" className="h-12 rounded-xl bg-muted/20 border-none font-bold" />
                </div>
              </div>

              {/* OPTIONS SECTION */}
              <div className="space-y-3 bg-muted/5 p-4 rounded-2xl border border-dashed border-muted-foreground/10">
                <div className="flex items-center justify-between mb-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Product Options (Max 5)</label>
                   <Button type="button" variant="ghost" size="sm" onClick={handleAddOption} className="h-7 text-[8px] font-black uppercase bg-primary/10 text-primary rounded-lg">
                      <Plus className="h-3 w-3 mr-1" /> Add Option
                   </Button>
                </div>
                <div className="space-y-2">
                   {options.map((opt, idx) => (
                     <div key={idx} className="flex gap-2 items-center animate-in slide-in-from-left-2 duration-300">
                        <Input 
                          placeholder="Option Name" 
                          value={opt.name} 
                          onChange={e => handleUpdateOption(idx, 'name', e.target.value)}
                          className="h-10 text-[11px] font-bold rounded-xl"
                        />
                        <Input 
                          type="number" 
                          placeholder="₹" 
                          value={opt.price || ''} 
                          onChange={e => handleUpdateOption(idx, 'price', e.target.value)}
                          className="h-10 w-20 text-[11px] font-bold rounded-xl text-center"
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOption(idx)} className="h-8 w-8 text-red-500 bg-red-50 rounded-lg">
                          <X className="h-4 w-4" />
                        </Button>
                     </div>
                   ))}
                   {options.length === 0 && (
                     <p className="text-[9px] text-muted-foreground font-bold italic text-center py-2 uppercase">No custom options added (Optional)</p>
                   )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Visual Branding</label>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-5 bg-muted/10 p-4 rounded-3xl border border-dashed border-muted-foreground/20">
                    <div onClick={() => fileInputRef.current?.click()} className="h-24 w-24 rounded-2xl bg-white shadow-sm flex items-center justify-center overflow-hidden shrink-0 border border-border/50 cursor-pointer hover:border-primary transition-all active:scale-95">
                      {selectedImage ? <img src={selectedImage} alt="Preview" className="h-full w-full object-cover" /> : <div className="flex flex-col items-center"><ImageIcon className="h-10 w-10 text-muted-foreground/20" /><span className="text-[8px] font-black uppercase text-muted-foreground mt-1">Select</span></div>}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                    <div className="flex-1 space-y-3">
                      <Button variant="outline" onClick={() => setIsGalleryOpen(!isGalleryOpen)} className="w-full rounded-xl border-primary/20 text-primary font-black uppercase tracking-widest text-[10px] h-10 bg-white">{isGalleryOpen ? "CLOSE GALLERY" : "USE SHOPYKART IMAGES"}</Button>
                    </div>
                  </div>
                  {isGalleryOpen && (
                    <div className="bg-[#0B0B0B] p-4 rounded-[2rem] border border-white/5 animate-in fade-in zoom-in-95 duration-300">
                      <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto no-scrollbar p-1">
                        {PlaceHolderImages.map((img) => (
                          <button key={img.id} onClick={() => { setSelectedImage(img.imageUrl); setIsGalleryOpen(false); }} className={cn("relative aspect-square rounded-xl overflow-hidden border-2 transition-all active:scale-90", selectedImage === img.imageUrl ? "border-primary scale-95" : "border-transparent opacity-60")}>
                            <img src={img.imageUrl} alt={img.description} className="h-full w-full object-cover" />
                            {selectedImage === img.imageUrl && <div className="absolute inset-0 bg-primary/20 flex items-center justify-center"><Check className="h-6 w-6 text-white drop-shadow-xl stroke-[4]" /></div>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4 bg-green-50 p-5 rounded-3xl border border-green-100">
                <input type="checkbox" id="isVeg" checked={isVeg} onChange={e => setIsVeg(e.target.checked)} className="h-6 w-6 rounded-lg accent-green-600 cursor-pointer" />
                <label htmlFor="isVeg" className="text-xs font-black uppercase italic tracking-tight text-green-700 cursor-pointer">Pure Vegetarian Selection</label>
              </div>
            </div>

            <div className="p-8 border-t bg-muted/5">
              <Button onClick={handleSave} className="w-full bg-primary font-black uppercase italic h-16 rounded-3xl shadow-xl shadow-primary/20 text-lg tracking-tighter active:scale-95 transition-all">
                PUBLISH TO MENU
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-40"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : products && products.length > 0 ? (
          products.map((product: any) => (
            <div key={product.id} className="bg-white p-5 rounded-[2.5rem] border border-border/50 flex flex-col hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="flex items-center space-x-5">
                <div className="h-24 w-24 bg-muted rounded-3xl flex items-center justify-center overflow-hidden border border-border/50 shrink-0">
                  {product.imageUrl ? <img src={product.imageUrl} className="h-full w-full object-cover" alt={product.name} /> : <Package className="h-10 w-10 text-muted-foreground/20" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-black text-lg italic tracking-tight truncate leading-none">{product.name}</h3>
                    {product.isVeg && <div className="h-3 w-3 rounded-full bg-green-500 shrink-0 shadow-sm border border-white" />}
                  </div>
                  <div className="flex flex-col gap-1 mb-3">
                    <div className="flex items-center text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                      <Store className="h-3 w-3 mr-1 text-primary/60" /> {product.restaurantName}
                    </div>
                    <div className="flex items-center text-[9px] font-black text-blue-500 uppercase tracking-widest">
                       <MapPin className="h-2.5 w-2.5 mr-1" /> {product.town || 'Unassigned'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-black text-foreground italic tracking-tighter">₹{product.price}</span>
                    <button onClick={() => handleToggleTopTen(product.id, !!product.isTopTen)} className={cn("h-8 px-3 rounded-xl flex items-center gap-1.5 transition-all text-[8px] font-black uppercase tracking-widest", product.isTopTen ? "bg-amber-500 text-white shadow-lg shadow-amber-200" : "bg-muted text-gray-400")}>
                      <Star className={cn("h-3 w-3", product.isTopTen ? "fill-white" : "fill-none")} />
                      {product.isTopTen ? 'TOP 10 LIVE' : 'ADD TO TOP 10'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl text-blue-500 bg-white shadow-lg border-none active:scale-90"><Edit className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(product.id)} className="h-10 w-10 rounded-xl text-red-500 bg-white shadow-lg border-none active:scale-90"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-32 bg-muted/10 rounded-[3rem] border-2 border-dashed">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
            <p className="text-muted-foreground font-black italic uppercase text-sm">Inventory Empty</p>
          </div>
        )}
      </div>
    </div>
  );
}
