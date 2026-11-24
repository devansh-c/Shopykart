
"use client"

import { useState, useMemo, useRef } from 'react';
import { 
  Building2, 
  Edit, 
  Trash2, 
  Search, 
  Loader2, 
  Star, 
  Phone, 
  Fingerprint, 
  ShieldCheck,
  MapPin,
  IndianRupee,
  CalendarCheck,
  CheckCircle2,
  Award,
  ChevronRight,
  Plus,
  Camera,
  ImageIcon,
  Lock,
  Type
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { cn, slugify } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, serverTimestamp, deleteDoc, setDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { compressImage } from '@/lib/image-utils';

export default function HotelManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingHotel, setEditingHotel] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const hotelsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'hotels');
  }, [firestore]);

  const { data: hotels, loading } = useCollection<any>(hotelsQuery, 'admin_hotels_master');

  const filteredHotels = useMemo(() => {
    if (!hotels) return [];
    return hotels.filter(h => 
      h.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      h.loginId?.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
  }, [hotels, searchQuery]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 800, 600);
      setEditingHotel((prev: any) => ({ ...prev, imageUrl: compressed }));
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateHotel = async () => {
    if (!firestore || !editingHotel) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(firestore, 'hotels', editingHotel.id), {
        name: editingHotel.name.toUpperCase(),
        loginId: editingHotel.loginId.toLowerCase(),
        password: editingHotel.password,
        address: editingHotel.address.toUpperCase(),
        pricePerNight: parseFloat(editingHotel.pricePerNight),
        rating: parseFloat(editingHotel.rating) || 4.5,
        imageUrl: editingHotel.imageUrl,
        updatedAt: serverTimestamp()
      });
      setIsEditOpen(false);
      toast({ title: "Hotel Profile Updated! ✅" });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteHotel = async (id: string) => {
    if (!firestore) return;
    if (confirm("🚨 WARNING: Delete this hotel record permanently?")) {
      await deleteDoc(doc(firestore, 'hotels', id));
      toast({ title: "Hotel Removed" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-[#0B0B0B] p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
             <h2 className="text-3xl font-black italic uppercase tracking-tighter">Hotelवाले Control</h2>
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Manage Stays, Pricing & Partner Logins</p>
          </div>
          <div className="relative w-full md:w-80">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
             <Input placeholder="Search Hotel Name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 h-14 bg-white/5 border-white/10 text-white rounded-2xl font-bold" />
          </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-44 bg-primary/5 -skew-x-12 translate-x-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !hotels ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : filteredHotels.map((hotel: any) => (
          <div key={hotel.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-border shadow-sm hover:shadow-xl transition-all group flex flex-col relative transform-gpu">
             <div className="relative h-44 w-full bg-muted overflow-hidden">
                <img src={hotel.imageUrl || 'https://picsum.photos/seed/hotel/600/400'} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                <div className="absolute top-4 left-4 bg-white/95 text-primary border-none font-black text-[8px] px-3 py-1 rounded-full shadow-lg uppercase">
                   Verified Stay
                </div>
             </div>

             <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                   <div className="min-w-0 pr-4">
                      <h3 className="font-black text-xl italic uppercase tracking-tighter truncate leading-none mb-2">{hotel.name}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase italic truncate">
                         <MapPin className="h-3 w-3 text-primary" /> {hotel.address}
                      </div>
                   </div>
                   <div className="bg-[#15803d] text-white px-2 py-1 rounded-lg flex items-center gap-1">
                      <Star className="h-3 w-3 fill-white stroke-none" />
                      <span className="text-[10px] font-black">{hotel.rating || '4.5'}</span>
                   </div>
                </div>

                <div className="bg-muted/30 rounded-[2rem] p-5 space-y-4 border border-border/40">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                         <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Partner ID</span>
                         <div className="flex items-center gap-2 text-gray-800"><Fingerprint className="h-3.5 w-3.5 text-primary" /><span className="text-xs font-black uppercase tracking-tight">{hotel.loginId}</span></div>
                      </div>
                      <div className="space-y-1">
                         <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Room Rate</span>
                         <div className="flex items-center gap-2 text-gray-800"><IndianRupee className="h-3.5 w-3.5 text-green-600" /><span className="text-sm font-black italic tracking-tighter">{hotel.pricePerNight}/NT</span></div>
                      </div>
                   </div>
                </div>

                <div className="flex gap-2">
                   <Dialog open={isEditOpen && editingHotel?.id === hotel.id} onOpenChange={(val) => { setIsEditOpen(val); if(val) setEditingHotel({...hotel}); }}>
                      <DialogTrigger asChild>
                         <button className="flex-1 h-12 bg-black hover:bg-primary text-white rounded-2xl font-black uppercase italic text-[10px] tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"><Edit className="h-3.5 w-3.5" /> MANAGE HUB</button>
                      </DialogTrigger>
                      <DialogContent className="rounded-[2.5rem] max-w-md p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh] bg-white">
                         <DialogHeader className="p-8 pb-4 shrink-0">
                            <DialogTitle className="font-black italic uppercase text-center text-2xl tracking-tighter">Edit Hotel Profile</DialogTitle>
                         </DialogHeader>
                         <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-0 space-y-6">
                            <div className="flex flex-col items-center gap-3">
                               <div 
                                 onClick={() => fileInputRef.current?.click()}
                                 className="h-32 w-48 rounded-[2rem] border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative hover:border-primary transition-all"
                               >
                                 {editingHotel?.imageUrl ? (
                                   <>
                                     <img src={editingHotel.imageUrl} className="h-full w-full object-cover" alt="" />
                                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Camera className="h-6 w-6 text-white" /></div>
                                   </>
                                 ) : (
                                   <div className="flex flex-col items-center gap-1"><ImageIcon className="h-8 w-8 text-gray-300" /><span className="text-[8px] font-black uppercase text-gray-400">Upload Banner</span></div>
                                 )}
                               </div>
                               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageSelect} />
                            </div>

                            <div className="space-y-4">
                               <div className="space-y-1.5">
                                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Hotel Identity</label>
                                  <div className="relative">
                                     <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                     <Input value={editingHotel?.name} onChange={e => setEditingHotel({...editingHotel, name: e.target.value})} className="h-14 pl-12 rounded-2xl bg-gray-50 border-none font-bold uppercase" />
                                  </div>
                               </div>

                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                     <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Login ID</label>
                                     <Input value={editingHotel?.loginId} onChange={e => setEditingHotel({...editingHotel, loginId: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold uppercase" />
                                  </div>
                                  <div className="space-y-1.5">
                                     <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Access Key</label>
                                     <Input value={editingHotel?.password} onChange={e => setEditingHotel({...editingHotel, password: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-black" />
                                  </div>
                               </div>

                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                     <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Base Price ₹</label>
                                     <Input type="number" value={editingHotel?.pricePerNight} onChange={e => setEditingHotel({...editingHotel, pricePerNight: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xl italic text-green-600" />
                                  </div>
                                  <div className="space-y-1.5">
                                     <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Rating</label>
                                     <Input type="number" step="0.1" value={editingHotel?.rating} onChange={e => setEditingHotel({...editingHotel, rating: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xl italic text-amber-500" />
                                  </div>
                               </div>

                               <div className="space-y-1.5">
                                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Complete Address</label>
                                  <Input value={editingHotel?.address} onChange={e => setEditingHotel({...editingHotel, address: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold uppercase" />
                               </div>
                            </div>
                         </div>
                         <div className="p-8 bg-muted/5 border-t shrink-0">
                            <Button onClick={handleUpdateHotel} disabled={isProcessing} className="w-full h-18 bg-primary hover:bg-black text-white rounded-[2rem] font-black uppercase italic text-lg shadow-xl transition-all">
                               {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : "UPDATE HOTEL MASTER"}
                            </Button>
                         </div>
                      </DialogContent>
                   </Dialog>
                   <button onClick={() => handleDeleteHotel(hotel.id)} className="h-12 w-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center border border-red-100"><Trash2 className="h-5 w-5" /></button>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
