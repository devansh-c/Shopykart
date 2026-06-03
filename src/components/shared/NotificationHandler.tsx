'use client';

import { useEffect, useState, useRef } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, onSnapshot, doc, orderBy, limit, Timestamp } from 'firebase/firestore';
import { BellRing, X, Megaphone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

/**
 * @fileOverview Integrated Notification Engine.
 * Handles:
 * 1. Global Broadcasts (Cloud Alerts)
 * 2. Order Status Updates (FCM-style Push)
 * 3. In-app Toast fallback
 */
export function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [permission, setPermission] = useState<string>('default');
  const [showPrompt, setShowPrompt] = useState(false);
  
  // Custom Alert State for Broadcasts
  const [activeAlert, setActiveAlert] = useState<{ title: string, message: string } | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  
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

  const NOTIFY_ICON = branding?.notificationLogoUrl || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛒</text></svg>';

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      
      // Prompt for push permission after 15s if not set
      if (Notification.permission === 'default' && user) {
        const timer = setTimeout(() => setShowPrompt(true), 15000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const triggerPush = (title: string, body: string, isOrder = false, isBroadcast = false) => {
    // 1. Play Order Alert Sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => console.log("Audio autoplay blocked"));
    } catch (e) {}

    // 2. If it's a broadcast, show Custom Modal
    if (isBroadcast) {
      setActiveAlert({ title, message: body });
      setIsAlertOpen(true);
    }

    // 3. Show Fast Toast (2s duration inherited from useToast config)
    toast({
      title: title.toUpperCase(),
      description: body
    });

    // 4. Native OS Cloud Push Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      const options: NotificationOptions = {
        body: body,
        icon: NOTIFY_ICON,
        badge: NOTIFY_ICON,
        tag: isOrder ? 'new-order' : 'shopykart-alert',
        silent: false,
        vibrate: [200, 100, 200]
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

  // 1. Order Cloud Listener
  useEffect(() => {
    if (!user || !firestore) return;
    
    const isAdmin = user.email === 'ceo@shopykart.co.in' || profile?.role === 'admin';
    const isVendor = profile?.role === 'vendor';

    let ordersQuery;
    
    // Admins see all orders from last 1 hour, others see their own
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

        // New Order Alert
        if (change.type === 'added' && newStatus === 'Placed') {
          if (!processedOrders.current.has(orderId)) {
            processedOrders.current.add(orderId);
            const displayId = orderData.orderDisplayId || orderId.slice(-5).toUpperCase();
            triggerPush(
              `${isAdmin ? '[ADMIN] ' : ''}New Order #${displayId}! 🚀`, 
              `Order of ₹${orderData.total} from ${orderData.restaurantName || 'a store'}.`,
              true
            );
          }
        }

        // Status Update Alert
        const oldStatus = lastStatuses.current[orderId];
        if (oldStatus && oldStatus !== newStatus) {
           let title = "Order Update";
           let body = `Order #${orderData.orderDisplayId || orderId.slice(-5).toUpperCase()} is now: ${newStatus}`;
           if (newStatus === 'Delivered') { title = "Delivered! 😋"; body = "Enjoy your meal from ShopyKart!"; }
           triggerPush(title, body);
        }
        lastStatuses.current[orderId] = newStatus;
      });
    });

    return () => unsubscribe();
  }, [user, firestore, profile]);

  // 2. Broadcast Listener (Global Marketing)
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
        triggerPush(data.title || "ShopyKart Alert", data.message || "", false, true);
      }
    });

    return () => unsubscribe();
  }, [firestore]);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setShowPrompt(false);
    try {
      const status = await Notification.requestPermission();
      setPermission(status);
      if (status === 'granted') {
        toast({ title: "Notifications Active ✅", description: "You will receive real-time order updates." });
      }
    } catch (err) {}
  };

  return (
    <>
      <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white animate-in zoom-in-95 duration-300">
           <div className="bg-primary h-2 w-full" />
           <div className="p-8 space-y-6 text-center">
              <div className="relative mx-auto">
                 <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full animate-pulse" />
                 <div className="relative bg-primary/10 h-20 w-20 rounded-[2rem] flex items-center justify-center text-primary mx-auto border border-primary/20">
                    <Megaphone className="h-10 w-10 animate-bounce" />
                 </div>
              </div>
              <div className="space-y-2">
                 <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-tight">
                   {activeAlert?.title}
                 </DialogTitle>
                 <DialogDescription className="text-sm font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                   Official Announcement
                 </DialogDescription>
              </div>
              <div className="bg-muted/30 p-6 rounded-3xl border border-border/50">
                 <p className="text-base font-black italic text-gray-800 leading-relaxed">
                   "{activeAlert?.message}"
                 </p>
              </div>
              <Button 
                onPointerDown={() => setIsAlertOpen(false)}
                className="w-full h-14 bg-[#0B0B0B] hover:bg-primary text-white rounded-2xl font-black uppercase italic shadow-xl transition-all active:scale-95"
              >
                GOT IT
              </Button>
           </div>
        </DialogContent>
      </Dialog>

      {showPrompt && user && permission === 'default' && (
        <div className="fixed top-20 left-4 right-4 z-[100] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-[#0B0B0B] text-white p-5 rounded-[2rem] shadow-2xl border border-white/5 flex items-center justify-between gap-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-xl">
                <BellRing className="h-5 v-5 text-primary animate-bounce" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none mb-1">Stay Notified</span>
                <span className="text-xs font-bold leading-tight">Enable cloud alerts for updates.</span>
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
      )}
    </>
  );
}
