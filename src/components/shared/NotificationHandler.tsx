'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogPortal, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, BellRing, Bell, X, Bike, CheckCircle2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Global Notification & Persistent Audio Alert Handler.
 * Fixed: Interaction blocked by overlay solved. handleAction is now robust.
 */
export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  
  const [userRole, setUserRole] = useState<'admin' | 'vendor' | 'customer' | 'delivery' | null>(null);
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const [pickupAlerts, setPickupAlerts] = useState<any[]>([]);
  const [pushAlerts, setPushAlerts] = useState<any[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pickupAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      if (typeof window === 'undefined') return;

      const isAdminAuth = localStorage.getItem('admin_auth') === 'true';
      if (isAdminAuth) { 
        setUserRole('admin'); 
        return; 
      }
      
      const isDeliveryAuth = localStorage.getItem('delivery_session_active') === 'true';
      if (isDeliveryAuth) {
        setUserRole('delivery');
        return;
      }

      if (user && firestore) {
        try {
          const vendorDoc = await getDoc(doc(firestore, 'vendors', user.uid));
          if (vendorDoc.exists()) { 
            setUserRole('vendor'); 
            return; 
          }
        } catch (e) { console.debug("Role check skip"); }
      }
      setUserRole('customer');
    };
    checkRole();
  }, [user, firestore, pathname]);

  const isManagementPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || p.startsWith('/vendor') || p.startsWith('/delivery') || p.startsWith('/medical') || p.startsWith('/beauty');
  }, [pathname]);

  // 1. ORDER ALERTS (For Admin/Vendor on 'Placed' status)
  useEffect(() => {
    if (!firestore || !userRole || !isManagementPath) return;

    if (userRole === 'admin' || userRole === 'vendor') {
      const q = query(collection(firestore, 'orders'), where('status', '==', 'Placed'));
      const unsub = onSnapshot(q, (snapshot) => {
        const allPlaced = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        let targeted: any[] = [];
        
        if (userRole === 'admin') {
          targeted = allPlaced;
        } else if (userRole === 'vendor' && user) {
          const vId = String(user.uid);
          targeted = allPlaced.filter((o: any) => 
            o.vendorId === vId || (Array.isArray(o.vendorIds) && o.vendorIds.includes(vId)) || (o.items?.some((it:any) => String(it.vendorId) === vId))
          );
        }
        setRingingOrders(targeted);
        handleAudio(targeted.length > 0, 'order');
      });
      return () => unsub();
    }
  }, [user, firestore, userRole, isManagementPath]);

  // 2. PICKUP ALERTS (For Delivery Partners on 'Ready for Pickup' status)
  useEffect(() => {
    if (!firestore || userRole !== 'delivery' || !isManagementPath) return;

    const q = query(collection(firestore, 'orders'), where('status', '==', 'Ready for Pickup'));
    const unsub = onSnapshot(q, (snapshot) => {
      const availableTasks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setPickupAlerts(availableTasks);
      handleAudio(availableTasks.length > 0, 'pickup');
    });

    return () => unsub();
  }, [firestore, userRole, isManagementPath]);

  const handleAudio = (shouldPlay: boolean, type: 'order' | 'pickup') => {
    if (typeof window === 'undefined') return;
    
    const targetRef = type === 'order' ? audioRef : pickupAudioRef;
    const soundUrl = type === 'order' 
      ? 'https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3' 
      : 'https://assets.mixkit.co/active_storage/sfx/1353/1353-preview.mp3';

    if (shouldPlay) {
      if (!targetRef.current) {
        targetRef.current = new Audio(soundUrl); 
        targetRef.current.loop = true;
      }
      targetRef.current.play().catch(() => {});
    } else if (targetRef.current) {
      targetRef.current.pause();
      targetRef.current.currentTime = 0;
    }
  };

  const handleAction = async (orderId: string) => {
    if (!firestore || isAccepting || !orderId) return;
    setIsAccepting(true);
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: 'Accepted', 
        updatedAt: serverTimestamp() 
      });
      
      handleAudio(false, 'order');
      setRingingOrders([]);
      toast({ title: "Order Accepted! ✅" });
    } catch (err) { 
      toast({ variant: "destructive", title: "Failed to Accept" }); 
    } finally { 
      setIsAccepting(false); 
    }
  };

  return (
    <>
      {ringingOrders.length > 0 && (
        <Dialog open={true}>
          <DialogPortal>
            <DialogOverlay className="z-[999998] bg-black/60 backdrop-blur-sm" />
            <DialogContent 
              className="z-[999999] rounded-[3.5rem] max-w-sm p-10 flex flex-col items-center text-center border-none shadow-2xl bg-white focus:outline-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              onPointerDownOutside={(e) => e.preventDefault()}
              onEscapeKeyDown={(e) => e.preventDefault()}
            >
              <div className="bg-red-50 h-24 w-24 rounded-[2.5rem] flex items-center justify-center text-red-600 mb-6 border-4 border-red-100 animate-pulse">
                <BellRing className="h-10 w-10 animate-bounce" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-red-600 font-black italic uppercase text-2xl tracking-tighter">NEW ORDER ALERT!</DialogTitle>
              </DialogHeader>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 mb-8 italic">Customer is waiting. Accept to start preparation.</p>
              <Button 
                onClick={() => handleAction(ringingOrders[0].id)} 
                disabled={isAccepting}
                className="w-full h-18 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase text-xl shadow-xl shadow-green-100 active:scale-95 transition-all pointer-events-auto"
              >
                {isAccepting ? <Loader2 className="h-6 w-6 animate-spin" /> : "ACCEPT NOW"}
              </Button>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      )}

      {pickupAlerts.length > 0 && userRole === 'delivery' && (
        <Dialog open={true} onOpenChange={() => setPickupAlerts([])}>
          <DialogPortal>
            <DialogOverlay className="z-[999998] bg-black/60 backdrop-blur-sm" />
            <DialogContent className="z-[999999] rounded-[3.5rem] max-w-sm p-10 flex flex-col items-center text-center border-none shadow-2xl bg-white focus:outline-none fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="bg-primary/5 h-24 w-24 rounded-[2.5rem] flex items-center justify-center text-primary mb-6 border-4 border-primary/10">
                <Bike className="h-12 w-12 animate-bounce" />
              </div>
              <DialogHeader>
                <DialogTitle className="text-gray-900 font-black italic uppercase text-2xl tracking-tighter">PICKUP TASK!</DialogTitle>
              </DialogHeader>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 mb-8 italic">Order is ready at store. Check your task dashboard.</p>
              <Button onClick={() => { setPickupAlerts([]); handleAudio(false, 'pickup'); }} className="w-full h-16 bg-black text-white rounded-2xl font-black uppercase italic shadow-xl pointer-events-auto">VIEW TASKS</Button>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      )}
    </>
  );
}
