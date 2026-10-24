
'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

/**
 * @fileOverview Visual & Audio Notification Handler.
 * Bridges Firestore events to Native System Notifications for loud ringing.
 * Fixed: Robust data-matching for vendorIds and refined initial load logic.
 */
export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const lastProcessedOrderIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  const isStoreApp = process.env.NEXT_PUBLIC_BIZ_APP === 'true' || process.env.NEXT_PUBLIC_ADMIN_APP === 'true';
  const isFleetApp = process.env.NEXT_PUBLIC_TOW_APP === 'true';

  useEffect(() => {
    if (!firestore || !user) return;

    // 1. Define targeted query based on app type
    let q;
    if (isStoreApp) {
      q = query(collection(firestore, 'orders'), where('status', '==', 'Placed'));
    } else if (isFleetApp) {
      q = query(collection(firestore, 'orders'), where('status', '==', 'Ready for Pickup'));
    } else {
      return;
    }

    // 2. Start Real-time listener
    const unsub = onSnapshot(q, async (snapshot) => {
      const active = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      let filteredActive: any[] = [];
      
      if (isStoreApp) {
        // MATCH: Check top-level vendorId or the vendorIds array
        filteredActive = active.filter(o => 
          String(o.vendorId) === String(user.uid) || 
          (Array.isArray(o.vendorIds) && o.vendorIds.includes(user.uid)) ||
          // Backup check inside items if legacy
          o.items?.some((it: any) => String(it.vendorId) === String(user.uid))
        );
      } else if (isFleetApp) {
        const dismissed = JSON.parse(localStorage.getItem('fleet_dismissed_tasks') || '[]');
        filteredActive = active.filter(o => !o.deliveryPartnerId && !dismissed.includes(o.id));
      }

      // CRITICAL: Prevent ringing for orders that already existed when app started
      // UNLESS they were created in the last 60 seconds (re-ringing protection)
      if (isInitialLoad.current) {
        filteredActive.forEach(o => {
          const createdAt = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : Date.now();
          const ageSeconds = (Date.now() - createdAt) / 1000;
          if (ageSeconds > 60) {
            lastProcessedOrderIds.current.add(o.id);
          }
        });
        isInitialLoad.current = false;
      }

      // 3. Detect NEW orders and trigger SYSTEM NOTIFICATION
      let didTriggerNew = false;

      for (const order of filteredActive) {
        if (!lastProcessedOrderIds.current.has(order.id)) {
          lastProcessedOrderIds.current.add(order.id);
          didTriggerNew = true;
          
          try {
            // TRIGGER SYSTEM NOTIFICATION - THIS PLAYS THE LOUD SOUND RESOURCE 'order_alert'
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: isStoreApp ? "🚨 NEW ORDER RECEIVED!" : "🛵 NEW PICKUP READY!",
                  body: isStoreApp 
                    ? `Order #${order.customerOrderNumber} from ${order.customerName}.` 
                    : `Order #${order.customerOrderNumber} is ready for pickup in your zone.`,
                  id: Math.floor(Date.now() % 100000),
                  channelId: 'new_order_channel', // High importance channel from PermissionManager
                  sound: 'order_alert', // Strictly matches res/raw/order_alert.mp3 resource
                  extra: { orderId: order.id },
                  actionTypeId: 'OPEN_DASHBOARD'
                }
              ]
            });
          } catch (e) {
            console.debug("Local Notification trigger failed (Native only feature)");
          }
        }
      }

      // Update local state to show visual popup ONLY IF there are active orders
      setRingingOrders(filteredActive);
    });

    return () => unsub();
  }, [firestore, user, isStoreApp, isFleetApp]);

  const handleDismissAlert = (orderId?: string) => {
    if (isFleetApp && orderId) {
      const dismissed = JSON.parse(localStorage.getItem('fleet_dismissed_tasks') || '[]');
      localStorage.setItem('fleet_dismissed_tasks', JSON.stringify([...dismissed, orderId]));
    }
    setRingingOrders([]);
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
