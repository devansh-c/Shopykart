"use client"

import { useState, useRef, useMemo } from 'react';
import { Plus, Edit, Trash2, Search, Package, Image as ImageIcon, Check, Store, Loader2, X, Power, PowerOff, Star, MapPin, ListPlus, Trophy, AlertCircle, FileUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, writeBatch, query, where, getDocs, setDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { compressImage } from '@/lib/image-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export function ProductManagement() {
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Bulk Status Dialog State
  const [isBulkStatusDialogOpen, setIsBulkStatusDialogOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<'open' | 'close'>('open');
  const [selectedBulkZoneId, setSelectedBulkZoneId] = useState<string>('');

  const [name, setName] = useState('');
  const [mrp, setMrp] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [isTopTen, setIsTopTen] = useState(false);
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

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'zones');
  }, [firestore]);
  const { data: zones } = useCollection<any>(zonesQuery);

  const handleBulkStatusAction = async () => {
    if (!firestore || !vendors || !selectedBulkZoneId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a zone first." });
      return;
    }

    setIsBulkUpdating(true);
    const isOnline = bulkMode === 'open';
    const zoneName = zones?.find(z => z.id === selectedBulkZoneId)?.name || 'Selected Zone';

    try {
      const batch = writeBatch(firestore);
      const targetVendors = vendors.filter(v => v.zoneId === selectedBulkZoneId);
      
      if (targetVendors.length === 0) {
        toast({ variant: "destructive", title: "No Stores", description: `No stores found in ${zoneName}.` });
        setIsBulkUpdating(false);
        return;
      }

      targetVendors.forEach(v => {
        batch.update(doc(firestore, 'vendors', v.id), { isOnline, updatedAt: serverTimestamp() });
      });

      const vendorIds = targetVendors.map(v => v.id);
      const targetProducts = products?.filter(p => vendorIds.includes(p.vendorId)) || [];

      targetProducts.forEach(p => {
        batch.set(doc(firestore, 'products', p.id), { isAvailable: isOnline, updatedAt: serverTimestamp() }, { merge: true });
        batch.set(doc(firestore, 'vendors', p.vendorId, 'products', p.id), { isAvailable: isOnline, updatedAt: serverTimestamp() }, { merge: true });
      });

      await batch.commit();
      
      toast({ title: isOnline ? "Zone Online! 🟢" : "Zone Closed! 🔴", description: `Updated ${targetVendors.length} stores in ${zoneName}.` });
      setIsBulkStatusDialogOpen(false);
      setSelectedBulkZoneId('');
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
    finally { setIsBulkUpdating(false); }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firestore) return;

    setIsBulkUpdating(true);
    toast({ title: "Importing...", description: "Processing your file. Please wait." });

    try {
      const XLSX = (await import('xlsx'));
      const reader = new FileReader();
      
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          toast({ variant: "destructive", title: "Empty File", description: "No data found in sheet." });
          setIsBulkUpdating(false);
          return;
        }

        // Process in batches of 500
        let successCount = 0;
        const totalBatches = Math.ceil(data.length / 500);

        for (let i = 0; i < data.length; i += 500) {
          const batch = writeBatch(firestore);
          const chunk = data.slice(i, i + 500);

          chunk.forEach(item => {
            const newRef = doc(collection(firestore, 'products'));
            const vendor = vendors?.find(v => v.id === String(item.vendorId || item.VendorID));
            
            const pData = {
              id: newRef.id,
              name: String(item.name || item.Name || 'Unnamed Product'),
              price: parseFloat(item.price || item.Price || 0),
              mrp: parseFloat(item.mrp || item.MRP || item.price || item.Price || 0),
              category: String(item.category || item.Category || 'General').toLowerCase(),
              vendorId: String(item.vendorId || item.VendorID || 'global'),
              restaurantName: vendor?.storeName || item.storeName || item.StoreName || 'ShopyKart Select',
              description: String(item.description || item.Description || ''),
              imageUrl: String(item.imageUrl || item.ImageUrl || 'https://picsum.photos/seed/bulk/400/400'),
              serviceMode: vendor?.category || 'Food',
              zoneId: vendor?.zoneId || null,
              town: vendor?.town || 'Local',
              isAvailable: true,
              isVeg: item.isVeg !== undefined ? Boolean(item.isVeg) : true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            
            batch.set(newRef, pData);
            if (pData.vendorId !== 'global') {
              batch.set(doc(firestore, 'vendors', pData.vendorId, 'products', newRef.id), pData);
            }
            successCount++;
          });

          await batch.commit();
        }

        toast({ title: "Import Complete! ✅", description: `${successCount} products added to catalog.` });
        setIsBulkImportOpen(false);
        setIsBulkUpdating(false);
      };
      reader.readAsBinaryString(file);
    } catch (err) {
      console.error("Bulk error:", err);
      toast({ variant: "destructive", title: "Import Failed", description: "Format error or network issue." });
      setIsBulkUpdating(false);
    }
  };

  const toggleProductAvailability = async (productId: string, vendorId: string, available: boolean) => {
    if (!firestore) return;
    try {
      await setDoc(doc(firestore, 'products', productId), { isAvailable: available, updatedAt: serverTimestamp() }, { merge: true });
      await setDoc(doc(firestore, 'vendors', vendorId, 'products', productId), { isAvailable: available, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: available ? "Stock Online" : "Stock Offline" });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
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
      isTopTen,
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
      toast({ title: "Product Published" });
    } catch (e) { toast({ variant: "destructive", title: "Error Saving" }); }
  };

  const resetForm = () => {
    setEditingId(null); setName(''); setMrp(''); setPrice(''); setDescription(''); setCategory(''); setSelectedVendorId('');
    setIsVeg(true); setIsTopTen(false); setIsVarietyRequired(false); setSelectedImage(null); setOptions([]); setMfgDate(''); setExpiryDate('');
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
    setIsTopTen(p.isTopTen || false);
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
           <Button 
            onClick={() => { setBulkMode('open'); setIsBulkStatusDialogOpen(true); }} 
            className="h-12 rounded-2xl bg-green-600 hover:bg-green-700 font-black uppercase text-[10px] text-white"
           >
            OPEN BY ZONE
           </Button>
           
           <Dialog open={isBulkImportOpen} onOpenChange={setIsBulkImportOpen}>
             <DialogTrigger asChild>
               <Button className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 font-black uppercase text-[10px] text-white">
                 <FileUp className="mr-2 h-4 w-4" /> BULK IMPORT
               </Button>
             </DialogTrigger>
             <DialogContent className="rounded-[2.5rem] max-w-sm">
                <DialogHeader><DialogTitle className="font-black italic uppercase text-center">Bulk Data Import</DialogTitle></DialogHeader>
                <div className="p-6 space-y-6">
                   <div onClick={() => bulkInputRef.current?.click()} className="h-40 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center bg-blue-50/50 cursor-pointer hover:border-blue-300 transition-all group">
                      {isBulkUpdating ? <Loader2 className="h-8 w-8 animate-spin text-blue-600" /> : (
                        <>
                          <FileUp className="h-8 w-8 text-blue-400 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-black uppercase text-blue-600 mt-2">Upload Excel / CSV</span>
                        </>
                      )}
                   </div>
                   <input type="file" ref={bulkInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleBulkImport} />
                   
                   <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-2">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                        Column headers required:
                        <span className="block text-black font-black mt-1">name, price, mrp, category, vendorId, description</span>
                      </p>
                      <button className="text-[8px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1"><Download className="h-2.5 w-2.5" /> Download Template</button>
                   </div>
                </div>
             </DialogContent>
           </Dialog>

           <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if(!val) resetForm(); }}>
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
                      <Input placeholder="Product Name" value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl font-bold bg-muted/20 border-none" />
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="MRP ₹" type="number" value={mrp} onChange={e => setMrp(e.target.value)} className="h-12 rounded-xl bg-muted/20 border-none" />
                        <Input placeholder="Selling Price ₹" type="number" value={price} onChange={e => setPrice(e.target.value)} className="h-12 rounded-xl border-primary/40 font-bold" />
                      </div>
                      <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="rounded-xl h-24 bg-muted/20 border-none p-4" />
                      <Select value={selectedVendorId} onValueChange={setSelectedVendorId}>
                        <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold"><SelectValue placeholder="Assign to Store" /></SelectTrigger>
                        <SelectContent className="rounded-2xl">{vendors?.map((v:any) => <SelectItem key={v.id} value={v.id}>{v.storeName}</SelectItem>)}</SelectContent>
                      </Select>
                      <Input placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} className="h-12 rounded-xl bg-muted/20 border-none font-bold" />
                   </div>
                   <Button onClick={handleSave} className="w-full h-18 bg-primary text-white rounded-[2rem] font-black uppercase italic shadow-xl">PUBLISH TO HUB</Button>
                </div>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      <Dialog open={isBulkStatusDialogOpen} onOpenChange={setIsBulkStatusDialogOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-sm">
          <DialogHeader><DialogTitle className="font-black italic uppercase text-center text-xl">{bulkMode === 'open' ? 'Open All Stores' : 'Close All Stores'}</DialogTitle></DialogHeader>
          <div className="py-6 space-y-4">
             <Select value={selectedBulkZoneId} onValueChange={setSelectedBulkZoneId}>
                <SelectTrigger className="h-14 rounded-2xl bg-muted/20 border-none font-bold"><SelectValue placeholder="Select Zone" /></SelectTrigger>
                <SelectContent className="rounded-2xl">{zones?.map((zone: any) => (<SelectItem key={zone.id} value={zone.id} className="font-bold py-3 uppercase text-xs">{zone.name}</SelectItem>))}</SelectContent>
             </Select>
             <Button onClick={handleBulkStatusAction} disabled={isBulkUpdating || !selectedBulkZoneId} className="w-full h-16 rounded-2xl font-black uppercase italic shadow-xl bg-green-600 text-white">
               {isBulkUpdating ? <Loader2 className="h-6 w-6 animate-spin" /> : "CONFIRM ACTION"}
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
        {products?.map(p => (
          <div key={p.id} className={cn("bg-white p-4 rounded-3xl border flex items-center justify-between group shadow-sm hover:shadow-md transition-all relative overflow-hidden", p.isAvailable === false && "opacity-60")}>
            <div className="flex items-center gap-4">
              <img src={p.imageUrl} className="h-16 w-16 rounded-xl object-cover bg-muted" />
              <div>
                <h4 className="font-black text-sm uppercase italic truncate max-w-[120px]">{p.name}</h4>
                <div className="flex items-center gap-2">
                   <span className="text-[8px] font-black text-primary bg-primary/5 px-1.5 py-0.5 rounded-full uppercase">{p.serviceMode || 'Food'}</span>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase truncate max-w-[80px]">{p.restaurantName}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-primary font-black text-xs">₹{p.price}</p>
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