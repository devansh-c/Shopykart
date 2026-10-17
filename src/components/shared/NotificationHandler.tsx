
'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, BellRing, PackageSearch, CheckCircle2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview Global Notification Handler - Updated for Fleet Ringing on 'Ready for Pickup' status.
 */
export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isStoreApp = process.env.NEXT_PUBLIC_BIZ_APP === 'true' || process.env.NEXT_PUBLIC_ADMIN_APP === 'true';
  const isFleetApp = process.env.NEXT_PUBLIC_TOW_APP === 'true';

  useEffect(() => {
    if (!firestore) return;

    // 1. RING FOR STORES: When Order is 'Placed'
    if (isStoreApp) {
      const q = query(collection(firestore, 'orders'), where('status', '==', 'Placed'));
      const unsub = onSnapshot(q, (snapshot) => {
        const active = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        handleRinging(active);
      });
      return () => unsub();
    }

    // 2. RING FOR FLEET: When Order is 'Ready for Pickup' (as requested)
    if (isFleetApp) {
      const q = query(collection(firestore, 'orders'), where('status', '==', 'Ready for Pickup'));
      const unsub = onSnapshot(q, (snapshot) => {
        const active = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Filter out locally dismissed tasks
        const dismissed = JSON.parse(localStorage.getItem('fleet_dismissed_tasks') || '[]');
        const actualActive = active.filter(o => !dismissed.includes(o.id) && !o.deliveryPartnerId);
        
        handleRinging(actualActive);
      });
      return () => unsub();
    }
  }, [firestore, isStoreApp, isFleetApp]);

  const handleRinging = (active: any[]) => {
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
  };

  const handleDismissAlert = (orderId?: string) => {
    if (isFleetApp && orderId) {
      const dismissed = JSON.parse(localStorage.getItem('fleet_dismissed_tasks') || '[]');
      localStorage.setItem('fleet_dismissed_tasks', JSON.stringify([...dismissed, orderId]));
    }
    setRingingOrders([]);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  if (ringingOrders.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[2000000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative bg-white rounded-[3.5rem] p-10 w-full max-w-sm flex flex-col items-center text-center shadow-2xl animate-in zoom-in duration-500">
        <div className="bg-primary/10 h-24 w-24 rounded-[2.5rem] flex items-center justify-center text-primary mb-6 border-4 border-primary/20 animate-pulse">
          {isStoreApp ? <BellRing className="h-10 w-10 animate-bounce" /> : <PackageSearch className="h-10 w-10 animate-bounce" />}
        </div>
        
        <h2 className="text-gray-900 font-black italic uppercase text-2xl tracking-tighter leading-none mb-2">
          {isStoreApp ? 'NEW ORDER!' : 'PICKUP ALERT!'}
        </h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-10 italic leading-relaxed">
          {isStoreApp ? 'CUSTOMER IS WAITING. ACCEPT NOW.' : 'A NEW TASK IS READY FOR PICKUP IN YOUR ZONE.'}
        </p>
        
        <div className="w-full space-y-4">
          <button 
            onClick={() => handleDismissAlert()}
            className="w-full h-20 bg-green-600 hover:bg-green-700 text-white rounded-[1.5rem] font-black uppercase text-xl shadow-xl shadow-green-100 active:scale-95 transition-all flex items-center justify-center"
          >
            VIEW TASK
          </button>
          
          <button 
            onClick={() => handleDismissAlert(ringingOrders[0].id)}
            className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
          >
            Ignore Task
          </button>
        </div>
      </div>
    </div>
  );
}
