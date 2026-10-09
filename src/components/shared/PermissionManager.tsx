'use client';

import { useEffect } from 'react';

export default function PermissionManager() {
  useEffect(() => {
    let isMounted = true;

    const setupFCM = async () => {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (!Capacitor.isNativePlatform()) return;

        const { PushNotifications } = await import('@capacitor/push-notifications');

        // Android 8+ Mandatory Default Channel
        try {
          await PushNotifications.createChannel({
            id: 'fcm_default_channel',
            name: 'General Notifications',
            description: 'Order and promotional alerts',
            importance: 5,
            visibility: 1,
            vibration: true,
            sound: 'default'
          });
        } catch (e) {
          console.error('Channel error:', e);
        }

        // Listener lagayein taaki token console/alert par dikhe
        await PushNotifications.removeAllListeners();

        PushNotifications.addListener('registration', (token) => {
          console.log('=== YOUR FCM DEVICE TOKEN ===', token.value);
          localStorage.setItem('shopykart_fcm_token', token.value);
        });

        PushNotifications.addListener('registrationError', (err) => {
          console.error('FCM Error:', err);
        });

        // Foreground alert
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          alert('Notification: ' + notification.title + '\n' + notification.body);
        });

        // Request Push Permission
        let perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') {
          perm = await PushNotifications.requestPermissions();
        }

        if (perm.receive === 'granted') {
          await PushNotifications.register();
        }

      } catch (err) {
        console.error('Push setup failed:', err);
      }
    };

    setTimeout(setupFCM, 500);

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}
