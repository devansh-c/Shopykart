
'use client';

import { useEffect, useRef } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';

/**
 * @fileOverview TelegramNotifier listens to order status changes and sends alerts to Telegram.
 * It is completely separate from Cloud Messaging and handles errors gracefully.
 */
export function TelegramNotifier() {
  const firestore = useFirestore();
  const processedOrders = useRef<Record<string, string>>({});

  // 1. Fetch Telegram Settings
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  useEffect(() => {
    if (!firestore || !settings?.enableTelegram || !settings?.telegramBotToken || !settings?.telegramChatId) return;

    const ordersQuery = query(collection(firestore, 'orders'));

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const orderData = change.doc.data();
        const orderId = change.doc.id;
        const currentStatus = orderData.status;

        // Skip if this specific status change was already alerted via Telegram
        // This check prevents duplicate messages across multiple active sessions
        if (orderData.lastTelegramStatus === currentStatus) return;

        // Requirement: alert on new order, packed, out for delivery, delivered, cancelled
        const targetStatuses = ['Placed', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled'];
        if (!targetStatuses.includes(currentStatus)) return;

        try {
          // Prepare Message
          const itemsList = orderData.items?.map((i: any) => `• ${i.quantity}x ${i.name}`).join('\n') || 'N/A';
          const message = `🚨 *SHOPYKART ORDER ALERT*\n\n` +
                          `🏪 *Store:* ${orderData.restaurantName || 'ShopyKart Select'}\n` +
                          `👤 *Customer:* ${orderData.customerName || 'Premium User'}\n` +
                          `💰 *Amount:* ₹${orderData.total || '0.00'}\n` +
                          `📦 *Status:* ${currentStatus.toUpperCase()}\n` +
                          `🛒 *Items:*\n${itemsList}`;

          // Send to Telegram Bot API
          const telegramUrl = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
          const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: settings.telegramChatId,
              text: message,
              parse_mode: 'Markdown',
            }),
          });

          if (response.ok) {
            // Update Firestore so other clients don't resend
            const orderRef = doc(firestore, 'orders', orderId);
            await updateDoc(orderRef, { lastTelegramStatus: currentStatus });
          }
        } catch (err) {
          // Silent error handling: App continues working normally if Telegram fails
          console.warn("Telegram Alert Failed:", err);
        }
      });
    });

    return () => unsubscribe();
  }, [firestore, settings]);

  return null;
}
