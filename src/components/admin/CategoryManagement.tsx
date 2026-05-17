
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

export function CategoryManagement() {
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const categoriesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'categories');
  }, [firestore]);

  const { data: categories, loading } = useCollection(categoriesQuery);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!firestore || !name || !selectedImage) {
      toast({ variant: "destructive", title: "Missing Info", description: "Name and Image are required." });
      return;
    }

    const data = {
      name,
      imageUrl: selectedImage,
      createdAt: serverTimestamp(),
    };

    if (editingId) {
      const ref = doc(firestore, 'categories', editingId);
      updateDoc(ref, data)
        .then(() => {
          setIsAddOpen(false);
          resetForm();
          toast({ title: "Category Updated" });
        });
    } else {
      addDoc(collection(firestore, 'categories'), data)
        .then(() => {
          setIsAddOpen(false);
          resetForm();
          toast({ title: "Category Created" });
        });
    }
  };

  const resetForm = () => {
    setName('');
    setSelectedImage(null);
    setEditingId(null);
  };

  const handleEdit = (cat: any) => {
    setName(cat.name);
    setSelectedImage(cat.imageUrl);
    setEditingId(cat.id);
    setIsAddOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    deleteDoc(doc(firestore, 'categories', id));
    toast({ title: "Category Removed" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black italic uppercase">Manage Categories</h2>
        <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#1E293B] rounded-xl"><Plus className="h-4 w-4 mr-2" /> NEW CATEGORY</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader><DialogTitle className="font-black italic uppercase text-center">{editingId ? 'Edit Category' : 'Add Category'}</DialogTitle></DialogHeader>
            <div className="space-y-5 pt-4">
              <div onClick={() => fileInputRef.current?.click()} className="h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-muted/20">
                {selectedImage ? <img src={selectedImage} className="h-full w-full object-cover" alt="Preview" /> : <ImageIcon className="h-8 w-8 text-muted-foreground/30" />}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-muted-foreground">Category Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Burgers, Pizza, Shakes" className="h-12 rounded-xl" />
              </div>

              <Button onClick={handleSave} className="w-full bg-primary h-14 rounded-2xl font-black uppercase italic shadow-lg shadow-primary/20">
                {editingId ? 'UPDATE CATEGORY' : 'CREATE CATEGORY'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {categories?.map((cat: any) => (
          <div key={cat.id} className="bg-white p-3 rounded-2xl border border-gray-100 flex flex-col items-center text-center group relative transition-all hover:shadow-md">
            <div className="h-20 w-20 rounded-full overflow-hidden mb-3 border-2 border-muted bg-muted">
              <img src={cat.imageUrl} className="h-full w-full object-cover" alt={cat.name} />
            </div>
            <span className="font-bold text-xs uppercase tracking-tight">{cat.name}</span>
            
            <div className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <button onClick={() => handleEdit(cat)} className="bg-white p-2 rounded-full text-blue-600"><Edit className="h-4 w-4" /></button>
              <button onClick={() => handleDelete(cat.id)} className="bg-white p-2 rounded-full text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
