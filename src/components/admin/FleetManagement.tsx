
"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { 
  Truck, 
  PhoneCall, 
  Mail, 
  Trash2, 
  Loader2, 
  Calendar,
  User,
  ShieldCheck,
  Search
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function FleetManagement() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const partnersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'delivery_partners'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: partners, loading } = useCollection<any>(partnersQuery);

  const filteredPartners = useMemo(() => {
    if (!partners) return [];
    return partners.filter(p => 
      p.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone?.includes(searchQuery) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [partners, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!firestore) return;
    if (confirm("Are you sure? This will remove the delivery partner account.")) {
      await deleteDoc(doc(firestore, 'delivery_partners', id));
      toast({ title: "Partner Removed" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">Delivery Fleet</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{partners?.length || 0} Registered Partners</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search partners..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-white border-none shadow-sm font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !partners ? (
          <div className="col-span-full flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredPartners.length > 0 ? (
          filteredPartners.map((partner: any) => {
            const dateStr = partner.createdAt?.seconds 
              ? format(new Date(partner.createdAt.seconds * 1000), 'MMM d, yyyy') 
              : 'N/A';

            return (
              <div key={partner.id} className="bg-white rounded-[2.5rem] p-6 border border-border/50 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                   <div className="relative">
                      <Avatar className="h-16 w-16 border-2 border-primary/10 rounded-2xl overflow-hidden">
                        <AvatarImage src={partner.photoUrl} className="object-cover" />
                        <AvatarFallback className="bg-muted text-primary font-black uppercase rounded-2xl">{partner.firstName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-green-500 h-4 w-4 rounded-full border-2 border-white shadow-sm" />
                   </div>
                   <div>
                      <h3 className="font-black text-lg italic uppercase tracking-tighter leading-tight truncate max-w-[150px]">{partner.fullName}</h3>
                      <div className="flex items-center gap-1 text-[9px] font-black text-muted-foreground uppercase mt-1">
                         <Calendar className="h-2.5 w-2.5" /> Joined {dateStr}
                      </div>
                   </div>
                </div>

                <div className="bg-muted/30 rounded-3xl p-5 space-y-3 mb-6 flex-1">
                   <div className="flex items-center justify-between border-b border-white pb-3">
                      <div className="flex items-center gap-2">
                         <div className="bg-white p-1.5 rounded-lg shadow-sm text-green-500"><PhoneCall className="h-3.5 w-3.5" /></div>
                         <span className="text-xs font-black">{partner.phone}</span>
                      </div>
                      <button onClick={() => window.open(`tel:${partner.phone}`)} className="p-2 bg-green-500 text-white rounded-lg active:scale-90 transition-transform shadow-md"><PhoneCall className="h-3 w-3" /></button>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="bg-white p-1.5 rounded-lg shadow-sm text-blue-500"><Mail className="h-3.5 w-3.5" /></div>
                      <span className="text-[10px] font-bold text-gray-500 truncate">{partner.email}</span>
                   </div>
                </div>

                <div className="mt-auto flex justify-between items-center px-1">
                   <Badge className="bg-primary/5 text-primary border-none font-black text-[8px] uppercase tracking-widest">ID: {partner.id.slice(-8)}</Badge>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(partner.id)}
                    className="h-10 w-10 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl"
                   >
                     <Trash2 className="h-4 w-4" />
                   </Button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
            <Truck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No delivery partners found</p>
          </div>
        )}
      </div>
    </div>
  );
}
