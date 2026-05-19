
'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, doc, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DEFAULT_LOGO = "https://picsum.photos/seed/shopykart-eats/200/200";

export function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [permission, setPermission] = useState<string>('default');
  const [showPrompt, setShowPrompt] = useState(false);
  
  const lastStatuses = useRef<Record<string, string>>({});
  const lastBroadcastId = useRef<string | null>(null);
  const lastPersonalId = useRef<string | null>(null);

  // Fetch dynamic notification logo from branding
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: branding } = useDoc<any>(brandingRef);

  const NOTIFY_ICON = branding?.notificationLogoUrl || DEFAULT_LOGO;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      
      if (Notification.permission === 'default' && user) {
        const timer = setTimeout(() => setShowPrompt(true), 15000); // Wait 15s before asking
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const triggerPush = (title: string, body: string) => {
    // Sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    } catch (e) {}

    // Toast
    toast({
      title: title,
      description: body,
      duration: 6000,
    });

    // Native Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body: body,
          icon: NOTIFY_ICON,
          badge: NOTIFY_ICON,
          tag: 'shopykart-alert'
        });
      } catch (err) {
        // Fallback for mobile browsers that require service worker for notifications
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, {
              body: body,
              icon: NOTIFY_ICON,
              badge: NOTIFY_ICON,
              tag: 'shopykart-alert'
            });
          }).catch(() => {});
        }
      }
    }
  };

  // 1. Order Status Listener
  useEffect(() => {
    if (!user || !firestore) return;

    const q = query(collection(firestore, 'orders'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const orderData = change.doc.data();
        const orderId = change.doc.id;
        const newStatus = orderData.status;
        const oldStatus = lastStatuses.current[orderId];

        if (oldStatus && oldStatus !== newStatus) {
           let title = "Order Update";
           let body = `Your order status is now: ${newStatus}`;
           if (newStatus === 'Delivered') { title = "Delivered! 😋"; body = "Enjoy your meal from ShopyKart!"; }
           if (newStatus === 'Out for Delivery') { title = "Almost There! 🚚"; body = "Your food is just around the corner."; }
           
           triggerPush(title, body);
        }
        lastStatuses.current[orderId] = newStatus;
      });
    });

    return () => unsubscribe();
  }, [user, firestore, toast]);

  // 2. Broadcast Listener (Global Campaigns)
  useEffect(() => {
    if (!firestore) return;

    const q = query(collection(firestore, 'broadcasts'), orderBy('timestamp', 'desc'), limit(1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      const latest = snapshot.docs[0];
      const data = latest.data();
      
      // Prevent showing old broadcasts on first load
      if (!lastBroadcastId.current) {
        lastBroadcastId.current = latest.id;
        return;
      }

      if (latest.id !== lastBroadcastId.current) {
        lastBroadcastId.current = latest.id;
        triggerPush(data.title || "ShopyKart Alert", data.message || "");
      }
    });

    return () => unsubscribe();
  }, [firestore]);

  // 3. Personal Notification Listener
  useEffect(() => {
    if (!user || !firestore) return;

    const q = query(collection(firestore, 'users', user.uid, 'notifications'), orderBy('timestamp', 'desc'), limit(1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      const latest = snapshot.docs[0];
      const data = latest.data();

      if (!lastPersonalId.current) {
        lastPersonalId.current = latest.id;
        return;
      }

      if (latest.id !== lastPersonalId.current) {
        lastPersonalId.current = latest.id;
        triggerPush(data.title || "For You", data.message || "");
      }
    });

    return () => unsubscribe();
  }, [user, firestore]);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setShowPrompt(false);
    try {
      const status = await Notification.requestPermission();
      setPermission(status);
      if (status === 'granted') toast({ title: "Enabled!", description: "Real-time alerts active." });
    } catch (err) {}
  };

  if (!showPrompt || !user || permission !== 'default' || typeof window === 'undefined' || !('Notification' in window)) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-[#0B0B0B] text-white p-5 rounded-[2rem] shadow-2xl border border-white/5 flex items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-xl">
            <BellRing className="h-5 v-5 text-primary animate-bounce" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Stay Notified</span>
            <span className="text-xs font-bold leading-tight">Enable alerts for order updates.</span>
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
