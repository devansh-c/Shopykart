"use client"

import { useState, useRef, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Package, Image as ImageIcon, Loader2, Trophy, FileUp, Globe, ListPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn, slugify } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, serverTimestamp, writeBatch, query, where, getDocs, setDoc } from 'firebase/firestore';
import { compressImage } from '@/lib/image-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function ProductManagement() {
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVarietyRequired, setIsVarietyRequired] = useState(false);
  const [options, setOptions] = useState<{ name: string; price: number }[]>([]);

  const productsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'products');
  }, [firestore]);
  const { data: products, loading } = useCollection<any>(productsQuery);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 400, 400);
      setSelectedImage(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleAddOption = () => {
    setOptions([...options, { name: '', price: 0 }]);
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...options];
    (newOptions[index] as any)[field] = field === 'price' ? parseFloat(value) || 0 : value;
    setOptions(newOptions);
  };

  const handleSave = async () => {
    if (!firestore || !name || !price || !selectedVendorId) {
      toast({ variant: "destructive", title: "Missing Info" });
      return;
    }
    
    setIsProcessing(true);
    const vendor = vendors?.find(v => v.id === selectedVendorId);
    const finalSlug = slug.trim().toLowerCase().replace(/\s+/g, '-') || slugify(name);

    const productData = {
      name: name.trim(),
      slug: finalSlug,
      price: parseFloat(price),
      description: description.trim(),
      category: category.toLowerCase().trim(),
      vendorId: selectedVendorId,
      restaurantName: vendor?.storeName || 'Store',
      imageUrl: selectedImage || 'https://picsum.photos/seed/food/300/300',
      options: options.filter(opt => opt.name.trim() !== ''),
      isVarietyRequired: isVarietyRequired,
      updatedAt: serverTimestamp(),
      isDeleted: false,
    };

    try {
      if (editingId) {
        await setDoc(doc(firestore, 'products', editingId), productData, { merge: true });
        await setDoc(doc(firestore, 'vendors', selectedVendorId, 'products', editingId), productData, { merge: true });
      } else {
        const newRef = doc(collection(firestore, 'products'));
        await setDoc(newRef, { ...productData, id: newRef.id, createdAt: serverTimestamp() });
        await setDoc(doc(firestore, 'vendors', selectedVendorId, 'products', newRef.id), { ...productData, id: newRef.id, createdAt: serverTimestamp() });
      }
      setIsAddOpen(false);
      resetForm();
      toast({ title: "Product SEO Published" });
    } catch (e) { toast({ variant: "destructive", title: "Save Error" }); }
    finally { setIsProcessing(false); }
  };

  const resetForm = () => {
    setEditingId(null); 
    setName(''); 
    setSlug(''); 
    setPrice(''); 
    setDescription('');
    setCategory('');
    setSelectedVendorId(''); 
    setSelectedImage(null);
    setOptions([]);
    setIsVarietyRequired(false);
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id); 
    setName(p.name); 
    setSlug(p.slug || ''); 
    setPrice(p.price.toString()); 
    setDescription(p.description || '');
    setCategory(p.category || '');
    setSelectedVendorId(p.vendorId); 
    setSelectedImage(p.imageUrl); 
    setOptions(p.options || []);
    setIsVarietyRequired(p.isVarietyRequired || false);
    setIsAddOpen(true);
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      if (p.isDeleted) return false; // HIDE DELETED PRODUCTS FROM ADMIN LIST
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.restaurantName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [products, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-3xl border shadow-sm gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search inventory..." className="pl-12 h-11 bg-muted/30 border-none rounded-xl font-bold" />
        </div>
        <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild><Button className="w-full md:w-auto bg-black rounded-xl font-black uppercase italic"><Plus className="h-4 w-4 mr-2" /> ADD PRODUCT</Button></DialogTrigger>
          <DialogContent className="rounded-[2.5rem] max-w-2xl focus:outline-none max-h-[90vh] overflow-y-auto no-scrollbar">
            <DialogHeader><DialogTitle className="font-black italic uppercase text-center text-2xl tracking-tighter">Product Master Editor</DialogTitle></DialogHeader>
            <div className="p-4 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div onClick={() => fileInputRef.current?.click()} className="h-48 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center bg-muted/20 cursor-pointer overflow-hidden group hover:border-primary transition-all">
                     {selectedImage ? <img src={selectedImage} className="h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-2"><ImageIcon className="h-8 w-8 opacity-20" /><span className="text-[10px] font-black uppercase text-muted-foreground">Product Photo</span></div>}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageSelect} />
                  
                  <div className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Product Identity</label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Product Name" className="h-12 rounded-xl font-bold bg-muted/20 border-none" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-primary ml-1 flex items-center gap-1.5"><Globe className="h-2.5 w-2.5" /> Super SEO Slug</label>
                        <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="dairy-milk-silk" className="h-12 rounded-xl bg-primary/5 border-primary/10 font-black italic text-primary" />
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Selling Price ₹</label>
                     <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Base Rate" className="h-12 rounded-xl font-black text-lg bg-muted/20 border-none" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Category</label>
                     <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Burger" className="h-12 rounded-xl font-bold bg-muted/20 border-none" />
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Assign to Partner Store</label>
                  <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                     <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold"><SelectValue placeholder="Select Store" /></SelectTrigger>
                     <SelectContent className="rounded-2xl">{vendors?.map((v:any) => <SelectItem key={v.id} value={v.id} className="font-bold py-3 uppercase text-xs">{v.storeName}</SelectItem>)}</SelectContent>
                  </Select>
               </div>

               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Short Description</label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Product features..." className="rounded-xl h-24 bg-muted/20 border-none p-4" />
               </div>

               {/* VARIETY / OPTIONS BUILDER */}
               <div className="bg-gray-50 p-6 rounded-[2rem] border-2 border-dashed border-gray-200 space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-xl text-primary"><ListPlus className="h-5 w-5" /></div>
                        <h3 className="text-sm font-black uppercase tracking-tight">Varieties / Options</h3>
                     </div>
                     <Button type="button" onClick={handleAddOption} className="bg-white border-2 border-gray-100 text-gray-800 h-9 rounded-xl font-black uppercase text-[9px] hover:bg-gray-50"><Plus className="h-3 w-3 mr-1" /> ADD OPTION</Button>
                  </div>

                  {options.length > 0 && (
                    <div className="space-y-3">
                       {options.map((opt, idx) => (
                         <div key={idx} className="flex gap-3 animate-in slide-in-from-right-2 duration-300">
                            <Input value={opt.name} onChange={e => updateOption(idx, 'name', e.target.value)} placeholder="e.g. Regular Size" className="flex-1 h-11 rounded-xl bg-white border-none font-bold text-xs" />
                            <Input type="number" value={opt.price} onChange={e => updateOption(idx, 'price', e.target.value)} placeholder="+ ₹" className="w-24 h-11 rounded-xl bg-white border-none font-black text-center text-primary" />
                            <button onClick={() => handleRemoveOption(idx)} className="h-11 w-11 rounded-xl bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><X className="h-4 w-4" /></button>
                         </div>
                       ))}

                       <div className="pt-4 border-t border-dashed flex items-center justify-between">
                          <div className="flex flex-col">
                             <span className="text-xs font-black uppercase">Selection Required?</span>
                             <span className="text-[8px] font-bold text-muted-foreground uppercase">Customer must pick one to checkout</span>
                          </div>
                          <Switch checked={isVarietyRequired} onCheckedChange={setIsVarietyRequired} />
                       </div>
                    </div>
                  )}
                  {options.length === 0 && (
                    <p className="text-[9px] font-bold text-muted-foreground text-center uppercase tracking-widest italic opacity-50">No varieties defined yet.</p>
                  )}
               </div>

               <Button onClick={handleSave} disabled={isProcessing} className="w-full h-18 bg-primary text-white rounded-[2.5rem] font-black uppercase italic text-xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.01]">
                 {isProcessing ? <Loader2 className="h-7 w-7 animate-spin" /> : editingId ? 'UPDATE PRODUCT SEO' : 'PUBLISH SUPER SEO'}
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading && !products ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map(p => (
            <div key={p.id} className="bg-white p-5 rounded-[2.5rem] border border-border/50 flex flex-col group shadow-sm hover:shadow-xl transition-all relative overflow-hidden transform-gpu">
               <div className="relative h-40 w-full rounded-2xl overflow-hidden bg-muted mb-4 border border-border/50">
                 <img src={p.imageUrl} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                 <Badge className="absolute top-3 left-3 bg-white/80 backdrop-blur-md text-black border-none font-black text-[8px] uppercase">₹{p.price}</Badge>
               </div>
               
               <div className="flex-1 min-w-0">
                  <h4 className="font-black text-base uppercase italic truncate leading-none mb-1">{p.name}</h4>
                  <p className="text-[8px] font-black text-primary truncate italic mb-3 opacity-60">/product/{p.slug || slugify(p.name)}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 truncate italic">{p.restaurantName || 'Gourmet'}</p>
               </div>

               <div className="mt-auto pt-4 border-t border-dashed flex gap-2">
                  <Button onClick={() => handleEdit(p)} variant="outline" className="flex-1 rounded-xl h-10 font-black uppercase italic text-[10px] border-blue-100 text-blue-600 hover:bg-blue-50 transition-colors"><Edit className="h-3.5 w-3.5 mr-2" /> EDIT</Button>
                  <Button onClick={async () => { if(confirm("Are you sure? This will remove the product from all menus.")) { await setDoc(doc(firestore!, 'products', p.id), { isDeleted: true }, { merge: true }); toast({title: 'Removed Permanently'}); } }} variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="h-4 w-4" /></Button>
               </div>

               {p.options?.length > 0 && (
                 <div className="absolute top-3 right-3 h-6 w-6 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/20 border-2 border-white">
                    <ListPlus className="h-3 w-3" />
                 </div>
               )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed">
            <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">Inventory is empty</p>
          </div>
        )}
      </div>
    </div>
  );
}