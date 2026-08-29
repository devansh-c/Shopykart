'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Radio, Loader2, Volume2 } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function NotificationHandler() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const pathname = usePathname();
  
  const [isRinging, setIsRinging] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'vendor' | 'customer' | null>(null);
  const [ringingOrders, setRingingOrders] = useState<any[]>([]);
  const [isAccepting, setIsAccepting] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // AUTO PERMISSION REQUEST ON MOUNT
  useEffect(() => {
    const askPermission = async () => {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission().catch(() => {});
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
    if (!firestore || !userRole) return;
    if ((userRole === 'admin' || userRole === 'vendor') && isManagementPath) {
      const q = query(collection(firestore, 'orders'), where('status', '==', 'Placed'));
      const unsub = onSnapshot(q, (snapshot) => {
        const allPlaced = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        let targeted: any[] = [];
        if (userRole === 'admin') targeted = allPlaced;
        else if (userRole === 'vendor' && user) {
          targeted = allPlaced.filter((o: any) => o.vendorId === user.uid || (Array.isArray(o.vendorIds) && o.vendorIds.includes(user.uid)));
        }
        setRingingOrders(targeted);
        setIsRinging(targeted.length > 0);
      });
      return () => unsub();
    }
  }, [user, firestore, userRole, isManagementPath]);

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
      <Dialog open={ringingOrders.length > 0} onOpenChange={() => {}}>
        <DialogContent className="rounded-[3.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white z-[55000]">
          <DialogHeader className="sr-only">
            <DialogTitle>Urgent Order Alert</DialogTitle>
            <DialogDescription>Action required for a new incoming order.</DialogDescription>
          </DialogHeader>
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
