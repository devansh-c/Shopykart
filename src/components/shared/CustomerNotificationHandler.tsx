
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const statusMessages: Record<string, { title: string; body: string }> = {
  'Placed': {
    title: '🎉 Order Confirmed!',
    body: 'Thank you for ordering with Shopykart. Your order has been placed and sent to the store.'
  },
  'Accepted': {
    title: '✅ Order Accepted!',
    body: 'The store has accepted your order and will start packing it shortly.'
  },
  'Preparing': {
    title: '🥘 Preparing Your Order...',
    body: 'Your items are being freshly prepared and carefully packed by the store.'
  },
  'Ready for Pickup': {
    title: '📦 Order Ready For Pickup!',
    body: 'Your order is packed and waiting for the Shopykart delivery partner to pick it up.'
  },
  'Out for Delivery': {
    title: '🛵 Out for Delivery!',
    body: 'Your Shopykart rider is on the way with your order. Keep your phone handy!'
  },
  'Delivered': {
    title: '🎁 Delivered Successfully!',
    body: 'Your order has arrived! Enjoy your meal, and thank you for choosing Shopykart.'
  }
};

/**
 * @fileOverview Foreground Notification Handler for Customers.
 * Listens for order changes and triggers system alerts when app is open.
 */
export default function CustomerNotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const lastKnownStatuses = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!firestore || !user) return;

    // Listen to orders for the current user in real-time
    const q = query(
      collection(firestore, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const order = change.doc.data();
          const orderId = change.doc.id;
          const currentStatus = order.status;

          // Sync status locally to prevent repeat notifications
          const prevStatus = lastKnownStatuses.current[orderId];
          
          if (prevStatus && prevStatus !== currentStatus) {
            const msg = statusMessages[currentStatus];

            if (msg) {
              // 1. Trigger System Notification (Foreground)
              try {
                if ('Notification' in window && Notification.permission === 'granted') {
                   new Notification(msg.title, {
                    body: msg.body,
                    icon: '/logo.png',
                    tag: orderId, // Prevent duplicate alerts for same order
                  });
                }
              } catch (e) {
                console.debug("Browser Notification failed, likely native.");
              }

              // 2. Capacitor Native Alert (if on Android)
              try {
                const { LocalNotifications } = await import('@capacitor/local-notifications');
                await LocalNotifications.schedule({
                  notifications: [
                    {
                      title: msg.title,
                      body: msg.body,
                      id: Math.floor(Math.random() * 100000),
                      extra: { orderId: orderId }
                    }
                  ]
                });
              } catch (e) {
                console.debug("Capacitor local notification skipped (web).");
              }

              // 3. Add to In-App History
              try {
                await addDoc(collection(firestore, 'users', user.uid, 'notifications'), {
                  title: msg.title,
                  message: msg.body,
                  type: 'order_update',
                  orderId: orderId,
                  timestamp: serverTimestamp(),
                  read: false
                });
              } catch (err) {}
            }
          }

          lastKnownStatuses.current[orderId] = currentStatus;
        }
      });
    });

    return () => unsubscribe();
  }, [user, firestore]);

  return null;
}
