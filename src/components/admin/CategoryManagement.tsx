"use client"

import { useState, useRef } from 'react';
import { Plus, Trash2, Image as ImageIcon, Loader2, ImagePlus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { compressImage } from '@/lib/image-utils';

export function CategoryManagement() {
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
        toast({ title: "Category Created" });
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
    setSelectedImage(null);
    setEditingId(null);
    setIsProcessing(false);
  };

  const handleEdit = (cat: any) => {
    setName(cat.name);
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
        <h2 className="text-xl font-black italic uppercase text-gray-800">Manage Categories</h2>
        <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#1E293B] rounded-xl font-black uppercase text-[10px] tracking-widest"><Plus className="h-4 w-4 mr-2" /> NEW CATEGORY</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 pb-2">
               <DialogTitle className="font-black italic uppercase text-center text-xl">{editingId ? 'Edit Category' : 'Add Category'}</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-6">
              <div onClick={() => fileInputRef.current?.click()} className="h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/20 hover:border-primary/40 transition-all">
                {selectedImage ? <img src={selectedImage} className="h-full w-full object-cover" alt="Preview" /> : <div className="flex flex-col items-center gap-2"><ImageIcon className="h-8 w-8 text-muted-foreground/30" /><span className="text-[10px] font-black uppercase text-muted-foreground">Upload Photo</span></div>}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Category Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Burgers, Pizza, Shakes" className="h-12 rounded-xl font-bold" />
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
