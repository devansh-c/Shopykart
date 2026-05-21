
'use client';

import { useEffect, useRef } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * @fileOverview TelegramNotifier listens to order status changes and sends alerts to Telegram.
 * Optimized for Static Hosting.
 */
export function TelegramNotifier() {
  const firestore = useFirestore();
  const isInitialLoad = useRef(true);

  // 1. Fetch Telegram Settings
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  useEffect(() => {
    if (!firestore || !settings?.enableTelegram || !settings?.telegramBotToken || !settings?.telegramChatId) {
      return;
    }

    const ordersQuery = query(collection(firestore, 'orders'));

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      // Skip the very first sync of all existing orders to avoid spamming old notifications
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }

      snapshot.docChanges().forEach(async (change) => {
        const orderData = change.doc.data();
        const orderId = change.doc.id;
        const currentStatus = orderData.status;

        // Skip if this specific status change was already alerted via Telegram
        if (orderData.lastTelegramStatus === currentStatus) return;

        // Alert on specific business milestones
        const targetStatuses = ['Placed', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled'];
        if (!targetStatuses.includes(currentStatus)) return;

        try {
          const itemsList = orderData.items?.map((i: any) => `• ${i.quantity}x ${i.name}`).join('\n') || 'N/A';
          
          const message = `🚨 SHOPYKART ORDER ALERT\n\n` +
                          `🏪 Store: ${orderData.restaurantName || 'ShopyKart Select'}\n` +
                          `👤 Customer: ${orderData.customerName || 'Premium User'}\n` +
                          `💰 Amount: ₹${orderData.total || '0.00'}\n` +
                          `📦 Status: ${currentStatus.toUpperCase()}\n\n` +
                          `🛒 Items:\n${itemsList}`;

          const token = settings.telegramBotToken.trim();
          const chatId = settings.telegramChatId.trim();
          const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;
          
          console.log("Attempting to send Telegram alert for order:", orderId);

          // Using mode: 'no-cors' to allow the request to leave the browser even if Telegram doesn't send CORS headers
          fetch(telegramUrl, { mode: 'no-cors' })
            .then(async () => {
              // Update Firestore so this specific status isn't alerted again
              const orderRef = doc(firestore, 'orders', orderId);
              await updateDoc(orderRef, { lastTelegramStatus: currentStatus });
              console.log("Telegram alert sent successfully for order:", orderId);
            })
            .catch(err => {
              console.error("Fetch error sending Telegram alert:", err);
            });
          
        } catch (err) {
          console.warn("Telegram Alert logic failed:", err);
        }
      });
    });

    return () => unsubscribe();
  }, [firestore, settings]);

  return null;
}
