"use client"

import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  MapPin, 
  Trash2, 
  Check, 
  X, 
  Building2, 
  IndianRupee, 
  ShoppingBag, 
  Edit,
  Loader2,
  AlertTriangle,
  Globe,
  Navigation,
  MousePointer2,
  Eraser,
  Store,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, query, where, writeBatch, getDocs } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';

const ZoneMapDrawing = dynamic(() => import('./ZoneMapDrawing'), { 
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-muted flex items-center justify-center rounded-3xl animate-pulse">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" />
    </div>
  )
});

export function ZoneManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'zones');
  }, [firestore]);

  const { data: zones, loading } = useCollection<any>(zonesQuery);

  // Fetch all vendors to assign them to zones
  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isStoreAssignOpen, setIsStoreAssignOpen] = useState(false);
  const [selectedZoneForStores, setSelectedZoneForStores] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [boundaryPoints, setBoundaryPoints] = useState<[number, number][]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    pincodes: '',
    minOrder: '0',
    deliveryCharge: '0',
    isActive: true
  });

  const handleMapUpdate = (points: [number, number][]) => {
    setBoundaryPoints(points);
  };

  const handleSave = async () => {
    if (!firestore) return;
    if (!formData.name) {
      toast({ variant: "destructive", title: "Required Field", description: "Zone Name is mandatory." });
      return;
    }

    const boundaryData = boundaryPoints.map(p => ({
      lat: p[0],
      lng: p[1]
    }));

    const zoneData = {
      name: formData.name.trim(),
      city: formData.city.trim() || 'Local',
      pincodes: formData.pincodes ? formData.pincodes.split(',').map(p => p.trim()).filter(p => p.length > 0) : [],
      boundary: boundaryData, 
      minOrder: parseFloat(formData.minOrder) || 0,
      deliveryCharge: parseFloat(formData.deliveryCharge) || 0,
      isActive: formData.isActive === true,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingId) {
        await updateDoc(doc(firestore, 'zones', editingId), zoneData);
        toast({ title: "Zone Updated" });
      } else {
        await addDoc(collection(firestore, 'zones'), { 
          ...zoneData, 
          createdAt: serverTimestamp() 
        });
        toast({ title: "Zone Created" });
      }
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      console.error("Zone Save Error:", err);
      toast({ variant: "destructive", title: "Save Failed", description: "Database error occurred." });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', city: '', pincodes: '', minOrder: '0', deliveryCharge: '0', isActive: true });
    setBoundaryPoints([]);
    setEditingId(null);
  };

  const handleEdit = (zone: any) => {
    setFormData({
      name: zone.name || '',
      city: zone.city || '',
      pincodes: Array.isArray(zone.pincodes) ? zone.pincodes.join(', ') : '',
      minOrder: (zone.minOrder || 0).toString(),
      deliveryCharge: (zone.deliveryCharge || 0).toString(),
      isActive: zone.isActive !== false
    });
    
    const pts = Array.isArray(zone.boundary) 
      ? zone.boundary.map((p: any) => [p.lat, p.lng] as [number, number]) 
      : [];
    setBoundaryPoints(pts);
    
    setEditingId(zone.id);
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm("Delete this zone? This will affect product availability.")) {
      await deleteDoc(doc(firestore, 'zones', id));
      toast({ title: "Zone Removed" });
    }
  };

  const handleToggleStoreAssignment = async (vendorId: string, currentZoneId: string | null) => {
    if (!firestore || !selectedZoneForStores || isProcessing) return;

    setIsProcessing(true);
    try {
      const vendorRef = doc(firestore, 'vendors', vendorId);
      // If store is already in THIS zone, remove it (set to null), otherwise assign to THIS zone
      const isCurrentlyAssigned = currentZoneId === selectedZoneForStores.id;
      const newZoneId = isCurrentlyAssigned ? null : selectedZoneForStores.id;
      const newTown = isCurrentlyAssigned ? 'Local' : (selectedZoneForStores.city || selectedZoneForStores.name);
      
      await updateDoc(vendorRef, { 
        zoneId: newZoneId,
        town: newTown,
        updatedAt: serverTimestamp()
      });

      // Update all products of this vendor to match the new zone and town
      const productsQuery = query(collection(firestore, 'products'), where('vendorId', '==', vendorId));
      const productsSnap = await getDocs(productsQuery);
      const batch = writeBatch(firestore);
      
      productsSnap.docs.forEach(pDoc => {
        batch.update(pDoc.ref, { 
          zoneId: newZoneId,
          town: newTown 
        });
      });
      
      await batch.commit();

      toast({ 
        title: newZoneId ? "Store Assigned" : "Store Removed", 
        description: `${vendors?.find(v => v.id === vendorId)?.storeName} updated to ${newTown}.` 
      });
    } catch (err) {
      console.error("Assignment Error:", err);
      toast({ variant: "destructive", title: "Assignment Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-black italic uppercase text-gray-800">Map Zone Control</h2>
          <p className="text-xs text-muted-foreground font-bold">Define precise delivery boundaries</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#0B0B0B] hover:bg-primary rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Draw Serving Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] max-w-2xl overflow-hidden p-0 flex flex-col h-[90vh]">
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="font-black italic uppercase text-center">{editingId ? 'Modify Boundary' : 'Create Map Zone'}</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-2 space-y-6">
              <div className="space-y-3">
                 <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase text-primary flex items-center gap-1.5">
                       <Navigation className="h-3 w-3" /> Mark Area on Map
                    </label>
                 </div>
                 
                 <div className="h-[300px] w-full bg-muted rounded-3xl overflow-hidden border-4 border-muted/20 relative">
                    <ZoneMapDrawing 
                      points={boundaryPoints} 
                      onUpdate={handleMapUpdate} 
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Zone Name</label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Ranipur North" className="h-12 rounded-xl font-bold" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">City</label>
                    <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Ranipur" className="h-12 rounded-xl font-bold" />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Legacy Pincode Support (Optional)</label>
                 <Input value={formData.pincodes} onChange={e => setFormData({...formData, pincodes: e.target.value})} placeholder="284205" className="h-12 rounded-xl font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Min. Order (₹)</label>
                    <Input type="number" value={formData.minOrder} onChange={e => setFormData({...formData, minOrder: e.target.value})} className="h-12 rounded-xl font-bold" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Delivery Fee (₹)</label>
                    <Input type="number" value={formData.deliveryCharge} onChange={e => setFormData({...formData, deliveryCharge: e.target.value})} className="h-12 rounded-xl font-bold" />
                 </div>
              </div>

              <div className="flex items-center justify-between bg-muted/20 p-4 rounded-2xl">
                 <div className="flex flex-col">
                    <span className="text-xs font-black uppercase">Active Serving</span>
                    <span className="text-[8px] font-bold text-muted-foreground">Is this zone accepting orders?</span>
                 </div>
                 <Switch checked={formData.isActive} onCheckedChange={(val) => setFormData({...formData, isActive: val})} />
              </div>
            </div>

            <div className="p-6 bg-muted/5 border-t">
               <Button onClick={handleSave} className="w-full bg-primary h-16 rounded-[2rem] font-black uppercase italic shadow-xl shadow-primary/20 text-lg">
                 {editingId ? 'UPDATE BOUNDARY' : 'SAVE MAP ZONE'}
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !zones ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : zones && zones.length > 0 ? (
          zones.map((zone) => {
            const assignedStoresCount = vendors?.filter(v => v.zoneId === zone.id).length || 0;
            
            return (
              <div key={zone.id} className={cn(
                "bg-white p-6 rounded-[2.5rem] border-2 transition-all relative overflow-hidden group flex flex-col",
                zone.isActive ? "border-green-100 shadow-sm" : "border-gray-100 grayscale opacity-60"
              )}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black italic uppercase tracking-tighter text-lg leading-tight">{zone.name}</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-[9px] font-black text-muted-foreground uppercase">{zone.city}</span>
                       {zone.boundary && Array.isArray(zone.boundary) && zone.boundary.length > 0 && (
                         <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[8px] px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                            <MousePointer2 className="h-2 w-2" /> Map Marked
                         </Badge>
                       )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
                         <span className="text-[8px] font-black uppercase text-blue-700 block mb-1">Min Order</span>
                         <p className="text-sm font-black italic">₹{zone.minOrder}</p>
                      </div>
                      <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100/50">
                         <span className="text-[8px] font-black uppercase text-amber-700 block mb-1">Delivery</span>
                         <p className="text-sm font-black italic">₹{zone.deliveryCharge || 0}</p>
                      </div>
                   </div>

                   <div className="bg-muted/30 p-3 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <Store className="h-3.5 w-3.5 text-gray-400" />
                         <span className="text-[10px] font-black uppercase text-gray-500">{assignedStoresCount} Stores Assigned</span>
                      </div>
                      <button 
                        onClick={() => { setSelectedZoneForStores(zone); setIsStoreAssignOpen(true); }}
                        className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline underline-offset-4"
                      >
                        MANAGE
                      </button>
                   </div>
                </div>

                <div className="mt-auto flex gap-3">
                   <Button onClick={() => handleEdit(zone)} variant="outline" className="flex-1 rounded-xl h-10 font-black uppercase text-[10px] border-primary/20 text-primary">EDIT</Button>
                   <Button onClick={() => handleDelete(zone.id)} variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-red-50 text-red-500"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No zones marked yet</p>
          </div>
        )}
      </div>

      {/* Store Assignment Dialog */}
      <Dialog open={isStoreAssignOpen} onOpenChange={setIsStoreAssignOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-md h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="font-black italic uppercase text-center text-xl">Assign Stores to Zone</DialogTitle>
            <p className="text-[10px] font-black text-muted-foreground uppercase text-center tracking-widest">Zone: {selectedZoneForStores?.name}</p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3">
             {vendors?.map((store: any) => {
               const isAssigned = store.zoneId === selectedZoneForStores?.id;
               const belongsToOther = store.zoneId && store.zoneId !== selectedZoneForStores?.id;

               return (
                 <button 
                   key={store.id}
                   onClick={() => handleToggleStoreAssignment(store.id, store.zoneId || null)}
                   className={cn(
                     "w-full p-4 rounded-[1.5rem] border-2 transition-all flex items-center justify-between text-left",
                     isAssigned ? "border-green-500 bg-green-50" : belongsToOther ? "border-amber-100 bg-amber-50 opacity-60" : "border-gray-50 bg-gray-50"
                   )}
                 >
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-white border border-gray-100 shrink-0">
                         <img src={store.imageUrl} className="h-full w-full object-cover" alt="" />
                      </div>
                      <div>
                         <h4 className="font-black italic uppercase text-sm leading-none mb-1">{store.storeName}</h4>
                         <p className="text-[9px] font-bold text-muted-foreground uppercase">{store.category} • {store.town}</p>
                         {belongsToOther && <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">Assigned to Other Zone</span>}
                      </div>
                   </div>
                   {isAssigned ? (
                     <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white shadow-lg"><CheckCircle2 className="h-5 w-5" /></div>
                   ) : (
                     <div className="h-8 w-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-300"><Plus className="h-4 w-4" /></div>
                   )}
                 </button>
               );
             })}
          </div>

          <div className="p-6 bg-muted/5 border-t">
             <Button onClick={() => setIsStoreAssignOpen(false)} className="w-full h-14 bg-black rounded-2xl font-black uppercase italic">DONE</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
