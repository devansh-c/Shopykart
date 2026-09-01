'use client';

import {
  Search,
  Camera,
  Mic,
  MapPin,
  Bell,
  ChevronDown,
  X,
  MessageSquare,
  Clock,
  Loader2,
  Trash2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, collection, query, orderBy, limit, updateDoc, deleteDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { requestPushToken } from '@/firebase/messaging';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

/**
 * @fileOverview LocationHeader with FCM Notification Bell.
 * Replaced Menu with Bell. Integrated Notification Center with Firestore.
 * Fixed: Added missing Button import.
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
  
  const [currentAddress, setCurrentAddress] = useState('Detecting...');
  const [fullAddress, setFullAddress] = useState('Searching current spot...');
  const [isMounted, setIsMounted] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const updateAddress = () => {
      const savedShort = typeof window !== 'undefined' ? localStorage.getItem('user_address') : null;
      const savedFull = typeof window !== 'undefined' ? localStorage.getItem('user_address_line') : null;
      
      if (savedShort) setCurrentAddress(savedShort);
      if (savedFull) setFullAddress(savedFull);
    };

    updateAddress();
    window.addEventListener('user-address-updated', updateAddress);
    return () => window.removeEventListener('user-address-updated', updateAddress);
  }, []);

  // NOTIFICATION LOGIC
  const notifyQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'notifications'), 
      orderBy('timestamp', 'desc'), 
      limit(20)
    );
  }, [firestore, user]);

  const { data: notifications, loading: notifyLoading } = useCollection<any>(notifyQuery);

  const unreadCount = useMemo(() => {
    return notifications?.filter((n: any) => n.read === false).length || 0;
  }, [notifications]);

  // Request FCM Token on mount if user logged in
  useEffect(() => {
    if (user && isMounted) {
      setTimeout(async () => {
        const token = await requestPushToken();
        if (token && firestore) {
           // Save token to user profile for Admin pushes
           const tokenRef = doc(firestore, 'users', user.uid, 'fcm_tokens', token);
           import('firebase/firestore').then(({ setDoc, serverTimestamp }) => {
             setDoc(tokenRef, { token, lastUpdated: serverTimestamp() }, { merge: true });
           });
        }
      }, 5000);
    }
  }, [user, isMounted, firestore]);

  const handleOpenPicker = () => {
    window.dispatchEvent(new CustomEvent('open-location-picker'));
  };

  const markAllAsRead = async () => {
    if (!firestore || !user || !notifications) return;
    notifications.forEach((n: any) => {
      if (!n.read) {
        updateDoc(doc(firestore, 'users', user.uid, 'notifications', n.id), { read: true });
      }
    });
  };

  const deleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!firestore || !user) return;
    await deleteDoc(doc(firestore, 'users', user.uid, 'notifications', id));
  };

  return (
    <div className="w-full bg-white pb-4 pt-3 px-4 space-y-3 rounded-b-[2.5rem] shadow-sm relative z-50 overflow-hidden">
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23 47c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5z' fill='%23000000' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '100px'
        }} 
      />

      <div className="flex items-center justify-between relative z-10">
        <button 
          onClick={handleOpenPicker}
          className="flex items-center gap-1.5 active:scale-95 transition-all text-left w-full"
        >
          <div className="h-8 w-8 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <MapPin className="h-4.5 w-4.5 text-primary stroke-[2.5]" />
          </div>
          <div className="flex flex-col min-w-0 pr-10">
            <div className="flex items-center gap-1">
              <span className="text-black text-xs font-black tracking-tight uppercase leading-none truncate">
                {isMounted ? currentAddress : 'Detecting...'}
              </span>
              <ChevronDown className="h-3 w-3 text-primary stroke-[3]" />
            </div>
            <span className="text-[8px] font-black text-primary uppercase tracking-widest mt-1 truncate">
              {isMounted ? fullAddress : 'Syncing GPS...'}
            </span>
          </div>
        </button>

        <button 
          onClick={() => {
            if (!user) {
              window.dispatchEvent(new CustomEvent('open-auth-overlay'));
            } else {
              setIsNotifyOpen(true);
              markAllAsRead();
            }
          }}
          className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 shadow-sm active:scale-90 transition-all hover:bg-gray-100 shrink-0 relative"
          aria-label="Open Notifications"
        >
          <Bell className={cn("h-6 w-6 text-black", unreadCount > 0 && "animate-ring")} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-primary rounded-full border-2 border-white shadow-sm animate-pulse" />
          )}
        </button>
      </div>

      <div className="relative group z-10">
        <div className="relative h-12 w-full bg-gradient-to-r from-[#D9C4A9] via-[#F1E4D1] to-[#D9C4A9] rounded-full overflow-hidden shadow-md border border-[#B8A38B]/20 flex items-center px-4">
          <Search className="h-5 w-5 text-[#5C4D3C] shrink-0" />
          
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search for Food or Groceries"
            className="h-full w-full bg-transparent border-none pl-2 pr-16 text-[#2D2418] font-bold placeholder:text-[#8C7A63] focus-visible:ring-0 text-xs tracking-tight"
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-3 text-[#2D2418]">
             <button className="active:scale-90 transition-all">
                <Camera className="h-5 w-5 stroke-[2.5]" />
             </button>
             <button className="active:scale-90 transition-all">
                <Mic className="h-5 w-5 stroke-[2.5]" />
             </button>
          </div>
        </div>
      </div>

      {/* NOTIFICATION CENTER DIALOG */}
      <Dialog open={isNotifyOpen} onOpenChange={setIsNotifyOpen}>
        <DialogContent className="rounded-t-[3rem] sm:rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white max-h-[85vh] flex flex-col focus:outline-none bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
           <DialogHeader className="p-8 pb-4 shrink-0">
              <div className="flex flex-col items-center text-center">
                 <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-3 shadow-inner">
                    <Bell className="h-7 w-7" />
                 </div>
                 <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Notification Hub</DialogTitle>
                 <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Live updates from ShopyKart</DialogDescription>
              </div>
              <button onClick={() => setIsNotifyOpen(false)} className="absolute top-6 right-6 h-8 w-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 active:scale-90 transition-all"><X className="h-4 w-4" /></button>
           </DialogHeader>

           <div className="flex-1 overflow-y-auto no-scrollbar p-6 pt-2 space-y-4">
              {notifyLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : notifications && notifications.length > 0 ? (
                notifications.map((n: any) => (
                  <div key={n.id} className={cn(
                    "p-5 rounded-[1.75rem] border-2 transition-all relative group",
                    n.read ? "bg-white border-gray-50 opacity-80" : "bg-primary/5 border-primary/10 shadow-sm"
                  )}>
                    <div className="flex items-start gap-4">
                       <div className={cn(
                         "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                         n.read ? "bg-gray-100 text-gray-400" : "bg-primary text-white"
                       )}>
                          <MessageSquare className="h-5 w-5" />
                       </div>
                       <div className="flex-1 min-w-0 pr-6">
                          <h4 className="text-sm font-black uppercase italic tracking-tight text-gray-900 leading-none mb-1.5">{n.title || 'Broadcast Alert'}</h4>
                          <p className="text-[11px] font-bold text-gray-600 uppercase leading-relaxed tracking-tight">{n.message}</p>
                          <div className="flex items-center gap-1.5 mt-3 text-[8px] font-black text-gray-400 uppercase tracking-widest italic">
                             <Clock className="h-2.5 w-2.5" />
                             {n.timestamp ? format(new Date(n.timestamp.seconds * 1000 || Date.now()), 'MMM d, h:mm a') : 'Recently'}
                          </div>
                       </div>
                    </div>
                    <button 
                      onClick={(e) => deleteNotification(e, n.id)}
                      className="absolute top-5 right-5 h-8 w-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                    >
                       <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 opacity-30 flex flex-col items-center">
                   <Bell className="h-16 w-16 mb-4 text-gray-200" />
                   <p className="font-black italic uppercase text-xs">No notifications yet</p>
                </div>
              )}
           </div>

           <div className="p-8 bg-gray-50 border-t">
              <Button onClick={() => setIsNotifyOpen(false)} className="w-full h-14 bg-black text-white rounded-2xl font-black uppercase italic">CLOSE HUB</Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}