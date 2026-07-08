
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BellRing, ShoppingBag, Loader2, VolumeX, Package, User, ChevronRight, Zap, Volume2, X, AlertTriangle, Radio } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * @fileOverview ULTIMATE EMERGENCY ALARM SYSTEM v7 - ULTRA FAST & AGGRESSIVE.
 * Optimized for lightning-fast detection and continuous high-speed vibration.
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

  // 0. Path Detection: Only alarm on management pages
  const isManagementPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || 
           p.startsWith('/vendor') || 
           p.startsWith('/medical/store') || 
           p.startsWith('/beauty/store');
  }, [pathname]);

  // 1. Role Detection (CEO/Staff/Vendor)
  useEffect(() => {
    const checkRole = async () => {
      const isAdminAuth = localStorage.getItem('admin_auth') === 'true';

      if (isAdminAuth) {
        setUserRole('admin');
        return;
      }

      if (user && firestore) {
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
      }
    };
    
    checkRole();
  }, [user, firestore, pathname]);

  // 2. Initialize Audio Object with Ultra-Fast Looping
  useEffect(() => {
    if (typeof window === 'undefined' || !isManagementPath) return;

    // Fast-paced emergency siren
    const alarmUrl = 'https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3';
    const audio = new Audio(alarmUrl);
    audio.loop = true;
    audio.volume = 1.0;
    audio.preload = 'auto';
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [isManagementPath]);

  // 3. RAPID Audio & Vibration Engine
  useEffect(() => {
    let vibInterval: NodeJS.Timeout;

    if (!audioRef.current || !isManagementPath || (userRole !== 'admin' && userRole !== 'vendor')) {
      return;
    }
    
    if (isRinging && !isAudioContextBlocked) {
      // Immediate playback
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          setIsAudioContextBlocked(true);
        });
      }

      // ULTRA-FAST VIBRATION PATTERN
      if (typeof window !== 'undefined' && window.navigator.vibrate) {
        // Pattern: [Vibrate, Pause, Vibrate]
        const pattern = [400, 100, 400];
        window.navigator.vibrate(pattern);
        
        // Rapid repetition every 1.2 seconds
        vibInterval = setInterval(() => {
          window.navigator.vibrate(pattern);
        }, 1200);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      if (typeof window !== 'undefined' && window.navigator.vibrate) {
        window.navigator.vibrate(0);
      }
    }

    return () => {
      if (vibInterval) clearInterval(vibInterval);
    };
  }, [isRinging, isAudioContextBlocked, userRole, isManagementPath]);

  // 4. Real-time Database Listener - HIGH PRIORITY
  useEffect(() => {
    if (!firestore || !userRole) return;

    if ((userRole === 'admin' || userRole === 'vendor') && isManagementPath) {
      const q = query(collection(firestore, 'orders'), where('status', '==', 'Placed'));
      const unsubEmergency = onSnapshot(q, (snapshot) => {
        const allPlaced = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        let targeted: any[] = [];

        if (userRole === 'admin') {
          targeted = allPlaced;
        } else if (userRole === 'vendor' && user) {
          targeted = allPlaced.filter((o: any) => 
            o.vendorId === user.uid || (Array.isArray(o.vendorIds) && o.vendorIds.includes(user.uid))
          );
        }

        // Trigger update immediately
        setRingingOrders(targeted);
        setIsRinging(targeted.length > 0);
      }, (err) => {
        console.debug("Firestore Listener Notice:", err);
      });
      return () => unsubEmergency();
    }

    if (userRole === 'customer' && user) {
      const q = query(collection(firestore, 'orders'), where('userId', '==', user.uid));
      const unsubCustomer = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const order = { id: change.doc.id, ...change.doc.data() as any };
            const prev = lastStatuses.current.get(order.id);
            if (prev && prev !== order.status && !pathname?.includes('/orders/track')) {
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

  const handleManualUnblock = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (audioRef.current) {
      audioRef.current.load();
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          audioRef.current?.pause();
          audioRef.current!.currentTime = 0;
          setIsAudioContextBlocked(false);
          toast({ title: "System Fast-Active! 🔊", description: "Real-time rapid alarms enabled." });
        }).catch(err => {
          toast({ variant: "destructive", title: "Action Needed", description: "Click again to allow sound." });
        });
      }
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!firestore || isAccepting) return;
    setIsAccepting(true);
    try {
      await updateDoc(doc(firestore, 'orders', orderId), { 
        status: 'Accepted', 
        updatedAt: serverTimestamp() 
      });
      toast({ title: "Order Accepted!", description: "Alarm silenced." });
    } catch (err) {
      toast({ variant: "destructive", title: "Acceptance Failed" });
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <>
      {/* ⚠️ ALARM ACTIVATION BANNER - ULTRA HIGH PRIORITY */}
      {(userRole === 'admin' || userRole === 'vendor') && isManagementPath && isAudioContextBlocked && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[999999] w-full max-w-sm px-4 pointer-events-auto cursor-pointer animate-in slide-in-from-top-4 duration-700">
           <button 
            onClick={handleManualUnblock}
            className="w-full bg-black text-white border-2 border-primary rounded-[2.5rem] p-6 shadow-[0_0_80px_rgba(239,68,68,0.5)] flex items-center gap-5 hover:bg-primary transition-all active:scale-95 group relative overflow-hidden"
           >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <div className="h-14 w-14 bg-primary/20 rounded-[1.5rem] flex items-center justify-center animate-pulse shrink-0 border border-primary/20 pointer-events-none">
                <Volume2 className="h-7 w-7 text-primary group-hover:text-white" />
              </div>
              <div className="flex flex-col items-start text-left pointer-events-none">
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-primary group-hover:text-white leading-none">Alarm System</span>
                <span className="text-[14px] font-black italic uppercase text-white mt-2">TAP TO ENABLE FAST ALERTS</span>
              </div>
           </button>
        </div>
      )}

      {/* 🚨 EMERGENCY ALARM OVERLAY */}
      <Dialog open={ringingOrders.length > 0} onOpenChange={() => {}}>
        <DialogContent className="rounded-[3.5rem] max-w-sm p-0 overflow-hidden border-none shadow-[0_0_120px_rgba(239,68,68,0.4)] bg-white z-[55000] focus:outline-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Urgent: New Order Detected</DialogTitle>
            <DialogDescription>A new order has been detected and requires immediate action to stop the alarm.</DialogDescription>
          </DialogHeader>
          <div className="bg-red-600 h-10 w-full animate-pulse flex items-center justify-center border-b-4 border-black/10">
             <span className="text-[10px] font-black text-white uppercase tracking-[0.5em]">URGENT: NEW ORDER</span>
          </div>
          <div className="p-10 space-y-10 flex flex-col items-center text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-40 scale-150" />
              <div className="relative h-40 w-40 bg-red-50 rounded-[3rem] flex items-center justify-center text-red-600 border-4 border-red-100 shadow-inner">
                 <Radio className="h-20 w-20 animate-bounce" />
              </div>
              <div className="absolute -top-4 -right-4 bg-red-600 text-white p-3 rounded-2xl shadow-2xl border-4 border-white animate-pulse">
                <AlertTriangle className="h-8 w-8" />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none text-red-600">
                ALARM ON.<br /><span className="text-black">RAPID ALERT!</span>
              </h2>
              <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] bg-gray-50 px-6 py-2.5 rounded-full border border-gray-100 inline-block">
                High-Speed Vibration Active
              </p>
            </div>

            <div className="w-full space-y-4">
               {ringingOrders.slice(0, 1).map((order) => (
                 <div key={order.id} className="bg-gray-50 p-6 rounded-[2.5rem] border border-gray-200 text-left relative overflow-hidden group shadow-inner">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">ID: #{order.orderDisplayId || order.id.slice(-4)}</span>
                      <span className="text-3xl font-black italic text-red-600 tracking-tighter">₹{order.total?.toFixed(0)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-md">
                         <User className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex flex-col">
                         <span className="text-sm font-black text-gray-800 uppercase italic truncate max-w-[180px]">{order.customerName || 'Premium User'}</span>
                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{order.items?.length || 0} Products in bag</span>
                      </div>
                    </div>
                 </div>
               ))}
            </div>

            <Button 
              onClick={() => handleAcceptOrder(ringingOrders[0].id)} 
              disabled={isAccepting} 
              className="w-full h-24 bg-green-600 hover:bg-green-700 text-white rounded-[2.5rem] font-black uppercase italic text-4xl shadow-[0_30px_60px_rgba(22,163,74,0.4)] active:scale-95 transition-all border-b-[10px] border-green-800"
            >
              {isAccepting ? <Loader2 className="h-12 w-12 animate-spin" /> : "ACCEPT NOW"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 📦 CUSTOMER NOTIFICATION */}
      {userRole === 'customer' && customerUpdate && (
        <Dialog open={!!customerUpdate} onOpenChange={(val) => !val && setCustomerUpdate(null)}>
           <DialogContent className="rounded-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white z-[55000] focus:outline-none">
              <DialogHeader className="sr-only">
                <DialogTitle>Status Update</DialogTitle>
                <DialogDescription>Your order status has changed.</DialogDescription>
              </DialogHeader>
              <div className="p-10 space-y-8 text-center flex flex-col items-center">
                 <div className="relative">
                    <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full animate-pulse" />
                    <div className="relative h-24 w-24 bg-primary rounded-[1.75rem] flex items-center justify-center text-white shadow-2xl shadow-primary/20">
                       <Package className="h-12 w-12 animate-bounce" />
                    </div>
                    <div className="absolute -top-3 -right-3 bg-green-500 text-white p-2 rounded-xl shadow-lg border-4 border-white animate-in zoom-in duration-500">
                       <Zap className="h-4 w-4" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">ORDER UPDATE!</h2>
                    <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">
                       Your order #{customerUpdate?.orderDisplayId || '...'} is now
                    </p>
                 </div>

                 <div className="bg-primary/5 px-10 py-4 rounded-[1.5rem] border-2 border-dashed border-primary/20 inline-block">
                    <span className="text-2xl font-black italic uppercase text-primary tracking-tighter">
                       {customerUpdate?.status}
                    </span>
                 </div>

                 <div className="w-full space-y-4">
                    <Button 
                      onClick={() => { router.push(`/orders/track?id=${customerUpdate.id}`); setCustomerUpdate(null); }}
                      className="w-full h-18 bg-[#0B0B0B] hover:bg-primary text-white rounded-[2rem] font-black uppercase italic shadow-2xl active:scale-95 transition-all text-xl"
                    >
                       TRACK LIVE NOW
                       <ChevronRight className="h-6 w-6 ml-2" />
                    </Button>
                 </div>
              </div>
           </DialogContent>
        </Dialog>
      )}
    </>
  );
}
