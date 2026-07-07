
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BellRing, ShoppingBag, Loader2, VolumeX, Package, MapPin, ChevronRight, Zap, Volume2, X, AlertTriangle } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Critical Alert & Live Tracking System.
 * - Admin/Vendors: Get LOUD persistent alarms and VIBRATION for new orders until accepted.
 * - Restricted: Alarms ONLY trigger inside /admin or /vendor dashboards.
 * - Customers: SILENT visual tracking updates only.
 */
export function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isRinging, setIsRinging] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'vendor' | 'delivery' | 'customer' | null>(null);
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const [customerUpdate, setCustomerUpdate] = useState<any>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isAudioContextBlocked, setIsAudioContextBlocked] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastStatuses = useRef<Map<string, string>>(new Map());
  const isInitialLoad = useRef(true);

  // 0. Path Detection: Is the user currently in a management area?
  const isManagementPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || 
           p.startsWith('/vendor') || 
           p.startsWith('/medical/store') || 
           p.startsWith('/beauty/store');
  }, [pathname]);

  // 1. Role Detection
  useEffect(() => {
    if (!user || !firestore) {
      setUserRole(null);
      return;
    }
    
    const checkRole = async () => {
      const email = user.email?.toLowerCase();
      if (email === 'ceo@shopykart.co.in') {
        setUserRole('admin');
        return;
      }
      
      try {
        const vendorDoc = await getDoc(doc(firestore, 'vendors', user.uid));
        if (vendorDoc.exists()) {
          setUserRole('vendor');
          return;
        }
        
        const partnerDoc = await getDoc(doc(firestore, 'delivery_partners', user.uid));
        if (partnerDoc.exists()) {
          setUserRole('delivery');
          return;
        }
        
        setUserRole('customer');
      } catch (e) {
        setUserRole('customer');
      }
    };
    
    checkRole();
  }, [user, firestore]);

  // 2. Initialize Audio & Vibration wake-up
  useEffect(() => {
    if (typeof window === 'undefined' || !userRole || userRole === 'customer' || userRole === 'delivery' || !isManagementPath) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }

    // High pitch emergency siren for business operators
    const alarmUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
    const audio = new Audio(alarmUrl);
    audio.loop = true;
    audio.volume = 1.0;
    audioRef.current = audio;

    const wakeUpSystems = () => {
      if (audioRef.current && (userRole === 'admin' || userRole === 'vendor') && isManagementPath) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          audioRef.current!.currentTime = 0;
          setIsAudioContextBlocked(false);
          // Attempt a short vibration to clear block
          if (window.navigator.vibrate) window.navigator.vibrate(10);
        }).catch(() => {});
      }
    };

    window.addEventListener('click', wakeUpSystems, { once: true });
    return () => {
      window.removeEventListener('click', wakeUpSystems);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [userRole, isManagementPath]);

  // 3. Audio & Vibration Control loop
  useEffect(() => {
    let vibInterval: NodeJS.Timeout;

    if (!audioRef.current || userRole === 'customer' || userRole === 'delivery' || !isManagementPath) {
      return;
    }
    
    if (isRinging && !isAudioContextBlocked) {
      // Start Ringing
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => setIsAudioContextBlocked(true));
      }

      // Start Continuous Vibration (Android only, requires user interaction)
      if (typeof window !== 'undefined' && window.navigator.vibrate) {
        vibInterval = setInterval(() => {
          window.navigator.vibrate([500, 200, 500, 200, 500]);
        }, 2000);
      }
    } else {
      // Stop Ringing
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      // Stop Vibration
      if (typeof window !== 'undefined' && window.navigator.vibrate) {
        window.navigator.vibrate(0);
      }
    }

    return () => {
      if (vibInterval) clearInterval(vibInterval);
      if (typeof window !== 'undefined' && window.navigator.vibrate) {
        window.navigator.vibrate(0);
      }
    };
  }, [isRinging, isAudioContextBlocked, userRole, isManagementPath]);

  // 4. Live Update Listeners (Aggressive Placed order detection)
  useEffect(() => {
    if (!user || !firestore || !userRole) return;

    // --- ADMIN / VENDOR LISTENER ---
    if ((userRole === 'admin' || userRole === 'vendor') && isManagementPath) {
      const q = query(collection(firestore, 'orders'), where('status', '==', 'Placed'));
      const unsubAdmin = onSnapshot(q, (snapshot) => {
        const allPlacedOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        let myAlerts: any[] = [];

        if (userRole === 'admin') {
          myAlerts = allPlacedOrders;
        } else if (userRole === 'vendor') {
          myAlerts = allPlacedOrders.filter((o: any) => 
            o.vendorId === user.uid || (Array.isArray(o.vendorIds) && o.vendorIds.includes(user.uid))
          );
        }

        setRingingOrders(myAlerts);
        setIsRinging(myAlerts.length > 0);
      });
      return () => unsubAdmin();
    }

    // --- CUSTOMER LISTENER (Live Tracking - Completely Silent) ---
    if (userRole === 'customer') {
      const q = query(collection(firestore, 'orders'), where('userId', '==', user.uid));
      const unsubCustomer = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const order = { id: change.doc.id, ...change.doc.data() as any };
            const prevStatus = lastStatuses.current.get(order.id);
            if (prevStatus && prevStatus !== order.status && !pathname?.includes('/orders/track')) {
              setCustomerUpdate(order);
            }
          }
          snapshot.docs.forEach(d => lastStatuses.current.set(d.id, (d.data() as any).status));
        });
        if (isInitialLoad.current) {
          snapshot.docs.forEach(d => lastStatuses.current.set(d.id, (d.data() as any).status));
          isInitialLoad.current = false;
        }
      });
      return () => unsubCustomer();
    }
  }, [user, firestore, userRole, isManagementPath, pathname]);

  const handleAcceptOrder = async (orderId: string) => {
    if (!firestore || isAccepting) return;
    setIsAccepting(true);
    try {
      await updateDoc(doc(firestore, 'orders', orderId), { 
        status: 'Accepted', 
        updatedAt: serverTimestamp() 
      });
      // The alarm will stop automatically because status is no longer 'Placed'
      toast({ title: "Order Accepted! ✅", description: "Alarm silenced." });
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to accept" });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleTrackClick = () => {
    if (customerUpdate) {
      router.push(`/orders/track?id=${customerUpdate.id}`);
      setCustomerUpdate(null);
    }
  };

  if (!userRole) return null;

  return (
    <>
      {/* 1. ADMIN/VENDOR ALARM UI */}
      {(userRole === 'admin' || userRole === 'vendor') && isManagementPath && (
        <>
          {isAudioContextBlocked && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60000] animate-in slide-in-from-top-4 duration-500 w-full max-w-xs px-4">
               <button 
                onClick={() => { if (audioRef.current) { audioRef.current.play().then(() => { audioRef.current?.pause(); audioRef.current!.currentTime = 0; setIsAudioContextBlocked(false); }).catch(() => {}); } }}
                className="w-full bg-[#0B0B0B] text-white border-2 border-primary rounded-[2rem] p-5 shadow-[0_0_50px_rgba(239,68,68,0.4)] flex items-center gap-4 hover:bg-primary transition-all group active:scale-95"
               >
                  <div className="h-12 w-12 bg-primary/20 rounded-2xl flex items-center justify-center animate-pulse shrink-0">
                    <VolumeX className="h-6 w-6 text-primary group-hover:text-white" />
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-[10px] font-black uppercase tracking-widest leading-none text-primary group-hover:text-white">Alarm System Paused</span>
                    <span className="text-[12px] font-bold text-gray-400 leading-tight mt-1.5 group-hover:text-white">Tap to enable Loud Siren & Vibration for new orders</span>
                  </div>
               </button>
            </div>
          )}

          <Dialog open={ringingOrders.length > 0} onOpenChange={() => {}}>
            <DialogContent className="rounded-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white z-[50000] focus:outline-none">
              <DialogHeader className="sr-only">
                <DialogTitle>Order Alarm</DialogTitle>
              </DialogHeader>
              <div className="bg-red-600 h-6 w-full animate-pulse flex items-center justify-center">
                 <span className="text-[8px] font-black text-white uppercase tracking-[0.4em]">Emergency Order Alert</span>
              </div>
              <div className="p-10 space-y-8 flex flex-col items-center text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-100 rounded-[3rem] animate-ping opacity-30" />
                  <div className="relative h-32 w-32 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-600 border-2 border-red-200 shadow-inner">
                     <BellRing className="h-16 w-16 animate-bounce" />
                  </div>
                  <div className="absolute -top-4 -right-4 bg-red-600 text-white p-2 rounded-xl shadow-xl border-4 border-white">
                    <AlertTriangle className="h-6 w-6 animate-pulse" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-red-600">
                    NEW ORDER!<br /><span className="text-black">SIREN ON...</span>
                  </h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
                    Device Vibrating & Ringing
                  </p>
                </div>

                <div className="w-full space-y-3">
                   {ringingOrders.slice(0, 1).map((order) => (
                     <div key={order.id} className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-200 text-left relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                          <ShoppingBag className="h-20 w-20 -rotate-12" />
                        </div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ORDER: #{order.orderDisplayId || order.id.slice(-4)}</span>
                          <span className="text-2xl font-black italic text-red-600 tracking-tighter">₹{order.total?.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                             <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex flex-col">
                             <span className="text-xs font-black text-gray-800 uppercase italic truncate max-w-[180px]">{order.customerName || 'Premium User'}</span>
                             <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{order.items?.length || 0} Items In Bag</span>
                          </div>
                        </div>
                     </div>
                   ))}
                </div>

                <Button 
                  onClick={() => handleAcceptOrder(ringingOrders[0].id)} 
                  disabled={isAccepting} 
                  className="w-full h-24 bg-green-600 hover:bg-green-700 text-white rounded-[2.5rem] font-black uppercase italic text-3xl shadow-[0_20px_50px_rgba(22,163,74,0.3)] active:scale-95 transition-all border-b-8 border-green-800"
                >
                  {isAccepting ? <Loader2 className="h-10 w-10 animate-spin" /> : "ACCEPT & SILENCE"}
                </Button>
                
                <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.5em]">ShopyKart Real-time Shield</p>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* 2. CUSTOMER LIVE TRACKING UI */}
      {userRole === 'customer' && (
        <Dialog open={!!customerUpdate} onOpenChange={(val) => !val && setCustomerUpdate(null)}>
           <DialogContent className="rounded-[2.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white z-[50000] focus:outline-none bottom-4 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
              <DialogHeader className="sr-only">
                <DialogTitle>Order Status Update</DialogTitle>
              </DialogHeader>
              <div className="p-8 space-y-6 text-center flex flex-col items-center">
                 <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full animate-pulse" />
                    <div className="relative h-20 w-20 bg-primary rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-primary/20">
                       <Package className="h-10 w-10 animate-bounce" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white p-1.5 rounded-full shadow-lg border-2 border-white">
                       <Zap className="h-3.5 w-3.5" />
                    </div>
                 </div>

                 <div className="space-y-1">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">ORDER UPDATE!</h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">
                       Your order #{customerUpdate?.orderDisplayId || '...'} is now
                    </p>
                 </div>

                 <div className="bg-primary/5 px-8 py-3 rounded-2xl border border-primary/10 inline-block">
                    <span className="text-xl font-black italic uppercase text-primary tracking-tight">
                       {customerUpdate?.status}
                    </span>
                 </div>

                 <div className="w-full space-y-3">
                    <Button 
                      onClick={handleTrackClick}
                      className="w-full h-16 bg-[#0B0B0B] hover:bg-primary text-white rounded-[2rem] font-black uppercase italic shadow-xl active:scale-95 transition-all text-lg"
                    >
                       TRACK LIVE NOW
                       <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                    <button 
                      onClick={() => setCustomerUpdate(null)}
                      className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                    >
                       Dismiss
                    </button>
                 </div>
                 <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em]">ShopyKart Real-time Guard</p>
              </div>
           </DialogContent>
        </Dialog>
      )}
    </>
  );
}
