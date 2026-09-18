'use client';

import {
  Search,
  MapPin,
  Bell,
  ChevronDown,
  X,
  Loader2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { requestPushToken } from '@/firebase/messaging';
import { cn } from '@/lib/utils';

/**
 * @fileOverview Simplified LocationHeader - All modes hidden for clean Food-only UI.
 */
export function LocationHeader({
  searchValue,
  onSearchChange,
}: {
  searchValue: string;
  onSearchChange: (val: string) => void;
  activeMode: string;
  onModeChange: (mode: string) => void;
}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const [currentAddress, setCurrentAddress] = useState('Select Area');
  const [isMounted, setIsMounted] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const updateAddress = () => {
      const savedShort = typeof window !== 'undefined' ? localStorage.getItem('user_address') : null;
      if (savedShort) setCurrentAddress(savedShort);
    };

    updateAddress();
    window.addEventListener('user-address-updated', updateAddress);
    return () => window.removeEventListener('user-address-updated', updateAddress);
  }, []);

  const notifyQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'), 
      orderBy('timestamp', 'desc'), 
      limit(20)
    );
  }, [firestore, user]);

  const { data: notifications } = useCollection<any>(notifyQuery);

  const unreadCount = useMemo(() => {
    return notifications?.filter((n: any) => n.read === false).length || 0;
  }, [notifications]);

  const handleOpenPicker = () => {
    window.dispatchEvent(new CustomEvent('open-location-picker'));
  };

  return (
    <div className="w-full bg-white pb-6 pt-3 px-4 space-y-4 rounded-b-[2.5rem] shadow-sm relative z-50 overflow-hidden transform-gpu">
      <div className="flex items-center justify-between relative z-10">
        <button onClick={handleOpenPicker} className="flex items-center gap-1.5 active:scale-95 transition-all text-left w-full">
          <div className="h-8 w-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="h-4.5 w-4.5 text-primary stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0 pr-10">
            <div className="flex items-center gap-1">
              <span className="text-black text-xs font-black tracking-tight uppercase leading-none truncate">{currentAddress}</span>
              <ChevronDown className="h-3 w-3 text-primary stroke-[3]" />
            </div>
            <span className="text-[8px] font-black text-primary uppercase tracking-widest mt-1">SHIPPING TO THIS ZONE</span>
          </div>
        </button>

        <button onClick={() => { if (!user) window.dispatchEvent(new CustomEvent('open-auth-overlay')); else setIsNotifyOpen(true); }} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 shadow-sm active:scale-90 transition-all shrink-0 relative">
          <Bell className={cn("h-6 w-6 text-black", unreadCount > 0 && "animate-ring")} />
          {unreadCount > 0 && <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-primary rounded-full border-2 border-white shadow-sm animate-pulse" />}
        </button>
      </div>

      <div className="relative group z-10">
        <div className="relative h-14 w-full bg-gray-50 rounded-2xl overflow-hidden shadow-inner border border-gray-100 flex items-center px-4">
          <Search className="h-6 w-6 text-gray-400 shrink-0" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Gourmet Food & Cuisines"
            className="h-full w-full bg-transparent border-none pl-2 pr-16 text-black font-bold placeholder:text-gray-400 focus-visible:ring-0 text-sm tracking-tight"
          />
        </div>
      </div>

      <Dialog open={isNotifyOpen} onOpenChange={setIsNotifyOpen}>
        <DialogContent className="rounded-t-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white max-h-[85vh] flex flex-col focus:outline-none bottom-0 top-auto translate-y-0">
           <DialogHeader className="p-8 pb-4 shrink-0">
              <div className="flex flex-col items-center text-center">
                 <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-3 shadow-inner"><Bell className="h-7 w-7" /></div>
                 <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Notifications</DialogTitle>
              </div>
              <button onClick={() => setIsNotifyOpen(false)} className="absolute top-6 right-6 h-8 w-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 active:scale-90"><X className="h-4 w-4" /></button>
           </DialogHeader>
           <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-2 space-y-4">
              {notifications && notifications.length > 0 ? notifications.map((n: any) => (
                <div key={n.id} className={cn("p-5 rounded-[1.75rem] border-2 transition-all", n.read ? "bg-white border-gray-50" : "bg-primary/5 border-primary/10 shadow-sm")}>
                  <h4 className="text-sm font-black uppercase italic tracking-tight text-gray-900 leading-none mb-1.5">{n.title}</h4>
                  <p className="text-[11px] font-bold text-gray-600 uppercase leading-relaxed">{n.message}</p>
                </div>
              )) : (
                <div className="text-center py-20 opacity-30 flex flex-col items-center">
                   <Bell className="h-16 w-16 mb-4" />
                   <p className="font-black italic uppercase text-xs">No notifications yet</p>
                </div>
              )}
           </div>
           <div className="p-8 bg-gray-50 border-t"><Button onClick={() => setIsNotifyOpen(false)} className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic">CLOSE HUB</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
