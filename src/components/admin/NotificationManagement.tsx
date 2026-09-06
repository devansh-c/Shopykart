
"use client"

import { useState, useMemo } from 'react';
import { 
  Bell, 
  Send, 
  Users, 
  Search, 
  Loader2, 
  MessageSquare, 
  Zap, 
  Target,
  Smartphone,
  Info,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, query, limit, orderBy } from 'firebase/firestore';
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

  const handleSendToUser = async (userId: string, userName: string) => {
    if (!title || !message || !firestore) {
      toast({ variant: "destructive", title: "Missing Fields" });
      return;
    }

    setIsSending(true);
    try {
      const userNotifyRef = collection(firestore, 'users', userId, 'notifications');
      await addDoc(userNotifyRef, {
        title: title.trim().toUpperCase(),
        message: message.trim(),
        type: msgType,
        timestamp: serverTimestamp(),
        read: false,
        isUrgent: true 
      });
      
      toast({ title: "Alert Pushed!", description: `Message delivered to ${userName}` });
      setTitle('');
      setMessage('');
    } catch (err) {
      toast({ variant: "destructive", title: "Failed", description: "Delivery error." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-500 max-w-6xl">
      <div className="bg-[#0B0B0B] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="flex items-center gap-6">
               <div className="h-20 w-20 bg-primary/20 rounded-[1.75rem] flex items-center justify-center text-primary border border-primary/20">
                  <Bell className="h-10 w-10 animate-ring" />
               </div>
               <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">Notification Hub</h2>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1 flex items-center gap-2">
                    <Smartphone className="h-3 w-3" /> Push alerts to {users?.length || 0} identities
                  </p>
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 h-full w-44 bg-primary/5 -skew-x-12 translate-x-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-border shadow-sm space-y-6">
             <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-xl text-primary"><MessageSquare className="h-5 w-5" /></div>
                <h3 className="text-xl font-black italic uppercase tracking-tighter">Alert Composer</h3>
             </div>

             <div className="space-y-5">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Title</label>
                   <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. MEGA OFFER! 💰" className="h-14 rounded-2xl bg-gray-50 border-none font-bold text-lg" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Message</label>
                   <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Write message..." className="min-h-[160px] rounded-[2rem] bg-gray-50 border-none font-medium p-6 text-sm italic" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Style</label>
                  <Select value={msgType} onValueChange={setMsgType}>
                     <SelectTrigger className="h-14 rounded-2xl bg-gray-50 border-none font-black italic uppercase"><SelectValue /></SelectTrigger>
                     <SelectContent className="rounded-2xl shadow-2xl border-none">
                        <SelectItem value="promo" className="font-bold py-3 uppercase text-xs italic">PROMOTIONAL</SelectItem>
                        <SelectItem value="info" className="font-bold py-3 uppercase text-xs italic">INFORMATION</SelectItem>
                     </SelectContent>
                  </Select>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[3rem] border border-border shadow-sm h-full flex flex-col min-h-[500px]">
              <div className="flex items-center gap-3 mb-6">
                 <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Target className="h-5 w-5" /></div>
                 <h3 className="text-lg font-black italic uppercase">Target User</h3>
              </div>
              <div className="relative mb-6">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 h-12 rounded-xl bg-gray-50 border-none font-bold text-sm" />
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                 {usersLoading ? (
                   <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary/20" /></div>
                 ) : filteredUsers.map((u: any) => (
                   <div key={u.id} className="p-4 bg-gray-50 rounded-[1.5rem] flex items-center justify-between group">
                      <div className="min-w-0">
                         <h4 className="text-[11px] font-black uppercase truncate italic">{u.fullName || 'Guest User'}</h4>
                         <span className="text-[8px] font-bold text-gray-400 truncate">{u.phoneNumber || 'No Phone'}</span>
                      </div>
                      <button onClick={() => handleSendToUser(u.id, u.fullName)} disabled={isSending || !title || !message} className="h-9 w-9 bg-white text-primary rounded-xl flex items-center justify-center shadow-md hover:bg-primary hover:text-white transition-all"><Send className="h-4 w-4" /></button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
