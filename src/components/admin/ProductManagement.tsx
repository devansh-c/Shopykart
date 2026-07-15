"use client"

import { useState, useRef, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Package, Image as ImageIcon, Loader2, Trophy, FileUp, Globe } from 'lucide-react';
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
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
      vendorId: selectedVendorId,
      restaurantName: vendor?.storeName || 'Store',
      imageUrl: selectedImage || 'https://picsum.photos/seed/food/300/300',
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
      toast({ title: "Product SEO Published" });
    } catch (e) { toast({ variant: "destructive", title: "Save Error" }); }
    finally { setIsProcessing(false); }
  };

  const resetForm = () => {
    setEditingId(null); setName(''); setSlug(''); setPrice(''); setSelectedVendorId(''); setSelectedImage(null);
  };

  const handleEdit = (p: any) => {
    setEditingId(p.id); setName(p.name); setSlug(p.slug || ''); setPrice(p.price.toString()); 
    setSelectedVendorId(p.vendorId); setSelectedImage(p.imageUrl); setIsAddOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl border shadow-sm">
        <div className="relative w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search inventory..." className="pl-12 h-11 bg-muted/30 border-none rounded-xl font-bold" />
        </div>
        <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild><Button className="bg-black rounded-xl font-black uppercase italic"><Plus className="h-4 w-4 mr-2" /> ADD PRODUCT</Button></DialogTrigger>
          <DialogContent className="rounded-[2.5rem] max-w-md focus:outline-none">
            <DialogHeader><DialogTitle className="font-black italic uppercase text-center">Product SEO Hub</DialogTitle></DialogHeader>
            <div className="p-4 space-y-6">
               <Input value={name} onChange={e => setName(e.target.value)} placeholder="Product Name" className="h-12 rounded-xl font-bold bg-muted/20" />
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-primary ml-1 flex items-center gap-1.5"><Globe className="h-2.5 w-2.5" /> Super SEO Slug</label>
                  <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="dairy-milk-silk" className="h-12 rounded-xl bg-primary/5 border-primary/10 font-black italic text-primary" />
               </div>
               <Input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="Selling Price ₹" className="h-12 rounded-xl font-black text-lg" />
               <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                  <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold"><SelectValue placeholder="Assign Store" /></SelectTrigger>
                  <SelectContent className="rounded-2xl">{vendors?.map((v:any) => <SelectItem key={v.id} value={v.id}>{v.storeName}</SelectItem>)}</SelectContent>
               </Select>
               <Button onClick={handleSave} disabled={isProcessing} className="w-full h-16 bg-primary text-white rounded-[2rem] font-black uppercase italic shadow-xl">
                 {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : 'PUBLISH SUPER SEO'}
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products?.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-3xl border flex items-center justify-between group shadow-sm transition-all relative overflow-hidden">
            <div className="flex items-center gap-4">
              <img src={p.imageUrl} className="h-14 w-14 rounded-xl object-cover" />
              <div className="min-w-0">
                <h4 className="font-black text-sm uppercase italic truncate max-w-[120px]">{p.name}</h4>
                <p className="text-[9px] font-black text-primary truncate italic leading-none">/product/{p.slug || slugify(p.name)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleEdit(p)} size="icon" variant="ghost" className="h-8 w-8 bg-blue-50 text-blue-600 rounded-lg"><Edit className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
