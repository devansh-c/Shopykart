
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { requestPushToken, syncTokenToFirestore } from '@/firebase/messaging';

/**
 * @fileOverview Permission Manager - Manages Notifications & FCM registration for all 4 Apps.
 * Optimized for LOUD Background Ringing using Delayed Local Notifications.
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
              // Ensure channel exists with custom sound
              await PushNotifications.createChannel({
                id: 'new_order_channel',
                name: 'Urgent Order Alerts',
                description: 'Critical loud alerts for incoming orders',
                sound: 'order_alert', // Targets res/raw/order_alert.mp3 (without extension)
                importance: 5, // MAX IMPORTANCE for Heads-up & Sound
                visibility: 1,
                vibration: true,
              });
              
              await LocalNotifications.createChannel({
                id: 'new_order_channel',
                name: 'Urgent Order Alerts',
                description: 'Critical loud alerts for incoming orders',
                sound: 'order_alert.mp3',
                importance: 5,
                visibility: 1,
                vibration: true,
              });
              
              console.log('LOUD Notification Channels Registered');
            } catch (err) {
              console.error('Channel creation error:', err);
            }

            // ADD LISTENER TO HANDLE HEADS-UP WHEN IN BACKGROUND
            PushNotifications.addListener('pushNotificationReceived', async (notification) => {
              // Force show as local notification to ensure sound in background
              await LocalNotifications.schedule({
                notifications: [
                  {
                    title: notification.title || 'New Order Alert!',
                    body: notification.body || 'Open app to accept.',
                    id: Math.floor(Math.random() * 10000),
                    schedule: { at: new Date(Date.now() + 100) },
                    channelId: 'new_order_channel',
                    smallIcon: 'ic_stat_notification',
                    sound: 'order_alert.mp3'
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

      } catch (err) {}
    };

    setupNotifications();
    return () => { isMounted = false; };
  }, [user]);

  return null;
}

/**
 * Utility to test background ringing. Schedules an alert for 10 seconds later.
 */
export async function scheduleTestNotification() {
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "🚨 LOUD ALERT TEST",
          body: "Verification: Background ringing is working!",
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
