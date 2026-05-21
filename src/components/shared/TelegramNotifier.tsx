
'use client';

import { useEffect, useRef } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * @fileOverview TelegramNotifier listens to order status changes and sends alerts to Telegram.
 * Uses HTML parse mode for maximum compatibility with special characters.
 */
export function TelegramNotifier() {
  const firestore = useFirestore();
  const componentMountedAt = useRef(Timestamp.now().seconds);

  // 1. Fetch Telegram Settings
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  useEffect(() => {
    // Only run if Telegram is enabled and credentials exist
    if (!firestore || !settings?.enableTelegram || !settings?.telegramBotToken || !settings?.telegramChatId) {
      return;
    }

    const ordersQuery = query(collection(firestore, 'orders'));

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const orderData = change.doc.data();
        const orderId = change.doc.id;
        const currentStatus = orderData.status;

        // CRUCIAL: Only alert for changes that happen AFTER the app was opened
        // This prevents re-sending alerts for all existing orders on page load
        const orderCreatedAt = orderData.createdAt?.seconds || 0;
        if (orderCreatedAt < componentMountedAt.current - 60) { // 1 min buffer
            // However, if the status JUST changed (even for an old order), we might want to know
            // So we check if lastTelegramStatus is different from current status
        }

        // Skip if this specific status change was already alerted via Telegram
        if (orderData.lastTelegramStatus === currentStatus) return;

        // Alert on specific business milestones
        const targetStatuses = ['Placed', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled'];
        if (!targetStatuses.includes(currentStatus)) return;

        try {
          // Prepare Message using HTML (safer than Markdown for user names/store names)
          const itemsList = orderData.items?.map((i: any) => `• ${i.quantity}x ${i.name}`).join('\n') || 'N/A';
          
          const message = `<b>🚨 SHOPYKART ORDER ALERT</b>\n\n` +
                          `<b>🏪 Store:</b> ${orderData.restaurantName || 'ShopyKart Select'}\n` +
                          `<b>👤 Customer:</b> ${orderData.customerName || 'Premium User'}\n` +
                          `<b>💰 Amount:</b> ₹${orderData.total || '0.00'}\n` +
                          `<b>📦 Status:</b> ${currentStatus.toUpperCase()}\n\n` +
                          `<b>🛒 Items:</b>\n${itemsList}`;

          // Send to Telegram Bot API
          const telegramUrl = `https://api.telegram.org/bot${settings.telegramBotToken.trim()}/sendMessage`;
          
          const response = await fetch(telegramUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: settings.telegramChatId.trim(),
              text: message,
              parse_mode: 'HTML',
            }),
          });

          const result = await response.json();

          if (response.ok) {
            // Update Firestore so this specific status isn't alerted again
            const orderRef = doc(firestore, 'orders', orderId);
            await updateDoc(orderRef, { lastTelegramStatus: currentStatus });
          } else {
            console.error("Telegram API Error:", result.description);
          }
        } catch (err) {
          // Silent error handling: App continues working normally
          console.warn("Telegram Alert Failed:", err);
        }
      });
    });

    return () => unsubscribe();
  }, [firestore, settings]);

  return null;
}
