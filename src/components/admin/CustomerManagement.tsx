"use client"

import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { 
  User, 
  PhoneCall, 
  MapPin, 
  Search, 
  Loader2, 
  Calendar,
  Building2,
  Navigation,
  Coins
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export function CustomerManagement() {
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all users from root collection
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
      const city = (u.city || '').toLowerCase();
      const pincode = (u.pincode || '');
      
      const q = searchQuery.toLowerCase();
      return name.includes(q) || phone.includes(q) || city.includes(q) || pincode.includes(q);
    });
  }, [users, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-800">User Directory</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Registered: {users?.length || 0}</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by name, phone or city..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-white border-none shadow-sm font-bold"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length > 0 ? (
          filteredUsers.map((user: any) => {
            return (
              <div key={user.id} className="bg-white rounded-[2.5rem] p-6 border border-border/50 shadow-sm hover:shadow-xl transition-all group relative flex flex-col">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-14 w-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                    <User className="h-7 w-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg italic uppercase tracking-tighter leading-tight truncate">
                      {user.fullName || 'Identity Pending'}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] font-black text-muted-foreground uppercase mt-1 tracking-widest italic">
                      <Calendar className="h-3 w-3" />
                      Joined {user.createdAt?.seconds ? format(new Date(user.createdAt.seconds * 1000), 'MMM d, yyyy') : 'Recently'}
                    </div>
                  </div>
                  <div className="bg-amber-50 px-3 py-2 rounded-2xl border border-amber-100 flex flex-col items-center justify-center">
                     <Coins className="h-4 w-4 text-amber-500 mb-0.5" />
                     <span className="text-xs font-black text-amber-600">{user.coins || 0}</span>
                  </div>
                </div>

                <div className="bg-muted/20 rounded-[1.5rem] p-4 space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                       <div className="bg-white p-1.5 rounded-lg shadow-sm">
                          <PhoneCall className="h-3.5 w-3.5 text-green-500" />
                       </div>
                       <span className="text-sm font-black tracking-tight">{user.phoneNumber || 'N/A'}</span>
                    </div>
                    {user.phoneNumber && (
                      <button 
                        onClick={() => window.open(`tel:${user.phoneNumber}`)}
                        className="text-[10px] font-black uppercase text-blue-600 underline"
                      >
                        CALL NOW
                      </button>
                    )}
                  </div>

                  <div className="flex items-start gap-2">
                     <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                     <p className="text-xs font-bold text-muted-foreground leading-snug">
                       {user.address || 'Address not provided'}
                     </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2 border-t border-dashed border-gray-200">
                     <div className="flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] font-black uppercase">{user.city || 'N/A'}</span>
                     </div>
                     <div className="h-1 w-1 bg-gray-300 rounded-full" />
                     <div className="flex items-center gap-1.5">
                        <Navigation className="h-3 w-3 text-gray-400" />
                        <span className="text-[10px] font-black uppercase">{user.pincode || 'N/A'}</span>
                     </div>
                  </div>
                </div>

                <div className="mt-auto pt-2">
                   <div className="flex justify-between items-center px-1">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ID: {user.id.slice(-8)}</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100 text-[8px] font-black px-2 py-0.5 rounded-full uppercase">
                         ACTIVE USER
                      </Badge>
                   </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-20 bg-muted/20 rounded-[2.5rem] border-2 border-dashed">
            <User className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-black italic uppercase tracking-widest text-sm">No customers found</p>
          </div>
        )}
      </div>
    </div>
  );
}
