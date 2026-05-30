
"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { collection, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { 
  Navigation, 
  Package, 
  CheckCircle, 
  MapPin, 
  LogOut, 
  BellRing, 
  Volume2, 
  VolumeX, 
  Compass, 
  Map, 
  User, 
  PhoneCall,
  History,
  LayoutDashboard,
  Clock,
  ShieldAlert,
  Loader2,
  X,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import dynamic from 'next/dynamic';

const OrderMapViewer = dynamic(() => import('@/components/shared/OrderMapViewer'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-white/5 animate-pulse rounded-3xl" />
});

export default function DeliveryDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [isMounted, setIsMounted] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedTaskCoords, setSelectedTaskCoords] = useState<{lat: number, lng: number} | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const partnerRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'delivery_partners', user.uid);
  }, [firestore, user]);
  
  const { data: partnerProfile, loading: profileLoading } = useDoc<any>(partnerRef);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/delivery/login');
      return;
    }

    if (!authLoading && !profileLoading && user && !partnerProfile) {
      toast({ 
        variant: "destructive", 
        title: "Access Restricted", 
        description: "Your account is not authorized to access the Delivery Hub." 
      });
      if (auth) signOut(auth);
      router.push('/delivery/login');
    }
  }, [user, authLoading, profileLoading, partnerProfile, router, auth, toast]);

  const activeTasksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'orders'), 
      where('status', 'in', ['Ready for Pickup', 'Picked Up', 'Out for Delivery'])
    );
  }, [firestore]);

  const { data: allActiveTasks, loading: activeLoading } = useCollection<any>(activeTasksQuery);

  const filteredActiveTasks = useMemo(() => {
    if (!allActiveTasks || !partnerProfile) return [];

    return allActiveTasks.filter(task => {
      if (task.status === 'Ready for Pickup') {
        return task.pincode === partnerProfile.assignedPincode;
      }
      return task.deliveryPartnerId === user?.uid;
    });
  }, [allActiveTasks, partnerProfile, user]);

  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'orders'),
      where('deliveryPartnerId', '==', user.uid),
      where('status', '==', 'Delivered'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: historyTasks, loading: historyLoading } = useCollection<any>(historyQuery);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasPendingPickup = filteredActiveTasks?.some(task => task.status === 'Ready for Pickup');
    if (hasPendingPickup && isAudioEnabled) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(() => {});
    } else {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    }
    return () => { if (audioRef.current) audioRef.current.pause(); };
  }, [filteredActiveTasks, isAudioEnabled]);

  const updateDelivery = (orderId: string, status: string) => {
    if (!firestore || !user) return;
    const ref = doc(firestore, 'orders', orderId);
    updateDoc(ref, { 
      status: status,
      deliveryPartnerId: user.uid 
    }).then(() => {
      toast({ title: "Updated", description: `Order is now ${status}` });
    });
  };

  const handleSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    router.push('/delivery/login');
  };

  const openInternalMap = (task: any) => {
    if (task.latitude && task.longitude) {
      setSelectedTaskCoords({ lat: Number(task.latitude), lng: Number(task.longitude) });
      setIsMapOpen(true);
    } else {
      // Fallback to address search if no coordinates
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`;
      window.open(url, '_blank');
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !partnerProfile) return null;

  const pendingPickupsCount = filteredActiveTasks?.filter(t => t.status === 'Ready for Pickup').length || 0;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white p-6 pb-32">
      <header className="mb-10 flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="relative">
             <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-primary/20 bg-white/5 p-0.5 shadow-2xl">
               <img 
                 src={partnerProfile?.photoUrl || "https://picsum.photos/seed/delivery/200/200"} 
                 className="h-full w-full object-cover rounded-[0.8rem]" 
                 alt="Profile" 
               />
             </div>
             <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-[#0B0B0B] shadow-sm" />
          </div>
          <div className="pt-1">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1 leading-none">Welcome back,</p>
            <h1 className="text-2xl font-black italic uppercase tracking-tighter leading-none mb-2">{partnerProfile?.fullName || 'Partner'}</h1>
            <div className="flex items-center gap-2">
              <div className="bg-green-500/10 px-2.5 py-1 rounded-lg border border-green-500/20 flex items-center gap-1.5 w-fit">
                <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-widest text-green-500">Zone: {partnerProfile?.assignedPincode}</span>
              </div>
              <button 
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className={cn(
                  "px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-all",
                  isAudioEnabled ? "bg-primary/10 border-primary/30 text-primary" : "bg-white/5 border-white/10 text-gray-600"
                )}
              >
                {isAudioEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                <span className="text-[8px] font-black uppercase tracking-widest">{isAudioEnabled ? 'AUDIO ON' : 'SILENT'}</span>
              </button>
            </div>
          </div>
        </div>
        <button onClick={handleSignOut} className="p-3 bg-white/5 rounded-2xl text-red-500 border border-white/5 active:scale-90 transition-all mt-1 hover:bg-red-500/10">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      <div className="flex bg-white/5 p-1 rounded-2xl mb-8">
        <button 
          onClick={() => setActiveTab('active')}
          className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2", activeTab === 'active' ? "bg-white text-black shadow-lg" : "text-gray-500")}
        >
          <LayoutDashboard className="h-3 w-3" /> Active Tasks
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn("flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2", activeTab === 'history' ? "bg-white text-black shadow-lg" : "text-gray-500")}
        >
          <History className="h-3 w-3" /> My History
        </button>
      </div>

      {activeTab === 'active' ? (
        <div className="space-y-4">
          {pendingPickupsCount > 0 && (
            <div className="mb-6 bg-primary p-4 rounded-2xl flex items-center gap-4 animate-pulse shadow-lg shadow-primary/20">
              <div className="bg-white/20 p-2 rounded-xl"><BellRing className="h-6 w-6 text-white" /></div>
              <div><h2 className="font-black italic uppercase text-sm leading-tight">{pendingPickupsCount} NEW PICKUP IN YOUR ZONE</h2><p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Pincode {partnerProfile.assignedPincode}</p></div>
            </div>
          )}

          {filteredActiveTasks?.map((task) => (
            <div key={task.id} className={cn(
              "bg-white/5 backdrop-blur-md rounded-[2.5rem] p-6 border transition-all relative overflow-hidden",
              task.status === 'Ready for Pickup' ? "border-primary shadow-xl shadow-primary/5" : "border-white/10"
            )}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={cn("text-[10px] font-black uppercase tracking-[0.2em]", task.status === 'Ready for Pickup' ? "text-primary" : "text-gray-500")}>{task.status}</span>
                  <h3 className="font-black italic text-lg leading-none mt-2">#{task.orderDisplayId || task.id.slice(-4)}</h3>
                  <div className="mt-4 flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-xl text-primary"><User className="h-4 w-4" /></div>
                        <div><p className="text-[10px] font-black text-gray-500 uppercase mb-1 leading-none">Customer</p><span className="text-xs font-black uppercase italic tracking-tighter">{task.customerName || 'Premium User'}</span></div>
                    </div>
                    {task.customerPhone && (
                      <button onClick={() => window.open(`tel:${task.customerPhone}`)} className="bg-green-600 hover:bg-green-500 p-3.5 rounded-xl text-white shadow-xl shadow-green-600/20 active:scale-90 transition-all"><PhoneCall className="h-5 w-5" /></button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-4 text-gray-400 text-xs"><MapPin className="h-3.5 w-3.5 text-primary" /><span className="truncate max-w-[180px] font-medium">{task.address}</span></div>
                  {task.latitude && <p className="text-[7px] font-black text-green-500 mt-2 uppercase tracking-widest flex items-center gap-1"><Navigation className="h-2 w-2" /> GPS PRECISION ACTIVE ✅</p>}
                </div>
                <button onClick={() => openInternalMap(task)} className="bg-white/10 p-5 rounded-2xl border border-white/5 hover:bg-primary/20 hover:border-primary/30 transition-all active:scale-95 group shadow-2xl"><Compass className={cn("h-7 w-7", task.status === 'Ready for Pickup' ? "text-primary animate-pulse" : "text-white group-hover:text-primary")} /></button>
              </div>

              <div className="space-y-3">
                <button onClick={() => openInternalMap(task)} className="w-full h-12 rounded-2xl border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 flex items-center justify-center"><Map className="h-3 w-3 mr-2" /> TRACK ON INTERNAL MAP</button>
                {task.status === 'Ready for Pickup' && <Button onClick={() => updateDelivery(task.id, 'Picked Up')} className="w-full bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase italic h-14 text-lg shadow-xl shadow-primary/20">Accept & Pickup</Button>}
                {task.status === 'Picked Up' && <Button onClick={() => updateDelivery(task.id, 'Out for Delivery')} className="w-full bg-blue-500 hover:bg-blue-600 rounded-2xl font-black uppercase italic h-14 text-lg">Mark Out for Delivery</Button>}
                {task.status === 'Out for Delivery' && <Button onClick={() => updateDelivery(task.id, 'Delivered')} className="w-full bg-green-500 hover:bg-green-600 rounded-2xl font-black uppercase italic h-14 text-lg">Confirm Delivery</Button>}
              </div>
            </div>
          ))}

          {(!filteredActiveTasks || filteredActiveTasks.length === 0) && (
            <div className="text-center py-20 opacity-30 flex flex-col items-center">
              <ShieldAlert className="h-16 w-16 mb-4 text-gray-600" />
              <p className="font-black italic uppercase tracking-widest text-sm">No orders in your zone ({partnerProfile.assignedPincode})</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {historyTasks?.map((task) => (
            <div key={task.id} className="bg-white/5 rounded-[2rem] p-6 border border-white/5">
               <div className="flex justify-between items-start mb-4">
                 <div>
                    <h3 className="font-black italic text-lg">#{task.orderDisplayId || task.id.slice(-4)}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                       <Clock className="h-3 w-3" />
                       {isMounted && task.createdAt?.seconds ? format(new Date(task.createdAt.seconds * 1000), 'MMM d, h:mm a') : 'Recently'}
                    </div>
                 </div>
                 <div className="bg-green-500/20 px-3 py-1.5 rounded-full text-green-500 text-[8px] font-black uppercase tracking-widest">Delivered</div>
               </div>
               <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white/5 p-2 rounded-xl text-primary"><User className="h-4 w-4" /></div>
                  <span className="text-xs font-bold">{task.customerName}</span>
               </div>
               <div className="flex items-center gap-3">
                  <div className="bg-white/5 p-2 rounded-xl text-primary"><MapPin className="h-4 w-4" /></div>
                  <span className="text-[10px] font-medium text-gray-500 truncate">{task.address}</span>
               </div>
            </div>
          ))}
          {(!historyTasks || historyTasks.length === 0) && (
            <div className="text-center py-20 opacity-30 flex flex-col items-center"><History className="h-16 w-16 mb-4" /><p className="font-black italic uppercase tracking-widest text-sm">No delivery history</p></div>
          )}
        </div>
      )}

      {/* Internal SDK Map Modal for Delivery Hub */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-full sm:max-w-xl h-[85vh] p-0 overflow-hidden bg-[#1A1A1A] border border-white/10 shadow-2xl focus:outline-none">
           <DialogHeader className="p-6 bg-[#0B0B0B] border-b border-white/5 absolute top-0 left-0 right-0 z-50">
              <DialogTitle className="font-black italic uppercase text-center flex items-center justify-center gap-2 text-white">
                 <Map className="h-5 w-5 text-primary" />
                 Navigation Assistant
              </DialogTitle>
           </DialogHeader>
           
           <div className="h-full w-full pt-16 relative">
              {selectedTaskCoords && (
                 <OrderMapViewer lat={selectedTaskCoords.lat} lng={selectedTaskCoords.lng} />
              )}
           </div>

           <div className="absolute bottom-8 left-0 right-0 px-6 z-50 flex flex-col gap-3">
              <Button 
                onClick={() => {
                   if (selectedTaskCoords) {
                     window.open(`https://www.google.com/maps/search/?api=1&query=${selectedTaskCoords.lat},${selectedTaskCoords.lng}`, '_blank');
                   }
                }}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-[1.5rem] h-14 font-black uppercase italic text-sm shadow-2xl active:scale-95 transition-all"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                START NAVIGATING (EXTERNAL)
              </Button>
              <Button 
                variant="ghost"
                onClick={() => setIsMapOpen(false)}
                className="w-full text-gray-400 font-bold uppercase text-[10px] tracking-widest"
              >
                CLOSE ASSISTANT
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
