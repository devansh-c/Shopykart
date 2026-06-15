"use client"

import { useState, useRef, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Package, Image as ImageIcon, Check, Store, Loader2, X, Power, PowerOff, Star, MapPin, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, writeBatch, query, getDocs, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { compressImage } from '@/lib/image-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export function ProductManagement() {
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [mrp, setMrp] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [isVarietyRequired, setIsVarietyRequired] = useState(false);
  const [mfgDate, setMfgDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
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

  const handleBulkStatus = async (online: boolean) => {
    if (!firestore || !vendors) return;
    if (!confirm(online ? "OPEN ALL?" : "CLOSE ALL?")) return;
    setIsBulkUpdating(true);
    try {
      const batch = writeBatch(firestore);
      vendors.forEach(v => batch.update(doc(firestore, 'vendors', v.id), { isOnline: online }));
      if (products) {
        products.forEach(p => {
          batch.update(doc(firestore, 'products', p.id), { isAvailable: online });
          batch.set(doc(firestore, 'vendors', p.vendorId, 'products', p.id), { isAvailable: online }, { merge: true });
        });
      }
      await batch.commit();
      toast({ title: online ? "All Online" : "All Closed" });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
    finally { setIsBulkUpdating(false); }
  };

  const toggleProductAvailability = async (productId: string, vendorId: string, available: boolean) => {
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, 'products', productId), { isAvailable: available, updatedAt: serverTimestamp() }, { merge: true });
      await setDoc(doc(firestore, 'vendors', vendorId, 'products', productId), { isAvailable: available, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: available ? "Stock Online" : "Stock Offline" });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const addOptionRow = () => {
    setOptions([...options, { name: '', price: 0 }]);
  };

  const removeOptionRow = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, field: 'name' | 'price', value: any) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], [field]: field === 'price' ? parseFloat(value) || 0 : value };
    setOptions(newOptions);
  };

  const handleSave = async () => {
    if (!firestore || !name || !price || !selectedVendorId) {
      toast({ variant: "destructive", title: "Missing Info", description: "Name, Price, and Vendor are required." });
      return;
    }
    
    const vendor = vendors?.find(v => v.id === selectedVendorId);
    const finalServiceMode = vendor?.category || 'Food';
    const finalZoneId = vendor?.zoneId || null;
    const finalTown = vendor?.town || 'Local';
    
    const productData = {
      name: name.trim(),
      mrp: parseFloat(mrp) || parseFloat(price),
      price: parseFloat(price),
      description: description.trim(),
      category: category.toLowerCase().trim() || 'general',
      serviceMode: finalServiceMode,
      vendorId: selectedVendorId,
      restaurantName: vendor?.storeName || 'Store',
      zoneId: finalZoneId,
      town: finalTown,
      isVeg,
      isVarietyRequired: options.length > 0 ? isVarietyRequired : false,
      mfgDate: mfgDate || null,
      expiryDate: expiryDate || null,
      imageUrl: selectedImage || 'https://picsum.photos/seed/food/300/300',
      isAvailable: true,
      options: options.filter(opt => opt.name.trim() !== ''),
      updatedAt: serverTimestamp(),
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
      toast({ title: "Product Published", description: `Assigned to ${finalServiceMode} Hub.` });
    } catch (e) { toast({ variant: "destructive", title: "Error Saving" }); }
  };

  const resetForm = () => {
    setEditingId(null); setName(''); setMrp(''); setPrice(''); setDescription(''); setCategory(''); setSelectedVendorId('');
    setIsVeg(true); setIsVarietyRequired(false); setSelectedImage(null); setOptions([]); setMfgDate(''); setExpiryDate('');
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id); 
    setName(p.name); 
    setMrp((p.mrp || p.price).toString());
    setPrice(p.price.toString()); 
    setDescription(p.description || ''); 
    setCategory(p.category);
    setSelectedVendorId(p.vendorId); 
    setIsVeg(p.isVeg !== false);
    setIsVarietyRequired(p.isVarietyRequired || false);
    setMfgDate(p.mfgDate || '');
    setExpiryDate(p.expiryDate || '');
    setSelectedImage(p.imageUrl); 
    setOptions(p.options || []); 
    setIsAddOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-3xl border shadow-sm items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search catalog..." className="pl-12 h-12 bg-muted/30 border-none rounded-2xl" />
        </div>
        <div className="flex gap-2">
           <Button onClick={() => handleBulkStatus(true)} className="h-12 rounded-2xl bg-green-600 font-black uppercase text-[10px]">OPEN ALL</Button>
           <Button onClick={() => handleBulkStatus(false)} variant="destructive" className="h-12 rounded-2xl font-black uppercase text-[10px]">CLOSE ALL</Button>
           <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild><Button className="bg-black rounded-2xl h-12 font-black uppercase italic"><Plus className="mr-2 h-4 w-4" /> NEW ITEM</Button></DialogTrigger>
              <DialogContent className="rounded-[2.5rem] max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar focus:outline-none p-0">
                <DialogHeader className="p-6 border-b"><DialogTitle className="font-black italic uppercase text-center">Inventory Master</DialogTitle></DialogHeader>
                <div className="p-8 space-y-6">
                   <div onClick={() => fileInputRef.current?.click()} className="h-44 border-2 border-dashed rounded-[2rem] flex items-center justify-center bg-muted/20 cursor-pointer overflow-hidden group">
                      {selectedImage ? <img src={selectedImage} className="h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-2"><ImageIcon className="h-8 w-8 opacity-20" /><span className="text-[10px] font-black uppercase text-muted-foreground">Upload Product Photo</span></div>}
                   </div>
                   <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = async () => setSelectedImage(await compressImage(r.result as string, 800, 800)); r.readAsDataURL(f); }
                   }} />
                   
                   <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Basic Info</label>
                        <Input placeholder="Dish/Product Name" value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl font-bold bg-muted/20 border-none" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">MRP ₹</label>
                          <Input placeholder="MRP ₹" type="number" value={mrp} onChange={e => setMrp(e.target.value)} className="h-12 rounded-xl bg-muted/20 border-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-primary ml-1">Selling Price ₹</label>
                          <Input placeholder="Selling Price ₹" type="number" value={price} onChange={e => setPrice(e.target.value)} className="h-12 rounded-xl border-primary/40 font-bold" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Description</label>
                        <Textarea placeholder="Full Description (Ingredients, usage, etc.)" value={description} onChange={e => setDescription(e.target.value)} className="rounded-xl h-24 font-medium bg-muted/20 border-none p-4" />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Assign Section</label>
                        <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                          <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold"><SelectValue placeholder="Assign to Store" /></SelectTrigger>
                          <SelectContent className="rounded-2xl">{vendors?.map((v:any) => <SelectItem key={v.id} value={v.id}>{v.storeName} ({v.category})</SelectItem>)}</SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                         <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Category</label>
                         <Input placeholder="e.g. Lipsticks, Burgers" value={category} onChange={e => setCategory(e.target.value)} className="h-12 rounded-xl bg-muted/20 border-none font-bold" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">MFG (Oct 2023)</label>
                           <Input placeholder="MFG" value={mfgDate} onChange={e => setMfgDate(e.target.value)} className="h-12 rounded-xl bg-muted/20 border-none text-xs" />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[9px] font-black uppercase text-red-400 ml-1">Expiry (Oct 2024)</label>
                           <Input placeholder="Expiry" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="h-12 rounded-xl bg-red-50/50 border-none text-xs" />
                        </div>
                      </div>

                      {/* VARIATIONS / OPTIONS SECTION */}
                      <div className="space-y-3 pt-4 border-t border-dashed">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <ListPlus className="h-4 w-4 text-primary" />
                             <h4 className="text-xs font-black uppercase tracking-widest">Variations / Variety</h4>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[8px] font-black uppercase text-muted-foreground">Selection Required?</span>
                             <Switch checked={isVarietyRequired} onCheckedChange={setIsVarietyRequired} className="scale-75 data-[state=checked]:bg-primary" />
                          </div>
                          <button onClick={addOptionRow} className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1.5 rounded-full uppercase tracking-widest border border-primary/10">Add Variety</button>
                        </div>
                        
                        <div className="space-y-3">
                          {options.map((opt, idx) => (
                            <div key={idx} className="flex gap-2 items-center bg-gray-50 p-2 rounded-xl border border-gray-100">
                               <Input 
                                 placeholder="Size/Shade" 
                                 value={opt.name} 
                                 onChange={e => updateOption(idx, 'name', e.target.value)}
                                 className="h-10 rounded-lg bg-white border-none text-xs font-bold"
                               />
                               <div className="relative w-24">
                                 <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">₹</span>
                                 <Input 
                                   type="number"
                                   placeholder="Extra" 
                                   value={opt.price || ''} 
                                   onChange={e => updateOption(idx, 'price', e.target.value)}
                                   className="h-10 pl-5 rounded-lg bg-white border-none text-xs font-bold"
                                 />
                               </div>
                               <button onClick={() => removeOptionRow(idx)} className="h-10 w-10 flex items-center justify-center text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                   </div>

                   <Button onClick={handleSave} className="w-full h-18 bg-primary text-white rounded-[2rem] font-black uppercase italic shadow-xl shadow-primary/20 text-lg">PUBLISH TO HUB</Button>
                </div>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
        {products?.map(p => (
          <div key={p.id} className={cn("bg-white p-4 rounded-3xl border flex items-center justify-between group shadow-sm hover:shadow-md transition-all", p.isAvailable === false && "opacity-60")}>
            <div className="flex items-center gap-4">
              <img src={p.imageUrl} className="h-16 w-16 rounded-xl object-cover bg-muted" />
              <div>
                <h4 className="font-black text-sm uppercase italic truncate max-w-[120px]">{p.name}</h4>
                <div className="flex items-center gap-2">
                   <span className="text-[8px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded-full uppercase">{p.serviceMode || 'Food'}</span>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[80px]">{p.restaurantName}</p>
                </div>
                <div className="flex items-center gap-4 mt-1">
                   <div className="flex items-center gap-1.5 bg-muted/30 px-1.5 py-0.5 rounded-lg">
                      <span className={cn("text-[7px] font-black uppercase", p.isAvailable !== false ? "text-green-600" : "text-red-500")}>
                        {p.isAvailable !== false ? 'Live' : 'OFF'}
                      </span>
                      <Switch 
                        checked={p.isAvailable !== false} 
                        onCheckedChange={(val) => toggleProductAvailability(p.id, p.vendorId, val)}
                        className="scale-50 data-[state=checked]:bg-green-500"
                      />
                   </div>
                   <div className="flex items-center gap-2">
                      <p className="text-primary font-black text-xs">₹{p.price}</p>
                      {p.mrp > p.price && <span className="text-[8px] text-gray-400 line-through">₹{p.mrp}</span>}
                   </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleEdit(p)} size="icon" variant="ghost" className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg"><Edit className="h-4 w-4" /></Button>
              <Button onClick={() => { if(confirm("Delete?")) { deleteDoc(doc(firestore!, 'products', p.id)); deleteDoc(doc(firestore!, 'vendors', p.vendorId, 'products', p.id)); } }} size="icon" variant="ghost" className="h-8 w-8 bg-red-50 text-red-600 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}