
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { requestPushToken, syncTokenToFirestore } from '@/firebase/messaging';

/**
 * @fileOverview Permission Manager - Handles Native Ringing via System Notifications.
 * Ensures the 'order_alert' sound plays through the system alert tray.
 */
export default function PermissionManager() {
  const { user } = useUser();
  const firestore = useFirestore();
  const registrationDone = useRef(false);

  useEffect(() => {
    if (user?.uid) {
      const savedToken = localStorage.getItem('shopykart_fcm_token');
      if (savedToken) {
        syncTokenToFirestore(user.uid, savedToken);
      }
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;

    const setupNotifications = async () => {
      if (!isMounted) return;

      try {
        const { Capacitor } = await import('@capacitor/core');
        
        if (Capacitor && Capacitor.isNativePlatform()) {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          const { LocalNotifications } = await import('@capacitor/local-notifications');

          // CREATE LOUD CHANNEL (Bypasses system quiet modes)
          const channelConfig = {
            id: 'new_order_channel',
            name: 'High Priority Alerts',
            description: 'Loud sound for new orders and fleet tasks',
            sound: 'order_alert', // Must exist in res/raw/order_alert.mp3
            importance: 5, // MAX IMPORTANCE
            visibility: 1,
            vibration: true,
          };

          // Reinforce channel every time to ensure sound is linked
          await PushNotifications.createChannel(channelConfig);
          await LocalNotifications.createChannel(channelConfig);

          // FORWARD PUSH TO SYSTEM TRAY WITH SOUND
          await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: notification.title || '🚨 SHOPYKART ALERT',
                  body: notification.body || 'Check your dashboard now.',
                  id: Math.floor(Date.now() % 100000),
                  channelId: 'new_order_channel',
                  smallIcon: 'ic_stat_notification',
                  sound: 'order_alert',
                  extra: notification.data
                }
              ]
            });
          });

          PushNotifications.addListener('registration', async (token) => {
            localStorage.setItem('shopykart_fcm_token', token.value);
            if (user?.uid) {
              await syncTokenToFirestore(user.uid, token.value);
            }
          });

          let perm = await PushNotifications.checkPermissions();
          if (perm.receive !== 'granted') {
            perm = await PushNotifications.requestPermissions();
          }

          if (perm.receive === 'granted') {
            await PushNotifications.register();
          }
        } 
        
        if (!registrationDone.current && typeof window !== 'undefined') {
          setTimeout(async () => {
            const token = await requestPushToken(user?.uid || undefined);
            if (token) registrationDone.current = true;
          }, 3000);
        }

      } catch (err) {
        console.error("Native notification setup failed:", err);
      }
    };

    setupNotifications();
    return () => { isMounted = false; };
  }, [user]);

  return null;
}

export async function scheduleTestNotification() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    
    // First, make sure channel exists
    await LocalNotifications.createChannel({
      id: 'new_order_channel',
      name: 'High Priority Alerts',
      sound: 'order_alert',
      importance: 5,
      visibility: 1,
      vibration: true,
    });

    await LocalNotifications.schedule({
      notifications: [
        {
          title: "🚨 LOUD SYSTEM ALERT",
          body: "Aapka phone background mein baj raha hai!",
          id: 8888,
          schedule: { at: new Date(Date.now() + 10000) }, // 10s delay
          channelId: 'new_order_channel',
          sound: 'order_alert',
          extra: { test: true }
        }
      ]
    });
    return true;
  } catch (e) {
    return false;
  }
}
