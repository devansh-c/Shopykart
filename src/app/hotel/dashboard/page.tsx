
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  CalendarCheck, 
  Users, 
  Settings, 
  LogOut, 
  Loader2, 
  Plus, 
  Star, 
  MapPin, 
  ChevronRight,
  TrendingUp,
  Wallet,
  IndianRupee,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Edit,
  Camera,
  History,
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, updateDoc, serverTimestamp, collection, query, where, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

type Tab = 'bookings' | 'profile' | 'stats';

/**
 * @fileOverview Hotel Partner Dashboard.
 */
export default function HotelDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [activeTab, setActiveTab] = useState<Tab>('bookings');
  const [isMounted, setIsMounted] = useState(false);

  const hotelId = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('hotel_partner_id') || '';
  }, []);

  useEffect(() => {
    setIsMounted(true);
    if (!hotelId && isMounted) router.replace('/hotel/login');
  }, [hotelId, isMounted]);

  const hotelRef = useMemoFirebase(() => (firestore && hotelId) ? doc(firestore, 'hotels', hotelId) : null, [firestore, hotelId]);
  const { data: hotel, loading: hotelLoading } = useDoc<any>(hotelRef);

  const bookingsQuery = useMemoFirebase(() => (firestore && hotelId) ? query(collection(firestore, 'hotel_bookings'), where('hotelId', '==', hotelId), orderBy('createdAt', 'desc')) : null, [firestore, hotelId]);
  const { data: bookings, loading: bookingsLoading } = useCollection<any>(bookingsQuery);

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    if (!firestore) return;
    try {
      await updateDoc(doc(firestore, 'hotel_bookings', bookingId), { status, updatedAt: serverTimestamp() });
      toast({ title: `Booking ${status}` });
    } catch (e) { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const handleLogout = () => {
    localStorage.removeItem('hotel_partner_id');
    localStorage.removeItem('shopykart_session_active');
    router.replace('/');
  };

  if (!isMounted || (hotelLoading && !hotel)) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="h-screen bg-[#F9FAFB] flex flex-col max-w-lg mx-auto relative overflow-hidden transform-gpu">
      <header className="bg-white px-6 py-6 border-b border-gray-50 flex items-center justify-between z-50 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl overflow-hidden border-2 border-amber-100 bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
               {hotel?.imageUrl ? <img src={hotel.imageUrl} className="h-full w-full object-cover" /> : <Building2 className="h-6 w-6" />}
            </div>
            <div className="min-w-0">
               <h1 className="text-lg font-black italic uppercase leading-none truncate max-w-[150px]">{hotel?.name}</h1>
               <div className="flex items-center gap-1.5 mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[8px] font-black uppercase text-gray-400 tracking-widest italic">Live Listing</span>
               </div>
            </div>
         </div>
         <button onClick={() => setActiveTab('profile')} className="h-10 w-10 bg-gray-50 text-gray-400 rounded-xl flex items-center justify-center active:scale-90 transition-transform"><Settings className="h-5 w-5" /></button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 p-5">
         {activeTab === 'bookings' && (
           <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[#EF4444] p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between aspect-square">
                    <div className="relative z-10"><span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80">Pending</span><div className="text-3xl font-black italic mt-1">{bookings?.filter((b:any)=>b.status==='Confirmed').length || 0}</div></div>
                    <Timer className="h-8 w-8 opacity-20 self-end" />
                 </div>
                 <div className="bg-green-600 p-5 rounded-[2rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-between aspect-square">
                    <div className="relative z-10"><span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80">Check-ins</span><div className="text-3xl font-black italic mt-1">{bookings?.filter((b:any)=>b.status==='Checked-in').length || 0}</div></div>
                    <CheckCircle2 className="h-8 w-8 opacity-20 self-end" />
                 </div>
              </div>

              <div className="flex items-center justify-between px-2">
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter">Guest Log</h2>
                 <Badge variant="outline" className="rounded-full border-gray-200 text-gray-400 font-black uppercase text-[10px]">{bookings?.length || 0} TOTAL</Badge>
              </div>

              <div className="space-y-4">
                 {bookings?.map((b: any) => (
                   <div key={b.id} className="bg-white p-6 rounded-[2.5rem] border border-border shadow-sm flex flex-col group animate-in slide-in-from-bottom-2">
                      <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shrink-0"><Users className="h-6 w-6" /></div>
                            <div>
                               <h4 className="font-black text-base uppercase italic leading-none">{b.customerName}</h4>
                               <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1 italic">Guest • {b.guests} Persons</p>
                            </div>
                         </div>
                         <Badge className={cn("border-none text-[8px] font-black uppercase px-3 py-1 rounded-lg", b.status === 'Confirmed' ? "bg-amber-100 text-amber-700 animate-pulse" : "bg-green-100 text-green-700")}>{b.status}</Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-muted/20 rounded-[1.75rem] p-5 mb-6 border border-border/40 shadow-inner">
                         <div className="space-y-1">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Check-in</span>
                            <span className="text-[11px] font-black uppercase italic text-gray-900">{format(new Date(b.checkIn), 'dd MMM yyyy')}</span>
                         </div>
                         <div className="space-y-1 text-right">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Check-out</span>
                            <span className="text-[11px] font-black uppercase italic text-gray-900">{format(new Date(b.checkOut), 'dd MMM yyyy')}</span>
                         </div>
                      </div>

                      <div className="flex gap-2">
                         {b.status === 'Confirmed' && <Button onClick={() => handleUpdateStatus(b.id, 'Checked-in')} className="flex-1 h-14 bg-green-600 hover:bg-black text-white rounded-2xl font-black uppercase italic shadow-lg">MARK CHECK-IN</Button>}
                         {b.status === 'Checked-in' && <Button onClick={() => handleUpdateStatus(b.id, 'Completed')} className="flex-1 h-14 bg-black text-white rounded-2xl font-black uppercase italic shadow-lg">MARK CHECK-OUT</Button>}
                         <Button onClick={() => window.open(`tel:${b.customerPhone}`)} variant="outline" className="h-14 w-14 rounded-2xl border-gray-100 text-primary shadow-sm"><Users className="h-5 w-5" /></Button>
                      </div>
                   </div>
                 ))}
                 {(!bookings || bookings.length === 0) && (
                   <div className="text-center py-20 opacity-20 flex flex-col items-center">
                      <CalendarCheck className="h-16 w-16 mb-4" />
                      <p className="font-black italic uppercase text-xs">No bookings received</p>
                   </div>
                 )}
              </div>
           </div>
         )}

         {activeTab === 'profile' && (
            <div className="p-4 space-y-10 animate-in fade-in duration-500 pb-20">
               <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="h-32 w-32 rounded-[3rem] overflow-hidden border-[6px] border-white shadow-2xl mx-auto bg-amber-50 flex items-center justify-center relative">
                      {hotel?.imageUrl ? <img src={hotel.imageUrl} className="h-full w-full object-cover" /> : <Building2 className="h-10 w-10 text-amber-200" />}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">{hotel?.name}</h2>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-3">PARTNER ID • {hotel?.loginId}</p>
                  </div>
               </div>

               <div className="space-y-4">
                  <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                     <div className="flex items-center justify-between border-b border-gray-50 pb-4">
                        <div className="flex items-center gap-4">
                           <div className="bg-primary/5 p-2 rounded-xl text-primary"><MapPin className="h-5 w-5" /></div>
                           <div className="min-w-0 pr-4">
                              <span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Location</span>
                              <p className="text-[11px] font-bold text-gray-800 uppercase italic truncate">{hotel?.address}</p>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="bg-green-50 p-2 rounded-xl text-green-600"><IndianRupee className="h-5 w-5" /></div>
                           <div>
                              <span className="text-[8px] font-black text-gray-400 uppercase block mb-0.5">Base Price</span>
                              <p className="text-sm font-black text-gray-900 italic leading-none">₹{hotel?.pricePerNight} / NIGHT</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  <button 
                    onClick={handleLogout}
                    className="w-full h-18 bg-white border border-red-50 text-red-500 rounded-[2.2rem] flex items-center justify-center gap-3 font-black uppercase italic text-sm shadow-sm active:scale-95 transition-all mt-6"
                  >
                    <LogOut className="h-5 w-5" /> DISCONNECT ACCOUNT
                  </button>
               </div>
            </div>
         )}
      </main>

      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[92%] max-w-[440px] bg-[#0F172A]/90 backdrop-blur-xl pt-4 pb-4 px-6 flex justify-around border border-white/10 z-[1000] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        {[
          {id:'bookings',label:'BOOKINGS',icon:CalendarCheck},
          {id:'stats',label:'REVENUE',icon:TrendingUp},
          {id:'profile',label:'CONSOLE',icon:Building2}
        ].map(item => (
          <button key={item.id} onClick={() => setActiveTab(item.id as any)} className="flex flex-col items-center gap-1.5 active:scale-90 transition-all group outline-none">
            <div className={cn("h-1 w-5 rounded-full transition-all mb-1", activeTab === item.id ? "bg-amber-400 w-8" : "bg-transparent")} />
            <item.icon className={cn("h-5 w-5 transition-all", activeTab === item.id ? "text-amber-400 scale-110" : "text-gray-500 group-hover:text-gray-300")} />
            <span className={cn("text-[9px] font-black uppercase tracking-[0.1em]", activeTab === item.id ? "text-white" : "text-gray-500")}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
