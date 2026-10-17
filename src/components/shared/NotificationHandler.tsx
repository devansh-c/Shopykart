
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BellRing } from 'lucide-react';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview Global Notification Handler - Handles foreground ringing for Admin, Biz, and Delivery.
 */
export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  
  const [isAccepting, setIsAccepting] = useState(false);
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // IDENTIFY APP TYPE FROM ENV OR AUTH
  const isBusinessApp = useMemo(() => {
    return process.env.NEXT_PUBLIC_ADMIN_APP === 'true' || 
           process.env.NEXT_PUBLIC_BIZ_APP === 'true' || 
           process.env.NEXT_PUBLIC_TOW_APP === 'true';
  }, []);

  useEffect(() => {
    if (!firestore || !isBusinessApp) return;

    // LISTEN FOR NEW ORDERS TO RING FOREGROUND
    const q = query(
      collection(firestore, 'orders'), 
      where('status', 'in', ['Placed', 'Preparing'])
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const active = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter based on role if needed, but per request: ring for both statuses
      setRingingOrders(active);
      
      if (active.length > 0) {
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
  }, [firestore, isBusinessApp]);

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
    <div className="fixed inset-0 z-[2000000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative bg-white rounded-[3.5rem] p-10 w-full max-w-sm flex flex-col items-center text-center shadow-2xl animate-in zoom-in duration-500">
        <div className="bg-red-50 h-24 w-24 rounded-[2.5rem] flex items-center justify-center text-red-600 mb-6 border-4 border-red-100 animate-pulse">
          <BellRing className="h-10 w-10 animate-bounce" />
        </div>
        
        <h2 className="text-red-600 font-black italic uppercase text-2xl tracking-tighter leading-none mb-2">NEW ORDER!</h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-10 italic">
          CUSTOMER IS WAITING. TAKE ACTION NOW.
        </p>
        
        <div className="w-full space-y-4">
          <button 
            onClick={() => handleAcceptOrder(ringingOrders[0].id)} 
            disabled={isAccepting}
            className="w-full h-20 bg-green-600 hover:bg-green-700 text-white rounded-[1.5rem] font-black uppercase text-xl shadow-xl shadow-green-100 active:scale-95 transition-all flex items-center justify-center"
          >
            {isAccepting ? <Loader2 className="h-6 w-6 animate-spin" /> : "TAKE ACTION"}
          </button>
          
          <button 
            onClick={() => setRingingOrders([])}
            className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
          >
            Ignore Alert
          </button>
        </div>
      </div>
    </div>
  );
}
