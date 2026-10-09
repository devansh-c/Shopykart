
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const statusMessages: Record<string, { title: string; body: string }> = {
  'Placed': {
    title: "🎉 Order Confirmed!",
    body: "Thank you for ordering with Shopykart. Your order has been placed and sent to the store."
  },
  'Accepted': {
    title: "✅ Order Accepted!",
    body: "The store has accepted your order and will start packing it shortly."
  },
  'Preparing': {
    title: "🥘 Preparing Your Order...",
    body: "Your items are being freshly prepared and carefully packed by the store."
  },
  'Ready for Pickup': {
    title: "📦 Order Ready For Pickup!",
    body: "Your order is packed and waiting for the Shopykart delivery partner to pick it up."
  },
  'Out for Delivery': {
    title: "🛵 Out for Delivery!",
    body: "Your Shopykart rider is on the way with your order. Keep your phone handy!"
  },
  'Delivered': {
    title: "🎁 Delivered Successfully!",
    body: "Your order has arrived! Enjoy your meal, and thank you for choosing Shopykart."
  }
};

/**
 * @fileOverview Listens to customer's orders and triggers System Cloud Notifications.
 * UI Toasts have been removed as per user request to provide a cleaner system feel.
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
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified' || change.type === 'added') {
          const order = change.doc.data();
          const orderId = change.doc.id;
          const currentStatus = order.status;

          // Only notify if status has actually changed to prevent duplicate alerts
          if (lastKnownStatuses.current[orderId] !== currentStatus) {
            const msg = statusMessages[currentStatus];
            
            if (msg) {
              // 1. TRIGGER SYSTEM NOTIFICATION (Drawer Alert)
              if ("Notification" in window && Notification.permission === "granted") {
                const notification = new Notification(msg.title, { 
                  body: msg.body, 
                  icon: '/logo.png', // Fallback to logo
                  tag: orderId, // Group notifications by order
                  badge: '/logo.png',
                  silent: false
                });

                // Play system chime if supported
                notification.onclick = () => {
                  window.focus();
                  window.location.href = `/order/track/#${order.customerOrderNumber}`;
                };
              }

              // 2. LOG TO USER IN-APP HISTORY
              addDoc(collection(firestore, 'users', user.uid, 'notifications'), {
                title: msg.title,
                message: msg.body,
                type: 'order_update',
                orderId: orderId,
                timestamp: serverTimestamp(),
                read: false
              }).catch(() => {});
            }

            lastKnownStatuses.current[orderId] = currentStatus;
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user, firestore]);

  return null;
}
