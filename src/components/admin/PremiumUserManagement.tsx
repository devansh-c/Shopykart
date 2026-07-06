
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Crown, 
  User, 
  Calendar, 
  Search, 
  Loader2, 
  PhoneCall, 
  ShieldCheck, 
  Clock, 
  Trash2, 
  AlertCircle,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function PremiumUserManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch only Premium Users
  const premiumUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), where('isPremium', '==', true));
  }, [firestore]);

  const { data: users, loading } = useCollection<any>(premiumUsersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => {
      const name = (u.fullName || '').toLowerCase();
      const phone = (u.phoneNumber || '');
      const q = searchQuery.toLowerCase();
      return name.includes(q) || phone.includes(q);
    }).sort((a, b) => {
      const dateA = a.premiumExpiry ? new Date(a.premiumExpiry).getTime() : 0;
      const dateB = b.premiumExpiry ? new Date(b.premiumExpiry).getTime() : 0;
      return dateA - dateB; // Show soonest expiring first
    });
  }, [users, searchQuery]);

  const handleRevokePremium = async (userId: string) => {
    if (!firestore) return;
    if (!confirm("Are you sure you want to revoke this user's Elite status?")) return;

    try {
      await updateDoc(doc(firestore, 'users', userId), {
        isPremium: false,
        premiumExpiry: null,
        updatedAt: serverTimestamp()
      });
      toast({ title: "Status Revoked", description: "User is no longer a premium member." });
    } catch (err) {
      toast({ variant: "destructive", title: "Action Failed" });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-[#0B0B0B] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden text-white mb-8 transform-gpu">
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-5">
               <div className="h-16 w-16 bg-amber-400 rounded-[1.5rem] flex items-center justify-center text-black shadow-xl shadow-amber-500/20 animate-pulse">
                  <Crown className="h-9 w-9 fill-black" />
               </div>
               <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">Elite Registry</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Managing {users?.length || 0} Premium Memberships</p>
               </div>
            </div>
            
            <div className="relative w-full md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                placeholder="Search Elite Users..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold placeholder:text-gray-600 focus-visible:ring-1 focus-visible:ring-amber-500/30"
              />
            </div>
         </div>
         <div className="absolute top-0 right-0 h-full w-44 bg-primary/5 -skew-x-12 translate-x-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
        {loading && !users ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-amber-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">Filtering elite profiles...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user: any) => {
            const expiryDate = user.premiumExpiry ? new Date(user.premiumExpiry) : null;
            const daysRemaining = expiryDate ? differenceInDays(expiryDate, new Date()) : 0;
            const isExpiringSoon = daysRemaining <= 7;
            const isExpired = daysRemaining < 0;

            return (
              <div key={user.id} className={cn(
                "bg-white rounded-[2.5rem] p-6 border-2 transition-all group relative flex flex-col overflow-hidden",
                isExpired ? "border-red-100 opacity-70" : isExpiringSoon ? "border-amber-200 shadow-amber-50" : "border-border/50 hover:shadow-xl"
              )}>
                
                <div className="flex items-center gap-4 mb-6">
                   <div className={cn(
                     "h-14 w-14 rounded-2xl flex items-center justify-center border shrink-0",
                     isExpired ? "bg-red-50 text-red-400" : "bg-amber-50 text-amber-600 border-amber-100"
                   )}>
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} className="h-full w-full object-cover rounded-2xl" alt="" />
                      ) : (
                        <User className="h-7 w-7" />
                      )}
                   </div>
                   <div className="min-w-0">
                      <h3 className="font-black text-lg italic uppercase tracking-tighter truncate leading-tight">{user.fullName || 'User'}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                         <Badge className={cn(
                           "border-none text-[8px] font-black uppercase tracking-widest px-2",
                           isExpired ? "bg-red-500 text-white" : "bg-[#0B0B0B] text-amber-400"
                         )}>
                            {isExpired ? 'EXPIRED' : 'ACTIVE ELITE'}
                         </Badge>
                      </div>
                   </div>
                </div>

                <div className="bg-muted/30 rounded-3xl p-5 space-y-4 mb-6 flex-1">
                   <div className="flex items-center justify-between border-b border-white pb-3">
                      <div className="flex items-center gap-2">
                         <PhoneCall className="h-3.5 w-3.5 text-green-600" />
                         <span className="text-xs font-black">{user.phoneNumber || 'N/A'}</span>
                      </div>
                      <button onClick={() => window.open(`tel:${user.phoneNumber}`)} className="p-2 bg-green-500 text-white rounded-lg active:scale-90 shadow-md transition-transform"><PhoneCall className="h-3 w-3" /></button>
                   </div>

                   <div className="space-y-3">
                      <div className="flex justify-between items-center">
                         <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Premium Expiry</span>
                         <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-primary" />
                            <span className="text-[11px] font-black italic">{expiryDate ? format(expiryDate, 'dd MMM yyyy') : 'Manual'}</span>
                         </div>
                      </div>

                      <div className="pt-2">
                         <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Time Remaining</span>
                            <span className={cn(
                              "text-[10px] font-black italic",
                              isExpired ? "text-red-500" : isExpiringSoon ? "text-amber-600" : "text-green-600"
                            )}>
                               {isExpired ? 'Already Expired' : `${daysRemaining} Days Left`}
                            </span>
                         </div>
                         <div className="w-full h-1.5 bg-white rounded-full overflow-hidden border border-gray-100">
                            <div 
                              className={cn(
                                "h-full transition-all duration-1000",
                                isExpired ? "bg-red-500" : isExpiringSoon ? "bg-amber-500" : "bg-green-500"
                              )}
                              style={{ width: `${Math.max(0, Math.min(100, (daysRemaining / 60) * 100))}%` }}
                            />
                         </div>
                      </div>
                   </div>
                </div>

                <div className="mt-auto pt-2 flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[7px] font-black text-gray-400 uppercase leading-none mb-1">Activated On</span>
                      <span className="text-[9px] font-bold text-gray-600 uppercase">
                         {isMounted && user.updatedAt?.seconds ? format(new Date(user.updatedAt.seconds * 1000), 'MMM d, yyyy') : 'N/A'}
                      </span>
                   </div>
                   <button 
                    onClick={() => handleRevokePremium(user.id)}
                    className="h-11 px-4 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl font-black uppercase text-[9px] tracking-widest transition-all active:scale-95 flex items-center gap-2 border border-red-100"
                   >
                     <Trash2 className="h-3.5 w-3.5" /> REVOKE
                   </button>
                </div>

                {isExpiringSoon && !isExpired && (
                  <div className="absolute -left-10 top-5 -rotate-45 bg-amber-400 text-black font-black text-[7px] uppercase w-40 text-center py-1 shadow-lg">
                    EXPIRING SOON
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-24 bg-muted/20 rounded-[3rem] border-2 border-dashed border-border">
            <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Crown className="h-10 w-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No Elite Members Yet</h3>
            <p className="text-[10px] font-bold text-muted-foreground/60 uppercase mt-2">Active premium users will appear here automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}
