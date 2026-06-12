'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { requestPushToken } from '@/firebase/messaging';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BellRing, ShoppingBag, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Critical alert system for Admin and Vendors.
 * Features persistent looping audio and mandatory Accept modal.
 */
export function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isRinging, setIsRinging] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'vendor' | 'delivery' | 'customer' | null>(null);
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio with high-priority looping
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.loop = true;
      audioRef.current = audio;
    }
  }, []);

  // Identity & Role Detection
  useEffect(() => {
    if (!user || !firestore) return;
    
    const checkRole = async () => {
      if (user.email === 'ceo@shopykart.co.in') {
        setUserRole('admin');
        return;
      }
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
    };

    checkRole();
  }, [user, firestore]);

  // Audio Playback Controller
  useEffect(() => {
    if (!audioRef.current) return;

    if (isRinging) {
      audioRef.current.play().catch(e => {
        console.warn("Autoplay blocked: Please tap anywhere on the screen to enable order alerts.");
      });
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
      await updateDoc(doc(firestore, 'orders', orderId), { 
        status: 'Accepted',
        updatedAt: serverTimestamp(),
        lastStatusUpdate: serverTimestamp()
      });
      toast({ title: "Order Accepted! ✅", description: "The alarm has been silenced." });
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

    // 1. ADMIN & VENDOR LISTENER (Persistent Alarm)
    if (userRole === 'admin' || userRole === 'vendor') {
      const baseQuery = collection(firestore, 'orders');
      const q = userRole === 'admin' 
        ? query(baseQuery, where('status', '==', 'Placed'))
        : query(baseQuery, where('vendorId', '==', user.uid), where('status', '==', 'Placed'));

      unsubscribe = onSnapshot(q, (snap) => {
        const orders = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setNewOrders(orders);
        setIsRinging(!snap.empty);
        
        if (!snap.empty) {
          console.log(`ALARM: ${snap.size} unaccepted orders found.`);
        }
      });
    } 
    
    // 2. DELIVERY PARTNER LISTENER
    else if (userRole === 'delivery') {
      const q = query(collection(firestore, 'orders'), where('status', '==', 'Ready for Pickup'));
      unsubscribe = onSnapshot(q, (snap) => {
        setIsRinging(!snap.empty);
      });
    }

    // 3. CUSTOMER LISTENER (Silent)
    else {
      const q = query(collection(firestore, 'orders'), where('userId', '==', user.uid));
      unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const data = change.doc.data();
            toast({ title: "Order Update", description: `Your order #${data.orderDisplayId || data.id.slice(-4)} is now ${data.status}.` });
          }
        });
      });
    }

    return () => unsubscribe();
  }, [user, firestore, userRole, toast]);

  // Automatically request push token on login
  useEffect(() => {
    if (user && firestore && (userRole === 'admin' || userRole === 'vendor')) {
      const registerFCM = async () => {
        try {
          const token = await requestPushToken();
          if (token) {
            await updateDoc(doc(firestore, userRole === 'admin' ? 'app_settings/branding' : 'vendors', user.uid), {
              fcmToken: token,
              lastTokenUpdate: serverTimestamp()
            });
          }
        } catch (e) {}
      };
      registerFCM();
    }
  }, [user, firestore, userRole]);

  return (
    <>
      {/* PERSISTENT ACCEPT MODAL FOR ADMIN/VENDORS */}
      <Dialog open={newOrders.length > 0} onOpenChange={() => {}}>
        <DialogContent className="rounded-[2.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white z-[20000]">
          <div className="bg-red-600 h-2 w-full animate-pulse" />
          <div className="p-8 space-y-6 flex flex-col items-center text-center">
            <div className="h-20 w-20 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-600 border border-red-100 relative">
               <div className="absolute inset-0 bg-red-100 rounded-[2rem] animate-ping opacity-20" />
               <BellRing className="h-10 w-10 animate-bounce" />
            </div>
            
            <div className="space-y-1">
              <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                New Order<br /><span className="text-red-600">Detected!</span>
              </DialogTitle>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Action Required Immediately</p>
            </div>

            <div className="w-full space-y-3">
               {newOrders.slice(0, 1).map((order) => (
                 <div key={order.id} className="bg-gray-50 p-5 rounded-3xl border border-gray-100 text-left">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ID: #{order.orderDisplayId || order.id.slice(-4)}</span>
                       <span className="text-lg font-black italic">₹{order.total?.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
                       <ShoppingBag className="h-3.5 w-3.5 text-red-500" />
                       <span className="truncate">{order.customerName || 'Premium User'}</span>
                    </div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase mt-2 italic">
                       Alarm will stop after you accept this order.
                    </p>
                 </div>
               ))}
            </div>

            <div className="w-full flex flex-col gap-3 pt-2">
               <Button 
                onClick={() => handleAcceptOrder(newOrders[0].id)}
                disabled={isAccepting}
                className="w-full h-16 bg-green-600 hover:bg-green-700 text-white rounded-3xl font-black uppercase italic text-lg shadow-xl shadow-green-100 active:scale-95 transition-all"
               >
                 {isAccepting ? <Loader2 className="h-6 w-6 animate-spin" /> : "ACCEPT ORDER NOW"}
               </Button>
               
               <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em]">ShopyKart Real-time Guard</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FLOATING ALARM INDICATOR (Mini) */}
      {isRinging && newOrders.length === 0 && (
         <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10001] bg-red-600 text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-bounce">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Incoming Task Alert!</span>
         </div>
      )}
    </>
  );
}
