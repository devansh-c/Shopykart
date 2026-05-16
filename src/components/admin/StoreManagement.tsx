
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
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
  Map as MapIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function StoreManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const applicationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendor_applications'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: applications, loading } = useCollection<any>(applicationsQuery);

  const handleApprove = async (app: any) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'vendors', app.id), { status: 'approved', updatedAt: new Date() });
      await deleteDoc(doc(firestore, 'vendor_applications', app.id));
      toast({ title: "Store Activated!", description: `${app.storeName} is now live.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to activate." });
    }
  };

  const handleReject = async (id: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'vendor_applications', id));
    await updateDoc(doc(firestore, 'vendors', id), { status: 'rejected' });
    toast({ title: "Rejected", description: "Application declined." });
  };

  const getMapUrl = (lat: string, lng: string) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude)) {
      // Default center if no coordinates
      return `https://www.openstreetmap.org/export/embed.html?bbox=78.3%2C25.2%2C78.6%2C25.4&layer=mapnik`;
    }
    return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.005}%2C${latitude-0.005}%2C${longitude+0.005}%2C${latitude+0.005}&layer=mapnik&marker=${latitude}%2C${longitude}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">Store Requests</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">New Vendors waiting for approval</p>
        </div>
        <Badge className="bg-primary/10 text-primary font-black uppercase text-[10px] px-3 h-8 flex items-center gap-2">
          <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />
          {applications?.length || 0} PENDING
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : applications && applications.length > 0 ? (
          applications.map((app: any) => (
            <div key={app.id} className="bg-white rounded-[2.5rem] p-8 border border-border/50 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4">
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5">{app.town || app.zone}</Badge>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary/10 p-4 rounded-2xl text-primary">{app.category === 'Food' ? <Utensils /> : <ShoppingBag />}</div>
                <div>
                  <h3 className="font-black text-xl italic uppercase tracking-tighter leading-none mb-1">{app.storeName}</h3>
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{app.category} Category</span>
                </div>
              </div>

              {/* Map Preview Section */}
              <div className="mb-6 space-y-2">
                <div className="flex items-center gap-2 ml-1">
                   <MapIcon className="h-3 w-3 text-primary" />
                   <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Live Location Preview</span>
                </div>
                <div className="w-full h-32 rounded-2xl overflow-hidden border border-border bg-muted">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight={0} 
                    marginWidth={0} 
                    src={getMapUrl(app.lat, app.lng)}
                    className="grayscale-[0.4] contrast-[1.2]"
                  />
                </div>
              </div>

              <div className="space-y-3 mb-8 bg-muted/20 p-5 rounded-3xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold"><User className="h-3 w-3 text-primary" />{app.firstName} {app.lastName}</div>
                  <div className="flex gap-2">
                    <button onClick={() => window.open(`tel:${app.phone}`)} className="p-1.5 bg-blue-100 text-blue-600 rounded-lg active:scale-90 transition-transform"><Phone className="h-3 w-3" /></button>
                    <button onClick={() => window.open(`https://wa.me/91${app.phone}`)} className="p-1.5 bg-green-100 text-green-600 rounded-lg active:scale-90 transition-transform"><MessageCircle className="h-3 w-3" /></button>
                    <button onClick={() => window.open(`mailto:${app.email}`)} className="p-1.5 bg-amber-100 text-amber-600 rounded-lg active:scale-90 transition-transform"><Mail className="h-3 w-3" /></button>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-3 border-t border-white/50">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-muted-foreground uppercase">GPS Coordinates</span>
                    <span className="text-[10px] font-bold">Lat: {app.lat} / Lng: {app.lng}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => handleApprove(app)} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-2xl h-14 font-black uppercase italic text-xs tracking-widest shadow-lg shadow-green-500/20"><CheckCircle className="h-4 w-4 mr-2" /> ACTIVATE STORE</Button>
                <Button variant="outline" onClick={() => handleReject(app.id)} className="h-14 w-14 rounded-2xl border-red-100 text-red-500 hover:bg-red-50"><Trash2 className="h-5 w-5" /></Button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
            <Store className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No new store requests</p>
          </div>
        )}
      </div>
    </div>
  );
}

