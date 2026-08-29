'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Radio, Loader2, BellRing, Volume2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

/**
 * @fileOverview Global Notification & Urgent Alert Handler.
 * Features: Role-based permission requests, Real-time order ringing for Admin/Vendors.
 */
export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  
  const [userRole, setUserRole] = useState<'admin' | 'vendor' | 'customer' | 'delivery' | null>(null);
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. AUTO PERMISSION REQUEST ON MOUNT
  useEffect(() => {
    const askPermissions = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          try {
            await Notification.requestPermission();
          } catch (e) {
            console.warn("Notification permission rejected");
          }
        }
      }
    };
    const timer = setTimeout(askPermissions, 2000);
    return () => clearTimeout(timer);
  }, []);

  // 2. DETECT USER ROLE FOR SPECIALIZED PERMISSIONS
  useEffect(() => {
    const checkRole = async () => {
      const isAdminAuth = localStorage.getItem('admin_auth') === 'true';
      if (isAdminAuth) { setUserRole('admin'); return; }
      
      const isDeliveryAuth = localStorage.getItem('delivery_session_active') === 'true';
      if (isDeliveryAuth) { setUserRole('delivery'); return; }

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

  const isManagementPath = useMemo(() => {
    if (!pathname) return false;
    const p = pathname.toLowerCase();
    return p.startsWith('/admin') || p.startsWith('/vendor') || p.startsWith('/delivery') || p.startsWith('/medical') || p.startsWith('/beauty');
  }, [pathname]);

  // 3. REAL-TIME ORDER LISTENER WITH RINGING ALERT
  useEffect(() => {
    if (!firestore || !userRole || !isManagementPath) return;

    // Listen for Placed orders that need attention
    if (userRole === 'admin' || userRole === 'vendor') {
      const q = query(collection(firestore, 'orders'), where('status', '==', 'Placed'));
      const unsub = onSnapshot(q, (snapshot) => {
        const allPlaced = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        let targeted: any[] = [];
        
        if (userRole === 'admin') {
          targeted = allPlaced;
        } else if (userRole === 'vendor' && user) {
          targeted = allPlaced.filter((o: any) => 
            o.vendorId === user.uid || 
            (Array.isArray(o.vendorIds) && o.vendorIds.includes(user.uid)) ||
            o.items?.some((it:any) => it.vendorId === user.uid)
          );
        }
        
        setRingingOrders(targeted);

        // RINGING LOGIC: Play sound if there's a new targeted order
        if (targeted.length > 0) {
          if (!audioRef.current) {
            audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1356/1356-preview.mp3'); // Loud Bell/Alert
            audioRef.current.loop = true;
          }
          audioRef.current.play().catch(e => console.warn("Audio interaction required"));
        } else {
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          }
        }
      });
      return () => {
        unsub();
        if (audioRef.current) {
          audioRef.current.pause();
        }
      };
    }
  }, [user, firestore, userRole, isManagementPath]);

  const handleAcceptOrder = async (orderId: string) => {
    if (!firestore || isAccepting) return;
    setIsAccepting(true);
    try {
      await updateDoc(doc(firestore, 'orders', orderId), { 
        status: 'Accepted', 
        updatedAt: serverTimestamp() 
      });
      toast({ title: "Order Accepted!" });
      
      // Stop ringing immediately
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    } catch (err) { 
      toast({ variant: "destructive", title: "Acceptance Failed" }); 
    } finally { 
      setIsAccepting(false); 
    }
  };

  return (
    <Dialog open={ringingOrders.length > 0} onOpenChange={() => {}}>
      <DialogContent className="rounded-[3.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white z-[55000] focus:outline-none">
        <DialogHeader className="p-10 pb-2">
          <DialogTitle className="text-center text-red-600 font-black italic uppercase text-2xl tracking-tighter">Urgent Order Alert</DialogTitle>
          <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Action required for a new incoming order.</DialogDescription>
        </DialogHeader>
        
        <div className="bg-red-600 h-10 w-full animate-pulse flex items-center justify-center border-b-4 border-black/10">
           <div className="flex items-center gap-2">
             <BellRing className="h-4 w-4 text-white animate-ring" />
             <span className="text-[10px] font-black text-white uppercase tracking-[0.5em]">SYSTEM RINGING</span>
           </div>
        </div>

        <div className="p-10 pt-4 space-y-10 flex flex-col items-center text-center">
          <div className="relative">
             <div className="absolute inset-0 bg-red-100 rounded-full animate-ping opacity-20" />
             <div className="relative h-32 w-32 bg-red-50 rounded-[3rem] flex items-center justify-center text-red-600 border-4 border-red-100 shadow-inner">
                <Radio className="h-16 w-16 animate-bounce" />
             </div>
             <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-red-50">
                <Volume2 className="h-5 w-5 text-red-600" />
             </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-red-600 leading-none">NEW ORDER!</h2>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Store ID: {ringingOrders[0]?.vendorId?.slice(-6).toUpperCase()}</p>
          </div>

          <Button 
            onClick={() => handleAcceptOrder(ringingOrders[0].id)} 
            disabled={isAccepting} 
            className="w-full h-20 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black uppercase italic text-2xl border-b-[6px] border-green-800 active:translate-y-1 active:border-b-0 transition-all shadow-xl shadow-green-200"
          >
            {isAccepting ? <Loader2 className="h-8 w-8 animate-spin" /> : "ACCEPT NOW"}
          </Button>
          
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Order will ring until accepted</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
