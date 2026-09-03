"use client"

import { useState, useMemo } from 'react';
import { 
  Bell, 
  Send, 
  Users, 
  User, 
  Search, 
  Loader2, 
  MessageSquare, 
  Sparkles, 
  Zap, 
  Target,
  ShieldCheck,
  Smartphone,
  Info,
  Clock,
  Trash2,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, getDocs, writeBatch, query, limit, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NotificationManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [msgType, setMsgType] = useState('promo');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetMode, setTargetMode] = useState<'individual' | 'global'>('individual');

  // Fetch Users
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'), limit(500));
  }, [firestore]);

  const { data: users, loading: usersLoading } = useCollection<any>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return users.slice(0, 20);
    return users.filter(u => {
      const name = (u.fullName || '').toLowerCase();
      const phone = (u.phoneNumber || '');
      return name.includes(q) || phone.includes(q);
    });
  }, [users, searchQuery]);

  const handleSendGlobal = async () => {
    if (!title || !message || !firestore || !users) return;
    
    if (!confirm(`Are you sure? This will send a notification to ALL ${users.length} registered customers.`)) return;

    setIsSending(true);
    try {
      const batch = writeBatch(firestore);
      
      const broadcastRef = doc(collection(firestore, 'broadcasts'));
      batch.set(broadcastRef, {
        title,
        message,
        type: msgType,
        timestamp: serverTimestamp(),
        target: 'all'
      });

      await batch.commit();
      toast({ title: "Broadcast Initiated!", description: "Message sent to global queue." });
      setTitle('');
      setMessage('');
    } catch (err) {
      toast({ variant: "destructive", title: "Failed", description: "Broadcast error." });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendToUser = async (userId: string, userName: string) => {
    if (!title || !message || !firestore) {
      toast({ variant: "destructive", title: "Missing Fields" });
      return;
    }

    setIsSending(true);
    try {
      const userNotifyRef = collection(firestore, 'users', userId, 'notifications');
      await addDoc(userNotifyRef, {
        title,
        message,
        type: msgType,
        timestamp: serverTimestamp(),
        read: false,
        isUrgent: true 
      });
      
      toast({ title: "Alert Pushed!", description: `Message delivered to ${userName}` });
      setTitle('');
      setMessage('');
    } catch (err) {
      toast({ variant: "destructive", title: "Failed", description: "Target delivery failed." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500 max-w-6xl">
      
      {/* HEADER SECTION */}
      <div className="bg-[#0B0B0B] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden transform-gpu">
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
               <div className="h-20 w-20 bg-primary/20 rounded-[1.75rem] flex items-center justify-center text-primary border border-primary/20 shadow-xl shadow-primary/10">
                  <Bell className="h-10 w-10 animate-ring" />
               </div>
               <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">Notification Hub</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                    <Smartphone className="h-3 w-3" /> Push alerts to {users?.length || 0} mobile identities
                  </p>
               </div>
            </div>
            
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
               <button 
                onClick={() => setTargetMode('individual')}
                className={cn("px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", targetMode === 'individual' ? "bg-primary text-white" : "text-gray-400")}
               >
                 Individual
               </button>
               <button 
                onClick={() => setTargetMode('global')}
                className={cn("px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", targetMode === 'global' ? "bg-red-600 text-white animate-pulse" : "text-gray-400")}
               >
                 Global Push
               </button>
            </div>
         </div>
         <div className="absolute top-0 right-0 h-full w-44 bg-primary/5 -skew-x-12 translate-x-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* COMPOSER FORM */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-border shadow-sm space-y-6">
             <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-xl text-primary"><MessageSquare className="h-5 w-5" /></div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Alert Composer</h3>
             </div>

             <div className="space-y-5">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Headline (Notification Title)</label>
                   <Input 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="e.g. Free 10 Coins Added! 💰"
                    className="h-14 rounded-2xl bg-gray-50 border-none font-bold text-lg"
                   />
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Message Body</label>
                   <Textarea 
                    value={message} 
                    onChange={e => setMessage(e.target.value)} 
                    placeholder="Write the notification text here..."
                    className="min-h-[160px] rounded-[2rem] bg-gray-50 border-none font-medium p-6 text-sm italic"
                   />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Alert Style</label>
                      <Select value={msgType} onValueChange={setMsgType}>
                         <SelectTrigger className="h-14 rounded-2xl bg-gray-50 border-none font-black italic uppercase">
                            <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="rounded-2xl shadow-2xl border-none">
                            <SelectItem value="promo" className="font-bold py-3 uppercase italic text-xs">PROMOTIONAL (Green)</SelectItem>
                            <SelectItem value="info" className="font-bold py-3 uppercase italic text-xs">INFORMATION (Blue)</SelectItem>
                            <SelectItem value="alert" className="font-bold py-3 uppercase italic text-xs">URGENT ALERT (Amber)</SelectItem>
                         </SelectContent>
                      </Select>
                   </div>
                   <div className="flex items-end">
                      {targetMode === 'global' && (
                        <Button 
                          onClick={handleSendGlobal}
                          disabled={isSending || !title || !message}
                          className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase italic shadow-xl shadow-red-100"
                        >
                          {isSending ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Zap className="h-5 w-5 mr-2 animate-pulse" />}
                          PUSH TO EVERYONE
                        </Button>
                      )}
                   </div>
                </div>
             </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-[2.5rem] border-2 border-dashed border-blue-100 flex items-start gap-4">
             <div className="bg-blue-600 p-2.5 rounded-xl text-white"><Info className="h-5 w-5" /></div>
             <div>
                <h4 className="font-black italic uppercase text-blue-900 text-sm">Real-time Logic</h4>
                <p className="text-[10px] font-bold text-blue-700/70 uppercase leading-relaxed mt-1">
                  Individual push alerts will trigger a stylish popup on the user's screen instantly. 
                  Users with the <span className="text-green-600 font-black">"PUSH READY"</span> badge have successfully synced their device identity.
                </p>
             </div>
          </div>
        </div>

        {/* USER SELECTION LIST (FOR INDIVIDUAL MODE) */}
        <div className={cn("space-y-6 transition-all duration-500", targetMode === 'global' ? "opacity-30 pointer-events-none grayscale" : "opacity-100")}>
           <div className="bg-white p-8 rounded-[3rem] border border-border shadow-sm h-full flex flex-col min-h-[600px]">
              <div className="flex items-center gap-3 mb-6">
                 <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Users className="h-5 w-5" /></div>
                 <h3 className="text-lg font-black italic uppercase">Target User</h3>
              </div>

              <div className="relative mb-6">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <Input 
                  placeholder="Search customer..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 rounded-xl bg-gray-50 border-none font-bold text-sm"
                 />
              </div>

              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                 {usersLoading ? (
                   <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary/20" /></div>
                 ) : filteredUsers.length > 0 ? (
                   filteredUsers.map((u: any) => (
                     <div key={u.id} className="p-4 bg-gray-50 rounded-[1.5rem] border border-transparent hover:border-primary/20 transition-all flex items-center justify-between group">
                        <div className="flex items-center gap-3 min-w-0">
                           <div className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center text-primary font-black uppercase text-xs shadow-sm shrink-0">
                              {(u.fullName || 'U').charAt(0)}
                           </div>
                           <div className="min-w-0">
                              <h4 className="text-[11px] font-black uppercase truncate italic">{u.fullName || 'Guest User'}</h4>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[8px] font-bold text-gray-400 truncate">{u.phoneNumber || 'No Phone'}</span>
                                {u.isPushEnabled && (
                                  <Badge className="bg-green-100 text-green-700 border-none text-[6px] font-black px-1.5 py-0 rounded uppercase animate-pulse">PUSH READY</Badge>
                                )}
                              </div>
                           </div>
                        </div>
                        <button 
                          onClick={() => handleSendToUser(u.id, u.fullName)}
                          disabled={isSending || !title || !message}
                          className="h-9 w-9 bg-white text-primary rounded-xl flex items-center justify-center shadow-md active:scale-90 transition-all hover:bg-primary hover:text-white"
                        >
                           <Send className="h-4 w-4" />
                        </button>
                     </div>
                   ))
                 ) : (
                   <div className="text-center py-20 opacity-20 uppercase font-black text-[10px] tracking-widest italic border-2 border-dashed rounded-[2rem]">No users found</div>
                 )}
              </div>

              <div className="mt-6 pt-4 border-t border-dashed">
                 <div className="bg-primary/5 p-4 rounded-2xl flex items-center gap-3">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="text-[8px] font-black uppercase text-primary tracking-widest">Select a user to push alert</span>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
