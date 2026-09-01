'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Radio, Loader2, BellRing, Volume2, Bike, MapPin } from 'lucide-react';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview Global Notification & Urgent Alert Handler.
 * Specialized for Admin, Biz, and Tow variants to ensure ringing alerts.
 * Added: Ringing logic for Delivery Partners when order is "Ready for Pickup" in their zone.
 */
export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  
  const [userRole, setUserRole] = useState<'admin' | 'vendor' | 'customer' | 'delivery' | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const askPermissions = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          try {
             setTimeout(() => Notification.requestPermission(), 5000);
          } catch (e) {
            console.warn("Notification permission rejected");
          }
        }
      }
    };
    askPermissions();
  }, []);

  useEffect(() => {
    const checkRole = async () => {
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

  useEffect(() => {
    if (!firestore || !userRole || !isManagementPath) return;

    // 1. ADMIN & VENDOR: Listen for "Placed" orders
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
      });
      return () => unsub();
    }

    // 2. DELIVERY PARTNER: Listen for "Ready for Pickup" orders in their zone
    if (userRole === 'delivery' && userData) {
      const q = query(
        collection(firestore, 'orders'), 
        where('status', '==', 'Ready for Pickup')
      );
      const unsub = onSnapshot(q, (snapshot) => {
        const allReady = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Filter by partner's assigned zone/pincode
        const targeted = allReady.filter((o: any) => {
          // If order has no delivery partner assigned yet
          if (o.deliveryPartnerId) return false;
          
          const zoneMatch = o.zoneId === userData.zoneId;
          const pincodeMatch = o.pincode === userData.assignedPincode;
          return zoneMatch || pincodeMatch || !userData.assignedPincode; // Default to all if no area set
        });

        setRingingOrders(targeted);
        handleAudio(targeted.length > 0);
      });
      return () => unsub();
    }

  }, [user, firestore, userRole, userData, isManagementPath, toast]);

  const handleAudio = (shouldPlay: boolean) => {
    if (shouldPlay) {
      if (!audioRef.current) {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3'); 
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(() => {
        toast({ title: "Task Alert!", description: "New order needs attention." });
      });
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  const handleAction = async (orderId: string) => {
    if (!firestore || isAccepting || !user) return;
    setIsAccepting(true);
    try {
      const nextStatus = userRole === 'delivery' ? 'Picked Up' : 'Accepted';
      const updateData: any = { 
        status: nextStatus, 
        updatedAt: serverTimestamp() 
      };

      if (userRole === 'delivery') {
        updateData.deliveryPartnerId = user.uid;
        updateData.deliveryPartnerName = userData?.fullName || 'Partner';
        updateData.deliveryPartnerPhone = userData?.phone || '';
      }

      await updateDoc(doc(firestore, 'orders', orderId), updateData);
      toast({ title: userRole === 'delivery' ? "Pickup Accepted! 📦" : "Order Accepted!" });
      
      handleAudio(false);
      setRingingOrders([]);
    } catch (err) { 
      toast({ variant: "destructive", title: "Action Failed" }); 
    } finally { 
      setIsAccepting(false); 
    }
  };

  return (
    <Dialog open={ringingOrders.length > 0} onOpenChange={() => {}}>
      <DialogContent className="rounded-[3.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white z-[55000] focus:outline-none">
        <DialogHeader className="p-10 pb-2">
          <DialogTitle className="text-center text-red-600 font-black italic uppercase text-2xl tracking-tighter">
            {userRole === 'delivery' ? 'New Pickup Alert' : 'Urgent Order Alert'}
          </DialogTitle>
          <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Action required for a new incoming task.</DialogDescription>
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
             <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-red-50">
                <Volume2 className="h-5 w-5 text-red-600" />
             </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-red-600 leading-none">
               {userRole === 'delivery' ? 'PICKUP READY!' : 'NEW ORDER!'}
            </h2>
            <div className="flex flex-col gap-1">
               <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  Order #{ringingOrders[0]?.customerOrderNumber || '...'}
               </p>
               <div className="flex items-center justify-center gap-1.5 text-primary">
                  <MapPin className="h-3 w-3" />
                  <span className="text-[10px] font-bold uppercase">{ringingOrders[0]?.restaurantName || 'ShopyKart Hub'}</span>
               </div>
            </div>
          </div>

          <Button 
            onClick={() => handleAction(ringingOrders[0].id)} 
            disabled={isAccepting} 
            className="w-full h-20 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black uppercase italic text-2xl border-b-[6px] border-green-800 active:translate-y-1 active:border-b-0 transition-all shadow-xl shadow-green-200"
          >
            {isAccepting ? <Loader2 className="h-8 w-8 animate-spin" /> : (userRole === 'delivery' ? "ACCEPT PICKUP" : "ACCEPT NOW")}
          </Button>
          
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Alert will stop once accepted</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
