'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { requestPushToken, syncTokenToFirestore } from '@/firebase/messaging';

/**
 * @fileOverview Permission Manager - Configures Max Priority Channels for Ringing.
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

          // CREATE RINGING CHANNEL (IMPORTANCE_MAX = 5)
          const ringingChannel = {
            id: 'new_order_channel',
            name: 'Order Ringing Alerts',
            description: 'Loud continuous ringing for new tasks',
            sound: 'order_alert', 
            importance: 5, 
            visibility: 1,
            vibration: true,
          };

          await PushNotifications.createChannel(ringingChannel);
          await LocalNotifications.createChannel(ringingChannel);

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
    
    await LocalNotifications.createChannel({
      id: 'new_order_channel',
      name: 'Order Ringing Alerts',
      sound: 'order_alert',
      importance: 5,
      visibility: 1,
      vibration: true,
    });

    await LocalNotifications.schedule({
      notifications: [
        {
          title: "🚨 RINGING TEST",
          body: "Loud alert system check successful!",
          id: 7777,
          schedule: { at: new Date(Date.now() + 5000) }, 
          channelId: 'new_order_channel',
          sound: 'order_alert'
        }
      ]
    });
    return true;
  } catch (e) {
    return false;
  }
}
