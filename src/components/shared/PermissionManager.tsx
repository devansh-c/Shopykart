
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
              // REGISTER HIGH IMPORTANCE CHANNEL (LEVEL 5)
              // This is critical for heads-up and background sound on Android 8+
              await PushNotifications.createChannel({
                id: 'new_order_channel',
                name: 'Loud Order Alerts',
                description: 'Critical loud alerts for incoming orders',
                sound: 'order_alert', // Targets res/raw/order_alert.mp3
                importance: 5, // MAX IMPORTANCE (Heads-up + Sound)
                visibility: 1, // Public on lockscreen
                vibration: true,
              });
              
              await LocalNotifications.createChannel({
                id: 'new_order_channel',
                name: 'Loud Order Alerts',
                description: 'Critical loud alerts for incoming orders',
                sound: 'order_alert.mp3',
                importance: 5,
                visibility: 1,
                vibration: true,
              });
              
              console.log('LOUD MAX-IMPORTANCE Channels Registered');
            } catch (err) {
              console.error('Channel creation error:', err);
            }

            // BACKGROUND / FOREGROUND HEADS-UP BRIDGE
            // If a notification is received while in background, this ensures a heads-up alert triggers
            PushNotifications.addListener('pushNotificationReceived', async (notification) => {
              console.log('Push received:', notification);
              
              // Force show as local notification if channel is set but OS is being lazy
              // This bypasses many background restrictions on modern Android
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: notification.title || 'New Order Alert!',
                    body: notification.body || 'Open app to accept.',
                    id: Math.floor(Math.random() * 10000),
                    schedule: { at: new Date(Date.now() + 50) },
                    channelId: 'new_order_channel',
                    smallIcon: 'ic_stat_notification',
                    sound: 'order_alert.mp3', // Extension is needed for local notifications plugin
                    extra: notification.data
                  }
                ]
              });
            });
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
        console.error("Notification setup error:", err);
      }
    };

    setupNotifications();
    return () => { isMounted = false; };
  }, [user]);

  return null;
}

/**
 * Utility to test background ringing. Schedules an alert for 10 seconds later.
 * Uses MAX IMPORTANCE channel to verify visibility.
 */
export async function scheduleTestNotification() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "🚨 MAX PRIORITY ALERT TEST",
          body: "Verification: Background ringing (Level 5) is working!",
          id: 9999,
          schedule: { at: new Date(Date.now() + 10000) }, // Fired after 10 seconds
          channelId: 'new_order_channel',
          sound: 'order_alert.mp3',
          extra: { test: true }
        }
      ]
    });
    return true;
  } catch (e) {
    console.error("Test notification failed", e);
    return false;
  }
}
