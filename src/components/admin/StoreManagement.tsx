
"use client"

import { useState, useEffect, useMemo } from 'react';
import { 
  Store, 
  Edit, 
  Trash2, 
  Search, 
  Loader2, 
  Globe, 
  Plus, 
  Clock, 
  Star, 
  Phone, 
  KeyRound, 
  Fingerprint, 
  Power, 
  ShieldCheck,
  MapPin,
  Save,
  X,
  Navigation,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { cn, slugify } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';
import dynamic from 'next/dynamic';

const GoogleMapPicker = dynamic(() => import('@/components/shared/GoogleMapPicker'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-muted animate-pulse rounded-2xl flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
});

const TIME_SLOTS = [
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM",
  "08:00 PM", "08:15 PM", "08:30 PM", "09:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"
];

export default function StoreManagement({ categoryFilter }: { categoryFilter?: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStore, setEditingStore] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [storeToPin, setStoreToPin] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTimeMins, setCurrentTimeMins] = useState<number | null>(null);

  useEffect(() => {
    const syncTime = () => {
      const now = new Date();
      setCurrentTimeMins(now.getHours() * 60 + now.getMinutes());
    };
    syncTime();
    const interval = setInterval(syncTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);

  const { data: vendors, loading } = useCollection<any>(vendorsQuery, 'admin_vendors_list');

  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    return vendors.filter(v => {
      const matchesSearch = v.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           v.storeId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || v.category === categoryFilter;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }, [vendors, searchQuery, categoryFilter]);

  const handleUpdateStore = async () => {
    if (!firestore || !editingStore) return;
    setIsProcessing(true);
    try {
      const finalSlug = slugify(editingStore.storeName);
      await updateDoc(doc(firestore, 'vendors', editingStore.id), {
        storeName: editingStore.storeName,
        slug: finalSlug,
        phone: editingStore.phone || '',
        rating: parseFloat(editingStore.rating) || 4.0,
        openingTime: editingStore.openingTime || '10:00 AM',
        closingTime: editingStore.closingTime || '08:15 PM',
        isOnline: editingStore.isOnline !== false,
        updatedAt: serverTimestamp()
      });
      setIsEditOpen(false);
      toast({ title: "Store Updated", description: "Configuration saved successfully." });
    } catch (err) { toast({ variant: "destructive", title: "Update Failed" }); }
    finally { setIsProcessing(false); }
  };

  const handleConfirmLocation = async (lat: number, lng: number, address?: string) => {
    if (!firestore || !storeToPin) return;
    setIsProcessing(true);
    try {
      await updateDoc(doc(firestore, 'vendors', storeToPin.id), {
        lat,
        lng,
        storeGeocodedAddress: address || '',
        updatedAt: serverTimestamp()
      });
      setIsMapOpen(false);
      setStoreToPin(null);
      toast({ title: "Location Pinned! ✅", description: "Coordinates locked for delivery routing." });
    } catch (err) {
      toast({ variant: "destructive", title: "Pinning Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleOnline = async (id: string, currentStatus: boolean) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'vendors', id), { isOnline: !currentStatus, updatedAt: serverTimestamp() });
      toast({ title: !currentStatus ? "Manual Override: ON 🟢" : "Manual Override: OFF 🔴" });
    } catch (e) {}
  };

  const handleDeleteStore = async (id: string) => {
    if (!firestore) return;
    if (confirm("Khatarnak Alert: Kya aap wakayi is store ko delete karna chahte hain?")) {
      await deleteDoc(doc(firestore, 'vendors', id));
      toast({ title: "Store Deleted Permanently" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0B0B0B] p-8 rounded-[3rem] text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
             <h2 className="text-3xl font-black italic uppercase tracking-tighter">Partner Control</h2>
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Direct logistics management</p>
          </div>
          <div className="relative w-full md:w-80">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
             <Input placeholder="Search ID or Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 h-14 bg-white/5 border-white/10 text-white rounded-2xl font-bold" />
          </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-44 bg-primary/5 -skew-x-12 translate-x-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !vendors ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : filteredVendors.map((store: any) => {
          const isOpenByTime = isStoreScheduleOpen(store, currentTimeMins);
          const isEffectivelyOpen = store.isOnline !== false && isOpenByTime;
          const hasLocation = store.lat && store.lng;

          return (
            <div key={store.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-border/50 shadow-sm hover:shadow-xl transition-all group flex flex-col relative transform-gpu">
              {/* PIN LOCATION OVERLAY FOR MISSING DATA */}
              {!hasLocation && (
                <button 
                  onClick={() => { setStoreToPin(store); setIsMapOpen(true); }}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 flex items-center justify-center gap-2 transition-all active:scale-95 z-20"
                >
                  <MapPin className="h-4 w-4 animate-bounce" />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">Set Store Location Hub</span>
                </button>
              )}

              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-primary/10 bg-muted shrink-0 shadow-inner">
                        <img src={store.imageUrl} className="h-full w-full object-cover" alt="" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-xl italic uppercase tracking-tighter truncate leading-none mb-1">{store.storeName}</h3>
                        <div className="flex items-center gap-2">
                            <Badge className={cn("border-none text-[7px] font-black uppercase px-2", isEffectivelyOpen ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                              {isEffectivelyOpen ? 'LIVE' : 'CLOSED'}
                            </Badge>
                            <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-lg">
                              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                              <span className="text-[10px] font-black text-amber-700">{store.rating || '4.0'}</span>
                            </div>
                        </div>
                      </div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                      <span className="text-[6px] font-black text-gray-400 uppercase">Override</span>
                      <Switch checked={store.isOnline !== false} onCheckedChange={() => handleToggleOnline(store.id, store.isOnline !== false)} className="data-[state=checked]:bg-green-500 scale-90" />
                  </div>
                </div>

                <div className="bg-muted/30 rounded-[2rem] p-5 space-y-4 mb-6 border border-border/40 flex-1">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Login ID</span>
                        <div className="flex items-center gap-2 text-gray-800"><Fingerprint className="h-3.5 w-3.5 text-primary" /><span className="text-xs font-black uppercase tracking-tight">{store.storeId}</span></div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Access Key</span>
                        <div className="flex items-center gap-2 text-gray-800"><KeyRound className="h-3.5 w-3.5 text-blue-500" /><span className="text-xs font-black tracking-widest">{store.password || '••••••'}</span></div>
                      </div>
                  </div>

                  <div className="pt-3 border-t border-white flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-green-500" /><span className="text-xs font-bold text-gray-700">{store.phone || 'No Phone'}</span></div>
                         <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-amber-500" /><span className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">{store.openingTime} - {store.closingTime}</span></div>
                      </div>
                      {hasLocation && (
                        <div className="flex items-center gap-2 pt-2 border-t border-white/50">
                           <CheckCircle2 className="h-3 w-3 text-green-500" />
                           <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Hub Location Pinned</span>
                        </div>
                      )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Dialog open={isEditOpen && editingStore?.id === store.id} onOpenChange={(val) => { setIsEditOpen(val); if(val) setEditingStore({...store}); }}>
                      <DialogTrigger asChild>
                        <Button className="flex-1 h-12 bg-black hover:bg-primary text-white rounded-2xl font-black uppercase italic text-[10px] tracking-widest shadow-xl transition-all"><Edit className="h-3.5 w-3.5 mr-2" /> MODIFY SETTINGS</Button>
                      </DialogTrigger>
                      <DialogContent className="rounded-[2.5rem] max-w-md p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh]">
                        <DialogHeader className="p-8 pb-4">
                            <DialogTitle className="font-black italic uppercase text-center text-2xl tracking-tighter">Schedule Sync</DialogTitle>
                        </DialogHeader>
                        <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-0 space-y-6">
                            <div className="space-y-4">
                              <div className="space-y-1">
                                  <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Business Name</label>
                                  <Input value={editingStore?.storeName} onChange={e => setEditingStore({...editingStore, storeName: e.target.value})} className="h-14 rounded-2xl bg-muted/20 border-none font-bold text-lg" />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Opening Time</label>
                                    <Select value={editingStore?.openingTime} onValueChange={(val) => setEditingStore({...editingStore, openingTime: val})}>
                                        <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl">{TIME_SLOTS.map(t => <SelectItem key={t} value={t} className="font-bold text-xs">{t}</SelectItem>)}</SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Closing Time</label>
                                    <Select value={editingStore?.closingTime} onValueChange={(val) => setEditingStore({...editingStore, closingTime: val})}>
                                        <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold"><SelectValue /></SelectTrigger>
                                        <SelectContent className="rounded-2xl">{TIME_SLOTS.map(t => <SelectItem key={t} value={t} className="font-bold text-xs">{t}</SelectItem>)}</SelectContent>
                                    </Select>
                                  </div>
                              </div>
                              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                                  <span className="text-xs font-black uppercase">Enable Manual Overide?</span>
                                  <Switch checked={editingStore?.isOnline !== false} onCheckedChange={(val) => setEditingStore({...editingStore, isOnline: val})} />
                              </div>
                            </div>
                        </div>
                        <div className="p-8 bg-muted/5 border-t">
                            <Button onClick={handleUpdateStore} disabled={isProcessing} className="w-full h-18 bg-primary hover:bg-black text-white rounded-[2rem] font-black uppercase italic text-lg shadow-xl transition-all">
                              {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : "SAVE CONFIGURATION"}
                            </Button>
                        </div>
                      </DialogContent>
                  </Dialog>
                  <Button onClick={() => handleDeleteStore(store.id)} variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 className="h-4.5 w-4.5" /></Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* GLOBAL MAP DIALOG FOR PINNING */}
      <Dialog open={isMapOpen} onOpenChange={(val) => { setIsMapOpen(val); if(!val) setStoreToPin(null); }}>
         <DialogContent className="rounded-none sm:rounded-[3rem] max-w-2xl h-full sm:h-[85vh] p-0 overflow-hidden border-none shadow-2xl focus:outline-none flex flex-col">
            <div className="flex-1 min-h-0 relative">
               <GoogleMapPicker onConfirm={handleConfirmLocation} />
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
