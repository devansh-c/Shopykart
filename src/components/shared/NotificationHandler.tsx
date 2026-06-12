'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BellRing, ShoppingBag, Loader2, VolumeX } from 'lucide-react';

/**
 * @fileOverview Critical Alert System.
 * EXCLUSIVE FOR ADMIN & VENDORS. Customers are strictly excluded to ensure they never hear background alarms.
 */
export function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isRinging, setIsRinging] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'vendor' | 'delivery' | 'customer' | null>(null);
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isAudioContextBlocked, setIsAudioContextBlocked] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Role Detection (Strict & Early)
  useEffect(() => {
    if (!user || !firestore) {
      setUserRole(null);
      return;
    }
    
    const checkRole = async () => {
      // Admin check via email
      if (user.email === 'ceo@shopykart.co.in') {
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
        
        // If none of the above, it's a customer
        setUserRole('customer');
      } catch (e) {
        setUserRole('customer');
      }
    };
    
    checkRole();
  }, [user, firestore]);

  // 2. Initialize Audio ONLY for Admin/Vendor
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (userRole === 'customer') return; // Strictly ignore customers

    const alarmUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';
    const audio = new Audio(alarmUrl);
    audio.loop = true;
    audio.volume = 1.0;
    audio.preload = 'auto';
    audioRef.current = audio;

    const wakeUpAudio = () => {
      if (audioRef.current && (userRole === 'admin' || userRole === 'vendor')) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          audioRef.current!.currentTime = 0;
          setIsAudioContextBlocked(false);
        }).catch(() => {
          setIsAudioContextBlocked(true);
        });
      }
    };

    window.addEventListener('click', wakeUpAudio, { once: true });
    window.addEventListener('touchstart', wakeUpAudio, { once: true });
    
    return () => {
      window.removeEventListener('click', wakeUpAudio);
      window.removeEventListener('touchstart', wakeUpAudio);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [userRole]);

  // 3. Persistent Ringing Logic (Admin/Vendor Only)
  useEffect(() => {
    if (!audioRef.current || userRole === 'customer') return;
    
    if (isRinging && !isAudioContextBlocked) {
      audioRef.current.play().catch(() => {
        setIsAudioContextBlocked(true);
      });
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isRinging, isAudioContextBlocked, userRole]);

  // 4. Multi-Store Order Listener (Real-time)
  useEffect(() => {
    if (!user || !firestore || !userRole || userRole === 'customer') return;

    const q = query(collection(firestore, 'orders'), where('status', '==', 'Placed'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allPlacedOrders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      let myAlerts: any[] = [];

      if (userRole === 'admin') {
        myAlerts = allPlacedOrders;
      } else if (userRole === 'vendor') {
        myAlerts = allPlacedOrders.filter((order: any) => 
          order.items?.some((item: any) => item.vendorId === user.uid)
        );
      } else if (userRole === 'delivery') {
        myAlerts = allPlacedOrders.filter((o: any) => o.status === 'Ready for Pickup');
      }

      setRingingOrders(myAlerts);
      setIsRinging(myAlerts.length > 0);
    });

    return () => unsubscribe();
  }, [user, firestore, userRole]);

  const handleAcceptOrder = async (orderId: string) => {
    if (!firestore || isAccepting) return;
    setIsAccepting(true);
    try {
      await updateDoc(doc(firestore, 'orders', orderId), { 
        status: 'Accepted',
        updatedAt: serverTimestamp()
      });
      toast({ title: "Order Accepted! ✅" });
    } catch (err) {
      toast({ variant: "destructive", title: "Failed to accept" });
    } finally {
      setIsAccepting(false);
    }
  };

  // If customer, render nothing at all to save resources and ensure zero noise
  if (userRole === 'customer' || !userRole) return null;

  return (
    <>
      {isAudioContextBlocked && (userRole === 'admin' || userRole === 'vendor') && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60000] animate-in slide-in-from-top-4 duration-500">
           <Button 
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.play().then(() => {
                  audioRef.current?.pause();
                  audioRef.current!.currentTime = 0;
                  setIsAudioContextBlocked(false);
                }).catch(() => {});
              }
            }}
            className="bg-[#0B0B0B] text-white border-2 border-primary rounded-full px-8 py-7 shadow-[0_0_50px_rgba(239,68,68,0.3)] flex items-center gap-4 hover:bg-primary transition-all group"
           >
              <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
                <VolumeX className="h-6 w-6 text-primary group-hover:text-white" />
              </div>
              <div className="flex flex-col items-start">
                 <span className="text-[11px] font-black uppercase tracking-widest leading-none">Alarm System Paused</span>
                 <span className="text-[13px] font-bold text-gray-400 leading-none mt-1.5 group-hover:text-white">Tap to Activate Loud Order Bell</span>
              </div>
           </Button>
        </div>
      )}

      <Dialog open={ringingOrders.length > 0} onOpenChange={() => {}}>
        <DialogContent className="rounded-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white z-[50000] focus:outline-none">
          <div className="bg-red-600 h-4 w-full animate-pulse" />
          <div className="p-10 space-y-8 flex flex-col items-center text-center">
            <div className="h-28 w-28 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-600 border border-red-100 relative">
               <div className="absolute inset-0 bg-red-100 rounded-[2.5rem] animate-ping opacity-30" />
               <BellRing className="h-14 w-14 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-4xl font-black italic uppercase tracking-tighter leading-none text-red-600">
                NEW ORDER!<br />RINGING...
              </DialogTitle>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Accept to silence the alarm</p>
            </div>

            <div className="w-full space-y-4">
               {ringingOrders.slice(0, 1).map((order) => {
                 const storeNames = Array.from(new Set(order.items?.map((i: any) => i.restaurantName).filter(Boolean)));
                 if (storeNames.length === 0 && order.restaurantName) storeNames.push(order.restaurantName);
                 
                 return (
                   <div key={order.id} className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-left relative overflow-hidden">
                      <div className="flex justify-between items-center mb-3">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ID: #{order.orderDisplayId || order.id.slice(-4)}</span>
                         <span className="text-xl font-black italic text-red-600">₹{order.total?.toFixed(2)}</span>
                      </div>
                      <div className="space-y-2">
                         <div className="flex items-center gap-2 text-xs font-black text-gray-800 uppercase italic">
                            <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                            <span className="truncate">{order.customerName || 'Premium User'}</span>
                         </div>
                         <div className="flex flex-wrap gap-1.5 mt-2">
                            {storeNames.map((name: any, idx) => (
                              <span key={idx} className="bg-white px-2 py-1 rounded-md border border-gray-200 text-[8px] font-black uppercase text-gray-500">
                                {name}
                              </span>
                            ))}
                         </div>
                      </div>
                   </div>
                 );
               })}
            </div>

            <div className="w-full space-y-3">
               <Button 
                onClick={() => handleAcceptOrder(ringingOrders[0].id)}
                disabled={isAccepting}
                className="w-full h-20 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black uppercase italic text-2xl shadow-xl shadow-green-100 active:scale-95 transition-all"
               >
                 {isAccepting ? <Loader2 className="h-8 w-8 animate-spin" /> : "ACCEPT ORDER"}
               </Button>
               <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.5em]">ShopyKart Real-time Guard</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
