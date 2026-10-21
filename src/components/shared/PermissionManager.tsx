'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { requestPushToken, syncTokenToFirestore } from '@/firebase/messaging';

/**
 * @fileOverview Permission Manager - Manages Notifications & FCM registration.
 * FINAL FIX: Uses 'order_alert' (no extension) for Android resource matching.
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

          const isAdmin = process.env.NEXT_PUBLIC_ADMIN_APP === 'true';
          const isBiz = process.env.NEXT_PUBLIC_BIZ_APP === 'true';
          const isTow = process.env.NEXT_PUBLIC_TOW_APP === 'true';

          if (isAdmin || isBiz || isTow) {
            try {
              // CREATE LOUD CHANNEL (Standard Android Name Mapping)
              const channelConfig = {
                id: 'new_order_channel',
                name: 'Critical Order Alerts',
                description: 'Loud sound for new orders',
                sound: 'order_alert', // Strictly matching res/raw/order_alert.mp3
                importance: 5,
                visibility: 1,
                vibration: true,
              };

              await PushNotifications.createChannel(channelConfig);
              await LocalNotifications.createChannel(channelConfig);
              
              console.log('High Importance Channel Active');

              // THE BRIDGE: Intercept Foreground Push and Play Sound
              await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
                console.log('Loud Alert Triggered:', notification);
                
                await LocalNotifications.schedule({
                  notifications: [
                    {
                      title: notification.title || '🚨 NEW ORDER!',
                      body: notification.body || 'Check your dashboard now.',
                      id: Math.floor(Date.now() % 100000),
                      channelId: 'new_order_channel',
                      smallIcon: 'ic_stat_notification',
                      sound: 'order_alert', // No extension for Android
                      extra: notification.data
                    }
                  ]
                });
              });

            } catch (err) {
              console.error('Channel creation error:', err);
            }
          }

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
        console.error("Native setup failed:", err);
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
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "🚨 LOUD ALERT TEST",
          body: "Verification: Ringing is active!",
          id: 8888,
          schedule: { at: new Date(Date.now() + 10000) },
          channelId: 'new_order_channel',
          sound: 'order_alert', // Correct resource name
          extra: { test: true }
        }
      ]
    });
    return true;
  } catch (e) {
    return false;
  }
}
