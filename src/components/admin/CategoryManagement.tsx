"use client"

import { useState, useRef } from 'react';
import { Plus, Trash2, Image as ImageIcon, Loader2, ImagePlus, Edit, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/image-utils';

export default function CategoryManagement() {
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: categories, loading } = useCollection<any>(categoriesQuery);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [serviceType, setServiceType] = useState('Food');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleSave = async () => {
    if (!firestore || !name || !selectedImage || isProcessing) {
      toast({ variant: "destructive", title: "Missing Info", description: "Name and Image are required." });
      return;
    }

    setIsProcessing(true);
    const data = {
      name,
      serviceType, // Add serviceType to category
      imageUrl: selectedImage,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        const ref = doc(firestore, 'categories', editingId);
        await updateDoc(ref, data);
        toast({ title: "Category Updated" });
      } else {
        await addDoc(collection(firestore, 'categories'), { ...data, createdAt: serverTimestamp() });
        toast({ title: "Category Created", description: `Published in ${serviceType} section.` });
      }
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      toast({ variant: "destructive", title: "Error Saving" });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setName('');
    setServiceType('Food');
    setSelectedImage(null);
    setEditingId(null);
    setIsProcessing(false);
  };

  const handleEdit = (cat: any) => {
    setName(cat.name);
    setServiceType(cat.serviceType || 'Food');
    setSelectedImage(cat.imageUrl);
    setEditingId(cat.id);
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm("Delete this category?")) {
      await deleteDoc(doc(firestore, 'categories', id));
      toast({ title: "Category Removed" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black italic uppercase text-gray-800">Master Categories</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Organize Food, Grocery, Medical & Beauty separately</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#1E293B] rounded-xl font-black uppercase text-[10px] tracking-widest"><Plus className="h-4 w-4 mr-2" /> NEW CATEGORY</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 pb-2">
               <DialogTitle className="font-black italic uppercase text-center text-xl">{editingId ? 'Edit Category' : 'Add Category'}</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-5">
              <div onClick={() => fileInputRef.current?.click()} className="h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/20 hover:border-primary/40 transition-all">
                {selectedImage ? <img src={selectedImage} className="h-full w-full object-cover" alt="Preview" /> : <div className="flex flex-col items-center gap-2"><ImageIcon className="h-8 w-8 text-muted-foreground/30" /><span className="text-[10px] font-black uppercase text-muted-foreground">Upload Photo</span></div>}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Category Name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lipsticks, Tablets, Burgers" className="h-12 rounded-xl font-bold" />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-primary ml-1">Assigned Service Section *</label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger className="h-12 rounded-xl bg-primary/5 border-none font-bold">
                      <SelectValue placeholder="Select Service" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="Food">Food Section</SelectItem>
                      <SelectItem value="Grocery">Grocery Section</SelectItem>
                      <SelectItem value="Medical">Medical & Care Section</SelectItem>
                      <SelectItem value="Beauty">Beauty & Cosmetics Section</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl flex gap-3">
                 <Info className="h-4 w-4 text-blue-600 shrink-0" />
                 <p className="text-[9px] font-bold text-blue-800 uppercase leading-relaxed">
                   Category sirf wahi dikhegi jahan aapne ise assign kiya hai.
                 </p>
              </div>

              <Button onClick={handleSave} disabled={isProcessing} className="w-full bg-primary h-16 rounded-[1.5rem] font-black uppercase italic shadow-xl shadow-primary/20 text-lg">
                {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : editingId ? 'UPDATE CATEGORY' : 'CREATE CATEGORY'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories?.map((cat: any) => (
          <div key={cat.id} className="bg-white p-4 rounded-[2rem] border border-gray-100 flex flex-col items-center text-center group relative transition-all hover:shadow-xl shadow-sm">
            <div className="h-20 w-20 rounded-full overflow-hidden mb-3 border-4 border-muted bg-muted shadow-inner">
              <img src={cat.imageUrl} className="h-full w-full object-cover" alt={cat.name} />
            </div>
            <span className="font-black text-[11px] uppercase tracking-tighter text-gray-800">{cat.name}</span>
            <span className={cn(
              "text-[7px] font-black uppercase mt-1 px-2 py-0.5 rounded-full",
              cat.serviceType === 'Beauty' ? "bg-rose-50 text-rose-600" :
              cat.serviceType === 'Medical' ? "bg-teal-50 text-teal-600" :
              "bg-primary/5 text-primary"
            )}>{cat.serviceType || 'Food'}</span>
            
            <div className="absolute inset-0 bg-black/60 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <button onClick={() => handleEdit(cat)} className="bg-white p-2.5 rounded-xl text-blue-600 active:scale-90 transition-transform"><Edit className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(cat.id)} className="bg-white p-2.5 rounded-xl text-red-600 active:scale-90 transition-transform"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
