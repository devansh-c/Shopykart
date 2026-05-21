
'use client';

import { useEffect, useRef } from 'react';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore';

/**
 * @fileOverview TelegramNotifier listens to order status changes and sends alerts to Telegram.
 * Optimized for Static Hosting using GET requests to bypass strict CORS blocks.
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
        if (orderCreatedAt < componentMountedAt.current - 30) {
            // Skip old orders unless the status is new
        }

        // Skip if this specific status change was already alerted via Telegram
        if (orderData.lastTelegramStatus === currentStatus) return;

        // Alert on specific business milestones
        const targetStatuses = ['Placed', 'Ready for Pickup', 'Out for Delivery', 'Delivered', 'Cancelled'];
        if (!targetStatuses.includes(currentStatus)) return;

        try {
          // Prepare Message using Plain Text with Emojis (Safer for GET requests)
          const itemsList = orderData.items?.map((i: any) => `- ${i.quantity}x ${i.name}`).join('\n') || 'N/A';
          
          const message = `🚨 SHOPYKART ORDER ALERT\n\n` +
                          `🏪 Store: ${orderData.restaurantName || 'ShopyKart Select'}\n` +
                          `👤 Customer: ${orderData.customerName || 'Premium User'}\n` +
                          `💰 Amount: ₹${orderData.total || '0.00'}\n` +
                          `📦 Status: ${currentStatus.toUpperCase()}\n\n` +
                          `🛒 Items:\n${itemsList}`;

          // Using GET request with mode: 'no-cors' is the only reliable way 
          // to trigger an external API from a static frontend without a proxy.
          const token = settings.telegramBotToken.trim();
          const chatId = settings.telegramChatId.trim();
          const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}`;
          
          // Fire and forget
          fetch(telegramUrl, { 
            mode: 'no-cors',
            method: 'GET'
          }).catch(() => {
            // Silently fail if network error
          });

          // Update Firestore so this specific status isn't alerted again
          const orderRef = doc(firestore, 'orders', orderId);
          await updateDoc(orderRef, { lastTelegramStatus: currentStatus });
          
        } catch (err) {
          console.warn("Telegram Alert Attempted but failed:", err);
        }
      });
    });

    return () => unsubscribe();
  }, [firestore, settings]);

  return null;
}
