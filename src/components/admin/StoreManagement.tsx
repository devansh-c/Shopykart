
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, deleteDoc, writeBatch } from 'firebase/firestore';
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
  PowerOff
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

export function StoreManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStore, setEditingStore] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Fetch Live Stores
  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendors'), orderBy('updatedAt', 'desc'));
  }, [firestore]);

  const { data: vendors, loading } = useCollection<any>(vendorsQuery);

  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    return vendors.filter(v => 
      v.storeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.phone?.includes(searchQuery) ||
      v.town?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [vendors, searchQuery]);

  const handleToggleStatus = async (id: string, online: boolean) => {
    if (!firestore) return;
    try {
      const ref = doc(firestore, 'vendors', id);
      await updateDoc(ref, { 
        isOnline: online,
        updatedAt: new Date()
      });
      toast({ 
        title: online ? "Store Opened" : "Store Closed",
        description: online ? "Customers can now order from this store." : "Store is now marked as closed."
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
        storeName: editingStore.storeName,
        phone: editingStore.phone,
        category: editingStore.category,
        town: editingStore.town,
        updatedAt: new Date()
      });
      setIsEditOpen(false);
      toast({ title: "Store Updated", description: "Business details saved successfully." });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm("Are you sure? This will remove the store permanently.")) {
      await deleteDoc(doc(firestore, 'vendors', id));
      toast({ title: "Store Removed", description: "Vendor has been deactivated." });
    }
  };

  const handleBulkStatus = async (online: boolean) => {
    if (!firestore || !vendors || vendors.length === 0) return;
    
    const confirmMsg = online 
      ? "Do you want to OPEN ALL stores in the network?" 
      : "CRITICAL: Do you want to CLOSE ALL stores in the network immediately?";
    
    if (!confirm(confirmMsg)) return;

    setIsBulkUpdating(true);
    try {
      const batch = writeBatch(firestore);
      
      vendors.forEach((store) => {
        const ref = doc(firestore, 'vendors', store.id);
        batch.update(ref, { isOnline: online, updatedAt: new Date() });
      });

      await batch.commit();
      toast({ 
        title: online ? "All Stores Opened" : "All Stores Closed", 
        description: `Successfully updated ${vendors.length} stores.`,
        variant: online ? "default" : "destructive"
      });
    } catch (err) {
      console.error("Bulk update error:", err);
      toast({ variant: "destructive", title: "Bulk Update Failed" });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Master Bulk Control */}
      <div className="bg-[#0B0B0B] p-6 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
             <div className="bg-primary/20 p-3 rounded-2xl border border-primary/20">
                <Power className="h-6 w-6 text-primary" />
             </div>
             <div>
                <h3 className="text-white font-black italic uppercase tracking-tighter text-lg">Master Network Control</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Control all {vendors?.length || 0} stores with one click</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
             <Button 
              disabled={isBulkUpdating}
              onClick={() => handleBulkStatus(true)}
              className="flex-1 md:flex-none h-12 rounded-xl bg-green-600 hover:bg-green-500 font-black uppercase italic text-[10px] tracking-widest"
             >
               {isBulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4 mr-2" />}
               OPEN ALL STORES
             </Button>
             <Button 
              disabled={isBulkUpdating}
              onClick={() => handleBulkStatus(false)}
              className="flex-1 md:flex-none h-12 rounded-xl bg-red-600 hover:bg-red-500 font-black uppercase italic text-[10px] tracking-widest"
             >
               {isBulkUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <PowerOff className="h-4 w-4 mr-2" />}
               CLOSE ALL STORES
             </Button>
          </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-32 bg-primary/5 -skew-x-12 translate-x-10" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pt-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-800">Store Directory</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Monitor and Edit Live Vendors</p>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredVendors.length > 0 ? (
          filteredVendors.map((store: any) => (
            <div key={store.id} className="bg-white rounded-[2.5rem] p-6 border border-border/50 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative flex flex-col">
              <div className="absolute top-0 right-0 p-4 flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-2 py-1.5 rounded-xl shadow-sm border border-border/50">
                  <span className={cn("text-[8px] font-black uppercase tracking-widest", store.isOnline !== false ? "text-green-600" : "text-gray-400")}>
                    {store.isOnline !== false ? 'Open' : 'Closed'}
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
                   {store.imageUrl ? (
                     <img src={store.imageUrl} className="h-full w-full object-cover" alt="" />
                   ) : (
                     <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground uppercase font-black">{store.storeName?.charAt(0)}</div>
                   )}
                </div>
                <div>
                  <h3 className="font-black text-lg italic uppercase tracking-tighter leading-tight mb-1 truncate max-w-[120px]">{store.storeName}</h3>
                  <div className="flex items-center gap-2">
                     <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{store.category}</span>
                     <span className="h-1 w-1 bg-gray-300 rounded-full" />
                     <span className="text-[9px] font-black uppercase text-primary tracking-widest italic">{store.town}</span>
                  </div>
                </div>
              </div>

              <div className="bg-muted/30 rounded-2xl p-4 space-y-3 mb-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                       <User className="h-3.5 w-3.5 text-primary" />
                       {store.firstName || 'Owner'} {store.lastName || ''}
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => window.open(`tel:${store.phone}`)}
                         className="p-2.5 bg-green-500 text-white rounded-xl shadow-lg shadow-green-500/20 active:scale-90 transition-all"
                       >
                         <PhoneCall className="h-3.5 w-3.5" />
                       </button>
                       <button 
                         onClick={() => window.open(`https://wa.me/91${store.phone}`)}
                         className="p-2.5 bg-green-50 text-green-600 rounded-xl active:scale-90 transition-all"
                       >
                         <MessageCircle className="h-3.5 w-3.5" />
                       </button>
                    </div>
                 </div>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground truncate">
                    <MapPin className="h-3 w-3 text-primary shrink-0" />
                    {store.address || 'Address not set'}
                 </div>
              </div>

              <div className="mt-auto flex gap-3">
                 <Dialog open={isEditOpen && editingStore?.id === store.id} onOpenChange={(val) => { setIsEditOpen(val); if(val) setEditingStore(store); }}>
                    <DialogTrigger asChild>
                       <Button variant="outline" className="flex-1 rounded-2xl h-12 font-black uppercase italic text-[10px] tracking-widest border-primary/20 text-primary hover:bg-primary/5">
                          <Edit className="h-3.5 w-3.5 mr-2" />
                          EDIT STORE
                       </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] max-w-sm">
                       <DialogHeader>
                          <DialogTitle className="font-black italic uppercase text-center text-xl">Modify Store</DialogTitle>
                       </DialogHeader>
                       <div className="space-y-4 pt-4">
                          <div className="space-y-1">
                             <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Business Name</label>
                             <Input 
                               value={editingStore?.storeName} 
                               onChange={e => setEditingStore({...editingStore, storeName: e.target.value})}
                               className="h-12 rounded-xl bg-muted/20 border-none font-bold"
                             />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Contact Number</label>
                             <Input 
                               value={editingStore?.phone} 
                               onChange={e => setEditingStore({...editingStore, phone: e.target.value.replace(/\D/g,'').slice(0, 10)})}
                               className="h-12 rounded-xl bg-muted/20 border-none font-bold"
                             />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Category</label>
                                <Select value={editingStore?.category} onValueChange={v => setEditingStore({...editingStore, category: v})}>
                                   <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold"><SelectValue /></SelectTrigger>
                                   <SelectContent className="rounded-2xl border-none shadow-2xl">
                                      <SelectItem value="Food">Food</SelectItem>
                                      <SelectItem value="Grocery">Grocery</SelectItem>
                                   </SelectContent>
                                </Select>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Town / Zone</label>
                                <Select value={editingStore?.town} onValueChange={v => setEditingStore({...editingStore, town: v})}>
                                   <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold"><SelectValue /></SelectTrigger>
                                   <SelectContent className="rounded-2xl border-none shadow-2xl">
                                      <SelectItem value="Ranipur">Ranipur</SelectItem>
                                      <SelectItem value="Mauranipur">Mauranipur</SelectItem>
                                   </SelectContent>
                                </Select>
                             </div>
                          </div>
                          <Button onClick={handleUpdateStore} className="w-full h-14 bg-primary rounded-2xl font-black uppercase italic shadow-xl shadow-primary/20 mt-4">
                             <Check className="h-5 w-5 mr-2" />
                             SAVE CHANGES
                          </Button>
                       </div>
                    </DialogContent>
                 </Dialog>

                 <Button 
                   variant="ghost" 
                   size="icon"
                   onClick={() => handleDelete(store.id)}
                   className="h-12 w-12 rounded-2xl text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                 >
                    <Trash2 className="h-4 w-4" />
                 </Button>
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
