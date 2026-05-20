
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, deleteDoc, setDoc } from 'firebase/firestore';
import { 
  Store, 
  User, 
  Phone, 
  MapPin, 
  CheckCircle, 
  Trash2, 
  Loader2, 
  Utensils, 
  ShoppingBag,
  MessageCircle,
  Mail,
  Map as MapIcon,
  Edit,
  PhoneCall,
  Search,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function StoreManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingStore, setEditingStore] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Fetch Live Stores instead of Applications
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-800">Store Management</h2>
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
              <div className="absolute top-0 right-0 p-4 flex gap-2">
                <Badge className={cn("text-[8px] font-black uppercase tracking-widest border-none", store.isOnline !== false ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500")}>
                  {store.isOnline !== false ? 'Online' : 'Offline'}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-2xl overflow-hidden bg-muted border-2 border-primary/10">
                   <img src={store.imageUrl || `https://picsum.photos/seed/${store.id}/100/100`} className="h-full w-full object-cover" alt="" />
                </div>
                <div>
                  <h3 className="font-black text-lg italic uppercase tracking-tighter leading-tight mb-1 truncate max-w-[150px]">{store.storeName}</h3>
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

