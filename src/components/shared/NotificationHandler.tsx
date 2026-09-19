'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BellRing, Bike, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Global Notification Handler - Unblocked Interaction.
 * Fixed: Added pointer-events-none to overlay and proper z-index to allow back-panel clicks.
 */
export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  
  const [userRole, setUserRole] = useState<'admin' | 'vendor' | 'customer' | 'delivery' | null>(null);
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // ORDER ALERTS LISTENER
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
        
        // Sound Management
        if (targeted.length > 0) {
          if (!audioRef.current) {
            audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3');
            audioRef.current.loop = true;
          }
          audioRef.current.play().catch(() => {});
        } else if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      });
      return () => unsub();
    }
  }, [user, firestore, userRole, isManagementPath]);

  const handleAcceptOrder = async (orderId: string) => {
    if (!firestore || isAccepting || !orderId) return;
    setIsAccepting(true);
    try {
      const orderRef = doc(firestore, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: 'Accepted', 
        updatedAt: serverTimestamp() 
      });
      
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setRingingOrders([]);
      toast({ title: "Order Accepted! ✅" });
    } catch (err) { 
      toast({ variant: "destructive", title: "Failed to Accept" }); 
    } finally { 
      setIsAccepting(false); 
    }
  };

  if (ringingOrders.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[2000000] flex items-center justify-center p-6 pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 pointer-events-none" />
      
      <div className="relative z-[2000001] bg-white rounded-[3.5rem] p-10 w-full max-w-sm flex flex-col items-center text-center shadow-2xl animate-in zoom-in duration-500 transform-gpu pointer-events-auto">
        <div className="bg-red-50 h-24 w-24 rounded-[2.5rem] flex items-center justify-center text-red-600 mb-6 border-4 border-red-100 animate-pulse">
          <BellRing className="h-10 w-10 animate-bounce" />
        </div>
        
        <h2 className="text-red-600 font-black italic uppercase text-2xl tracking-tighter leading-none mb-2">NEW ORDER!</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-10 italic">
          CUSTOMER IS WAITING. ACCEPT TO START PREPARATION.
        </p>
        
        <div className="w-full space-y-4">
          <button 
            onClick={() => handleAcceptOrder(ringingOrders[0].id)} 
            disabled={isAccepting}
            className="w-full h-20 bg-green-600 hover:bg-green-700 text-white rounded-[1.5rem] font-black uppercase text-xl shadow-xl shadow-green-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer pointer-events-auto"
          >
            {isAccepting ? <Loader2 className="h-6 w-6 animate-spin" /> : "ACCEPT NOW"}
          </button>
          
          <button 
            onClick={() => setRingingOrders([])}
            className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors pointer-events-auto cursor-pointer"
          >
            Ignore Alert
          </button>
        </div>
      </div>
    </div>
  );
}
