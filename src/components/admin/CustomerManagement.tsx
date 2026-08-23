
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { 
  User, 
  PhoneCall, 
  MapPin, 
  Search, 
  Loader2, 
  Calendar,
  Coins,
  MessageCircle,
  Plus,
  Minus,
  Send,
  Zap,
  Users,
  Copy,
  Check,
  Building2,
  Navigation,
  Mail,
  Crown,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

export default function CustomerManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Bulk WhatsApp State
  const [isBulkMsgOpen, setIsBulkMsgOpen] = useState(false);
  const [bulkMessage, setBulkMessage] = useState('');
  const [sendingIndex, setSendingIndex] = useState(-1);
  const [isNumbersCopied, setIsNumbersCopied] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: users, loading } = useCollection<any>(usersQuery);

  const validUsers = useMemo(() => {
    return users?.filter(u => u.phoneNumber && u.phoneNumber.length === 10) || [];
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => {
      const name = (u.fullName || '').toLowerCase();
      const phone = (u.phoneNumber || '');
      const email = (u.email || '').toLowerCase();
      const addr = (u.address || '').toLowerCase();
      const city = (u.city || '').toLowerCase();
      const q = searchQuery.toLowerCase();
      return name.includes(q) || phone.includes(q) || email.includes(q) || addr.includes(q) || city.includes(q);
    });
  }, [users, searchQuery]);

  const handleCopyAllNumbers = () => {
    if (validUsers.length === 0) {
      toast({ variant: "destructive", title: "No numbers found" });
      return;
    }
    const numbers = validUsers.map(u => u.phoneNumber).join(', ');
    navigator.clipboard.writeText(numbers);
    setIsNumbersCopied(true);
    toast({ title: "Copied!", description: `${validUsers.length} numbers ready for WhatsApp Broadcast list.` });
    setTimeout(() => setIsNumbersCopied(false), 3000);
  };

  const handleAdjustCoins = async (userId: string, mode: 'add' | 'sub') => {
    if (!firestore || !adjustAmount || isNaN(Number(adjustAmount))) return;
    setIsAdjusting(true);
    const amount = Number(adjustAmount);
    const finalChange = mode === 'add' ? amount : -amount;
    try {
      await updateDoc(doc(firestore, 'users', userId), { coins: increment(finalChange) });
      toast({ title: "Coins Updated" });
      setAdjustAmount('');
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    } finally {
      setIsAdjusting(false);
    }
  };

  const handleTogglePremium = async (userId: string, currentStatus: boolean) => {
    if (!firestore) return;
    try {
      const expiry = currentStatus ? null : addDays(new Date(), 60).toISOString();
      await updateDoc(doc(firestore, 'users', userId), {
        isPremium: !currentStatus,
        premiumExpiry: expiry,
        updatedAt: serverTimestamp()
      });
      toast({ title: !currentStatus ? "Premium Enabled! 👑" : "Premium Removed" });
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed" });
    }
  };

  const startBroadcasting = () => {
    if (!bulkMessage.trim()) {
      toast({ variant: "destructive", title: "Empty Message" });
      return;
    }
    setSendingIndex(0);
  };

  const sendNext = (index: number) => {
    if (index >= validUsers.length) {
      setSendingIndex(-1);
      setBulkMessage('');
      setIsBulkMsgOpen(false);
      toast({ title: "Broadcast Finished! ✅" });
      return;
    }

    const user = validUsers[index];
    const url = `https://wa.me/91${user.phoneNumber}?text=${encodeURIComponent(bulkMessage)}`;
    window.open(url, '_blank');
    setSendingIndex(index + 1);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0B0B0B] p-8 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">WhatsApp Power Tools</h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Direct access to {validUsers.length} customers</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={handleCopyAllNumbers}
              className={cn(
                "h-14 px-6 rounded-2xl font-black uppercase italic text-[10px] tracking-widest transition-all",
                isNumbersCopied ? "bg-green-600 text-white" : "bg-white/10 text-white hover:bg-white/20 border border-white/5"
              )}
            >
              {isNumbersCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {isNumbersCopied ? 'NUMBERS COPIED' : 'COPY ALL NUMBERS'}
            </Button>

            <Dialog open={isBulkMsgOpen} onOpenChange={setIsBulkMsgOpen}>
              <DialogTrigger asChild>
                <Button className="h-14 px-8 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black uppercase italic shadow-xl shadow-green-900/20 active:scale-95 transition-all">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    SEND BULK MESSAGE
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[2.5rem] max-w-md p-8 border-none shadow-2xl bg-white">
                <DialogHeader className="mb-6">
                    <DialogTitle className="font-black italic uppercase text-center text-2xl tracking-tighter text-gray-900">Broadcaster</DialogTitle>
                </DialogHeader>
                
                {sendingIndex === -1 ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Your Promotional Message</label>
                       <Textarea 
                        placeholder="E.g. Special 50% Off Today! Order now at ShopyKart." 
                        value={bulkMessage}
                        onChange={e => setBulkMessage(e.target.value)}
                        className="min-h-[160px] rounded-[2rem] bg-gray-50 border-none font-bold p-6 text-sm"
                       />
                    </div>
                    <div className="bg-amber-50 p-5 rounded-2xl flex gap-4 border border-amber-100">
                       <Zap className="h-6 w-6 text-amber-500 shrink-0" />
                       <p className="text-[10px] font-bold text-amber-800 uppercase leading-relaxed">
                         One-by-One mode use karein taaki WhatsApp aapko spam na samjhe aur chats safely open hon.
                       </p>
                    </div>
                    <Button onClick={startBroadcasting} className="w-full h-16 bg-black hover:bg-green-600 text-white rounded-[2rem] font-black uppercase italic text-lg shadow-xl transition-all">
                       START BROADCASTING
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-8 animate-in zoom-in duration-500">
                     <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-20" />
                        <div className="relative bg-green-500 h-24 w-24 rounded-full flex items-center justify-center shadow-xl shadow-green-200">
                            <Send className="h-10 w-10 text-white" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <h3 className="text-3xl font-black italic uppercase text-gray-900 leading-none">Sending...</h3>
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em]">Customer {sendingIndex + 1} of {validUsers.length}</p>
                     </div>
                     <div className="w-full space-y-4">
                        <Button onClick={() => sendNext(sendingIndex)} className="w-full h-20 bg-green-600 hover:bg-green-700 text-white rounded-[2rem] font-black uppercase italic text-xl shadow-lg active:scale-95">
                           OPEN CHAT #{sendingIndex + 1}
                        </Button>
                        <button onClick={() => setSendingIndex(-1)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest underline">Cancel Session</button>
                     </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="absolute top-0 right-0 h-full w-32 bg-white/5 -skew-x-12 translate-x-10" />
      </div>

      <div className="flex justify-between items-center px-2">
         <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
               placeholder="Search by name, phone, or email..." 
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

            const isPremium = user.isPremium && new Date(user.premiumExpiry).getTime() > Date.now();

            return (
              <div key={user.id} className="bg-white rounded-[2.5rem] p-6 border border-border/50 shadow-sm hover:shadow-xl transition-all group relative flex flex-col transform-gpu">
                
                <div className="absolute top-6 right-6 z-10 flex flex-col items-end gap-2">
                   {isPremium && (
                      <Badge className="bg-amber-400 text-black border-none font-black text-[7px] uppercase tracking-widest animate-pulse">
                         <Crown className="h-2 w-2 mr-1 fill-black" /> ELITE USER
                      </Badge>
                   )}
                   <div className="bg-white/80 backdrop-blur-md px-2 py-1.5 rounded-xl border shadow-sm flex items-center gap-2">
                      <span className="text-[7px] font-black uppercase text-gray-400">Elite</span>
                      <Switch 
                        checked={user.isPremium === true} 
                        onCheckedChange={() => handleTogglePremium(user.id, user.isPremium === true)}
                        className="scale-75 data-[state=checked]:bg-amber-500"
                      />
                   </div>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center border overflow-hidden",
                      isPremium ? "border-amber-400 bg-amber-50" : "border-primary/10 bg-primary/5"
                    )}>
                      {user.profileImageUrl ? (
                        <img src={user.profileImageUrl} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <User className={cn("h-7 w-7", isPremium ? "text-amber-500" : "text-primary")} />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg italic uppercase tracking-tighter leading-tight truncate pr-20">
                      {user.fullName || 'New User'}
                    </h3>
                    <div className="flex items-center gap-1 text-[9px] font-black text-muted-foreground uppercase mt-1 tracking-widest italic">
                      <Calendar className="h-2.5 w-2.5" /> {dateStr}
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
                          <Input 
                            type="number" 
                            placeholder="Amount" 
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(e.target.value)}
                            className="h-14 rounded-2xl text-center text-xl font-black bg-muted/20 border-none"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <Button onClick={() => handleAdjustCoins(user.id, 'add')} disabled={isAdjusting || !adjustAmount} className="h-14 rounded-2xl bg-green-600 hover:bg-green-700 font-black uppercase italic"><Plus className="mr-2 h-5 w-5" /> ADD</Button>
                          <Button onClick={() => handleAdjustCoins(user.id, 'sub')} disabled={isAdjusting || !adjustAmount} variant="destructive" className="h-14 rounded-2xl font-black uppercase italic"><Minus className="mr-2 h-5 w-5" /> REMOVE</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="bg-muted/20 rounded-[1.5rem] p-4 space-y-3 mb-4 flex-1 border border-border/30">
                  {isPremium && (
                    <div className="flex items-center gap-2 bg-amber-50 p-2 rounded-xl border border-amber-100 mb-1">
                       <AlertCircle className="h-3 w-3 text-amber-600" />
                       <span className="text-[8px] font-bold text-amber-700 uppercase">Elite UTR: {user.premiumUtr || 'ADMIN_ENABLED'}</span>
                    </div>
                  )}
                  <div className="flex flex-col gap-2 border-b border-white pb-3 mb-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                         <div className="bg-white p-1.5 rounded-lg shadow-sm">
                            <PhoneCall className="h-3.5 w-3.5 text-green-500" />
                         </div>
                         <span className="text-sm font-black tracking-tight">{user.phoneNumber || 'N/A'}</span>
                      </div>
                      <div className="flex gap-2">
                        {user.phoneNumber && (
                          <>
                            <button onClick={() => window.open(`tel:${user.phoneNumber}`)} className="p-2 bg-green-500 text-white rounded-lg active:scale-90 transition-transform shadow-md"><PhoneCall className="h-3.5 w-3.5" /></button>
                            <button onClick={() => window.open(`https://wa.me/91${user.phoneNumber}`)} className="p-2 bg-green-50 text-green-600 rounded-lg active:scale-90 transition-transform"><MessageCircle className="h-3.5 w-3.5" /></button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 px-1">
                      <div className="bg-white p-1.5 rounded-lg shadow-sm">
                         <Mail className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <span className="text-[11px] font-bold text-gray-700 truncate">{user.email || 'No email registered'}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="flex items-start gap-2">
                      <div className="bg-white p-1 rounded-md shrink-0"><MapPin className="h-3 w-3 text-primary" /></div>
                      <div className="flex flex-col min-w-0">
                         <span className="text-[7px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Full Address</span>
                         <p className="text-[10px] font-bold text-gray-700 leading-tight">
                           {user.address || 'No address provided'}
                         </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 bg-white/50 p-2 rounded-xl border border-white">
                        <Building2 className="h-3 w-3 text-gray-400" />
                        <div className="flex flex-col">
                           <span className="text-[6px] font-black text-gray-400 uppercase">City</span>
                           <span className="text-[9px] font-black uppercase text-gray-800 truncate">{user.city || 'Ranipur'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 bg-white/50 p-2 rounded-xl border border-white">
                        <Navigation className="h-3 w-3 text-gray-400" />
                        <div className="flex flex-col">
                           <span className="text-[6px] font-black text-gray-400 uppercase">Pincode</span>
                           <span className="text-[9px] font-black text-gray-800">{user.pincode || '284205'}</span>
                        </div>
                      </div>
                    </div>

                    {user.lastSelectedZone && (
                      <div className="flex items-center gap-2 bg-primary/5 p-2 rounded-xl border border-primary/10">
                        <Badge className="bg-primary text-white text-[7px] px-1.5 py-0 rounded uppercase font-black border-none">ZONE</Badge>
                        <span className="text-[9px] font-black uppercase italic text-primary">{user.lastSelectedZone}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No customers registered yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
