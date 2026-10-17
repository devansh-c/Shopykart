'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { requestPushToken, syncTokenToFirestore } from '@/firebase/messaging';

/**
 * @fileOverview Permission Manager - Manages Notifications & FCM registration for all 4 Apps.
 * Optimized for LOUD Background Ringing using MAX Importance Channels (Level 5).
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
              // 1. CREATE CHANNEL FOR PUSH NOTIFICATIONS (Importance 5 = LOUD + BANNER)
              await PushNotifications.createChannel({
                id: 'new_order_channel',
                name: 'Loud Order Alerts',
                description: 'Critical loud alerts for incoming orders',
                sound: 'order_alert', // References res/raw/order_alert.mp3 without extension
                importance: 5, 
                visibility: 1, 
                vibration: true,
              });
              
              // 2. CREATE CHANNEL FOR LOCAL NOTIFICATIONS BRIDGE
              await LocalNotifications.createChannel({
                id: 'new_order_channel',
                name: 'Loud Order Alerts',
                description: 'Critical loud alerts for incoming orders',
                sound: 'order_alert.mp3', // Extension usually needed for local
                importance: 5,
                visibility: 1,
                vibration: true,
              });
              
              console.log('MAX-IMPORTANCE Channels Registered for Business App');

              // 3. BACKGROUND FORCE-RINGING BRIDGE
              // When push is received in background, force a local notification to play sound
              PushNotifications.addListener('pushNotificationReceived', async (notification) => {
                console.log('Push captured in background:', notification);
                
                await LocalNotifications.schedule({
                  notifications: [
                    {
                      title: notification.title || '🚨 NEW ORDER RECEIVED!',
                      body: notification.body || 'Check dashboard immediately.',
                      id: Date.now() % 100000,
                      schedule: { at: new Date(Date.now() + 100) },
                      channelId: 'new_order_channel',
                      smallIcon: 'ic_stat_notification',
                      sound: 'order_alert.mp3',
                      extra: notification.data
                    }
                  ]
                });
              });
            } catch (err) {
              console.error('Loud channel creation failed:', err);
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
 * Utility to test background ringing. 
 * Schedules a Level-5 importance alert with a 10s delay.
 */
export async function scheduleTestNotification() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "🚨 LOUD ALERT TEST",
          body: "Verification: Background ringing (Level 5) is active!",
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