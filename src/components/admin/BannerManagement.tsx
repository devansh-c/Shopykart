"use client"

import { useState, useRef } from 'react';
import { Plus, Trash2, Tag, Image as ImageIcon, Loader2, ImagePlus, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { compressImage } from '@/lib/image-utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function BannerManagement() {
  const firestore = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  // Fetch Banners
  const bannersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'banners');
  }, [firestore]);
  const { data: banners, loading } = useCollection<any>(bannersQuery);

  // Fetch Zones for selector
  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'zones');
  }, [firestore]);
  const { data: zones } = useCollection<any>(zonesQuery);
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [tag, setTag] = useState('');
  const [selectedZoneId, setSelectedZoneId] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 800, 400);
      setSelectedImage(compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = (id: string) => {
    if (!firestore) return;
    if (confirm("Remove this banner?")) {
       const docRef = doc(firestore, 'banners', id);
       deleteDoc(docRef);
       toast({ title: "Banner Removed" });
    }
  };

  const handleSave = async () => {
    if (!firestore || !title || !selectedImage || !selectedZoneId || isProcessing) {
      toast({ variant: "destructive", title: "Incomplete", description: "Title, Image and Zone are required." });
      return;
    }

    setIsProcessing(true);
    const zoneName = zones?.find(z => z.id === selectedZoneId)?.name || 'Local';

    const bannerData = {
      title,
      subtitle,
      tag,
      zoneId: selectedZoneId,
      zoneName,
      imageUrl: selectedImage,
      createdAt: serverTimestamp(),
    };

    try {
       await addDoc(collection(firestore, 'banners'), bannerData);
       setIsAddOpen(false);
       resetForm();
       toast({ title: "Banner Added", description: `Published for ${zoneName}` });
    } catch (e) {
       toast({ variant: "destructive", title: "Upload Failed" });
    } finally {
       setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setTag('');
    setSelectedZoneId('');
    setSelectedImage(null);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black italic uppercase text-gray-800">Banners & Promotions</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 rounded-xl font-black uppercase italic text-[10px] tracking-widest">
              <Plus className="h-4 w-4 mr-2" />
              New Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="font-black italic uppercase text-center text-xl">Configure Promotion</DialogTitle>
            </DialogHeader>
            <div className="p-6 space-y-4">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative h-48 w-full border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-muted/20",
                  selectedImage ? "border-primary/50" : "border-gray-200"
                )}
              >
                {selectedImage ? (
                  <img src={selectedImage} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <ImageIcon className="h-8 w-8 text-primary/20" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Select Image (Wide)</span>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Title</label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="50% OFF" className="h-12 rounded-xl font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subtitle</label>
                  <Input value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="First Order" className="h-12 rounded-xl font-bold" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Assign to Zone *</label>
                <Select value={selectedZoneId} onValueChange={setSelectedZoneId}>
                  <SelectTrigger className="h-12 rounded-xl bg-primary/5 border-primary/10 font-bold">
                    <SelectValue placeholder="Select Serving Zone" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {zones?.map((zone: any) => (
                      <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tag (Bottom Label)</label>
                <Input value={tag} onChange={e => setTag(e.target.value)} placeholder="Limited Time" className="h-12 rounded-xl font-bold" />
              </div>

              <Button onClick={handleSave} disabled={isProcessing} className="w-full bg-primary font-black uppercase italic rounded-2xl h-16 shadow-xl shadow-primary/20 text-lg">
                {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Publish Banner'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners && banners.length > 0 ? (
          banners.map((banner: any) => (
            <div key={banner.id} className="bg-white rounded-[2rem] border p-2 overflow-hidden group shadow-sm transition-all hover:shadow-xl">
              <div className="relative h-44 bg-muted rounded-[1.5rem] overflow-hidden">
                <img src={banner.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                  <h3 className="text-white font-black text-2xl italic tracking-tighter leading-none">{banner.title}</h3>
                  <p className="text-primary font-black text-sm italic tracking-tight mt-1">{banner.subtitle}</p>
                </div>
                <button 
                  onClick={() => handleDelete(banner.id)}
                  className="absolute top-4 right-4 bg-black/40 backdrop-blur-md p-2.5 rounded-xl text-white hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                  <Tag className="h-3 w-3 mr-1.5 text-primary" />
                  {banner.tag || 'Exclusive'}
                </div>
                <div className="flex items-center gap-1.5 bg-primary/5 px-2 py-1 rounded-full text-primary">
                  <MapPin className="h-3 w-3" />
                  <span className="text-[9px] font-black uppercase">{banner.zoneName || 'Local'}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-24 bg-muted/10 rounded-[3rem] border-2 border-dashed">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No promotional banners active</p>
          </div>
        )}
      </div>
    </div>
  );
}
