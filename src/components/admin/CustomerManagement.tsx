
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, increment } from 'firebase/firestore';
import { 
  User, 
  PhoneCall, 
  MapPin, 
  Search, 
  Loader2, 
  Calendar,
  Building2,
  Navigation,
  Coins,
  MessageCircle,
  Plus,
  Minus,
  Mail
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function CustomerManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch all users ordered by newest first
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: users, loading } = useCollection<any>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => {
      const name = (u.fullName || '').toLowerCase();
      const phone = (u.phoneNumber || '');
      const email = (u.email || '').toLowerCase();
      const city = (u.city || '').toLowerCase();
      const pincode = (u.pincode || '');
      
      const q = searchQuery.toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q) || city.includes(q) || pincode.includes(q);
    });
  }, [users, searchQuery]);

  const handleAdjustCoins = async (userId: string, mode: 'add' | 'sub') => {
    if (!firestore || !adjustAmount || isNaN(Number(adjustAmount))) return;
    
    setIsAdjusting(true);
    const amount = Number(adjustAmount);
    const finalChange = mode === 'add' ? amount : -amount;

    try {
      const userRef = doc(firestore, 'users', userId);
      await updateDoc(userRef, {
        coins: increment(finalChange)
      });
      toast({ 
        title: "Coins Updated", 
        description: `Successfully ${mode === 'add' ? 'added' : 'removed'} ${amount} coins.` 
      });
      setAdjustAmount('');
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-800">Customer Insights</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Tracking {users?.length || 0} Registered Users</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by name, phone or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-white border-none shadow-sm font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !users ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user: any) => {
            const dateStr = isMounted && user.createdAt?.seconds 
              ? format(new Date(user.createdAt.seconds * 1000), 'MMM d, h:mm a') 
              : 'Recently';

            return (
              <div key={user.id} className="bg-white rounded-[2.5rem] p-6 border border-border/50 shadow-sm hover:shadow-xl transition-all group relative flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} className="h-full w-full object-cover rounded-2xl" alt="" />
                      ) : (
                        <User className="h-7 w-7" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg italic uppercase tracking-tighter leading-tight truncate">
                      {user.fullName || 'New User'}
                    </h3>
                    <div className="flex items-center gap-1 text-[9px] font-black text-muted-foreground uppercase mt-1 tracking-widest italic">
                      <Calendar className="h-2.5 w-2.5" /> Registered: {dateStr}
                    </div>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <button className="bg-amber-50 px-3 py-2 rounded-2xl border border-amber-100 flex flex-col items-center justify-center hover:bg-amber-100 transition-colors group/coin">
                        <Coins className="h-4 w-4 text-amber-500 mb-0.5 group-hover/coin:scale-110 transition-transform" />
                        <span className="text-xs font-black text-amber-600">{user.coins || 0}</span>
                      </button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] max-w-sm">
                      <DialogHeader>
                        <DialogTitle className="font-black italic uppercase text-center text-xl">Manage Coins</DialogTitle>
                      </DialogHeader>
                      <div className="p-4 space-y-6">
                        <div className="text-center">
                          <p className="text-[10px] font-black text-muted-foreground uppercase mb-1">Current Balance</p>
                          <div className="text-4xl font-black italic text-amber-600">{user.coins || 0}</div>
                        </div>
                        
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-center block">Adjustment Amount</label>
                          <Input 
                            type="number" 
                            placeholder="Enter amount" 
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(e.target.value)}
                            className="h-14 rounded-2xl text-center text-xl font-black bg-muted/20 border-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <Button 
                            onClick={() => handleAdjustCoins(user.id, 'add')}
                            disabled={isAdjusting || !adjustAmount}
                            className="h-14 rounded-2xl bg-green-600 hover:bg-green-700 font-black uppercase italic"
                          >
                            <Plus className="mr-2 h-5 w-5" /> ADD
                          </Button>
                          <Button 
                            onClick={() => handleAdjustCoins(user.id, 'sub')}
                            disabled={isAdjusting || !adjustAmount}
                            variant="destructive"
                            className="h-14 rounded-2xl font-black uppercase italic"
                          >
                            <Minus className="mr-2 h-5 w-5" /> REMOVE
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="bg-muted/20 rounded-[1.5rem] p-4 space-y-3 mb-4 flex-1">
                  <div className="flex items-center justify-between border-b border-white pb-3 mb-1">
                    <div className="flex items-center gap-2">
                       <div className="bg-white p-1.5 rounded-lg shadow-sm">
                          <PhoneCall className="h-3.5 w-3.5 text-green-500" />
                       </div>
                       <span className="text-sm font-black tracking-tight">{user.phoneNumber || 'N/A'}</span>
                    </div>
                    <div className="flex gap-2">
                      {user.phoneNumber && (
                        <>
                          <button 
                            onClick={() => window.open(`tel:${user.phoneNumber}`)}
                            className="p-2 bg-green-500 text-white rounded-lg active:scale-90 transition-transform shadow-md"
                            title="Call Now"
                          >
                            <PhoneCall className="h-3.5 w-3.5" />
                          </button>
                          <button 
                            onClick={() => window.open(`https://wa.me/91${user.phoneNumber}`)}
                            className="p-2 bg-green-50 text-green-600 rounded-lg active:scale-90 transition-transform"
                            title="WhatsApp Now"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span className="text-[10px] font-bold text-gray-500 truncate">{user.email || 'No Email'}</span>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Full Address</p>
                    <div className="flex items-start gap-2">
                       <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                       <p className="text-xs font-bold text-gray-800 leading-snug">
                         {user.address || 'Address Not Provided'}
                       </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-3 border-t border-dashed border-gray-300">
                     <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] font-black uppercase text-gray-500">{user.city || 'Ranipur'}</span>
                     </div>
                     <div className="h-1 w-1 bg-gray-300 rounded-full" />
                     <div className="flex items-center gap-1.5">
                        <Navigation className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] font-black uppercase text-gray-500">{user.pincode || 'N/A'}</span>
                     </div>
                  </div>
                </div>

                <div className="pt-2">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">UID: {user.id.slice(-8)}</span>
                      <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[8px] uppercase">ShopyKart Member</Badge>
                   </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
            <User className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No customers registered yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
