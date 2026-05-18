
'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { getFirebaseMessaging } from '@/firebase/messaging';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp, collection, query, where, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { BellRing, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const BRAND_LOGO_URL = "https://picsum.photos/seed/shopykart-eats/200/200";

export function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);
  
  // To track order status changes locally
  const lastStatuses = useRef<Record<string, string>>({});

  const VAPID_KEY = 'BC5Gx8VDwyRgNuv-SzJPZnqkcCCDzrhZnJ4SsGfK65Z9_SkQRYjSSfZraLlUpxIwGenba0GpsQAnnatRwSQ-VKo';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermission(Notification.permission);
      
      if (Notification.permission === 'default' && user) {
        const timer = setTimeout(() => setShowPrompt(true), 5000);
        return () => clearTimeout(timer);
      }
    }

    const handleManualRequest = () => {
      requestPermission();
    };
    window.addEventListener('request-notifications', handleManualRequest);
    return () => window.removeEventListener('request-notifications', handleManualRequest);
  }, [user]);

  // Status Change Listener Logic
  useEffect(() => {
    if (!user || !firestore) return;

    const q = query(collection(firestore, 'orders'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const orderData = change.doc.data();
        const orderId = change.doc.id;
        const newStatus = orderData.status;
        const oldStatus = lastStatuses.current[orderId];

        // Notify if status changed
        if (oldStatus && oldStatus !== newStatus) {
           triggerStatusNotification(newStatus);
        }
        
        // Initialize status if not present (to avoid notifying on first load)
        lastStatuses.current[orderId] = newStatus;
      });
    });

    return () => unsubscribe();
  }, [user, firestore]);

  const triggerStatusNotification = (status: string) => {
    let title = "Order Update";
    let body = `Your order status is now: ${status}`;

    switch (status) {
      case 'Accepted':
        title = "Order Accepted! 👨‍🍳";
        body = "Your order has been accepted and preparation has started right now!";
        break;
      case 'Preparing':
        title = "In the Kitchen! 🍱";
        body = "Your order is being prepared. It will be ready for pickup in approximately 2 minutes.";
        break;
      case 'Ready for Pickup':
        title = "Ready to Go! ✅";
        body = "Your order is ready for pickup! Our delivery partner will pick it up within 10 minutes.";
        break;
      case 'Picked Up':
        title = "On the Way! 🚚";
        body = "Your order has been picked up and will be delivered in a few minutes.";
        break;
      case 'Out for Delivery':
        title = "Almost There! 📍";
        body = "Your order is out for delivery. The delivery partner is just 100 meters away from you!";
        break;
      case 'Delivered':
        title = "Delivered! 😋";
        body = "Your order has been successfully delivered. Thank you for shopping with ShopyKart!";
        break;
    }

    // Play Sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(() => {});

    // Browser Notification
    if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body: body,
          icon: BRAND_LOGO_URL,
          badge: BRAND_LOGO_URL,
          tag: 'order-status'
        });
      });
    }

    // UI Toast as fallback/duplicate for foreground
    toast({
      title: title,
      description: body,
      duration: 5000,
    });
  };

  useEffect(() => {
    if (!user || !firestore || Notification.permission !== 'granted') return;

    const setupMessaging = async () => {
      try {
        if ('serviceWorker' in navigator) {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        }

        const messaging = await getFirebaseMessaging();
        if (!messaging) return;

        onMessage(messaging, (payload) => {
          console.log("Foreground FCM received:", payload);
          triggerStatusNotification(payload.notification?.body || 'Updated');
        });

        await saveToken(messaging);
      } catch (err) {
        console.error("Messaging setup error:", err);
      }
    };

    setupMessaging();
  }, [user, firestore]);

  const saveToken = async (messaging: any) => {
    try {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (token && user && firestore) {
        const tokenRef = doc(firestore, 'users', user.uid, 'fcmTokens', token);
        await setDoc(tokenRef, {
          token,
          deviceType: 'web',
          lastUpdated: serverTimestamp(),
          userId: user.uid
        }, { merge: true });
      }
    } catch (err) {
      console.error("Token retrieval failed:", err);
    }
  };

  const requestPermission = async () => {
    setShowPrompt(false);
    try {
      const status = await Notification.requestPermission();
      setPermission(status);
      if (status === 'granted') {
        const messaging = await getFirebaseMessaging();
        if (messaging) await saveToken(messaging);
        toast({ title: "Notifications Enabled!", description: "You will now receive real-time order alerts." });
      }
    } catch (err) {
      console.error("Permission request failed:", err);
    }
  };

  if (!showPrompt || !user || permission !== 'default') return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-[#0B0B0B] text-white p-5 rounded-[2rem] shadow-2xl border border-white/5 flex items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-xl">
            <BellRing className="h-5 v-5 text-primary animate-bounce" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Stay Notified</span>
            <span className="text-xs font-bold leading-tight">Enable alerts for order updates and premium offers.</span>
          </div>
        </div>
        <div className="flex gap-2 items-center">
           <button onClick={() => setShowPrompt(false)} className="text-[10px] font-black uppercase text-gray-500 px-2">Later</button>
           <Button onClick={requestPermission} className="bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-4 font-black uppercase italic text-[10px] tracking-widest shadow-lg">
             ALLOW
           </Button>
        </div>
      </div>
    </div>
  );
}
