"use client"

import { useState } from 'react';
import { Plus, Trash2, Tag, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function BannerManagement() {
  const firestore = useFirestore();
  const { data: banners, loading } = useCollection(firestore ? collection(firestore, 'banners') : null);
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tag, setTag] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (!firestore) return;
    const docRef = doc(firestore, 'banners', id);
    deleteDoc(docRef).catch(async (e) => {
      const err = new FirestorePermissionError({ path: docRef.path, operation: 'delete' });
      errorEmitter.emit('permission-error', err);
    });
    toast({ title: "Banner Removed", description: "The banner slider has been updated." });
  };

  const handleSave = () => {
    if (!firestore || !title || !selectedImage) return;

    const bannerData = {
      title,
      subtitle,
      tag,
      imageUrl: selectedImage,
      createdAt: serverTimestamp(),
    };

    addDoc(collection(firestore, 'banners'), bannerData)
      .then(() => {
        setIsAddOpen(false);
        setTitle('');
        setSubtitle('');
        setTag('');
        setSelectedImage(null);
        toast({ title: "Banner Added", description: "Successfully updated your promotional banners." });
      })
      .catch(async (e) => {
        const err = new FirestorePermissionError({ path: 'banners', operation: 'create', requestResourceData: bannerData });
        errorEmitter.emit('permission-error', err);
      });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Create Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-black italic uppercase">New Banner Slider</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Banner Title (e.g. 50% OFF)</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Subtitle (e.g. FIRST ORDER)</label>
                <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Subtitle" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tag (e.g. Limited Time)</label>
                <Input value={tag} onChange={e => setTag(e.target.value)} placeholder="Tag" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Background</label>
                <div className="grid grid-cols-4 gap-2 max-h-[150px] overflow-y-auto no-scrollbar p-1">
                  {PlaceHolderImages.filter(img => img.id.includes('hero') || img.id.includes('combo')).map(img => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(img.imageUrl)}
                      className={cn(
                        "aspect-video rounded-lg overflow-hidden border-2",
                        selectedImage === img.imageUrl ? "border-primary" : "border-transparent"
                      )}
                    >
                      <img src={img.imageUrl} className="h-full w-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleSave} className="w-full bg-primary font-black uppercase italic rounded-xl h-12">Publish Banner</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : banners && banners.length > 0 ? (
          banners.map((banner: any) => (
            <div key={banner.id} className="bg-white rounded-2xl border p-1 overflow-hidden group">
              <div className="relative h-40 bg-muted rounded-xl flex items-center justify-center m-1">
                <img src={banner.imageUrl} className="absolute inset-0 w-full h-full object-cover rounded-xl" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5 rounded-xl">
                  <h3 className="text-white font-black text-2xl italic tracking-tighter leading-none">{banner.title}</h3>
                  <p className="text-primary text-[10px] font-black uppercase tracking-widest mt-1">{banner.subtitle}</p>
                </div>
                <button 
                  onClick={() => handleDelete(banner.id)}
                  className="absolute top-3 right-3 bg-black/40 backdrop-blur-md p-2 rounded-xl text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 pt-2">
                <div className="flex items-center text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                  <Tag className="h-3 w-3 mr-1.5 text-primary" />
                  {banner.tag}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed">
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No promotional banners active</p>
          </div>
        )}
      </div>
    </div>
  );
}
