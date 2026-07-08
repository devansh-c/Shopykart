'use client';

import { useEffect, useRef } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, onSnapshot, doc, updateDoc, orderBy, limit } from 'firebase/firestore';

/**
 * @fileOverview TelegramNotifier listens to order status changes and sends alerts.
 */
export default function TelegramNotifier() {
  const firestore = useFirestore();
  const processedOrdersInSession = useRef<Set<string>>(new Set());

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  useEffect(() => {
    if (!firestore || !settings?.enableTelegram || !settings?.telegramBotToken || !settings?.telegramChatId) {
      return;
    }

    const ordersQuery = query(
      collection(firestore, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot: any) => {
      snapshot.docChanges().forEach(async (change: any) => {
        if (change.type === 'removed') return;

        const orderData = change.doc.data();
        const orderId = change.doc.id;
        const currentStatus = orderData.status;

        const sessionKey = `${orderId}_${currentStatus}`;
        if (orderData.lastTelegramStatus === currentStatus || processedOrdersInSession.current.has(sessionKey)) {
          return;
        }

        const targetStatuses = ['Placed', 'Accepted', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled'];
        if (!targetStatuses.includes(currentStatus)) return;

        try {
          const itemsList = orderData.items?.map((i: any) => `• ${i.quantity}x ${i.name}`).join('\n') || 'N/A';
          const message = `🚨 <b>SHOPYKART ALERT</b>\n\n` +
                          `🏪 <b>Store:</b> ${orderData.restaurantName || 'Store'}\n` +
                          `👤 <b>Customer:</b> ${orderData.customerName || 'User'}\n` +
                          `💰 <b>Amount:</b> ₹${orderData.total || '0'}\n` +
                          `📦 <b>Status:</b> ${currentStatus.toUpperCase()}\n\n` +
                          `🛒 <b>Items:</b>\n${itemsList}`;

          const telegramUrl = `https://api.telegram.org/bot${settings.telegramBotToken.trim()}/sendMessage?chat_id=${settings.telegramChatId.trim()}&text=${encodeURIComponent(message)}&parse_mode=HTML`;
          
          processedOrdersInSession.current.add(sessionKey);
          fetch(telegramUrl, { mode: 'no-cors' }).then(() => {
            updateDoc(doc(firestore, 'orders', orderId), { lastTelegramStatus: currentStatus });
          }).catch(() => {
            processedOrdersInSession.current.delete(sessionKey);
          });
        } catch (err) {}
      });
    });

    return () => unsubscribe();
  }, [firestore, settings]);

  return null;
}
