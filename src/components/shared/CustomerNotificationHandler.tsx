
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const statusMessages: Record<string, { title: string; body: string }> = {
  'Accepted': {
    title: '✅ Order Accepted!',
    body: 'The store has accepted your order and will start packing it shortly.'
  },
  'Preparing': {
    title: '🥘 Preparing Your Order...',
    body: 'Your items are being freshly prepared and carefully packed by the store.'
  },
  'Ready for Pickup': {
    title: '📦 Order Ready!',
    body: 'Your order is packed and waiting for the Shopykart rider.'
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
 * @fileOverview STATUS UPDATE HANDLER (For Customers Only).
 * Triggers notifications when the Store updates an order.
 */
export default function CustomerNotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const lastKnownStatuses = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!firestore || !user) return;

    // Listen only to orders WHERE THIS USER is the customer
    const q = query(
      collection(firestore, 'orders'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'modified') {
          const order = change.doc.data();
          const orderId = change.doc.id;
          const currentStatus = order.status;

          const prevStatus = lastKnownStatuses.current[orderId];
          
          // Only notify if status has actually changed
          if (prevStatus && prevStatus !== currentStatus) {
            const msg = statusMessages[currentStatus];

            if (msg) {
              // 1. Show UI Toast for foreground visibility
              toast({ title: msg.title, description: msg.body });

              // 2. Trigger System Notification (Standard priority)
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
                console.debug("Standard notification skipped in browser");
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
        } else if (change.type === 'added') {
          // Store initial status on load to prevent notifications for old orders
          lastKnownStatuses.current[change.doc.id] = change.doc.data().status;
        }
      });
    });

    return () => unsubscribe();
  }, [user, firestore, toast]);

  return null;
}
