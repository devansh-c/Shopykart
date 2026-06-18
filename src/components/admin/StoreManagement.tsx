
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, deleteDoc, writeBatch, serverTimestamp, where, getDocs, setDoc } from 'firebase/firestore';
import { 
  Store, 
  User, 
  MapPin, 
  Trash2, 
  Loader2, 
  MessageCircle,
  Edit,
  PhoneCall,
  Search,
  Check,
  Power,
  PowerOff,
  Fingerprint,
  Lock,
  KeyRound,
  HeartPulse
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export function StoreManagement({ categoryFilter }: { categoryFilter?: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStore, setEditingStore] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Fetch Live Stores
  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let baseQuery = collection(firestore, 'vendors');
    if (categoryFilter) {
      return query(baseQuery, where('category', '==', categoryFilter), orderBy('updatedAt', 'desc'));
    }
    return query(baseQuery, orderBy('updatedAt', 'desc'));
  }, [firestore, categoryFilter]);

  const { data: vendors, loading } = useCollection<any>(vendorsQuery);

  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    return vendors.filter(v => 
      v.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone?.includes(searchQuery) ||
      v.town?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.storeId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vendors, searchQuery]);

  const handleToggleStatus = async (id: string, online: boolean) => {
    if (!firestore) return;
    try {
      // NUCLEAR OPTIMIZATION: Immediate direct update to store status 
      // followed by a background atomic batch for products to eliminate lag.
      await updateDoc(doc(firestore, 'vendors', id), { isOnline: online, updatedAt: serverTimestamp() });
      
      const batch = writeBatch(firestore);
      const productsQuery = query(collection(firestore, 'products'), where('vendorId', '==', id));
      const productsSnap = await getDocs(productsQuery);
      
      productsSnap.docs.forEach(pDoc => {
        batch.update(pDoc.ref, { isAvailable: online, updatedAt: serverTimestamp() });
        batch.set(doc(firestore, 'vendors', id, 'products', pDoc.id), { isAvailable: online, updatedAt: serverTimestamp() }, { merge: true });
      });

      await batch.commit();
      
      toast({ 
        title: online ? "Store Online 🟢" : "Store Offline 🔴",
        description: online ? "Accepting orders now!" : "Store is now hidden."
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleUpdateStore = async () => {
    if (!firestore || !editingStore) return;
    try {
      const ref = doc(firestore, 'vendors', editingStore.id);
      await updateDoc(ref, {
        storeName: editingStore.storeName || '',
        phone: editingStore.phone || '',
        category: editingStore.category || 'Food',
        town: editingStore.town || 'Local',
        storeId: editingStore.storeId?.trim().toLowerCase() || '',
        password: editingStore.password || '',
        updatedAt: serverTimestamp()
      });
      setIsEditOpen(false);
      toast({ title: "Store Updated" });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm("Are you sure? This will remove the store permanently.")) {
      await deleteDoc(doc(firestore, 'vendors', id));
      toast({ title: "Store Removed" });
    }
  };

  const handleBulkStatus = async (online: boolean) => {
    if (!firestore || !vendors || vendors.length === 0) return;
    
    if (!confirm(online ? "Open all stores in this list?" : "Close all stores in this list immediately?")) return;

    setIsBulkUpdating(true);
    try {
      const batch = writeBatch(firestore);
      
      for (const store of vendors) {
        batch.update(doc(firestore, 'vendors', store.id), { isOnline: online, updatedAt: serverTimestamp() });
      }

      await batch.commit();

      // Background product sync
      const productsQuery = query(collection(firestore, 'products'));
      const productsSnap = await getDocs(productsQuery);
      const productBatch = writeBatch(firestore);
      
      const vendorIds = vendors.map(v => v.id);
      productsSnap.docs.forEach(pDoc => {
        if (vendorIds.includes(pDoc.data().vendorId)) {
          productBatch.update(pDoc.ref, { isAvailable: online, updatedAt: serverTimestamp() });
        }
      });
      await productBatch.commit();

      toast({ title: online ? "Stores Opened! 🟢" : "Stores Closed! 🔴" });
    } catch (err) {
      console.error("Bulk sync error:", err);
      toast({ variant: "destructive", title: "Bulk Sync Failed" });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0B0B0B] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden transform-gpu">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="bg-primary/20 p-3 rounded-2xl border border-primary/20">
                {categoryFilter === 'Medical' ? <HeartPulse className="h-6 w-6 text-primary" /> : <Power className="h-6 w-6 text-primary" />}
             </div>
             <div>
                <h3 className="text-white font-black italic uppercase tracking-tighter text-lg">{categoryFilter ? `${categoryFilter} Control` : 'Network Master'}</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Instant control for {vendors?.length || 0} vendors</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <Button 
              disabled={isBulkUpdating}
              onClick={() => handleBulkStatus(true)}
              className="flex-1 md:flex-none h-12 rounded-xl bg-green-600 hover:bg-green-500 font-black uppercase italic text-[10px] tracking-widest shadow-lg shadow-green-900/20"
             >
               {isBulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4 mr-2" />}
               OPEN ALL
             </Button>
             <Button 
              disabled={isBulkUpdating}
              onClick={() => handleBulkStatus(false)}
              className="flex-1 md:flex-none h-12 rounded-xl bg-red-600 hover:bg-red-500 font-black uppercase italic text-[10px] tracking-widest shadow-lg shadow-red-900/20"
             >
               {isBulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PowerOff className="h-4 w-4 mr-2" />}
               CLOSE ALL
             </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-32 bg-primary/5 -skew-x-12 translate-x-10" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pt-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search stores..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-white border-none shadow-sm font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
        {loading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredVendors.length > 0 ? (
          filteredVendors.map((store: any) => (
            <div key={store.id} className="bg-white rounded-[2.5rem] p-6 border border-border/50 shadow-sm hover:shadow-xl transition-all transform-gpu flex flex-col">
              <div className="absolute top-0 right-0 p-4 flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-2 py-1.5 rounded-xl shadow-sm border border-border/50">
                  <span className={cn("text-[8px] font-black uppercase tracking-widest", store.isOnline !== false ? "text-green-600" : "text-gray-400")}>
                    {store.isOnline !== false ? 'Live' : 'Off'}
                  </span>
                  <Switch 
                    checked={store.isOnline !== false} 
                    onCheckedChange={(val) => handleToggleStatus(store.id, val)}
                    className="scale-75 data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 mb-6 mt-4">
                <div className="h-16 w-16 rounded-2xl overflow-hidden bg-muted border-2 border-primary/10">
                   {store.imageUrl ? <img src={store.imageUrl} className="h-full w-full object-cover" alt="" /> : <Store className="h-7 w-7 m-auto opacity-20" />}
                </div>
                <div>
                  <h3 className="font-black text-lg italic uppercase tracking-tighter leading-tight mb-1 truncate max-w-[120px]">{store.storeName}</h3>
                  <span className="text-[9px] font-black uppercase text-primary tracking-widest italic">{store.town}</span>
                </div>
              </div>

              <div className="bg-[#0B0B0B] rounded-2xl p-4 mb-4 border border-white/5 space-y-2">
                <div className="flex items-center gap-3">
                   <div className="p-1.5 rounded-lg bg-white/5 text-gray-400"><Fingerprint className="h-3 w-3" /></div>
                   <div className="flex flex-col">
                      <span className="text-[7px] font-bold text-gray-500 uppercase">STORE ID</span>
                      <span className="text-[11px] font-black text-white italic tracking-widest uppercase">{store.storeId || 'EMAIL LOGIN'}</span>
                   </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="p-1.5 rounded-lg bg-white/5 text-gray-400"><Lock className="h-3 w-3" /></div>
                   <div className="flex flex-col">
                      <span className="text-[7px] font-bold text-gray-500 uppercase">PASSWORD</span>
                      <span className="text-[11px] font-black text-white tracking-widest uppercase">{store.password || '••••••••'}</span>
                   </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-2xl p-4 space-y-3 mb-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                       <User className="h-3.5 w-3.5 text-primary" />
                       {store.firstName || 'Owner'}
                    </div>
                    <button onClick={() => window.open(`tel:${store.phone}`)} className="p-2.5 bg-green-500 text-white rounded-xl shadow-lg active:scale-90 transition-all"><PhoneCall className="h-3.5 w-3.5" /></button>
                 </div>
              </div>

              <div className="mt-auto flex gap-3">
                 <Dialog open={isEditOpen && editingStore?.id === store.id} onOpenChange={(val) => { setIsEditOpen(val); if(val) setEditingStore(store); }}>
                    <DialogTrigger asChild>
                       <Button variant="outline" className="flex-1 rounded-2xl h-12 font-black uppercase italic text-[10px] tracking-widest border-primary/20 text-primary">
                          <Edit className="h-3.5 w-3.5 mr-2" /> EDIT ACCESS
                       </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] max-w-sm">
                       <DialogHeader><DialogTitle className="font-black italic uppercase text-center text-xl">Modify Store Access</DialogTitle></DialogHeader>
                       <div className="space-y-4 pt-4">
                          <div className="space-y-1">
                             <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Business Name</label>
                             <Input value={editingStore?.storeName || ''} onChange={e => setEditingStore({...editingStore, storeName: e.target.value})} className="h-12 rounded-xl bg-muted/20 border-none font-bold" />
                          </div>
                          <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-3">
                             <Input value={editingStore?.storeId || ''} onChange={e => setEditingStore({...editingStore, storeId: e.target.value.replace(/\s/g, '')})} placeholder="Store ID" className="h-12 rounded-xl font-black italic text-primary uppercase" />
                             <Input value={editingStore?.password || ''} onChange={e => setEditingStore({...editingStore, password: e.target.value})} placeholder="Password" className="h-12 rounded-xl font-black tracking-widest" />
                          </div>
                          <Button onClick={handleUpdateStore} className="w-full h-14 bg-primary rounded-2xl font-black uppercase italic shadow-xl">SAVE MASTER UPDATES</Button>
                       </div>
                    </DialogContent>
                 </Dialog>

                 <Button variant="ghost" size="icon" onClick={() => handleDelete(store.id)} className="h-12 w-12 rounded-2xl text-red-500 bg-red-50 hover:bg-red-100 transition-colors"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
            <Store className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No matching stores found</p>
          </div>
        )}
      </div>
    </div>
  );
}
