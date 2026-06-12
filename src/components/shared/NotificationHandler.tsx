
'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BellRing, ShoppingBag, Loader2, AlertTriangle, Volume2 } from 'lucide-react';

/**
 * @fileOverview Critical alert system for Admin and Vendors.
 * Features persistent looping LOUD audio and mandatory Accept modal.
 */
export function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isRinging, setIsRinging] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'vendor' | 'delivery' | 'customer' | null>(null);
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio with maximum priority looping
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.loop = true;
      audio.volume = 1.0;
      audio.preload = 'auto';
      audioRef.current = audio;

      // Handle browser autoplay policy
      const unlockAudio = () => {
        if (audioRef.current) {
          audioRef.current.play().then(() => {
            audioRef.current?.pause();
            audioRef.current!.currentTime = 0;
            setNeedsInteraction(false);
            window.removeEventListener('click', unlockAudio);
            window.removeEventListener('touchstart', unlockAudio);
          }).catch(() => {
            setNeedsInteraction(true);
          });
        }
      };

      window.addEventListener('click', unlockAudio);
      window.addEventListener('touchstart', unlockAudio);
      return () => {
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
      };
    }
  }, []);

  // Identity & Role Detection
  useEffect(() => {
    if (!user || !firestore) {
      setUserRole(null);
      return;
    }
    
    const checkRole = async () => {
      // 1. Check Admin by Email
      if (user.email === 'ceo@shopykart.co.in') {
        setUserRole('admin');
        return;
      }
      
      // 2. Check Vendor Table
      const vendorDoc = await getDoc(doc(firestore, 'vendors', user.uid));
      if (vendorDoc.exists()) {
        setUserRole('vendor');
        return;
      }

      // 3. Check Delivery Table
      const partnerDoc = await getDoc(doc(firestore, 'delivery_partners', user.uid));
      if (partnerDoc.exists()) {
        setUserRole('delivery');
        return;
      }

      setUserRole('customer');
    };

    checkRole();
  }, [user, firestore]);

  // Audio Playback Controller
  useEffect(() => {
    if (!audioRef.current) return;

    if (isRinging) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn("Autoplay blocked: Alarm will sound after interaction.");
          setNeedsInteraction(true);
        });
      }
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isRinging]);

  // Accept Order Handler
  const handleAcceptOrder = async (orderId: string) => {
    if (!firestore || isAccepting) return;
    setIsAccepting(true);
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: 'Accepted',
        updatedAt: serverTimestamp()
      });
      toast({ title: "Order Accepted! ✅", description: "Alarm silenced." });
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed", description: "Could not accept order." });
    } finally {
      setIsAccepting(false);
    }
  };

  // Real-time Alarm Listeners
  useEffect(() => {
    if (!user || !firestore || !userRole) return;

    let unsubscribe: () => void = () => {};

    // ADMIN or VENDOR: Watch for "Placed" orders
    if (userRole === 'admin' || userRole === 'vendor') {
      const baseQuery = collection(firestore, 'orders');
      const q = userRole === 'admin' 
        ? query(baseQuery, where('status', '==', 'Placed'))
        : query(baseQuery, where('vendorId', '==', user.uid), where('status', '==', 'Placed'));

      unsubscribe = onSnapshot(q, (snap) => {
        const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setNewOrders(orders);
        setIsRinging(!snap.empty);
      }, (err) => {
        console.error("Snapshot error:", err);
      });
    } 
    
    // DELIVERY: Watch for "Ready for Pickup"
    else if (userRole === 'delivery') {
      const q = query(collection(firestore, 'orders'), where('status', '==', 'Ready for Pickup'));
      unsubscribe = onSnapshot(q, (snap) => {
        setIsRinging(!snap.empty);
      });
    }

    // CUSTOMER: Watch for their own order updates
    else if (userRole === 'customer') {
      const q = query(collection(firestore, 'orders'), where('userId', '==', user.uid));
      unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const data = change.doc.data();
            toast({ 
              title: "Order Update", 
              description: `Your order #${data.orderDisplayId || data.id.slice(-4)} is now ${data.status}.` 
            });
          }
        });
      });
    }

    return () => unsubscribe();
  }, [user, firestore, userRole, toast]);

  return (
    <>
      {/* Persistant Loud Alert Dialog */}
      <Dialog open={newOrders.length > 0} onOpenChange={() => {}}>
        <DialogContent className="rounded-[2.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white z-[50000] focus:outline-none">
          <div className="bg-red-600 h-3 w-full animate-pulse" />
          <div className="p-8 space-y-6 flex flex-col items-center text-center">
            <div className="h-24 w-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center text-red-600 border border-red-100 relative">
               <div className="absolute inset-0 bg-red-100 rounded-[2.5rem] animate-ping opacity-30" />
               <BellRing className="h-12 w-12 animate-bounce" />
            </div>
            
            <div className="space-y-1">
              <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter leading-none text-red-600">
                NEW ORDER!<br />RINGING LOUD
              </DialogTitle>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Accept to silence the alarm</p>
            </div>

            <div className="w-full space-y-3">
               {newOrders.slice(0, 1).map((order) => (
                 <div key={order.id} className="bg-gray-50 p-5 rounded-3xl border border-gray-100 text-left">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ID: #${order.orderDisplayId || order.id.slice(-4)}</span>
                       <span className="text-lg font-black italic text-red-600">₹{order.total?.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                       <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                       <span className="truncate">{order.customerName || 'Premium User'}</span>
                    </div>
                 </div>
               ))}
            </div>

            <div className="w-full flex flex-col gap-3">
               <Button 
                onClick={() => handleAcceptOrder(newOrders[0].id)}
                disabled={isAccepting}
                className="w-full h-20 bg-green-600 hover:bg-green-700 text-white rounded-3xl font-black uppercase italic text-xl shadow-xl shadow-green-100 active:scale-95 transition-all"
               >
                 {isAccepting ? <Loader2 className="h-8 w-8 animate-spin" /> : "ACCEPT ORDER"}
               </Button>
               <p className="text-[7px] font-black text-gray-300 uppercase tracking-[0.5em]">ShopyKart Real-time Guard</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Global "Audio Unblock" UI if needed */}
      {needsInteraction && (userRole === 'admin' || userRole === 'vendor') && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[50001] bg-[#0B0B0B] text-white px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4 border border-primary/20">
           <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary">
              <Volume2 className="h-5 w-5 animate-pulse" />
           </div>
           <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Alerts Blocked</span>
              <span className="text-[11px] font-bold text-gray-400">Tap anywhere to enable sound</span>
           </div>
        </div>
      )}

      {/* Persistent floating banner if ringing but modal closed (unlikely but safe) */}
      {isRinging && newOrders.length === 0 && (
         <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[50001] bg-red-600 text-white px-8 py-3 rounded-full shadow-[0_0_50px_rgba(239,68,68,0.5)] flex items-center gap-4 animate-bounce">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-widest italic">INCOMING TASK • RINGING LOUD</span>
         </div>
      )}
    </>
  );
}

