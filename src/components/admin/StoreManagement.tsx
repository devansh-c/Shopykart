
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { Store, User, Phone, MapPin, Globe, CheckCircle, Trash2, Loader2, Utensils, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function StoreManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();

  // Querying from 'vendor_applications' where applications are waiting
  const applicationsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'vendor_applications'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: applications, loading } = useCollection<any>(applicationsQuery);

  const handleApprove = async (app: any) => {
    if (!firestore) return;
    
    try {
      // 1. Update the 'vendors' status to 'approved'
      // This is the trigger that allows them to login
      const vendorRef = doc(firestore, 'vendors', app.id);
      await updateDoc(vendorRef, {
        status: 'approved',
        updatedAt: new Date(),
      });

      // 2. Remove from pending applications view
      await deleteDoc(doc(firestore, 'vendor_applications', app.id));

      toast({ 
        title: "Store Activated!", 
        description: `${app.storeName} can now login using their credentials.` 
      });
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Could not activate store. Ensure vendor exists in database." });
    }
  };

  const handleReject = async (id: string) => {
    if (!firestore) return;
    try {
      await deleteDoc(doc(firestore, 'vendor_applications', id));
      await updateDoc(doc(firestore, 'vendors', id), { status: 'rejected' });
      toast({ title: "Application Removed", description: "The request has been declined." });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to process rejection." });
    }
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
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : applications && applications.length > 0 ? (
          applications.map((app: any) => (
            <div key={app.id} className="bg-white rounded-[2.5rem] p-8 border border-border/50 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4">
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary bg-primary/5">
                  {app.zone}
                </Badge>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="bg-primary/10 p-4 rounded-2xl text-primary">
                  {app.category === 'Food' ? <Utensils className="h-6 w-6" /> : <ShoppingBag className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="font-black text-xl italic uppercase tracking-tighter leading-none mb-1">{app.storeName}</h3>
                  <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{app.category} Category</span>
                </div>
              </div>

              <div className="space-y-3 mb-8 bg-muted/20 p-5 rounded-3xl">
                <div className="flex items-center gap-3 text-sm font-bold">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-xs uppercase">{app.firstName} {app.lastName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold">
                  <Phone className="h-4 w-4 text-primary" />
                  <span className="text-xs">{app.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="text-xs lowercase">{app.email}</span>
                </div>
                <div className="flex items-center gap-3 pt-2 border-t border-white/50">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-muted-foreground uppercase">GPS Coordinates</span>
                    <span className="text-[10px] font-bold">Lat: {app.lat}</span>
                    <span className="text-[10px] font-bold">Lng: {app.lng}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => handleApprove(app)}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-2xl h-14 font-black uppercase italic text-xs tracking-widest shadow-lg shadow-green-500/20"
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> ACTIVATE STORE
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleReject(app.id)}
                  className="h-14 w-14 rounded-2xl border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 transition-colors"
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
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
