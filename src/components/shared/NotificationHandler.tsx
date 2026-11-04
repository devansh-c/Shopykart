"use client"

import { useEffect, useState, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Bell, ShoppingBag, Truck, Volume2, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * @fileOverview LOUD RINGING ALERT HANDLER (Advanced Zomato-Style).
 * Triggers continuous ringing for new orders until they are accepted.
 * Updated: Now uses local /sounds/order_alert.mp3 for easy replacement.
 */
export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const lastProcessedOrderIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isAdminApp = process.env.NEXT_PUBLIC_ADMIN_APP === 'true';
  const isStoreApp = process.env.NEXT_PUBLIC_BIZ_APP === 'true';
  const isFleetApp = process.env.NEXT_PUBLIC_TOW_APP === 'true';

  useEffect(() => {
    // 1. Initialize Audio Object with Local File
    if (typeof window !== 'undefined' && !audioRef.current) {
      // Points to public/sounds/order_alert.mp3
      const audio = new Audio('/sounds/order_alert.mp3'); 
      audio.loop = true;
      audioRef.current = audio;
    }
  }, []);

  useEffect(() => {
    if (!firestore || !user || (!isStoreApp && !isFleetApp && !isAdminApp)) return;

    // 2. Setup Listener Query
    let q;
    if (isStoreApp || isAdminApp) {
      q = query(collection(firestore, 'orders'), where('status', '==', 'Placed'));
    } else if (isFleetApp) {
      q = query(collection(firestore, 'orders'), where('status', '==', 'Ready for Pickup'));
    } else {
      return;
    }

    const unsub = onSnapshot(q, async (snapshot) => {
      const active = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      let filteredActive: any[] = [];
      
      if (isStoreApp) {
        filteredActive = active.filter(o => 
          String(o.vendorId) === String(user.uid) || 
          (Array.isArray(o.vendorIds) && o.vendorIds.includes(user.uid))
        );
      } else if (isFleetApp) {
        const dismissed = JSON.parse(localStorage.getItem('fleet_dismissed_tasks') || '[]');
        filteredActive = active.filter(o => !o.deliveryPartnerId && !dismissed.includes(o.id));
      } else if (isAdminApp) {
        filteredActive = active;
      }

      // 3. Initial Load Guard
      if (isInitialLoad.current) {
        filteredActive.forEach(o => lastProcessedOrderIds.current.add(o.id));
        isInitialLoad.current = false;
        return;
      }

      // 4. Trigger Ringing for Truly New Items
      const newOrders = filteredActive.filter(o => !lastProcessedOrderIds.current.has(o.id));
      
      if (newOrders.length > 0) {
        // Start Continuous Ringing
        try {
          if (audioRef.current) {
            audioRef.current.play().catch(e => {
              console.warn("Audio autoplay blocked. Interaction required.");
            });
          }
        } catch (e) {}

        // Native Alert for Android/iOS
        try {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          await LocalNotifications.schedule({
            notifications: [
              {
                title: isStoreApp ? "🚨 NEW ORDER ARRIVED!" : "🛵 NEW PICKUP READY!",
                body: `Check Order #${newOrders[0].customerOrderNumber} now.`,
                id: 99999,
                channelId: 'new_order_channel',
                smallIcon: 'ic_stat_notification',
                sound: 'order_alert', 
                extra: { orderId: newOrders[0].id }
              }
            ]
          });
        } catch (e) {}
      } else if (filteredActive.length === 0) {
        // Stop Ringing when everything is processed
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }

      setRingingOrders(filteredActive);
    });

    return () => {
      unsub();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [firestore, user, isStoreApp, isFleetApp, isAdminApp]);

  const stopAlert = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setRingingOrders([]);
  };

  if (ringingOrders.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="relative bg-white rounded-[4rem] p-12 w-full max-sm flex flex-col items-center text-center shadow-[0_0_100px_rgba(239,68,68,0.4)] animate-in zoom-in duration-700 border-4 border-primary/20">
        
        <div className="absolute -top-10 flex justify-center w-full">
           <div className="bg-primary text-white px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl animate-bounce">
              Emergency Alert
           </div>
        </div>

        <div className="relative mb-8">
           <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
           <div className="relative h-32 w-32 bg-primary rounded-[3rem] flex items-center justify-center text-white shadow-2xl border-8 border-white">
              <Bell className="h-16 w-16 animate-ring" />
           </div>
        </div>
        
        <h2 className="text-gray-900 font-black italic uppercase text-4xl tracking-tighter leading-none mb-3">
          {isStoreApp ? 'NEW ORDER!' : 'PICKUP ALERT!'}
        </h2>
        
        <div className="bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 mb-8">
           <p className="text-[12px] font-black text-primary uppercase tracking-widest">
             ORDER ID: #{ringingOrders[0].customerOrderNumber || 'PENDING'}
           </p>
        </div>

        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-10 leading-relaxed italic">
          PLEASE OPEN YOUR DASHBOARD IMMEDIATELY TO ACCEPT THE TASK.
        </p>
        
        <div className="w-full space-y-4">
          <button 
            onClick={stopAlert}
            className="w-full h-24 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black uppercase italic text-2xl shadow-[0_20px_50px_rgba(22,163,74,0.3)] active:scale-95 transition-all flex items-center justify-center gap-4 group"
          >
            <ShieldAlert className="h-8 w-8 text-white group-hover:rotate-12 transition-transform" />
            OPEN HUB
          </button>
          
          <div className="flex items-center justify-center gap-2 text-primary font-black uppercase text-[8px] tracking-[0.4em] animate-pulse pt-2">
             <Volume2 className="h-3 w-3" /> RINGING CONTINUOUSLY
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-2 bg-gray-100 overflow-hidden rounded-b-[4rem]">
           <div className="h-full bg-primary animate-running-line" style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  );
}
