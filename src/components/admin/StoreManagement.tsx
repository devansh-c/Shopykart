"use client"

import { useState, useRef, useMemo } from 'react';
import { Store, Edit, Trash2, Search, Loader2, Globe, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { cn, slugify } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function StoreManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStore, setEditingStore] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors, loading } = useCollection<any>(vendorsQuery);

  const handleUpdateStore = async () => {
    if (!firestore || !editingStore) return;
    const finalSlug = editingStore.slug?.trim().toLowerCase().replace(/\s+/g, '-') || slugify(editingStore.storeName);
    
    try {
      await updateDoc(doc(firestore, 'vendors', editingStore.id), {
        storeName: editingStore.storeName || '',
        slug: finalSlug,
        updatedAt: serverTimestamp()
      });
      setIsEditOpen(false);
      toast({ title: "Store SEO Updated" });
    } catch (err) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[#0B0B0B] p-6 rounded-[2.5rem] text-white">
        <div>
           <h2 className="text-2xl font-black italic uppercase tracking-tighter">Store Hub SEO</h2>
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Managing slugs for {vendors?.length || 0} partners</p>
        </div>
        <div className="relative w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
           <Input placeholder="Filter..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 h-10 bg-white/5 border-white/10 text-white rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vendors?.map((store: any) => (
          <div key={store.id} className="bg-white rounded-[2.5rem] p-6 border shadow-sm hover:shadow-xl transition-all">
            <div className="flex items-center gap-4 mb-4">
              <img src={store.imageUrl} className="h-14 w-14 rounded-2xl object-cover" />
              <div className="min-w-0">
                <h3 className="font-black text-lg italic uppercase truncate">{store.storeName}</h3>
                <p className="text-[9px] font-black text-primary italic leading-none truncate">/store/{store.slug || slugify(store.storeName)}</p>
              </div>
            </div>
            <Dialog open={isEditOpen && editingStore?.id === store.id} onOpenChange={(val) => { setIsEditOpen(val); if(val) setEditingStore(store); }}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gray-50 text-gray-900 h-11 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-100"><Edit className="h-3.5 w-3.5 mr-2" /> CONFIGURE SLUG</Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] max-w-sm">
                 <DialogHeader><DialogTitle className="font-black italic uppercase text-center">Store SEO Settings</DialogTitle></DialogHeader>
                 <div className="p-4 space-y-5">
                    <div className="space-y-1">
                       <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Store Name</label>
                       <Input value={editingStore?.storeName} onChange={e => setEditingStore({...editingStore, storeName: e.target.value})} className="h-12 rounded-xl font-bold bg-muted/20" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-black uppercase text-primary ml-1 flex items-center gap-1.5"><Globe className="h-3 w-3" /> Unique URL Path</label>
                       <Input value={editingStore?.slug} onChange={e => setEditingStore({...editingStore, slug: e.target.value})} placeholder="city-sweets" className="h-12 rounded-xl bg-primary/5 border-primary/10 font-black italic text-primary" />
                    </div>
                    <Button onClick={handleUpdateStore} className="w-full h-16 bg-black text-white rounded-[2rem] font-black uppercase italic shadow-xl">SAVE SEO CHANGES</Button>
                 </div>
              </DialogContent>
            </Dialog>
          </div>
        ))}
      </div>
    </div>
  );
}
