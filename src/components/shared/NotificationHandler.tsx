
'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { requestPushToken } from '@/firebase/messaging';

/**
 * @fileOverview System for handling looping order alerts and push notifications.
 * Restored: Continuous looping alarm until order is accepted/processed.
 */
export function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isRinging, setIsRinging] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'vendor' | 'delivery' | 'customer' | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio object with looping enabled
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.loop = true;
      audioRef.current = audio;
    }
  }, []);

  // Identity & Role Detection
  useEffect(() => {
    if (!user || !firestore) return;
    
    const checkRole = async () => {
      // 1. Check Admin
      if (user.email === 'ceo@shopykart.co.in') {
        setUserRole('admin');
        return;
      }

      // 2. Check Vendor
      const vendorDoc = await getDoc(doc(firestore, 'vendors', user.uid));
      if (vendorDoc.exists()) {
        setUserRole('vendor');
        return;
      }

      // 3. Check Delivery Partner
      const partnerDoc = await getDoc(doc(firestore, 'delivery_partners', user.uid));
      if (partnerDoc.exists()) {
        setUserRole('delivery');
        return;
      }

      setUserRole('customer');
    };

    checkRole();
  }, [user, firestore]);

  // Audio Playback Controller
  useEffect(() => {
    if (!audioRef.current) return;

    if (isRinging) {
      audioRef.current.play().catch(e => {
        console.warn("Autoplay blocked: Please interact with the page once to enable sound alerts.");
      });
    } else {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [isRinging]);

  // Real-time Alarm Listeners
  useEffect(() => {
    if (!user || !firestore || !userRole) return;

    let unsubscribe: () => void = () => {};

    // 1. ADMIN LISTENER: Rings for ANY unaccepted order
    if (userRole === 'admin') {
      const q = query(collection(firestore, 'orders'), where('status', '==', 'Placed'));
      unsubscribe = onSnapshot(q, (snap) => {
        const hasNew = !snap.empty;
        setIsRinging(hasNew);
        if (hasNew) {
          toast({ title: "NEW ORDER ALERT! 🔔", description: `${snap.size} orders waiting for your attention.` });
        }
      });
    } 
    
    // 2. VENDOR LISTENER: Rings for their specific unaccepted orders
    else if (userRole === 'vendor') {
      const q = query(collection(firestore, 'orders'), where('vendorId', '==', user.uid), where('status', '==', 'Placed'));
      unsubscribe = onSnapshot(q, (snap) => {
        const hasNew = !snap.empty;
        setIsRinging(hasNew);
        if (hasNew) {
          toast({ title: "NEW ORDER RECEIVED! 🍔", description: "Please accept and start preparing items." });
        }
      });
    }

    // 3. DELIVERY PARTNER: Rings when an order is ready for dispatch
    else if (userRole === 'delivery') {
      const q = query(collection(firestore, 'orders'), where('status', '==', 'Ready for Pickup'));
      unsubscribe = onSnapshot(q, (snap) => {
        const hasNew = !snap.empty;
        setIsRinging(hasNew);
        if (hasNew) {
          toast({ title: "PICKUP READY! 🚲", description: "Tasks available in your zone." });
        }
      });
    }

    // 4. CUSTOMER: Silent status updates
    else {
      const q = query(collection(firestore, 'orders'), where('userId', '==', user.uid));
      unsubscribe = onSnapshot(q, (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const data = change.doc.data();
            toast({ title: "Order Update", description: `Your order #${data.orderDisplayId || data.id.slice(-4)} is now ${data.status}.` });
          }
        });
      });
    }

    return () => unsubscribe();
  }, [user, firestore, userRole, toast]);

  // FCM Token Management
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
          }
        } catch (e) {}
      };
      registerFCM();
    }
  }, [user, firestore]);

  return null;
}
