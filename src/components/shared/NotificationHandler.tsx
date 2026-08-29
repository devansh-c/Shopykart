'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BellRing, ShoppingBag, Loader2, Package, User, ChevronRight, Zap, Volume2, X, AlertTriangle, Radio } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { requestPushToken } from '@/firebase/messaging';

export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isRinging, setIsRinging] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'vendor' | 'delivery' | 'customer' | null>(null);
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const [customerUpdate, setCustomerUpdate] = useState<any>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isAudioContextBlocked, setIsAudioContextBlocked] = useState(true);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastStatuses = useRef<Map<string, string>>(new Map());
  const isInitialLoad = useRef(true);

  // AUTO PERMISSION REQUEST ON MOUNT
  useEffect(() => {
    const askPermission = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
              console.log('Notification permission granted.');
              await requestPushToken();
            }
          } catch (e) {
            console.error('Error requesting notification permission:', e);
          }
        }
      }
    };
    const timer = setTimeout(askPermission, 3000);
    return () => clearTimeout(timer);
  }, []);

  const isManagementPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || p.startsWith('/vendor');
  }, [pathname]);

  useEffect(() => {
    const checkRole = async () => {
      const isAdminAuth = localStorage.getItem('admin_auth') === 'true';
      if (isAdminAuth) { setUserRole('admin'); return; }
      if (user && firestore) {
        try {
          const vendorDoc = await getDoc(doc(firestore, 'vendors', user.uid));
          if (vendorDoc.exists()) { setUserRole('vendor'); return; }
          setUserRole('customer');
        } catch (e) { setUserRole('customer'); }
      }
    };
    checkRole();
  }, [user, firestore]);

  useEffect(() => {
    if (typeof window === 'undefined' || !isManagementPath) return;
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3');
    audio.loop = true;
    audioRef.current = audio;
    return () => { audio.pause(); audioRef.current = null; };
  }, [isManagementPath]);

  useEffect(() => {
    if (!firestore || !userRole) return;
    if ((userRole === 'admin' || userRole === 'vendor') && isManagementPath) {
      const q = query(collection(firestore, 'orders'), where('status', '==', 'Placed'));
      const unsubEmergency = onSnapshot(q, (snapshot) => {
        const allPlaced = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        let targeted: any[] = [];
        if (userRole === 'admin') targeted = allPlaced;
        else if (userRole === 'vendor' && user) {
          targeted = allPlaced.filter((o: any) => o.vendorId === user.uid);
        }
        setRingingOrders(targeted);
        setIsRinging(targeted.length > 0);
      });
      return () => unsubEmergency();
    }
  }, [user, firestore, userRole, isManagementPath]);

  const handleManualUnblock = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause(); audioRef.current!.currentTime = 0;
        setIsAudioContextBlocked(false);
        toast({ title: "Alarms Active! 🔊" });
      }).catch(() => {});
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!firestore || isAccepting) return;
    setIsAccepting(true);
    try {
      await updateDoc(doc(firestore, 'orders', orderId), { status: 'Accepted', updatedAt: serverTimestamp() });
      toast({ title: "Order Accepted!" });
    } catch (err) { toast({ variant: "destructive", title: "Acceptance Failed" }); }
    finally { setIsAccepting(false); }
  };

  return (
    <>
      {(userRole === 'admin' || userRole === 'vendor') && isManagementPath && isAudioContextBlocked && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[999999] w-full max-w-sm px-4">
           <button onClick={handleManualUnblock} className="w-full bg-black text-white border-2 border-primary rounded-[2.5rem] p-6 shadow-2xl flex items-center gap-5 hover:bg-primary transition-all">
              <div className="h-14 w-14 bg-primary/20 rounded-[1.5rem] flex items-center justify-center animate-pulse shrink-0 border border-primary/20">
                <Volume2 className="h-7 w-7 text-primary" />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-[11px] font-black uppercase text-primary leading-none">Alarm System</span>
                <span className="text-[14px] font-black italic uppercase text-white mt-2">TAP TO ENABLE SOUND</span>
              </div>
           </button>
        </div>
      )}

      <Dialog open={ringingOrders.length > 0} onOpenChange={() => {}}>
        <DialogContent className="rounded-[3.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white z-[55000]">
          <div className="bg-red-600 h-10 w-full animate-pulse flex items-center justify-center border-b-4 border-black/10">
             <span className="text-[10px] font-black text-white uppercase tracking-[0.5em]">URGENT: NEW ORDER</span>
          </div>
          <div className="p-10 space-y-10 flex flex-col items-center text-center">
            <div className="relative h-32 w-32 bg-red-50 rounded-[3rem] flex items-center justify-center text-red-600 border-4 border-red-100 shadow-inner">
               <Radio className="h-16 w-16 animate-bounce" />
            </div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-red-600">NEW ORDER!</h2>
            <Button onClick={() => handleAcceptOrder(ringingOrders[0].id)} disabled={isAccepting} className="w-full h-20 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black uppercase italic text-2xl border-b-[6px] border-green-800">
              {isAccepting ? <Loader2 className="h-8 w-8 animate-spin" /> : "ACCEPT NOW"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
