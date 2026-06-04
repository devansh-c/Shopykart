
'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, Timestamp, orderBy, limit } from 'firebase/firestore';
import { BellRing, X, Megaphone, ShoppingBag, Package, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { requestPushToken } from '@/firebase/messaging';

export function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [permission, setPermission] = useState<string>('default');
  const [showPrompt, setShowPrompt] = useState(false);
  const [activeAlert, setActiveAlert] = useState<{ title: string, message: string, type?: string } | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  
  const lastStatuses = useRef<Record<string, string>>({});
  const processedOrders = useRef<Set<string>>(new Set());

  // FCM Token Registration
  useEffect(() => {
    if (user && firestore) {
      const registerFCM = async () => {
        const token = await requestPushToken();
        if (token) {
          // Save token to user profile so backend can send push messages
          await setDoc(doc(firestore, 'users', user.uid), {
            fcmToken: token,
            lastTokenUpdate: serverTimestamp()
          }, { merge: true });
          console.log("FCM Token registered for background alerts ✅");
        }
      };
      registerFCM();
    }
  }, [user, firestore]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'default' && user) {
        const timer = setTimeout(() => setShowPrompt(true), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const triggerPush = (title: string, body: string, isOrder = false, type = 'general') => {
    // 1. SOUND ALERT
    try {
      const isCritical = isOrder || type === 'delivery-task';
      const soundUrl = isCritical 
        ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' 
        : 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
      const audio = new Audio(soundUrl);
      audio.volume = 1.0;
      audio.play().catch(() => {});
    } catch (e) {}

    // 2. MODAL ALERT (Foreground)
    if (isOrder || type === 'delivery-task') {
      setActiveAlert({ title, message: body, type });
      setIsAlertOpen(true);
    }

    // 3. TOAST
    toast({ title: title.toUpperCase(), description: body });

    // 4. BROWSER/APK SYSTEM NOTIFICATION
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const options = {
        body: body,
        icon: '/icon.png',
        tag: isOrder ? 'new-order' : 'status-update',
        requireInteraction: true,
        vibrate: [200, 100, 200]
      };
      new Notification(title, options);
    }
  };

  // Foreground Listeners (onSnapshot)
  useEffect(() => {
    if (!user || !firestore) return;
    
    // Admin/Vendor Order Listener
    const isAdmin = user.email === 'ceo@shopykart.co.in';
    const ordersQuery = isAdmin 
      ? query(collection(firestore, 'orders'), where('status', '==', 'Placed'))
      : query(collection(firestore, 'orders'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const id = change.doc.id;

        if (change.type === 'added' && data.status === 'Placed' && isAdmin) {
          if (!processedOrders.current.has(id)) {
            processedOrders.current.add(id);
            triggerPush(`🚨 NEW ORDER ARRIVED!`, `Order of ₹${data.total} from ${data.customerName}`, true);
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user, firestore]);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setShowPrompt(false);
    const status = await Notification.requestPermission();
    setPermission(status);
  };

  return (
    <>
      <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-sm p-8 text-center bg-white shadow-2xl">
           <div className="h-20 w-20 rounded-[2rem] bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
              <Megaphone className="h-10 w-10 animate-bounce" />
           </div>
           <h2 className="text-2xl font-black italic uppercase mb-2">{activeAlert?.title}</h2>
           <p className="text-gray-600 font-bold mb-8 italic">"{activeAlert?.message}"</p>
           <Button onClick={() => setIsAlertOpen(false)} className="w-full h-14 rounded-2xl bg-black font-black uppercase italic">GOT IT</Button>
        </DialogContent>
      </Dialog>

      {showPrompt && user && permission === 'default' && (
        <div className="fixed top-20 left-4 right-4 z-[5000] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-[#0B0B0B] text-white p-5 rounded-[2rem] shadow-2xl border border-white/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-xl"><BellRing className="h-5 v-5 text-primary animate-ring" /></div>
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-primary">Enable Alerts</span><span className="text-xs font-bold">Receive instant order rings.</span></div>
            </div>
            <Button onClick={requestPermission} className="bg-primary text-white rounded-xl h-10 px-6 font-black uppercase italic text-[10px] tracking-widest">ALLOW</Button>
          </div>
        </div>
      )}
    </>
  );
}
