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
  
  const processedOrders = useRef<Set<string>>(new Set());

  // FCM Token Registration
  useEffect(() => {
    if (user && firestore) {
      const registerFCM = async () => {
        try {
          const token = await requestPushToken();
          if (token) {
            await setDoc(doc(firestore, 'users', user.uid), {
              fcmToken: token,
              lastTokenUpdate: serverTimestamp()
            }, { merge: true });
            console.log("FCM Identity Verified ✅");
          }
        } catch (e) {
          console.warn("FCM skip: Registration not completed.");
        }
      };
      registerFCM();
    }
  }, [user, firestore]);

  const triggerPush = (title: string, body: string, isOrder = false, type = 'general') => {
    // 1. LOUD SOUND
    try {
      const soundUrl = isOrder ? 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3' : 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3';
      const audio = new Audio(soundUrl);
      audio.volume = 1.0;
      audio.play().catch(() => {});
    } catch (e) {}

    // 2. MODAL ALERT for high priority
    if (isOrder || type === 'delivery-task') {
      setActiveAlert({ title, message: body, type });
      setIsAlertOpen(true);
    }

    // 3. SYSTEM NOTIFICATION
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: '/icon.png',
        tag: isOrder ? 'new-order' : 'status-update',
        requireInteraction: true
      });
    }
    
    toast({ title: title.toUpperCase(), description: body });
  };

  // REAL-TIME ORDER MONITORING
  useEffect(() => {
    if (!user || !firestore) return;
    
    // Listen for orders relevant to this user (Admin, Vendor, or Customer)
    const isAdmin = user.email === 'ceo@shopykart.co.in';
    
    // Vendor or Admin New Order query
    const ordersQuery = query(
      collection(firestore, 'orders'), 
      where('status', '==', 'Placed')
    );
    
    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const data = change.doc.data();
        const id = change.doc.id;

        if (change.type === 'added') {
          // If I'm the designated vendor or admin
          const isMyOrder = data.vendorId === user.uid || isAdmin;
          
          if (isMyOrder && !processedOrders.current.has(id)) {
            processedOrders.current.add(id);
            triggerPush(`🚨 NEW ORDER ARRIVED!`, `₹${data.total} order from ${data.customerName}`, true, 'vendor-order');
          }
        }
      });
    });

    // Customer Status Change Listener
    const customerQuery = query(
      collection(firestore, 'orders'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc'),
      limit(5)
    );

    const unsubscribeCustomer = onSnapshot(customerQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'modified') {
          const data = change.doc.data();
          const status = data.status;
          if (status !== 'Placed') {
            triggerPush(`Update: ${status}`, `Your order #${data.orderDisplayId} is now ${status}.`);
          }
        }
      });
    });

    return () => {
      unsubscribe();
      unsubscribeCustomer();
    };
  }, [user, firestore]);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const status = await Notification.requestPermission();
    setPermission(status);
    setShowPrompt(false);
  };

  return (
    <>
      <Dialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-sm p-8 text-center bg-white shadow-2xl">
           <DialogHeader className="sr-only">
             <DialogTitle>Notification Alert</DialogTitle>
           </DialogHeader>
           <div className="h-20 w-20 rounded-[2rem] bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
              <Megaphone className="h-10 w-10 animate-bounce" />
           </div>
           <h2 className="text-2xl font-black italic uppercase mb-2">{activeAlert?.title}</h2>
           <p className="text-gray-600 font-bold mb-8 italic">"{activeAlert?.message}"</p>
           <Button onClick={() => setIsAlertOpen(false)} className="w-full h-14 rounded-2xl bg-black font-black uppercase italic">GOT IT</Button>
        </DialogContent>
      </Dialog>

      {showPrompt && user && (
        <div className="fixed top-20 left-4 right-4 z-[5000] animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-[#0B0B0B] text-white p-5 rounded-[2rem] shadow-2xl border border-white/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-2 rounded-xl"><BellRing className="h-5 v-5 text-primary" /></div>
              <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-primary">Enable Alerts</span><span className="text-xs font-bold">Never miss a new order.</span></div>
            </div>
            <Button onClick={requestPermission} className="bg-primary text-white rounded-xl h-10 px-6 font-black uppercase italic text-[10px] tracking-widest">ALLOW</Button>
          </div>
        </div>
      )}
    </>
  );
}
