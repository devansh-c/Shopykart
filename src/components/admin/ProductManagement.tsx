"use client"

import { useState, useRef, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Package, Image as ImageIcon, Check, Store, Loader2, X, Power, PowerOff, Star, MapPin } from 'lucide-react';
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
      if (products) products.forEach(p => batch.update(doc(firestore, 'products', p.id), { isAvailable: online }));
      await batch.commit();
      toast({ title: online ? "All Online" : "All Closed" });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
    finally { setIsBulkUpdating(false); }
  };

  const handleSave = async () => {
    if (!firestore || !name || !price || !selectedVendorId) {
      toast({ variant: "destructive", title: "Missing Info", description: "Name, Price, and Vendor are required." });
      return;
    }
    
    const vendor = vendors?.find(v => v.id === selectedVendorId);
    // HUB INHERITANCE: Automatically set serviceMode based on vendor's assigned category
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
      mfgDate: mfgDate || null,
      expiryDate: expiryDate || null,
      imageUrl: selectedImage || 'https://picsum.photos/seed/food/300/300',
      isAvailable: true,
      options: options.filter(opt => opt.name.trim() !== ''),
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(firestore, 'products', editingId), productData);
      } else {
        await addDoc(collection(firestore, 'products'), { ...productData, createdAt: serverTimestamp() });
      }
      setIsAddOpen(false);
      resetForm();
      toast({ title: "Product Published", description: `Assigned to ${finalServiceMode} Hub.` });
    } catch (e) { toast({ variant: "destructive", title: "Error Saving" }); }
  };

  const resetForm = () => {
    setEditingId(null); setName(''); setMrp(''); setPrice(''); setDescription(''); setCategory(''); setSelectedVendorId('');
    setIsVeg(true); setSelectedImage(null); setOptions([]); setMfgDate(''); setExpiryDate('');
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
              <DialogContent className="rounded-[2.5rem] max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar">
                <DialogHeader><DialogTitle className="font-black italic uppercase">Inventory Master</DialogTitle></DialogHeader>
                <div className="space-y-5 pt-4">
                   <div onClick={() => fileInputRef.current?.click()} className="h-40 border-2 border-dashed rounded-2xl flex items-center justify-center bg-muted/20 cursor-pointer overflow-hidden group">
                      {selectedImage ? <img src={selectedImage} className="h-full w-full object-cover" /> : <div className="flex flex-col items-center gap-2"><ImageIcon className="h-8 w-8 opacity-20" /><span className="text-[10px] font-black uppercase text-muted-foreground">Upload Product Photo</span></div>}
                   </div>
                   <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = async () => setSelectedImage(await compressImage(r.result as string, 800, 800)); r.readAsDataURL(f); }
                   }} />
                   
                   <div className="space-y-4">
                      <Input placeholder="Dish/Product Name" value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl font-bold" />
                      <Textarea placeholder="Full Description (Ingredients, usage, etc.)" value={description} onChange={e => setDescription(e.target.value)} className="rounded-xl h-24 font-medium" />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="MRP ₹" type="number" value={mrp} onChange={e => setMrp(e.target.value)} className="h-12 rounded-xl bg-muted/20" />
                        <Input placeholder="Selling Price ₹" type="number" value={price} onChange={e => setPrice(e.target.value)} className="h-12 rounded-xl border-primary/40 font-bold" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="MFG (Oct 2023)" value={mfgDate} onChange={e => setMfgDate(e.target.value)} className="h-11 rounded-xl text-xs" />
                        <Input placeholder="Expiry (Oct 2024)" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="h-11 rounded-xl text-xs border-red-100" />
                      </div>

                      <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                        <SelectTrigger className="h-12 rounded-xl bg-primary/5 border-none font-bold"><SelectValue placeholder="Assign to Store" /></SelectTrigger>
                        <SelectContent className="rounded-2xl">{vendors?.map((v:any) => <SelectItem key={v.id} value={v.id}>{v.storeName} ({v.category})</SelectItem>)}</SelectContent>
                      </Select>

                      <Input placeholder="Category (e.g. Lipsticks, Burgers)" value={category} onChange={e => setCategory(e.target.value)} className="h-12 rounded-xl bg-muted/10 border-none font-bold" />
                   </div>

                   <Button onClick={handleSave} className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl shadow-primary/20 text-lg">PUBLISH PRODUCT</Button>
                </div>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
        {products?.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-3xl border flex items-center justify-between group shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center gap-4">
              <img src={p.imageUrl} className="h-16 w-16 rounded-xl object-cover bg-muted" />
              <div>
                <h4 className="font-black text-sm uppercase italic truncate max-w-[120px]">{p.name}</h4>
                <div className="flex items-center gap-2">
                   <span className="text-[8px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded-full uppercase">{p.serviceMode || 'Food'}</span>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[80px]">{p.restaurantName}</p>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                   <p className="text-primary font-black text-xs">₹{p.price}</p>
                   {p.mrp > p.price && <span className="text-[8px] text-gray-400 line-through">₹{p.mrp}</span>}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleEdit(p)} size="icon" variant="ghost" className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg"><Edit className="h-4 w-4" /></Button>
              <Button onClick={() => { if(confirm("Delete?")) deleteDoc(doc(firestore!, 'products', p.id)); }} size="icon" variant="ghost" className="h-8 w-8 bg-red-50 text-red-600 rounded-lg"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
