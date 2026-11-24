"use client"

import { useEffect, useState, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Bell, ShoppingBag, Truck, Volume2, ShieldAlert, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview LOUD RINGING ALERT HANDLER (Advanced Zomato-Style).
 * FIXED: Now works for Admin even if Firebase Auth 'user' is null (uses path & localStorage).
 */
export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const pathname = usePathname();
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const lastProcessedOrderIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // APP & ROLE DETECTION
  const isAdminPath = pathname?.startsWith('/admin');
  const isStorePath = pathname?.startsWith('/vendor');
  const isFleetPath = pathname?.startsWith('/delivery');
  
  const isAdminApp = typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_ADMIN_APP === 'true' || isAdminPath);
  const isStoreApp = typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_BIZ_APP === 'true' || isStorePath);
  const isFleetApp = typeof window !== 'undefined' && (process.env.NEXT_PUBLIC_TOW_APP === 'true' || isFleetPath);

  useEffect(() => {
    // 1. Initialize Audio Object with Local File
    if (typeof window !== 'undefined' && !audioRef.current) {
      const audio = new Audio('/sounds/order_alert.mp3'); 
      audio.loop = true;
      audioRef.current = audio;
    }
  }, []);

  useEffect(() => {
    // SECURITY GUARD: Strictly handle business users
    // Admin dashboard uses custom auth, so we don't strictly require 'user' if on admin path
    if (!firestore) return;
    if (!isAdminApp && !isStoreApp && !isFleetApp) return;
    if (!isAdminApp && !user) return; // Stores/Fleet still need Firebase User

    // 2. Setup Listener Query based on User Role
    let q;
    if (isAdminApp) {
      // ADMIN SEES ALL PLACED ORDERS GLOBALLY
      q = query(collection(firestore, 'orders'), where('status', '==', 'Placed'));
    } else if (isStoreApp) {
      q = query(collection(firestore, 'orders'), where('status', '==', 'Placed'));
    } else if (isFleetApp) {
      q = query(collection(firestore, 'orders'), where('status', '==', 'Ready for Pickup'));
    } else {
      return;
    }

    const unsub = onSnapshot(q, async (snapshot) => {
      const active = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      let filteredActive: any[] = [];
      
      if (isAdminApp) {
        // NO FILTER FOR ADMIN - RING FOR EVERYTHING
        filteredActive = active;
      } else if (isStoreApp && user) {
        // Vendor only sees their own orders
        filteredActive = active.filter(o => 
          String(o.vendorId) === String(user.uid) || 
          (Array.isArray(o.vendorIds) && o.vendorIds.includes(user.uid))
        );
      } else if (isFleetApp && user) {
        // Fleet sees unassigned pickups
        const dismissed = JSON.parse(localStorage.getItem('fleet_dismissed_tasks') || '[]');
        filteredActive = active.filter(o => !o.deliveryPartnerId && !dismissed.includes(o.id));
      }

      // 3. Initial Load Guard (Don't ring for existing orders when opening dashboard)
      if (isInitialLoad.current) {
        filteredActive.forEach(o => lastProcessedOrderIds.current.add(o.id));
        isInitialLoad.current = false;
        return;
      }

      // 4. Trigger Ringing for Truly New Items
      const trulyNew = filteredActive.filter(o => !lastProcessedOrderIds.current.has(o.id));
      
      if (trulyNew.length > 0) {
        try {
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.warn("Audio play blocked by browser. Interactions required."));
          }
        } catch (e) {}

        // Native Alert for Android/iOS
        try {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          await LocalNotifications.schedule({
            notifications: [
              {
                title: isAdminApp ? "🚨 GLOBAL ORDER ALERT" : isStoreApp ? "🚨 NEW ORDER ARRIVED!" : "🛵 NEW PICKUP READY!",
                body: `Order #${trulyNew[0].customerOrderNumber} at ${trulyNew[0].restaurantName || 'Hub'}.`,
                id: 99999,
                channelId: 'new_order_channel',
                smallIcon: 'ic_stat_notification',
                sound: 'order_alert', 
                extra: { orderId: trulyNew[0].id }
              }
            ]
          });
        } catch (e) {}
      } else if (filteredActive.length === 0) {
        // Stop Ringing when everything is processed or accepted
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
  }, [firestore, user, isAdminApp, isStoreApp, isFleetApp]);

  const stopAlert = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Mark all current ringing orders as seen for this session
    ringingOrders.forEach(o => lastProcessedOrderIds.current.add(o.id));
    setRingingOrders([]);
  };

  if (ringingOrders.length === 0) return null;

  const currentOrder = ringingOrders[0];

  return (
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-6 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="relative bg-white rounded-[4rem] p-12 w-full max-sm flex flex-col items-center text-center shadow-[0_0_100px_rgba(239,68,68,0.4)] animate-in zoom-in duration-700 border-4 border-primary/20">
        
        <div className="absolute -top-10 flex justify-center w-full">
           <div className={cn(
             "px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest shadow-2xl animate-bounce",
             isAdminApp ? "bg-black text-white" : "bg-primary text-white"
           )}>
              {isAdminApp ? 'Global Network Alert' : 'Store Alert'}
           </div>
        </div>

        <div className="relative mb-8">
           <div className={cn("absolute inset-0 rounded-full animate-ping opacity-20", isAdminApp ? "bg-black" : "bg-primary")} />
           <div className={cn(
             "relative h-32 w-32 rounded-[3rem] flex items-center justify-center text-white shadow-2xl border-8 border-white",
             isAdminApp ? "bg-black" : "bg-primary"
           )}>
              <Bell className="h-16 w-16 animate-ring" />
           </div>
        </div>
        
        <h2 className="text-gray-900 font-black italic uppercase text-4xl tracking-tighter leading-none mb-3">
          {isAdminApp ? 'ANY STORE ORDER' : isStoreApp ? 'NEW ORDER!' : 'PICKUP ALERT!'}
        </h2>
        
        <div className="bg-gray-50 px-6 py-4 rounded-3xl border border-gray-100 mb-8 space-y-2 w-full">
           <p className="text-[12px] font-black text-primary uppercase tracking-widest">
             ORDER ID: #{currentOrder.customerOrderNumber || 'PENDING'}
           </p>
           <div className="flex items-center justify-center gap-2 text-gray-500">
              <Store className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase italic">{currentOrder.restaurantName || 'Local Hub'}</span>
           </div>
        </div>

        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-10 leading-relaxed italic">
          {isAdminApp ? 'A NEW ORDER HAS BEEN PLACED IN THE NETWORK. MONITOR STATUS.' : 'PLEASE OPEN YOUR DASHBOARD IMMEDIATELY TO ACCEPT THE TASK.'}
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
           <div className={cn("h-full animate-running-line", isAdminApp ? "bg-black" : "bg-primary")} style={{ width: '100%' }} />
        </div>
      </div>
    </div>
  );
}
