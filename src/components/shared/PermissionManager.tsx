'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { requestPushToken, syncTokenToFirestore } from '@/firebase/messaging';

/**
 * @fileOverview Permission Manager - Manages Notifications & FCM registration for all 4 Apps.
 * FORCE FIX: Implements a Native Bridge to ensure sound plays in both Foreground and Background.
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

          // DETECT ROLE-BASED APPS FOR LOUD CHANNEL
          const isAdmin = process.env.NEXT_PUBLIC_ADMIN_APP === 'true';
          const isBiz = process.env.NEXT_PUBLIC_BIZ_APP === 'true';
          const isTow = process.env.NEXT_PUBLIC_TOW_APP === 'true';

          // CREATE LOUD CHANNEL FOR BUSINESS APPS (ADMIN, BIZ, TOW)
          if (isAdmin || isBiz || isTow) {
            try {
              // 1. REGISTER CHANNEL ON BOTH PLUGINS (MAX IMPORTANCE)
              const channelConfig = {
                id: 'new_order_channel',
                name: 'Order Alerts (Loud)',
                description: 'Critical alerts for new orders',
                sound: 'order_alert', // For Push (res/raw/order_alert.mp3)
                importance: 5,
                visibility: 1,
                vibration: true,
              };

              await PushNotifications.createChannel(channelConfig);
              
              // LocalNotifications needs the .mp3 extension in some versions
              await LocalNotifications.createChannel({
                ...channelConfig,
                sound: 'order_alert.mp3'
              });
              
              console.log('Notification Channels Primed (Level 5)');

              // 2. THE BRIDGE: INTERCEPT PUSH AND FORCE LOCAL ALERT (Ensures sound in Foreground & Background)
              await PushNotifications.addListener('pushNotificationReceived', async (notification) => {
                console.log('Intercepting Push:', notification);
                
                // Force a local notification which is much more reliable for sound playback
                await LocalNotifications.schedule({
                  notifications: [
                    {
                      title: notification.title || '🚨 NEW ORDER RECEIVED!',
                      body: notification.body || 'Check your dashboard now.',
                      id: Math.floor(Date.now() % 100000),
                      schedule: { at: new Date(Date.now() + 50) },
                      channelId: 'new_order_channel',
                      smallIcon: 'ic_stat_notification',
                      sound: 'order_alert.mp3',
                      extra: notification.data
                    }
                  ]
                });
              });

              // Also handle action (click on notification)
              await PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                console.log('Notification tapped:', notification);
              });

            } catch (err) {
              console.error('Loud channel bridge failed:', err);
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

/**
 * Utility to test background/foreground ringing. 
 * Schedules a Level-5 importance alert with a 10s delay.
 */
export async function scheduleTestNotification() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "🚨 LOUD ALERT TEST",
          body: "Verification: Manual Bridge ringing (Level 5) is active!",
          id: 8888,
          schedule: { at: new Date(Date.now() + 10000) },
          channelId: 'new_order_channel',
          sound: 'order_alert.mp3',
          extra: { test: true }
        }
      ]
    });
    return true;
  } catch (e) {
    console.error("Local schedule failed", e);
    return false;
  }
}
