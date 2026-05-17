
'use client';

import { useEffect, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { getFirebaseMessaging } from '@/firebase/messaging';
import { getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { BellRing, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermission(Notification.permission);
      if (Notification.permission === 'default' && user) {
        // Show our custom premium prompt after a short delay
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user || !firestore || Notification.permission !== 'granted') return;

    const setupMessaging = async () => {
      try {
        const messaging = await getFirebaseMessaging();
        if (!messaging) return;

        // Foreground listener
        onMessage(messaging, (payload) => {
          toast({
            title: payload.notification?.title || 'ShopyKart',
            description: payload.notification?.body || 'New update received.',
            action: (
              <Button size="sm" variant="outline" className="rounded-lg font-bold text-[10px]" onClick={() => window.location.href = '/orders'}>
                VIEW
              </Button>
            ),
          });
          
          // Play sound
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => {});
        });

        saveToken(messaging);
      } catch (err) {
        console.warn('Messaging setup failed:', err);
      }
    };

    setupMessaging();
  }, [user, firestore, toast]);

  const saveToken = async (messaging: any) => {
    try {
      // IMPORTANT: Generate VAPID key in Firebase Console > Project Settings > Cloud Messaging
      // Scroll down to "Web push certificates" and click "Generate key pair"
      const vapidKey = 'BBA-Your-VAPID-Key-Here'; // PASTE YOUR KEY HERE
      
      const token = await getToken(messaging, {
        vapidKey: vapidKey === 'BBA-Your-VAPID-Key-Here' ? undefined : vapidKey
      });

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
      console.error('Failed to get FCM token:', err);
    }
  };

  const requestPermission = async () => {
    setShowPrompt(false);
    try {
      const messaging = await getFirebaseMessaging();
      if (!messaging) return;

      const status = await Notification.requestPermission();
      setPermission(status);
      
      if (status === 'granted') {
        saveToken(messaging);
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive order and offer updates!",
        });
      }
    } catch (err) {
      setPermission('denied');
    }
  };

  if (!showPrompt || !user || permission !== 'default') return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="bg-[#0B0B0B] text-white p-5 rounded-[2rem] shadow-2xl border border-white/5 flex items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-xl">
            <BellRing className="h-5 w-5 text-primary animate-bounce" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Enable Alerts</span>
            <span className="text-xs font-bold leading-tight">Get real-time order updates & exclusive offers.</span>
          </div>
        </div>
        
        <div className="flex gap-2 items-center">
           <button onClick={() => setShowPrompt(false)} className="text-[10px] font-black uppercase text-gray-500 px-2 hover:text-white transition-colors">Later</button>
           <Button onClick={requestPermission} className="bg-primary hover:bg-primary/90 text-white rounded-xl h-10 px-4 font-black uppercase italic text-[10px] tracking-widest shadow-lg shadow-primary/20">
             ALLOW
           </Button>
        </div>
      </div>
    </div>
  );
}
