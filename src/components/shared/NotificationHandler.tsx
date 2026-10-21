
'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

/**
 * @fileOverview Global Notification Handler - Handles targeted ringing for Store and Fleet.
 * Rings until the specific condition (Acceptance/Processing) is met.
 */
export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isStoreApp = process.env.NEXT_PUBLIC_BIZ_APP === 'true' || process.env.NEXT_PUBLIC_ADMIN_APP === 'true';
  const isFleetApp = process.env.NEXT_PUBLIC_TOW_APP === 'true';

  useEffect(() => {
    if (!firestore || !user) return;

    let q;
    if (isStoreApp) {
      // Listen for orders placed for THIS specific vendor
      q = query(collection(firestore, 'orders'), where('status', '==', 'Placed'));
    } else if (isFleetApp) {
      // Listen for orders ready for pickup that haven't been assigned yet
      q = query(collection(firestore, 'orders'), where('status', '==', 'Ready for Pickup'));
    } else {
      return;
    }

    const unsub = onSnapshot(q, (snapshot) => {
      const active = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      let filteredActive = [];
      
      if (isStoreApp) {
        // Filter: Ring only if the order belongs to THIS vendor
        filteredActive = active.filter(o => String(o.vendorId) === String(user.uid) || (Array.isArray(o.vendorIds) && o.vendorIds.includes(user.uid)));
      } else if (isFleetApp) {
        // Filter: Ring if order is unassigned and not dismissed locally
        const dismissed = JSON.parse(localStorage.getItem('fleet_dismissed_tasks') || '[]');
        filteredActive = active.filter(o => !o.deliveryPartnerId && !dismissed.includes(o.id));
      }

      handleRinging(filteredActive);
    });

    return () => unsub();
  }, [firestore, user, isStoreApp, isFleetApp]);

  const handleRinging = (active: any[]) => {
    setRingingOrders(active);
    if (active.length > 0) {
      if (!audioRef.current) {
        // High quality continuous loop sound
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3');
        audioRef.current.loop = true;
      }
      audioRef.current.play().catch(() => {
        console.log("Interaction required for audio.");
      });
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
    <div className="fixed inset-0 z-[2000000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative bg-white rounded-[3.5rem] p-10 w-full max-w-sm flex flex-col items-center text-center shadow-2xl animate-in zoom-in duration-500">
        <div className="bg-primary/10 h-24 w-24 rounded-[2.5rem] flex items-center justify-center text-primary mb-6 border-4 border-primary/20 animate-pulse">
           <div className="relative">
              <span className="absolute -top-2 -right-2 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-primary"></span>
              </span>
              <svg className="h-10 w-10 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
           </div>
        </div>
        
        <h2 className="text-gray-900 font-black italic uppercase text-2xl tracking-tighter leading-none mb-2">
          {isStoreApp ? 'NEW ORDER!' : 'PICKUP ALERT!'}
        </h2>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-10 italic leading-relaxed">
          {isStoreApp ? 'ACTION REQUIRED: PLEASE ACCEPT THE ORDER NOW.' : 'A NEW TASK IS WAITING FOR PICKUP IN YOUR ZONE.'}
        </p>
        
        <div className="w-full space-y-4">
          <button 
            onClick={() => handleDismissAlert()}
            className="w-full h-20 bg-green-600 hover:bg-green-700 text-white rounded-[1.5rem] font-black uppercase text-xl shadow-xl shadow-green-100 active:scale-95 transition-all flex items-center justify-center"
          >
            OPEN DASHBOARD
          </button>
          
          <button 
            onClick={() => handleDismissAlert(ringingOrders[0].id)}
            className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors"
          >
            {isFleetApp ? 'Pass Task' : 'Close Alert'}
          </button>
        </div>
      </div>
    </div>
  );
}
