
'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, Timestamp, orderBy, limit } from 'firebase/firestore';
import { BellRing, X, Megaphone, ShoppingBag, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { requestPushToken } from '@/firebase/messaging';

/**
 * @fileOverview System for handling push notifications and real-time order tracking.
 * Modal Alert system has been removed as per user request to keep the UI clean.
 */
export function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [permission, setPermission] = useState<string>('default');
  const [showPrompt, setShowPrompt] = useState(false);
  
  const processedOrders = useRef<Set<string>>(new Set());

  // FCM Token Registration
  useEffect(() => {
    if (user && firestore) {
      const registerFCM = async () => {
        try {
          const token = await requestPushToken();
          if (token) {
            await setDoc(doc(firestore, 'users', user.uid), {
              fcmToken: token,
              lastTokenUpdate: serverTimestamp()
            }, { merge: true });
            console.log("FCM Identity Verified ✅");
          }
        } catch (e) {
          console.warn("FCM skip: Registration not completed.");
        }
      };
      registerFCM();
    }
  }, [user, firestore]);

  const triggerPush = (title: string, body: string, isOrder = false) => {
    // 1. LOUD SOUND
    try {
      const soundUrl = isOrder ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
      const audio = new Audio(soundUrl);
      audio.volume = 1.0;
      audio.play().catch(() => {});
    } catch (e) {}

    // 2. SYSTEM NOTIFICATION (For mobile compatibility)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body: body,
            icon: '/icon.png',
            tag: isOrder ? 'new-order' : 'status-update',
            requireInteraction: true,
            vibrate: [200, 100, 200]
          });
        }).catch(() => {
          try { new Notification(title, { body }); } catch (e) {}
        });
      } else {
        try {
          new Notification(title, {
            body: body,
            icon: '/icon.png',
            tag: isOrder ? 'new-order' : 'status-update',
            requireInteraction: true
          });
        } catch (e) {}
      }
    }
    
    // 3. UI TOAST (Instant feedback)
    toast({ 
      title: title.toUpperCase(), 
      description: body,
      variant: isOrder ? "default" : "default" 
    });
  };

  // REAL-TIME ORDER MONITORING
  useEffect(() => {
    if (!user || !firestore) return;
    
    const isAdmin = user.email === 'ceo@shopykart.co.in';
    
    // Vendor or Admin New Order query
    const ordersQuery = query(
      collection(firestore, 'orders'), 
      where('status', '==', 'Placed')
    );
    
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const id = change.doc.id;

        if (change.type === 'added') {
          const isMyOrder = data.vendorId === user.uid || isAdmin;
          if (isMyOrder && !processedOrders.current.has(id)) {
            processedOrders.current.add(id);
            triggerPush(`🚨 NEW ORDER ARRIVED!`, `₹${data.total} order from ${data.customerName}`, true);
          }
        }
      });
    });

    // Customer Status Change Listener
    const customerQuery = query(
      collection(firestore, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribeCustomer = onSnapshot(customerQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const data = change.doc.data();
          const status = data.status;
          if (status !== 'Placed') {
            triggerPush(`Order ${status}`, `Your order #${data.orderDisplayId} is now ${status}.`);
          }
        }
      });
    });

    return () => {
      unsubscribe();
      unsubscribeCustomer();
    };
  }, [user, firestore]);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const status = await Notification.requestPermission();
    setPermission(status);
    setShowPrompt(false);
  };

  return (
    <>
      {showPrompt && user && (
        <div className="fixed top-20 left-4 right-4 z-[5000] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-[#0B0B0B] text-white p-5 rounded-[2rem] shadow-2xl border border-white/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-xl"><BellRing className="h-5 v-5 text-primary" /></div>
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-primary">Enable Alerts</span><span className="text-xs font-bold">Never miss a new order.</span></div>
            </div>
            <Button onClick={requestPermission} className="bg-primary text-white rounded-xl h-10 px-6 font-black uppercase italic text-[10px] tracking-widest">ALLOW</Button>
          </div>
        </div>
      )}
    </>
  );
}
