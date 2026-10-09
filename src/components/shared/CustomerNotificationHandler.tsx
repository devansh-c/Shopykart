'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

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
 * @fileOverview Listens to customer's orders and triggers UI notifications on status change.
 */
export default function CustomerNotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const lastKnownStatuses = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!firestore || !user) return;

    // Listen to orders for the current user
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

          // Only notify if status has actually changed
          if (lastKnownStatuses.current[orderId] !== currentStatus) {
            const msg = statusMessages[currentStatus];
            
            if (msg) {
              // 1. Show UI Toast
              toast({
                title: msg.title,
                description: msg.body,
              });

              // 2. Trigger Browser Notification (if permission granted)
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(msg.title, { body: msg.body, icon: '/favicon.ico' });
              }

              // 3. Save to user notifications sub-collection for in-app history
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
  }, [user, firestore, toast]);

  return null;
}
