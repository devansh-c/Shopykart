'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, doc, orderBy, limit, Timestamp } from 'firebase/firestore';
import { BellRing, X, Megaphone, Sparkles, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview Integrated Notification Engine with Audible Cloud Alerts.
 * Enhanced to act as an "Emergency Alert" for vendors with high-priority sticky behavior.
 */
export function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [permission, setPermission] = useState<string>('default');
  const [showPrompt, setShowPrompt] = useState(false);
  const [activeAlert, setActiveAlert] = useState<{ title: string, message: string } | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  
  const lastStatuses = useRef<Record<string, string>>({});
  const lastBroadcastId = useRef<string | null>(null);
  const processedOrders = useRef<Set<string>>(new Set());

  // Branding for icons
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: branding } = useDoc<any>(brandingRef);

  // User role for intelligent alerting
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile } = useDoc<any>(profileRef);

  const NOTIFY_ICON = branding?.notificationLogoUrl || 'https://shopykart.co.in/icon.png';

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'default' && user) {
        const timer = setTimeout(() => setShowPrompt(true), 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const triggerPush = (title: string, body: string, isOrder = false, isBroadcast = false) => {
    // 1. SOUND ALERT: Loud Ring for Orders
    try {
      const soundUrl = isOrder 
        ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' 
        : 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
      const audio = new Audio(soundUrl);
      audio.volume = 1.0;
      audio.play().catch(() => console.log("Interaction required for audio"));
    } catch (e) {}

    // 2. MODAL ALERT: Disruptive visual feedback for orders/broadcasts
    if (isBroadcast || isOrder) {
      setActiveAlert({ title, message: body });
      setIsAlertOpen(true);
    }

    // 3. TOAST ALERT: Instant UI feedback
    toast({
      title: title.toUpperCase(),
      description: body
    });

    // 4. NATIVE SYSTEM NOTIFICATION (For APK/Background)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const options: NotificationOptions = {
        body: body,
        icon: NOTIFY_ICON,
        badge: NOTIFY_ICON,
        tag: isOrder ? 'new-order' : 'shopykart-alert',
        renotify: isOrder, // Buzzer will repeat if new order comes while old one exists
        requireInteraction: isOrder, // Keeps notification on screen until vendor reacts
        silent: false,
        vibrate: [500, 200, 500, 200, 500, 200, 1000] // Extended vibration for orders
      };

      try {
        const n = new Notification(title, options);
        n.onclick = (e) => {
          e.preventDefault();
          window.focus();
          if (profile?.role === 'vendor') router.push('/vendor/dashboard');
          else if (profile?.role === 'admin' || user?.email === 'ceo@shopykart.co.in') router.push('/admin/dashboard');
          else router.push('/orders');
          n.close();
        };
      } catch (err) {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, options));
        }
      }
    }
  };

  // ORDER LISTENER: Detects new orders and triggers alarms
  useEffect(() => {
    if (!user || !firestore) return;
    
    const isAdmin = user.email === 'ceo@shopykart.co.in' || profile?.role === 'admin';
    const isVendor = profile?.role === 'vendor';

    if (!isAdmin && !isVendor && profile?.role !== 'customer') return;

    let ordersQuery;
    if (isAdmin) {
      const oneHourAgo = new Timestamp(Timestamp.now().seconds - 3600, 0);
      ordersQuery = query(collection(firestore, 'orders'), where('createdAt', '>=', oneHourAgo));
    } else if (isVendor) {
      ordersQuery = query(collection(firestore, 'orders'), where('vendorId', '==', user.uid));
    } else {
      ordersQuery = query(collection(firestore, 'orders'), where('userId', '==', user.uid));
    }
    
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const orderData = change.doc.data();
        const orderId = change.doc.id;
        const newStatus = orderData.status;

        // New Order Arrival Alarm
        if (change.type === 'added' && newStatus === 'Placed') {
          if (!processedOrders.current.has(orderId)) {
            processedOrders.current.add(orderId);
            const displayId = orderData.orderDisplayId || orderId.slice(-5).toUpperCase();
            triggerPush(
              `🚨 NEW ORDER #${displayId}`, 
              `Incoming order of ₹${orderData.total} from ${orderData.customerName || 'Customer'}.`,
              true
            );
          }
        }

        // Status Update Notifications
        const oldStatus = lastStatuses.current[orderId];
        if (oldStatus && oldStatus !== newStatus) {
           triggerPush("Order Update", `Order #${orderData.orderDisplayId || orderId.slice(-5).toUpperCase()} is now ${newStatus}.`);
        }
        lastStatuses.current[orderId] = newStatus;
      });
    });

    return () => unsubscribe();
  }, [user, firestore, profile, router]);

  // BROADCAST LISTENER: Global announcements
  useEffect(() => {
    if (!firestore) return;
    const q = query(collection(firestore, 'broadcasts'), orderBy('timestamp', 'desc'), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      const latest = snapshot.docs[0];
      if (lastBroadcastId.current && latest.id !== lastBroadcastId.current) {
        triggerPush(latest.data().title || "Announcement", latest.data().message || "", false, true);
      }
      lastBroadcastId.current = latest.id;
    });
    return () => unsubscribe();
  }, [firestore]);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setShowPrompt(false);
    const status = await Notification.requestPermission();
    setPermission(status);
  };

  return (
    <>
      <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white">
           <DialogHeader className="sr-only">
              <DialogTitle>{activeAlert?.title || 'System Alert'}</DialogTitle>
           </DialogHeader>
           <div className="bg-primary h-2 w-full" />
           <div className="p-8 space-y-6 text-center">
              <div className="relative bg-primary/10 h-20 w-20 rounded-[2rem] flex items-center justify-center text-primary mx-auto border border-primary/20">
                 <Megaphone className="h-10 w-10 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-tight">
                {activeAlert?.title}
              </h2>
              <div className="bg-muted/30 p-6 rounded-3xl border border-border/50">
                 <p className="text-base font-black italic text-gray-800 leading-relaxed">
                   "{activeAlert?.message}"
                 </p>
              </div>
              <Button onClick={() => setIsAlertOpen(false)} className="w-full h-14 bg-[#0B0B0B] text-white rounded-2xl font-black uppercase italic shadow-xl">GOT IT</Button>
           </div>
        </DialogContent>
      </Dialog>

      {showPrompt && user && permission === 'default' && (
        <div className="fixed top-20 left-4 right-4 z-[5000] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-[#0B0B0B] text-white p-5 rounded-[2rem] shadow-2xl border border-white/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-xl"><BellRing className="h-5 v-5 text-primary animate-ring" /></div>
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-primary">Enable Alerts</span><span className="text-xs font-bold">Receive new order rings.</span></div>
            </div>
            <Button onClick={requestPermission} className="bg-primary text-white rounded-xl h-10 px-6 font-black uppercase italic text-[10px] tracking-widest">ALLOW</Button>
          </div>
        </div>
      )}
    </>
  );
}
