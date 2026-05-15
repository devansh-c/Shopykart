
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, setDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { Store, User, Phone, MapPin, Globe, CheckCircle, Trash2, Loader2, Utensils, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';

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
      // In a real production app, we would use a Cloud Function to create the auth user
      // For this MVP, we will move the data to 'vendors' and set status to 'approved'
      // Note: The vendor will still need an Auth account. 
      // We will suggest the admin to inform them to sign up with the same email if not already done,
      // or we simulate the "Assignment".
      
      const vendorRef = doc(firestore, 'vendors', app.id);
      await setDoc(vendorRef, {
        ...app,
        status: 'approved',
        updatedAt: new Date(),
      });

      // Remove from applications
      await deleteDoc(doc(firestore, 'vendor_applications', app.id));

      toast({ 
        title: "Store Assigned", 
        description: `${app.storeName} is now active on the platform.` 
      });
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Could not assign store." });
    }
  };

  const handleReject = async (id: string) => {
    if (!firestore) return;
    await deleteDoc(doc(firestore, 'vendor_applications', id));
    toast({ title: "Application Removed", description: "The request has been declined." });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">New Store Requests</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Pending Onboarding Approvals</p>
        </div>
        <Badge className="bg-primary/10 text-primary font-black uppercase text-[10px] px-3">
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
            <div key={app.id} className="bg-white rounded-[2.5rem] p-8 border border-border/50 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-4 rounded-2xl text-primary">
                    {app.category === 'Food' ? <Utensils className="h-6 w-6" /> : <ShoppingBag className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-black text-xl italic uppercase tracking-tighter leading-none">{app.storeName}</h3>
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">{app.category} Portal</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 text-primary">
                  {app.zone}
                </Badge>
              </div>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                  <User className="h-4 w-4 text-primary" />
                  {app.firstName} {app.lastName}
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                  <Phone className="h-4 w-4 text-primary" />
                  {app.phone}
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                  <Globe className="h-4 w-4 text-primary" />
                  {app.email}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground italic">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">Lat: {app.lat}, Lng: {app.lng}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={() => handleApprove(app)}
                  className="flex-1 bg-green-500 hover:bg-green-600 rounded-xl h-12 font-black uppercase italic text-xs"
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> ASSIGN STORE
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => handleReject(app.id)}
                  className="h-12 w-12 rounded-xl border-red-100 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
            <Store className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No pending store requests</p>
          </div>
        )}
      </div>
    </div>
  );
}
