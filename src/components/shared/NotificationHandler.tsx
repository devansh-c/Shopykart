'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BellRing, Bike } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Global Notification Handler.
 * Fixed: Explicitly unblocked interaction and set highest z-index.
 */
export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  
  const [userRole, setUserRole] = useState<'admin' | 'vendor' | 'customer' | 'delivery' | null>(null);
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const [pickupAlerts, setPickupAlerts] = useState<any[]>([]);
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
    return p.startsWith('/admin') || p.startsWith('/vendor') || p.startsWith('/delivery');
  }, [pathname]);

  // ORDER ALERTS
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

  if (ringingOrders.length === 0 && (pickupAlerts.length === 0 || userRole !== 'delivery')) return null;

  return (
    <div className="fixed inset-0 z-[2000000] flex items-center justify-center p-6 pointer-events-none">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" />
      
      {ringingOrders.length > 0 ? (
        <div className="relative z-[2000001] bg-white rounded-[3.5rem] p-10 w-full max-w-sm flex flex-col items-center text-center shadow-2xl animate-in zoom-in duration-500 transform-gpu pointer-events-auto">
          <div className="bg-red-50 h-24 w-24 rounded-[2.5rem] flex items-center justify-center text-red-600 mb-6 border-4 border-red-100 animate-pulse">
            <BellRing className="h-10 w-10 animate-bounce" />
          </div>
          <h2 className="text-red-600 font-black italic uppercase text-2xl tracking-tighter leading-none mb-2">NEW ORDER ALERT!</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-10 italic text-center">CUSTOMER IS WAITING. ACCEPT TO START PREPARATION.</p>
          
          <button 
            onClick={() => handleAction(ringingOrders[0].id)} 
            disabled={isAccepting}
            className="w-full h-18 bg-green-600 hover:bg-green-700 text-white rounded-[1.5rem] font-black uppercase text-xl shadow-xl shadow-green-100 active:scale-95 transition-all flex items-center justify-center pointer-events-auto relative cursor-pointer"
          >
            {isAccepting ? <Loader2 className="h-6 w-6 animate-spin" /> : "ACCEPT NOW"}
          </button>
        </div>
      ) : pickupAlerts.length > 0 && userRole === 'delivery' && (
        <div className="relative z-[2000001] bg-white rounded-[3.5rem] p-10 w-full max-w-sm flex flex-col items-center text-center shadow-2xl animate-in zoom-in duration-500 transform-gpu pointer-events-auto">
          <div className="bg-primary/5 h-24 w-24 rounded-[2.5rem] flex items-center justify-center text-primary mb-6 border-4 border-primary/10 animate-pulse">
            <Bike className="h-12 w-12 animate-bounce" />
          </div>
          <h2 className="text-gray-900 font-black italic uppercase text-2xl tracking-tighter leading-none mb-2">PICKUP TASK!</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-10 italic text-center">ORDER IS READY AT STORE. CHECK YOUR TASK DASHBOARD.</p>
          
          <button 
            onClick={() => { setPickupAlerts([]); handleAudio(false, 'pickup'); }} 
            className="w-full h-18 bg-[#0B0B0B] text-white rounded-[1.5rem] font-black uppercase text-lg shadow-xl active:scale-95 transition-all pointer-events-auto relative cursor-pointer"
          >
            VIEW TASKS
          </button>
        </div>
      )}
    </div>
  );
}
