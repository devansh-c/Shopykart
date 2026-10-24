
'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

/**
 * @fileOverview LOUD ALERT HANDLER (For Store & Fleet Only).
 * Triggers ringing when a Customer places an order or when an order is ready for pickup.
 */
export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const lastProcessedOrderIds = useRef<Set<string>>(new Set());
  const isInitialLoad = useRef(true);

  const isAdminApp = process.env.NEXT_PUBLIC_ADMIN_APP === 'true';
  const isStoreApp = process.env.NEXT_PUBLIC_BIZ_APP === 'true';
  const isFleetApp = process.env.NEXT_PUBLIC_TOW_APP === 'true';

  useEffect(() => {
    if (!firestore || !user || (!isStoreApp && !isFleetApp && !isAdminApp)) return;

    // 1. Listen for new tasks based on role
    let q;
    if (isStoreApp || isAdminApp) {
      // Stores listen for NEW PLACED orders
      q = query(collection(firestore, 'orders'), where('status', '==', 'Placed'));
    } else if (isFleetApp) {
      // Fleet listens for READY FOR PICKUP orders
      q = query(collection(firestore, 'orders'), where('status', '==', 'Ready for Pickup'));
    } else {
      return;
    }

    const unsub = onSnapshot(q, async (snapshot) => {
      const active = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      let filteredActive: any[] = [];
      
      if (isStoreApp) {
        // FILTER: Only orders belonging to THIS store
        filteredActive = active.filter(o => 
          String(o.vendorId) === String(user.uid) || 
          (Array.isArray(o.vendorIds) && o.vendorIds.includes(user.uid))
        );
      } else if (isFleetApp) {
        // FILTER: Only orders not yet picked up and not dismissed
        const dismissed = JSON.parse(localStorage.getItem('fleet_dismissed_tasks') || '[]');
        filteredActive = active.filter(o => !o.deliveryPartnerId && !dismissed.includes(o.id));
      } else if (isAdminApp) {
        filteredActive = active;
      }

      // INITIAL LOAD: Sync already existing orders to prevent re-ringing
      if (isInitialLoad.current) {
        filteredActive.forEach(o => lastProcessedOrderIds.current.add(o.id));
        isInitialLoad.current = false;
        return;
      }

      // TRIGGER: If a truly new order arrives, fire native alert
      let didTriggerNew = false;
      for (const order of filteredActive) {
        if (!lastProcessedOrderIds.current.has(order.id)) {
          lastProcessedOrderIds.current.add(order.id);
          didTriggerNew = true;
          
          try {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: isStoreApp ? "🚨 NEW ORDER!" : "🛵 NEW PICKUP!",
                  body: isStoreApp 
                    ? `Order #${order.customerOrderNumber} from ${order.customerName}.` 
                    : `Order #${order.customerOrderNumber} is ready in your zone.`,
                  id: Math.floor(Date.now() % 100000),
                  channelId: 'new_order_channel',
                  sound: 'order_alert',
                  extra: { orderId: order.id }
                }
              ]
            });
          } catch (e) {
            console.debug("Native alert skipped in browser");
          }
        }
      }

      setRingingOrders(filteredActive);
    });

    return () => unsub();
  }, [firestore, user, isStoreApp, isFleetApp, isAdminApp]);

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
           <svg className="h-10 w-10 animate-bounce" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
             <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round"/>
             <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
           </svg>
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
            Close Alert
          </button>
        </div>
      </div>
    </div>
  );
}
