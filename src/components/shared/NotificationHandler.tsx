
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { requestPushToken } from '@/firebase/messaging';

/**
 * @fileOverview System for handling push notifications and real-time order tracking.
 * Restored: Ring Alarm sound for new orders (Admin/Vendor only).
 */
export function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const processedOrders = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio object only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audioRef.current.loop = false;
    }
  }, []);

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

  const triggerAlert = (title: string, body: string, isOrder = false) => {
    // 1. SHOW TOAST
    toast({ 
      title: title.toUpperCase(), 
      description: body,
      variant: isOrder ? "default" : "default" 
    });

    // 2. PLAY RING ALARM (Only for new orders)
    if (isOrder && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log("Audio play blocked: Interacting with page might be needed."));
    }
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
            triggerAlert(`NEW ORDER! 🔔`, `₹${data.total} order from ${data.customerName}`, true);
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
            triggerAlert(`Order Update`, `Your order #${data.orderDisplayId} is now ${status}.`);
          }
        }
      });
    });

    return () => {
      unsubscribe();
      unsubscribeCustomer();
    };
  }, [user, firestore, toast]);

  return null;
}
