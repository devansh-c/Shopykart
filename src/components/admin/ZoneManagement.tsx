
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
  Eraser
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
import dynamic from 'next/dynamic';

// Dynamic Import for Leaflet (SSR issues)
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Polygon = dynamic(() => import('react-leaflet').then(mod => mod.Polygon), { ssr: false });
const useMapEvents = dynamic(() => import('react-leaflet').then(mod => mod.useMapEvents), { ssr: false });

import 'leaflet/dist/leaflet.css';

// Helper component for map clicks
function MapEvents({ onMapClick }: { onMapClick: (latlng: any) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng);
    },
  });
  return null;
}

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
  const [boundaryPoints, setBoundaryPoints] = useState<[number, number][]>([]);

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    pincodes: '',
    minOrder: '0',
    deliveryCharge: '0',
    isActive: true
  });

  const handleMapClick = (latlng: any) => {
    setBoundaryPoints(prev => [...prev, [latlng.lat, latlng.lng]]);
  };

  const clearLastPoint = () => {
    setBoundaryPoints(prev => prev.slice(0, -1));
  };

  const clearAllPoints = () => {
    setBoundaryPoints([]);
  };

  const handleSave = async () => {
    if (!firestore) return;
    if (!formData.name) {
      toast({ variant: "destructive", title: "Required Field", description: "Zone Name is mandatory." });
      return;
    }

    const zoneData = {
      name: formData.name.trim(),
      city: formData.city.trim() || 'Local',
      pincodes: formData.pincodes.split(',').map(p => p.trim()).filter(p => p.length > 0),
      boundary: boundaryPoints, // Storing coordinates as [lat, lng] array
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
    setBoundaryPoints([]);
    setEditingId(null);
  };

  const handleEdit = (zone: any) => {
    setFormData({
      name: zone.name,
      city: zone.city,
      pincodes: (zone.pincodes || []).join(', '),
      minOrder: zone.minOrder.toString(),
      deliveryCharge: (zone.deliveryCharge || 0).toString(),
      isActive: zone.isActive
    });
    setBoundaryPoints(zone.boundary || []);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-xl font-black italic uppercase">Map Zone Control</h2>
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
              {/* Map Marking Section */}
              <div className="space-y-3">
                 <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase text-primary flex items-center gap-1.5">
                       <Navigation className="h-3 w-3" /> Mark Area on Map
                    </label>
                    <div className="flex gap-2">
                       <button onClick={clearLastPoint} className="text-[8px] font-black uppercase bg-muted px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-amber-100 hover:text-amber-700 transition-colors">
                          <Eraser className="h-2.5 w-2.5" /> Undo
                       </button>
                       <button onClick={clearAllPoints} className="text-[8px] font-black uppercase bg-red-50 text-red-600 px-2 py-1 rounded-lg flex items-center gap-1 hover:bg-red-100 transition-colors">
                          <Trash2 className="h-2.5 w-2.5" /> Clear Map
                       </button>
                    </div>
                 </div>
                 <div className="h-[300px] w-full bg-muted rounded-3xl overflow-hidden border-4 border-muted/20 relative">
                    <MapContainer 
                      center={[25.2443, 79.0838]} // Default center Ranipur area
                      zoom={14} 
                      style={{ height: '100%', width: '100%' }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <MapEvents onMapClick={handleMapClick} />
                      {boundaryPoints.length > 2 && (
                        <Polygon positions={boundaryPoints} color="#EF4444" fillOpacity={0.3} />
                      )}
                    </MapContainer>
                    {boundaryPoints.length < 3 && (
                       <div className="absolute inset-0 z-[10] bg-black/40 flex items-center justify-center pointer-events-none">
                          <p className="text-white text-[10px] font-black uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full border border-white/20">
                             Tap 3 or more spots to mark an area
                          </p>
                       </div>
                    )}
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
                 <Input value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} placeholder="284205" className="h-12 rounded-xl font-bold" />
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
          zones.map((zone) => (
            <div key={zone.id} className={cn(
              "bg-white p-6 rounded-[2.5rem] border-2 transition-all relative overflow-hidden group",
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
                     {zone.boundary && (
                       <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[8px] px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                          <MousePointer2 className="h-2 w-2" /> Map Marked
                       </Badge>
                     )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
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
              </div>

              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0">
                 <Button variant="ghost" size="icon" onClick={() => handleEdit(zone)} className="h-9 w-9 rounded-xl bg-white shadow-md text-blue-500 hover:bg-blue-50"><Edit className="h-4 w-4" /></Button>
                 <Button variant="ghost" size="icon" onClick={() => handleDelete(zone.id)} className="h-9 w-9 rounded-xl bg-white shadow-md text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed">
            <Globe className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No zones marked yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
