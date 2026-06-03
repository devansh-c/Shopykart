
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { 
  LifeBuoy, 
  User, 
  PhoneCall, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  Loader2, 
  MessageCircle,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

export function TicketManagement() {
  const firestore = useFirestore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const ticketsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'tickets'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: tickets, loading } = useCollection<any>(ticketsQuery);

  const handleResolve = async (id: string) => {
    if (!firestore) return;
    await updateDoc(doc(firestore, 'tickets', id), {
      status: 'Resolved',
      updatedAt: serverTimestamp()
    });
  };

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm("Delete this ticket permanently?")) {
      await deleteDoc(doc(firestore, 'tickets', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black italic uppercase">Support Center</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Active Customer Requests</p>
        </div>
        <Badge className="bg-primary text-white border-none px-3 py-1 font-black">
          {tickets?.length || 0} TOTAL TICKETS
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !tickets ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : tickets && tickets.length > 0 ? (
          tickets.map((ticket: any) => {
            const dateStr = isMounted && ticket.createdAt?.seconds 
              ? format(new Date(ticket.createdAt.seconds * 1000), 'MMM d, h:mm a') 
              : 'Recently';

            return (
              <div key={ticket.id} className={cn(
                "bg-white rounded-[2.5rem] p-6 border-2 transition-all relative overflow-hidden flex flex-col group hover:shadow-xl",
                ticket.status === 'Resolved' ? "border-green-100 opacity-80" : "border-amber-100 shadow-sm"
              )}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center",
                      ticket.status === 'Resolved' ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                    )}>
                      <LifeBuoy className="h-6 w-6" />
                    </div>
                    <div>
                       <h3 className="font-black text-lg italic uppercase tracking-tighter leading-none">{ticket.customerName || 'Premium User'}</h3>
                       <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">
                          <Calendar className="h-2.5 w-2.5" /> {dateStr}
                       </div>
                    </div>
                  </div>
                  <Badge className={cn(
                    "uppercase text-[8px] font-black border-none",
                    ticket.status === 'Resolved' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700 animate-pulse"
                  )}>
                    {ticket.status || 'Pending'}
                  </Badge>
                </div>

                <div className="bg-muted/30 rounded-3xl p-5 space-y-4 mb-6 flex-1">
                   <div className="space-y-1">
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest">Issue Description</p>
                      <p className="text-sm font-bold text-gray-700 leading-relaxed italic">
                        "{ticket.description}"
                      </p>
                   </div>
                   
                   <div className="pt-3 border-t border-dashed border-gray-300">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <div className="bg-white p-1.5 rounded-lg shadow-sm text-green-500"><PhoneCall className="h-3.5 w-3.5" /></div>
                            <span className="text-sm font-black tracking-tight">{ticket.phone}</span>
                         </div>
                         <div className="flex gap-2">
                            <button 
                              onClick={() => window.open(`tel:${ticket.phone}`)}
                              className="p-2 bg-green-500 text-white rounded-xl shadow-md active:scale-90 transition-transform"
                            >
                              <PhoneCall className="h-3.5 w-3.5" />
                            </button>
                            <button 
                              onClick={() => window.open(`https://wa.me/91${ticket.phone}`)}
                              className="p-2 bg-green-50 text-green-600 rounded-xl active:scale-90 transition-transform"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

                <div className="mt-auto flex gap-3">
                   {ticket.status !== 'Resolved' && (
                     <Button 
                      onClick={() => handleResolve(ticket.id)}
                      className="flex-1 rounded-2xl h-12 bg-green-600 hover:bg-green-700 font-black uppercase italic text-[10px] tracking-widest shadow-lg shadow-green-100"
                     >
                       <CheckCircle2 className="h-4 w-4 mr-2" />
                       MARK RESOLVED
                     </Button>
                   )}
                   <Button 
                    onClick={() => handleDelete(ticket.id)}
                    variant="ghost" 
                    size="icon" 
                    className="h-12 w-12 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100"
                   >
                     <Trash2 className="h-5 w-5" />
                   </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[3rem] border-2 border-dashed">
            <LifeBuoy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No support tickets found</p>
          </div>
        )}
      </div>
    </div>
  );
}
