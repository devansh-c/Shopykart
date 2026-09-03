'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Radio, Loader2, BellRing, Volume2, Bike, MapPin, MessageSquare, Sparkles, AlertTriangle, Info, Bell, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { format } from 'date-fns';

/**
 * @fileOverview Global Notification & Urgent Alert Handler.
 * Enhanced: Now handles Direct Messaging (Push Alerts) from Admin to Customers.
 */
export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  
  const [userRole, setUserRole] = useState<'admin' | 'vendor' | 'customer' | 'delivery' | null>(null);
  const [userData, setUserData] = useState<any>(null);
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
            setUserData(partnerSnap.data());
            return;
          }
        } catch (e) {}
      }

      if (user && firestore) {
        try {
          const vendorDoc = await getDoc(doc(firestore, 'vendors', user.uid));
          if (vendorDoc.exists()) { 
            setUserRole('vendor'); 
            setUserData(vendorDoc.data());
            return; 
          }
          setUserRole('customer');
        } catch (e) { setUserRole('customer'); }
      }
    };
    checkRole();
  }, [user, firestore]);

  const isManagementPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || p.startsWith('/vendor') || p.startsWith('/delivery') || p.startsWith('/medical') || p.startsWith('/beauty');
  }, [pathname]);

  // 1. ORDER ALERTS (FOR ADMIN/VENDOR/DELIVERY)
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
          targeted = allPlaced.filter((o: any) => 
            o.vendorId === user.uid || 
            (Array.isArray(o.vendorIds) && o.vendorIds.includes(user.uid)) ||
            o.items?.some((it:any) => it.vendorId === user.uid)
          );
        }
        
        setRingingOrders(targeted);
        handleAudio(targeted.length > 0);
      }, (err) => {
        console.warn("Ringing listener restricted:", err.message);
      });
      return () => unsub();
    }

    if (userRole === 'delivery' && userData) {
      const q = query(collection(firestore, 'orders'), where('status', '==', 'Ready for Pickup'));
      const unsub = onSnapshot(q, (snapshot) => {
        const allReady = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        const targeted = allReady.filter((o: any) => {
          if (o.deliveryPartnerId) return false;
          const zoneMatch = o.zoneId === userData.zoneId;
          return zoneMatch || !userData.assignedPincode;
        });

        setRingingOrders(targeted);
        handleAudio(targeted.length > 0);
      });
      return () => unsub();
    }
  }, [user, firestore, userRole, userData, isManagementPath]);

  // 2. PUSH ALERTS / DIRECT MESSAGES (FOR CUSTOMERS)
  useEffect(() => {
    if (!firestore || !user || userRole !== 'customer' || isManagementPath) return;

    // Listen for new notifications for this specific user
    const q = query(
      collection(firestore, 'users', user.uid, 'notifications'), 
      where('read', '==', false),
      where('isUrgent', '==', true),
      orderBy('timestamp', 'desc'),
      limit(1)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const newAlerts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (newAlerts.length > 0) {
        setPushAlerts(newAlerts);
        playBellSound();
      }
    });

    // Also listen for Global Broadcasts
    const globalQ = query(collection(firestore, 'broadcasts'), orderBy('timestamp', 'desc'), limit(1));
    const globalUnsub = onSnapshot(globalQ, (snapshot) => {
      if (snapshot.empty) return;
      const broadcast = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() as any };
      
      // Check if already shown in this session to avoid annoyance
      const lastShown = sessionStorage.getItem(`shown_broadcast_${broadcast.id}`);
      const isFresh = (Date.now() - (broadcast.timestamp?.seconds * 1000 || 0)) < 3600000; // Last 1 hour

      if (!lastShown && isFresh) {
        setPushAlerts(prev => [...prev, broadcast]);
        playBellSound();
      }
    });

    return () => { unsub(); globalUnsub(); };
  }, [user, firestore, userRole, isManagementPath]);

  const handleAudio = (shouldPlay: boolean) => {
    if (typeof window === 'undefined') return;
    if (shouldPlay) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3'); 
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(() => {});
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  const playBellSound = () => {
    if (typeof window === 'undefined') return;
    if (!bellAudioRef.current) {
      bellAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1350/1356-preview.mp3'); // A shorter chime
    }
    bellAudioRef.current.play().catch(() => {});
  };

  const handleAction = async (orderId: string) => {
    if (!firestore || isAccepting || !user) return;
    setIsAccepting(true);
    try {
      const nextStatus = userRole === 'delivery' ? 'Picked Up' : 'Accepted';
      const updateData: any = { status: nextStatus, updatedAt: serverTimestamp() };
      if (userRole === 'delivery') {
        updateData.deliveryPartnerId = user.uid;
        updateData.deliveryPartnerName = userData?.fullName || 'Partner';
        updateData.deliveryPartnerPhone = userData?.phone || '';
      }
      await updateDoc(doc(firestore, 'orders', orderId), updateData);
      toast({ title: userRole === 'delivery' ? "Pickup Accepted! 📦" : "Order Accepted!" });
      handleAudio(false);
      setRingingOrders([]);
    } catch (err) { toast({ variant: "destructive", title: "Action Failed" }); }
    finally { setIsAccepting(false); }
  };

  const markAlertAsRead = async (alert: any) => {
    setPushAlerts(prev => prev.filter(a => a.id !== alert.id));
    if (alert.target === 'all') {
      sessionStorage.setItem(`shown_broadcast_${alert.id}`, 'true');
    } else if (user && firestore) {
      await updateDoc(doc(firestore, 'users', user.uid, 'notifications', alert.id), { read: true });
    }
  };

  const currentPush = pushAlerts[0];

  return (
    <>
      {/* 1. ORDER RINGING DIALOG */}
      {ringingOrders.length > 0 && (
        <Dialog open={true} onOpenChange={() => {}}>
          <DialogContent className="rounded-[3.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white z-[55000] focus:outline-none">
            <DialogHeader className="p-10 pb-2">
              <DialogTitle className="text-center text-red-600 font-black italic uppercase text-2xl tracking-tighter">
                {userRole === 'delivery' ? 'New Pickup Alert' : 'Urgent Order Alert'}
              </DialogTitle>
            </DialogHeader>
            <div className="bg-red-600 h-10 w-full animate-pulse flex items-center justify-center border-b-4 border-black/10">
               <div className="flex items-center gap-2">
                 <BellRing className="h-4 w-4 text-white animate-ring" />
                 <span className="text-[10px] font-black text-white uppercase tracking-[0.5em]">SYSTEM RINGING</span>
               </div>
            </div>
            <div className="p-10 pt-4 space-y-10 flex flex-col items-center text-center">
              <div className="relative">
                 <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-20" />
                 <div className="relative h-32 w-32 bg-red-50 rounded-[3rem] flex items-center justify-center text-red-600 border-4 border-red-100 shadow-inner">
                    {userRole === 'delivery' ? <Bike className="h-16 w-16 animate-bounce" /> : <Radio className="h-16 w-16 animate-bounce" />}
                 </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-red-600 leading-none">
                   {userRole === 'delivery' ? 'PICKUP READY!' : 'NEW ORDER!'}
                </h2>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Order #{ringingOrders[0]?.customerOrderNumber || '...'}</p>
              </div>
              <Button onClick={() => handleAction(ringingOrders[0].id)} disabled={isAccepting} className="w-full h-20 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black uppercase italic text-2xl border-b-[6px] border-green-800 active:translate-y-1 active:border-b-0 transition-all shadow-xl shadow-green-200">
                {isAccepting ? <Loader2 className="h-8 w-8 animate-spin" /> : (userRole === 'delivery' ? "ACCEPT PICKUP" : "ACCEPT NOW")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 2. CUSTOMER PUSH ALERT POPUP */}
      {currentPush && (
        <Dialog open={true} onOpenChange={() => markAlertAsRead(currentPush)}>
          <DialogContent className="rounded-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white z-[60000] focus:outline-none">
            <div className={cn(
              "h-2 w-full",
              currentPush.type === 'alert' ? "bg-amber-500" : currentPush.type === 'promo' ? "bg-green-500" : "bg-blue-600"
            )} />
            
            <div className="p-8 space-y-8 flex flex-col items-center text-center relative">
               <button onClick={() => markAlertAsRead(currentPush)} className="absolute top-6 right-6 h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 active:scale-90 transition-transform"><X className="h-5 w-5" /></button>
               
               <div className="relative">
                  <div className="absolute inset-0 bg-primary/5 rounded-full blur-2xl animate-pulse" />
                  <div className={cn(
                    "relative h-24 w-24 rounded-[2rem] flex items-center justify-center border-4 border-white shadow-xl",
                    currentPush.type === 'alert' ? "bg-amber-50 text-amber-500" : currentPush.type === 'promo' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                  )}>
                     {currentPush.type === 'alert' ? <AlertTriangle className="h-10 w-10" /> : currentPush.type === 'promo' ? <Sparkles className="h-10 w-10 animate-pulse" /> : <Info className="h-10 w-10" />}
                  </div>
                  <div className="absolute -top-2 -right-2 bg-white p-2 rounded-xl shadow-lg border">
                     <Bell className="h-4 w-4 text-primary animate-ring" />
                  </div>
               </div>

               <div className="space-y-3">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-tight">{currentPush.title}</h3>
                  <p className="text-xs font-bold text-gray-600 uppercase leading-relaxed tracking-tight italic">
                    "{currentPush.message}"
                  </p>
               </div>

               <Button 
                onClick={() => markAlertAsRead(currentPush)}
                className={cn(
                  "w-full h-16 rounded-2xl font-black uppercase italic text-sm tracking-widest shadow-xl transition-all",
                  currentPush.type === 'alert' ? "bg-amber-600 shadow-amber-100" : currentPush.type === 'promo' ? "bg-green-600 shadow-green-100" : "bg-blue-600 shadow-blue-100"
                )}
               >
                 OKAY, GOT IT!
               </Button>
               
               <p className="text-[8px] font-black text-gray-300 uppercase tracking-[0.4em]">ShopyKart Elite Network</p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
