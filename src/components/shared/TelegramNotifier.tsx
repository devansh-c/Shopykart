
'use client';

import { useEffect, useRef } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, onSnapshot, doc, updateDoc, Timestamp, orderBy, limit } from 'firebase/firestore';

/**
 * @fileOverview TelegramNotifier listens to order status changes and sends alerts to Telegram.
 * Optimized for Static Hosting. Works as long as the app is open in any tab.
 */
export function TelegramNotifier() {
  const firestore = useFirestore();
  const processedOrdersInSession = useRef<Set<string>>(new Set());

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

    // Listen to most recent orders to minimize overhead
    const ordersQuery = query(
      collection(firestore, 'orders'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        // We only care about Added (new orders) or Modified (status changes)
        if (change.type === 'removed') return;

        const orderData = change.doc.data();
        const orderId = change.doc.id;
        const currentStatus = orderData.status;

        // Skip if this specific status change was already alerted via Telegram
        // or if we already sent an alert for this exact status in this session
        const sessionKey = `${orderId}_${currentStatus}`;
        if (orderData.lastTelegramStatus === currentStatus || processedOrdersInSession.current.has(sessionKey)) {
          return;
        }

        // Target business critical statuses
        const targetStatuses = ['Placed', 'Accepted', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled'];
        if (!targetStatuses.includes(currentStatus)) return;

        try {
          const itemsList = orderData.items?.map((i: any) => `• ${i.quantity}x ${i.name}`).join('\n') || 'N/A';
          
          const message = `🚨 <b>SHOPYKART ORDER ALERT</b>\n\n` +
                          `🏪 <b>Store:</b> ${orderData.restaurantName || 'ShopyKart Select'}\n` +
                          `👤 <b>Customer:</b> ${orderData.customerName || 'Premium User'}\n` +
                          `💰 <b>Amount:</b> ₹${orderData.total || '0.00'}\n` +
                          `📦 <b>Status:</b> ${currentStatus.toUpperCase()}\n\n` +
                          `🛒 <b>Items:</b>\n${itemsList}`;

          const token = settings.telegramBotToken.trim();
          const chatId = settings.telegramChatId.trim();
          
          // Using HTML mode for better formatting and robustness
          const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}&parse_mode=HTML`;
          
          processedOrdersInSession.current.add(sessionKey);

          // Standard fetch is usually fine for GET requests to Telegram API even on local/static
          fetch(telegramUrl, { mode: 'no-cors' })
            .then(async () => {
              // Mark as notified in DB to prevent duplicates from other tabs/sessions
              const orderRef = doc(firestore, 'orders', orderId);
              await updateDoc(orderRef, { lastTelegramStatus: currentStatus });
            })
            .catch(err => {
              console.warn("Telegram fetch failed:", err);
              // Remove from session set so it can retry if the user interacts
              processedOrdersInSession.current.delete(sessionKey);
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
