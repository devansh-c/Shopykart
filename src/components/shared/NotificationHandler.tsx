
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, BellRing, MessageSquare, Bell, X, Bike, CheckCircle2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Global Notification & Persistent Audio Alert Handler.
 * Ringing logic for Admin/Vendor (New Order) and Delivery (Ready for Pickup).
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
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      if (typeof window === 'undefined') return;

      const isAdminAuth = localStorage.getItem('admin_auth') === 'true';
      if (isAdminAuth) { setUserRole('admin'); return; }
      
      const isDeliveryAuth = localStorage.getItem('delivery_session_active') === 'true';
      if (isDeliveryAuth && user && firestore) {
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
          setUserRole('customer');
        } catch (e) { setUserRole('customer'); }
      } else {
        setUserRole('customer');
      }
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
        
        if (userRole === 'admin') targeted = allPlaced;
        else if (userRole === 'vendor' && user) {
          targeted = allPlaced.filter((o: any) => 
            o.vendorId === user.uid || (o.items?.some((it:any) => String(it.vendorId) === user.uid))
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
      // Filter by zone/pincode if needed, for now ring all available tasks in dashboard
      setPickupAlerts(availableTasks);
      handleAudio(availableTasks.length > 0, 'pickup');
    });

    return () => unsub();
  }, [firestore, userRole, isManagementPath]);

  // 3. PUSH ALERTS FOR CUSTOMERS
  useEffect(() => {
    if (!firestore || !user || userRole !== 'customer' || isManagementPath) return;

    const q = query(
      collection(firestore, 'users', user.uid, 'notifications'), 
      where('read', '==', false),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      const newAlerts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (newAlerts[0] && (newAlerts[0].title || newAlerts[0].message)) {
        setPushAlerts(newAlerts);
        playBellSound();
      }
    });

    return () => unsub();
  }, [user, firestore, userRole, isManagementPath]);

  const handleAudio = (shouldPlay: boolean, type: 'order' | 'pickup') => {
    if (typeof window === 'undefined') return;
    
    const targetRef = type === 'order' ? audioRef : pickupAudioRef;
    const soundUrl = type === 'order' 
      ? 'https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3' // Siren for Admin/Vendor
      : 'https://assets.mixkit.co/active_storage/sfx/1353/1353-preview.mp3'; // Bell for Delivery

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

  const playBellSound = () => {
    if (typeof window === 'undefined') return;
    try {
      if (!bellAudioRef.current) {
        bellAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1350/1350-preview.mp3');
      }
      bellAudioRef.current.play().catch(() => {});
    } catch (e) {}
  };

  const handleAction = async (orderId: string) => {
    if (!firestore || isAccepting || !user) return;
    setIsAccepting(true);
    try {
      await updateDoc(doc(firestore, 'orders', orderId), { status: 'Accepted', updatedAt: serverTimestamp() });
      setRingingOrders([]);
      handleAudio(false, 'order');
    } catch (err) { toast({ variant: "destructive", title: "Failed" }); }
    finally { setIsAccepting(false); }
  };

  return (
    <>
      {/* PERSISTENT MODAL FOR NEW ORDER */}
      {ringingOrders.length > 0 && (
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent className="rounded-[3.5rem] max-w-sm p-10 flex flex-col items-center text-center border-none shadow-2xl bg-white z-[60000]">
            <div className="bg-red-50 h-24 w-24 rounded-[2.5rem] flex items-center justify-center text-red-600 mb-6 border-4 border-red-100 animate-pulse">
               <BellRing className="h-10 w-10 animate-bounce" />
            </div>
            <DialogHeader>
               <DialogTitle className="text-red-600 font-black italic uppercase text-2xl tracking-tighter">NEW ORDER ALERT!</DialogTitle>
            </DialogHeader>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 mb-8 italic">Customer is waiting. Accept to start preparation.</p>
            <Button onClick={() => handleAction(ringingOrders[0].id)} className="w-full h-18 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase text-xl shadow-xl shadow-green-100 active:scale-95 transition-all">ACCEPT NOW</Button>
          </DialogContent>
        </Dialog>
      )}

      {/* PERSISTENT MODAL FOR DELIVERY PICKUP */}
      {pickupAlerts.length > 0 && userRole === 'delivery' && (
        <Dialog open={true} onOpenChange={() => setPickupAlerts([])}>
          <DialogContent className="rounded-[3.5rem] max-w-sm p-10 flex flex-col items-center text-center border-none shadow-2xl bg-white z-[60000]">
            <div className="bg-primary/5 h-24 w-24 rounded-[2.5rem] flex items-center justify-center text-primary mb-6 border-4 border-primary/10">
               <Bike className="h-12 w-12 animate-bounce" />
            </div>
            <DialogHeader>
               <DialogTitle className="text-gray-900 font-black italic uppercase text-2xl tracking-tighter">PICKUP TASK!</DialogTitle>
            </DialogHeader>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-2 mb-8 italic">Order is ready at store. Check your task dashboard.</p>
            <Button onClick={() => { setPickupAlerts([]); handleAudio(false, 'pickup'); }} className="w-full h-16 bg-black text-white rounded-2xl font-black uppercase italic shadow-xl">VIEW TASKS</Button>
          </DialogContent>
        </Dialog>
      )}

      {/* CUSTOMER PUSH ALERTS */}
      {pushAlerts.length > 0 && (
        <Dialog open={true} onOpenChange={() => setPushAlerts([])}>
          <DialogContent className="rounded-[3rem] max-w-sm p-8 flex flex-col items-center text-center border-none shadow-2xl bg-white z-[70000] focus:outline-none">
            <button onClick={() => setPushAlerts([])} className="absolute top-6 right-6 h-8 w-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 active:scale-90"><X className="h-4 w-4" /></button>
            <div className="h-20 w-20 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary mb-6 shadow-inner border border-primary/10"><CheckCircle2 className="h-10 w-10 animate-ring" /></div>
            <div className="space-y-2 mb-8">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">{pushAlerts[0].title}</h3>
              <p className="text-[11px] font-bold text-gray-500 uppercase italic">"{pushAlerts[0].message}"</p>
            </div>
            <Button onClick={() => setPushAlerts([])} className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic shadow-lg">DISMISS</Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
