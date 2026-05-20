"use client"

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, updateDoc, query, where } from 'firebase/firestore';
import { Navigation, Package, CheckCircle, MapPin, LogOut, BellRing, Volume2, VolumeX, Compass, Map, User, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';

export default function DeliveryDashboard() {
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, loading: authLoading } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/delivery/login');
    }
  }, [user, authLoading, router]);

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'orders'), where('status', 'in', ['Ready for Pickup', 'Picked Up', 'Out for Delivery']));
  }, [firestore]);

  const { data: tasks, loading } = useCollection<any>(tasksQuery);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const hasPendingPickup = tasks?.some(task => task.status === 'Ready for Pickup');

    if (hasPendingPickup && isAudioEnabled) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(e => console.log("Autoplay blocked"));
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [tasks, isAudioEnabled]);

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

  const openNavigation = (task: any) => {
    if (task.latitude && task.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${task.latitude},${task.longitude}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(task.address)}`;
      window.open(url, '_blank');
      toast({ title: "Note", description: "Navigating via address as GPS spot was not set." });
    }
  };

  if (authLoading || loading) return null;
  if (!user) return null;

  const pendingPickupsCount = tasks?.filter(t => t.status === 'Ready for Pickup').length || 0;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white p-6 pb-24">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Delivery Hub</h1>
          <div className="flex gap-2 mt-2">
            <div className="bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30 flex items-center gap-2 w-fit">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-green-500">Online</span>
            </div>
            <button 
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={cn(
                "px-3 py-1 rounded-full border flex items-center gap-2 transition-all",
                isAudioEnabled ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 text-gray-500"
              )}
            >
              {isAudioEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
              <span className="text-[10px] font-black uppercase tracking-widest">{isAudioEnabled ? 'Sound ON' : 'Sound OFF'}</span>
            </button>
          </div>
        </div>
        <button onClick={handleSignOut} className="p-3 bg-white/5 rounded-2xl text-red-500 border border-white/5 active:scale-90 transition-all">
          <LogOut className="h-5 w-5" />
        </button>
      </header>

      {pendingPickupsCount > 0 && (
        <div className="mb-6 bg-primary p-4 rounded-2xl flex items-center gap-4 animate-pulse shadow-lg shadow-primary/20">
          <div className="bg-white/20 p-2 rounded-xl">
            <BellRing className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="font-black italic uppercase text-sm leading-tight">{pendingPickupsCount} NEW PICKUP AVAILABLE</h2>
            <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">Action Required Immediately</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tasks?.map((task) => (
          <div key={task.id} className={cn(
            "bg-white/5 backdrop-blur-md rounded-[2.5rem] p-6 border transition-all relative overflow-hidden",
            task.status === 'Ready for Pickup' ? "border-primary shadow-xl shadow-primary/5" : "border-white/10"
          )}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className={cn(
                  "text-[10px] font-black uppercase tracking-[0.2em]",
                  task.status === 'Ready for Pickup' ? "text-primary" : "text-gray-500"
                )}>{task.status}</span>
                <h3 className="font-black italic text-lg leading-none mt-2">PICKUP #{task.id.slice(-4)}</h3>
                
                <div className="mt-4 flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="bg-white/10 p-2 rounded-xl text-primary"><User className="h-4 w-4" /></div>
                      <div>
                        <p className="text-[10px] font-black text-gray-500 uppercase leading-none mb-1">Customer</p>
                        <span className="text-xs font-black uppercase italic tracking-tighter">{task.customerName || 'Premium User'}</span>
                      </div>
                   </div>
                   {task.customerPhone && (
                     <button 
                      onClick={() => window.open(`tel:${task.customerPhone}`)}
                      className="bg-green-600 hover:bg-green-500 p-3.5 rounded-xl text-white shadow-xl shadow-green-600/20 active:scale-90 transition-all"
                     >
                       <PhoneCall className="h-5 w-5" />
                     </button>
                   )}
                </div>

                <div className="flex items-center gap-2 mt-4 text-gray-400 text-xs">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate max-w-[180px] font-medium">{task.address}</span>
                </div>
                {task.latitude && (
                  <div className="mt-2 inline-flex items-center gap-1.5 bg-green-500/10 px-2.5 py-1 rounded-lg text-[9px] font-black text-green-500 uppercase">
                    <CheckCircle className="h-2.5 w-2.5" /> GPS SPOT VERIFIED
                  </div>
                )}
              </div>
              <button 
                onClick={() => openNavigation(task)}
                className="bg-white/10 p-5 rounded-2xl border border-white/5 hover:bg-primary/20 hover:border-primary/30 transition-all active:scale-95 group shadow-2xl"
              >
                <Compass className={cn("h-7 w-7", task.status === 'Ready for Pickup' ? "text-primary animate-pulse" : "text-white group-hover:text-primary")} />
              </button>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={() => openNavigation(task)}
                variant="outline"
                className="w-full h-12 rounded-2xl border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10"
              >
                <Map className="h-3 w-3 mr-2" />
                Open Smart Route
              </Button>

              {task.status === 'Ready for Pickup' && (
                <Button onClick={() => updateDelivery(task.id, 'Picked Up')} className="w-full bg-primary hover:bg-primary/90 rounded-2xl font-black uppercase italic h-14 text-lg shadow-xl shadow-primary/20">Accept & Pickup</Button>
              )}
              {task.status === 'Picked Up' && (
                <Button onClick={() => updateDelivery(task.id, 'Out for Delivery')} className="w-full bg-blue-500 hover:bg-blue-600 rounded-2xl font-black uppercase italic h-14 text-lg">Mark Out for Delivery</Button>
              )}
              {task.status === 'Out for Delivery' && (
                <Button onClick={() => updateDelivery(task.id, 'Delivered')} className="w-full bg-green-500 hover:bg-green-600 rounded-2xl font-black uppercase italic h-14 text-lg">Confirm Delivery</Button>
              )}
            </div>
          </div>
        ))}

        {(!tasks || tasks.length === 0) && (
          <div className="text-center py-20 opacity-30 flex flex-col items-center">
            <Package className="h-16 w-16 mb-4" />
            <p className="font-black italic uppercase tracking-widest text-sm">No tasks available</p>
          </div>
        )}
      </div>
    </div>
  );
}