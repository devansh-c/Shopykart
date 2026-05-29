
"use client"

import { useState } from 'react';
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
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function ZoneManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'zones');
  }, [firestore]);

  const { data: zones, loading } = useCollection<any>(zonesQuery);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    pincodes: '',
    minOrder: '0',
    deliveryCharge: '0',
    isActive: true
  });

  const handleSave = async () => {
    if (!firestore) return;
    if (!formData.name || !formData.pincodes) {
      toast({ variant: "destructive", title: "Required Fields", description: "Name and Pincodes are mandatory." });
      return;
    }

    const zoneData = {
      name: formData.name.trim(),
      city: formData.city.trim() || 'Local',
      pincodes: formData.pincodes.split(',').map(p => p.trim()).filter(p => p.length > 0),
      minOrder: parseFloat(formData.minOrder) || 0,
      deliveryCharge: parseFloat(formData.deliveryCharge) || 0,
      isActive: formData.isActive,
      updatedAt: serverTimestamp()
    };

    try {
      if (editingId) {
        await updateDoc(doc(firestore, 'zones', editingId), zoneData);
        toast({ title: "Zone Updated" });
      } else {
        await addDoc(collection(firestore, 'zones'), { ...zoneData, createdAt: serverTimestamp() });
        toast({ title: "Zone Created" });
      }
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      toast({ variant: "destructive", title: "Save Failed" });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', city: '', pincodes: '', minOrder: '0', deliveryCharge: '0', isActive: true });
    setEditingId(null);
  };

  const handleEdit = (zone: any) => {
    setFormData({
      name: zone.name,
      city: zone.city,
      pincodes: zone.pincodes.join(', '),
      minOrder: zone.minOrder.toString(),
      deliveryCharge: zone.deliveryCharge.toString(),
      isActive: zone.isActive
    });
    setEditingId(zone.id);
    setIsAddOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm("Delete this zone? This will affect product availability for customers in these pincodes.")) {
      await deleteDoc(doc(firestore, 'zones', id));
      toast({ title: "Zone Removed" });
    }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'zones', id), { isActive: !current });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-black italic uppercase">Zone Management</h2>
          <p className="text-xs text-muted-foreground font-bold">Control where ShopyKart operates</p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={(val) => { setIsAddOpen(val); if(!val) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-[#0B0B0B] hover:bg-primary rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              New Delivery Zone
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] max-w-md">
            <DialogHeader>
              <DialogTitle className="font-black italic uppercase text-center">{editingId ? 'Edit Zone' : 'Create Serving Zone'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 pt-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Zone Name</label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Ranipur Hub" className="h-12 rounded-xl font-bold" />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">City</label>
                    <Input value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="e.g. Jhansi" className="h-12 rounded-xl font-bold" />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Serving Pincodes (Comma separated)</label>
                 <Input value={formData.pincodes} onChange={e => setFormData({...formData, pincodes: e.target.value})} placeholder="284205, 284204" className="h-12 rounded-xl font-bold" />
                 <p className="text-[8px] font-bold text-primary mt-1">* Only customers in these pincodes will see products.</p>
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
                 <span className="text-xs font-black uppercase">Enable Zone</span>
                 <Switch checked={formData.isActive} onCheckedChange={(val) => setFormData({...formData, isActive: val})} />
              </div>

              <Button onClick={handleSave} className="w-full bg-primary h-14 rounded-2xl font-black uppercase italic shadow-xl">
                {editingId ? 'SAVE CHANGES' : 'ACTIVATE ZONE'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !zones ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : zones && zones.length > 0 ? (
          zones.map((zone) => (
            <div key={zone.id} className={cn(
              "bg-white p-6 rounded-[2.5rem] border-2 transition-all relative overflow-hidden group",
              zone.isActive ? "border-green-100 shadow-sm" : "border-gray-100 grayscale opacity-60"
            )}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                   <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
                      <MapPin className="h-5 w-5" />
                   </div>
                   <div>
                      <h3 className="font-black italic uppercase tracking-tighter text-lg leading-tight">{zone.name}</h3>
                      <span className="text-[10px] font-black text-muted-foreground uppercase">{zone.city}</span>
                   </div>
                </div>
                <Switch checked={zone.isActive} onCheckedChange={() => toggleStatus(zone.id, zone.isActive)} className="scale-75 data-[state=checked]:bg-green-500" />
              </div>

              <div className="space-y-4">
                 <div className="flex flex-wrap gap-1.5">
                    {zone.pincodes.map((pin: string) => (
                      <Badge key={pin} variant="secondary" className="bg-muted/50 border-none text-[9px] font-bold py-0.5">{pin}</Badge>
                    ))}
                 </div>

                 <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/50">
                       <div className="flex items-center gap-1.5 mb-1">
                          <ShoppingBag className="h-3 w-3 text-blue-600" />
                          <span className="text-[8px] font-black uppercase text-blue-700">Min Order</span>
                       </div>
                       <p className="text-sm font-black italic">₹{zone.minOrder}</p>
                    </div>
                    <div className="bg-amber-50/50 p-3 rounded-2xl border border-amber-100/50">
                       <div className="flex items-center gap-1.5 mb-1">
                          <Truck className="h-3 w-3 text-amber-600" />
                          <span className="text-[8px] font-black uppercase text-amber-700">Delivery</span>
                       </div>
                       <p className="text-sm font-black italic">₹{zone.deliveryCharge}</p>
                    </div>
                 </div>
              </div>

              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                 <Button variant="ghost" size="icon" onClick={() => handleEdit(zone)} className="h-9 w-9 rounded-xl bg-white shadow-md text-blue-500 hover:bg-blue-50"><Edit className="h-4 w-4" /></Button>
                 <Button variant="ghost" size="icon" onClick={() => handleDelete(zone.id)} className="h-9 w-9 rounded-xl bg-white shadow-md text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
              </div>

              {!zone.isActive && (
                <div className="absolute inset-0 bg-white/40 flex items-center justify-center">
                   <Badge className="bg-red-500 text-white font-black uppercase">PAUSED</Badge>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No delivery zones defined yet</p>
          </div>
        )}
      </div>

      <div className="bg-primary/5 p-6 rounded-[2.5rem] border border-primary/20 flex gap-4">
         <AlertTriangle className="h-6 w-6 text-primary shrink-0" />
         <p className="text-xs font-bold text-gray-700 leading-relaxed uppercase">
           <b>Warning:</b> Pincode system strictly filters visibility. If a customer is in a pincode not listed in any <b>ACTIVE</b> zone, they will see a "Service Unavailable" screen.
         </p>
      </div>
    </div>
  );
}
