
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
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [isVeg, setIsVeg] = useState(true);
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

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'zones');
  }, [firestore]);
  const { data: zones } = useCollection<any>(zonesQuery);

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
      toast({ variant: "destructive", title: "Missing Info" });
      return;
    }
    
    const vendor = vendors?.find(v => v.id === selectedVendorId);
    const finalZoneId = selectedZoneId || vendor?.zoneId || null;
    const zone = zones?.find(z => z.id === finalZoneId);
    
    const productData = {
      name: name.trim(),
      price: parseFloat(price),
      category: category.toLowerCase().trim() || 'general',
      vendorId: selectedVendorId,
      restaurantName: vendor?.storeName || 'Store',
      zoneId: finalZoneId,
      town: zone?.name || vendor?.town || 'Local',
      isVeg,
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
      toast({ title: "Success" });
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
  };

  const resetForm = () => {
    setEditingId(null); setName(''); setPrice(''); setCategory(''); setSelectedVendorId(''); setSelectedZoneId('');
    setIsVeg(true); setSelectedImage(null); setOptions([]);
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id); setName(p.name); setPrice(p.price.toString()); setCategory(p.category);
    setSelectedVendorId(p.vendorId); setSelectedZoneId(p.zoneId || ''); setIsVeg(p.isVeg !== false);
    setSelectedImage(p.imageUrl); setOptions(p.options || []); setIsAddOpen(true);
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
                   <Input placeholder="Dish name" value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" />
                   <Input placeholder="Price" type="number" value={price} onChange={e => setPrice(e.target.value)} className="h-12 rounded-xl" />
                   <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                      <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Select Store" /></SelectTrigger>
                      <SelectContent>{vendors?.map((v:any) => <SelectItem key={v.id} value={v.id}>{v.storeName}</SelectItem>)}</SelectContent>
                   </Select>
                   <Input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} className="h-12 rounded-xl" />
                   <div onClick={() => fileInputRef.current?.click()} className="h-32 border-2 border-dashed rounded-2xl flex items-center justify-center bg-muted/20 cursor-pointer overflow-hidden">
                      {selectedImage ? <img src={selectedImage} className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8 opacity-20" />}
                   </div>
                   <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onloadend = async () => setSelectedImage(await compressImage(r.result as string, 800, 800)); r.readAsDataURL(f); }
                   }} />
                   <Button onClick={handleSave} className="w-full h-14 bg-primary rounded-2xl font-black uppercase italic shadow-lg">PUBLISH PRODUCT</Button>
                </div>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
        {products?.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-3xl border flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <img src={p.imageUrl} className="h-16 w-16 rounded-xl object-cover" />
              <div>
                <h4 className="font-black text-sm uppercase italic">{p.name}</h4>
                <p className="text-[10px] font-bold text-muted-foreground uppercase">{p.restaurantName} • {p.town}</p>
                <p className="text-primary font-black">₹{p.price}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleEdit(p)} size="icon" variant="ghost" className="h-8 w-8 bg-blue-50 text-blue-600"><Edit className="h-4 w-4" /></Button>
              <Button onClick={() => { if(confirm("Delete?")) deleteDoc(doc(firestore!, 'products', p.id)); }} size="icon" variant="ghost" className="h-8 w-8 bg-red-50 text-red-600"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
