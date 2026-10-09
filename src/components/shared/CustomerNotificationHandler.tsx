'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

const statusMessages: Record<string, { title: string; body: string }> = {
  'Placed': {
    title: '🎉 Order Placed Successfully!',
    body: 'Your order has been received by Shopykart and is being prepared.'
  },
  'Confirmed': {
    title: '✅ Order Confirmed!',
    body: 'Store has accepted your order and packing is underway.'
  },
  'On The Way': {
    title: '🛵 Order On The Way!',
    body: 'Your Shopykart rider is on the way with your order. Keep your phone handy!'
  },
  'Delivered': {
    title: '🎁 Delivered Successfully!',
    body: 'Your order has arrived! Enjoy your meal, and thank you for choosing Shopykart.'
  }
};

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

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === 'modified' || change.type === 'added') {
          const order = change.doc.data();
          const orderId = change.doc.id;
          const currentStatus = order.status;

          // Only trigger if status has changed
          if (lastKnownStatuses.current[orderId] && lastKnownStatuses.current[orderId] !== currentStatus) {
            const msg = statusMessages[currentStatus];

            if (msg) {
              // 1. Native Android Status Bar Notification
              try {
                const { LocalNotifications } = await import('@capacitor/local-notifications');
                await LocalNotifications.schedule({
                  notifications: [
                    {
                      title: msg.title,
                      body: msg.body,
                      id: Math.floor(Math.random() * 100000),
                      schedule: { at: new Date(Date.now() + 100) },
                      sound: undefined,
                      channelId: 'shopykart_orders',
                      actionTypeId: '',
                      extra: {
                        orderId: orderId,
                        url: `/order/track/#${order.customerOrderNumber || orderId}`
                      }
                    }
                  ]
                });
              } catch (e) {
                // Fallback for Web Browser
                if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                  new Notification(msg.title, { body: msg.body, icon: '/logo.png' });
                }
              }

              // 2. In-App Notification History in Firestore
              try {
                await addDoc(collection(firestore, 'users', user.uid, 'notifications'), {
                  title: msg.title,
                  message: msg.body,
                  type: 'order_update',
                  orderId: orderId,
                  timestamp: serverTimestamp(),
                  read: false
                });
              } catch (err) {
                console.error('History save error:', err);
              }
            }
          }

          lastKnownStatuses.current[orderId] = currentStatus;
        }
      }
    });

    return () => unsubscribe();
  }, [user, firestore]);

  return null;
}
