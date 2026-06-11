
"use client"

import { useState } from 'react';
import { BellRing, Send, Users, User, Search, Loader2, MessageSquare, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview Individual Messaging component. Broadcast feature removed as requested.
 */
export function NotificationManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch Users for individual targeting
  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: users, loading: usersLoading } = useCollection<any>(usersQuery);

  const filteredUsers = users?.filter(u => {
    const name = (u.fullName || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
  }) || [];

  const handleSendToUser = async (userId: string, userName: string) => {
    if (!title || !message || !firestore) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Title and message are required." });
      return;
    }

    setIsSending(true);
    try {
      const userNotifyRef = collection(firestore, 'users', userId, 'notifications');
      await addDoc(userNotifyRef, {
        title,
        message,
        timestamp: serverTimestamp(),
        type: 'personal',
        read: false
      });
      
      toast({ title: "Sent!", description: `Notification sent to ${userName}` });
      setTitle('');
      setMessage('');
    } catch (err) {
      toast({ variant: "destructive", title: "Failed", description: "Could not send message." });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-primary/10 p-2 rounded-xl text-primary"><MessageSquare className="h-5 w-5" /></div>
            <h3 className="text-lg font-black italic uppercase">Direct Messaging</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Subject</label>
              <Input 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Premium Bonus Added! 💰" 
                className="h-14 rounded-2xl border-muted bg-muted/5 font-bold"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Message Body</label>
              <Textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your private message here..." 
                className="rounded-2xl border-muted bg-muted/5 font-medium min-h-[160px]"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border border-border/50 shadow-sm flex flex-col">
           <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-500"><Users className="h-5 w-5" /></div>
            <h3 className="text-lg font-black italic uppercase">Target User</h3>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search user..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-muted/30 border-none text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 min-h-[300px] max-h-[500px]">
            {usersLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((u: any) => (
                <div key={u.id} className="p-4 bg-muted/20 rounded-2xl flex items-center justify-between border border-transparent hover:border-primary/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold">
                      {(u.fullName || 'U').charAt(0)}
                    </div>
                    <div className="max-w-[120px]">
                      <p className="text-xs font-black truncate">{u.fullName || 'No Name'}</p>
                      <p className="text-[9px] text-muted-foreground truncate">{u.phoneNumber}</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleSendToUser(u.id, u.fullName)}
                    className="h-8 w-8 p-0 rounded-lg bg-white shadow-sm text-primary hover:bg-primary hover:text-white"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-20 opacity-30 uppercase font-black text-[10px] tracking-widest italic">No users found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
