'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, doc, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const [permission, setPermission] = useState<string>('default');
  const [showPrompt, setShowPrompt] = useState(false);
  
  const lastStatuses = useRef<Record<string, string>>({});
  const lastBroadcastId = useRef<string | null>(null);
  const lastPersonalId = useRef<string | null>(null);
  const processedOrders = useRef<Set<string>>(new Set());

  // Fetch dynamic notification logo from branding (Admin Panel)
  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: branding } = useDoc<any>(brandingRef);

  // Fetch user profile to determine role
  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile } = useDoc<any>(profileRef);

  // Using Admin Set Logo. If not set, it will be blank/browser-default.
  const NOTIFY_ICON = branding?.notificationLogoUrl || '';

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      
      if (Notification.permission === 'default' && user) {
        const timer = setTimeout(() => setShowPrompt(true), 15000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const triggerPush = (title: string, body: string, isOrder = false) => {
    // Sound - Using the requested ringtone
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {
        console.log("Audio autoplay blocked - User interaction required");
      });
    } catch (e) {}

    // Toast Notification in UI
    toast({
      title: title,
      description: body,
      duration: 8000,
      variant: "default",
    });

    // Native Push Notification (Mobile/Desktop)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const options: NotificationOptions = {
        body: body,
        icon: NOTIFY_ICON,
        badge: NOTIFY_ICON,
        tag: isOrder ? 'new-order' : 'shopykart-alert',
        silent: false
      };

      try {
        const n = new Notification(title, options);
        n.onclick = (e) => {
          e.preventDefault();
          window.focus();
          if (profile?.role === 'vendor') {
            router.push('/vendor/dashboard');
          } else if (profile?.role === 'admin' || user?.email === 'admin@shopykart.com') {
            router.push('/admin/dashboard');
          } else {
            router.push('/orders');
          }
          n.close();
        };
      } catch (err) {
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, options);
          }).catch(() => {});
        }
      }
    }
  };

  // 1. Order Listener (Admin & Vendor & Customer)
  useEffect(() => {
    if (!user || !firestore) return;
    
    const isAdmin = user.email === 'admin@shopykart.com' || profile?.role === 'admin';
    const isVendor = profile?.role === 'vendor';

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

        if (change.type === 'added' && newStatus === 'Placed') {
          if (!processedOrders.current.has(orderId)) {
            processedOrders.current.add(orderId);
            
            const displayId = orderData.orderDisplayId || orderId.slice(-5).toUpperCase();
            const rolePrefix = isAdmin ? "[ADMIN] " : "";
            
            triggerPush(
              `${rolePrefix}New Order #${displayId}! 🚀`, 
              `Total: ₹${orderData.total} from ${orderData.restaurantName || 'a store'}. Click to manage.`,
              true
            );
          }
        }

        const oldStatus = lastStatuses.current[orderId];
        if (oldStatus && oldStatus !== newStatus) {
           let title = "Order Update";
           let body = `Order #${orderData.orderDisplayId || orderId.slice(-5).toUpperCase()} is now: ${newStatus}`;
           
           if (newStatus === 'Delivered') { title = "Delivered! 😋"; body = "Enjoy your meal from ShopyKart!"; }
           if (newStatus === 'Out for Delivery') { title = "Almost There! 🚚"; body = "Your food is just around the corner."; }
           
           triggerPush(title, body);
        }
        lastStatuses.current[orderId] = newStatus;
      });
    });

    return () => unsubscribe();
  }, [user, firestore, profile, router]);

  // 2. Broadcast Listener (Global Campaigns)
  useEffect(() => {
    if (!firestore) return;

    const q = query(collection(firestore, 'broadcasts'), orderBy('timestamp', 'desc'), limit(1));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) return;
      const latest = snapshot.docs[0];
      const data = latest.data();
      
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
