
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, BellRing, MessageSquare, Bell, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Global Notification & Urgent Alert Handler.
 * Robust format handling to prevent crashes.
 * Added: Defensive checks for alert data to prevent errors on customer app.
 */
export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  
  const [userRole, setUserRole] = useState<'admin' | 'vendor' | 'customer' | 'delivery' | null>(null);
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const [pushAlerts, setPushAlerts] = useState<any[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bellAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      if (typeof window === 'undefined') return;

      const isAdminAuth = localStorage.getItem('admin_auth') === 'true';
      if (isAdminAuth) { setUserRole('admin'); return; }
      
      const isDeliveryAuth = localStorage.getItem('delivery_session_active') === 'true';
      if (isDeliveryAuth && user && firestore) {
        try {
          const partnerSnap = await getDoc(doc(firestore, 'delivery_partners', user.uid));
          if (partnerSnap.exists()) {
            setUserRole('delivery');
            return;
          }
        } catch (e) {}
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
        setUserRole('customer'); // Default to customer for anonymous
      }
    };
    checkRole();
  }, [user, firestore]);

  const isManagementPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || p.startsWith('/vendor') || p.startsWith('/delivery') || p.startsWith('/medical') || p.startsWith('/beauty');
  }, [pathname]);

  // ORDER ALERTS (For Admin/Vendor)
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
            o.vendorId === user.uid || (o.items?.some((it:any) => it.vendorId === user.uid))
          );
        }
        setRingingOrders(targeted);
        handleAudio(targeted.length > 0);
      });
      return () => unsub();
    }
  }, [user, firestore, userRole, isManagementPath]);

  // PUSH ALERTS FOR CUSTOMERS
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
      
      // Robust Check: Ensure data exists before setting state
      if (newAlerts[0] && (newAlerts[0].title || newAlerts[0].message)) {
        setPushAlerts(newAlerts);
        playBellSound();
      }
    }, (err) => {
      console.debug("Notification listener restricted (expected for some auth states)");
    });

    return () => unsub();
  }, [user, firestore, userRole, isManagementPath]);

  const handleAudio = (shouldPlay: boolean) => {
    if (typeof window === 'undefined') return;
    if (shouldPlay) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3'); 
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(() => {});
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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
      handleAudio(false);
    } catch (err) { toast({ variant: "destructive", title: "Failed" }); }
    finally { setIsAccepting(false); }
  };

  const markAlertAsRead = async (alert: any) => {
    setPushAlerts([]);
    if (user && firestore && alert?.id) {
      try {
        await updateDoc(doc(firestore, 'users', user.uid, 'notifications', alert.id), { read: true });
      } catch (e) {}
    }
  };

  const currentPush = pushAlerts[0];

  return (
    <>
      {ringingOrders.length > 0 && (
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent className="rounded-[3.5rem] max-w-sm p-10 flex flex-col items-center text-center border-none shadow-2xl bg-white z-[60000]">
            <DialogHeader><DialogTitle className="text-red-600 font-black italic uppercase text-2xl">URGENT ORDER!</DialogTitle></DialogHeader>
            <div className="bg-red-50 h-24 w-24 rounded-[2rem] flex items-center justify-center text-red-600 mb-6 border-4 border-red-100"><BellRing className="h-10 w-10 animate-bounce" /></div>
            <h2 className="text-xl font-black mb-6 italic uppercase">New Order Received</h2>
            <Button onClick={() => handleAction(ringingOrders[0].id)} className="w-full h-16 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase text-xl shadow-xl">ACCEPT NOW</Button>
          </DialogContent>
        </Dialog>
      )}

      {currentPush && (
        <Dialog open={true} onOpenChange={() => markAlertAsRead(currentPush)}>
          <DialogContent className="rounded-[3rem] max-w-sm p-8 flex flex-col items-center text-center border-none shadow-2xl bg-white z-[70000] focus:outline-none">
            <button onClick={() => markAlertAsRead(currentPush)} className="absolute top-6 right-6 h-8 w-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 active:scale-90"><X className="h-4 w-4" /></button>
            <div className="h-20 w-20 bg-primary/5 rounded-[2rem] flex items-center justify-center text-primary mb-6 shadow-inner"><Bell className="h-10 w-10 animate-ring" /></div>
            <div className="space-y-2 mb-8">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">{currentPush.title || 'Broadcast Alert'}</h3>
              <p className="text-xs font-bold text-gray-600 uppercase italic">"{currentPush.message}"</p>
            </div>
            <Button onClick={() => markAlertAsRead(currentPush)} className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic">GOT IT!</Button>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
