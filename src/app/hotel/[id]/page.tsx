
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  ChevronLeft, 
  Star, 
  MapPin, 
  Wifi, 
  Car, 
  Coffee, 
  Tv, 
  Wind,
  Loader2,
  Calendar,
  Users,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Info,
  Building2,
  CreditCard,
  Banknote,
  IndianRupee,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

function HotelDetailsInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();

  const hotelId = searchParams.get('id') || (params?.id as string);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const hotelRef = useMemoFirebase(() => (firestore && hotelId) ? doc(firestore, 'hotels', hotelId) : null, [firestore, hotelId]);
  const { data: hotel, loading } = useDoc<any>(hotelRef);

  const [bookingForm, setBookingForm] = useState({
    checkIn: new Date().toISOString().split('T')[0],
    checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    guests: '2'
  });

  const handleBooking = async () => {
    if (!user) { window.dispatchEvent(new CustomEvent('open-auth-overlay')); return; }
    if (!firestore || !hotel) return;

    setIsProcessing(true);
    try {
      const nights = Math.ceil((new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) / (1000 * 60 * 60 * 24)) || 1;
      const total = nights * hotel.pricePerNight;

      await addDoc(collection(firestore, 'hotel_bookings'), {
        hotelId: hotel.id,
        hotelName: hotel.name,
        userId: user.uid,
        customerName: user.displayName?.toUpperCase() || 'PREMIUM USER',
        customerPhone: localStorage.getItem('user_phone') || '',
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        guests: parseInt(bookingForm.guests),
        totalAmount: total,
        status: 'Confirmed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setShowSuccess(true);
      setTimeout(() => {
        setIsBookingOpen(false);
        router.replace('/orders');
      }, 2500);
    } catch (err) {
      toast({ variant: "destructive", title: "Booking Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-white pb-40">
      <div className="relative h-[45vh] w-full">
         <Image src={hotel?.imageUrl || 'https://picsum.photos/seed/hotel/800/600'} alt={hotel?.name} fill className="object-cover" priority unoptimized />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-between p-6">
            <button onClick={() => router.back()} className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 active:scale-90 transition-transform"><ChevronLeft className="h-6 w-6" /></button>
            <div className="space-y-2">
               <Badge className="bg-amber-400 text-black border-none font-black text-[9px] uppercase tracking-widest px-3 py-1">OYO Style Elite</Badge>
               <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter leading-none drop-shadow-xl">{hotel?.name}</h1>
               <div className="flex items-center gap-2 text-white/80 text-[10px] font-bold uppercase italic">
                  <MapPin className="h-3 w-3 text-amber-400" /> {hotel?.address}
               </div>
            </div>
         </div>
      </div>

      <div className="p-6 space-y-8 animate-in slide-in-from-bottom-4 duration-700">
         <div className="flex justify-between items-center bg-gray-50 p-6 rounded-[2.5rem] border border-gray-100">
            <div>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Standard Rate</span>
               <div className="text-3xl font-black italic text-gray-900 leading-none">₹{hotel?.pricePerNight}<span className="text-[11px] font-bold text-gray-400 italic not-italic lowercase">/night</span></div>
            </div>
            <div className="bg-green-600 text-white px-4 py-2 rounded-2xl flex items-center gap-1.5 shadow-lg">
               <Star className="h-4 w-4 fill-white stroke-none" />
               <span className="text-sm font-black italic leading-none">{hotel?.rating}</span>
            </div>
         </div>

         <div className="space-y-4">
            <h3 className="text-xl font-black italic uppercase tracking-tighter border-l-4 border-primary pl-3">Amenities</h3>
            <div className="grid grid-cols-2 gap-4">
               {hotel?.amenities?.map((amn: string, idx: number) => (
                 <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-4 shadow-sm group hover:border-primary/20 transition-all">
                    <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                       {amn.toLowerCase().includes('wifi') ? <Wifi className="h-5 w-5" /> : 
                        amn.toLowerCase().includes('ac') ? <Wind className="h-5 w-5" /> :
                        amn.toLowerCase().includes('parking') ? <Car className="h-5 w-5" /> :
                        <Coffee className="h-5 w-5" />}
                    </div>
                    <span className="text-[10px] font-black uppercase text-gray-600">{amn}</span>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-muted/30 p-8 rounded-[3rem] space-y-4 border border-dashed border-gray-200">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-primary">About this property</h4>
            <p className="text-sm font-medium text-gray-500 leading-relaxed italic uppercase">
               Premium stays with verified amenities and professional staff. Experience hospitality like never before at {hotel?.name}.
            </p>
         </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[200] bg-white border-t border-gray-100 p-6 pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.1)]">
         <div className="max-w-md mx-auto">
            <Button 
               onClick={() => setIsBookingOpen(true)}
               className="w-full h-20 bg-[#0B0B0B] hover:bg-primary text-white rounded-[2.5rem] font-black uppercase italic text-xl shadow-2xl flex items-center justify-center gap-4 group"
            >
               CHECK AVAILABILITY <ArrowRight className="h-6 w-6 text-primary group-hover:translate-x-2 transition-transform" />
            </Button>
         </div>
      </div>

      <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
         <DialogContent className="rounded-t-[3rem] p-0 overflow-hidden border-none shadow-2xl bg-white bottom-0 top-auto translate-y-0 focus:outline-none">
            <div className="bg-amber-400 h-[2px] w-full" />
            <div className="p-8 space-y-8">
               {showSuccess ? (
                 <div className="flex flex-col items-center text-center py-10 animate-in zoom-in duration-500">
                    <div className="h-24 w-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center text-white mb-6 shadow-xl shadow-green-100 border-4 border-white">
                       <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">BOOKING<br/><span className="text-green-600">CONFIRMED!</span></h2>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-4">Check status in My Bookings</p>
                 </div>
               ) : (
                 <>
                    <div className="flex flex-col items-center text-center space-y-2">
                       <div className="h-16 w-16 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-2 border border-amber-100"><Zap className="h-8 w-8" /></div>
                       <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Reserve Room</DialogTitle>
                       <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Confirm your dates to lock the price</p>
                    </div>

                    <div className="space-y-5">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Check-in Date</label>
                             <Input type="date" value={bookingForm.checkIn} onChange={e => setBookingForm({...bookingForm, checkIn: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Check-out Date</label>
                             <Input type="date" value={bookingForm.checkOut} onChange={e => setBookingForm({...bookingForm, checkOut: e.target.value})} className="h-14 rounded-2xl bg-gray-50 border-none font-bold" />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Total Guests</label>
                          <Select value={bookingForm.guests} onValueChange={(v) => setBookingForm({...bookingForm, guests: v})}>
                             <SelectTrigger className="h-14 rounded-2xl bg-gray-50 border-none font-bold"><SelectValue /></SelectTrigger>
                             <SelectContent className="rounded-2xl">
                                <SelectItem value="1">1 Person</SelectItem>
                                <SelectItem value="2">2 Persons</SelectItem>
                                <SelectItem value="3">3 Persons</SelectItem>
                                <SelectItem value="4">4 Persons</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-3">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
                          <span>Standard Room Rate</span>
                          <span className="text-gray-900">₹{hotel?.pricePerNight}</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-400">
                          <span>Nights</span>
                          <span className="text-gray-900">x {Math.ceil((new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) / (1000 * 60 * 60 * 24)) || 1}</span>
                       </div>
                       <div className="pt-3 border-t-2 border-dashed border-gray-200 flex justify-between items-center">
                          <span className="text-xs font-black uppercase italic">Payable Total</span>
                          <span className="text-2xl font-black italic text-primary">₹{(Math.ceil((new Date(bookingForm.checkOut).getTime() - new Date(bookingForm.checkIn).getTime()) / (1000 * 60 * 60 * 24)) || 1) * (hotel?.pricePerNight || 0)}</span>
                       </div>
                    </div>

                    <Button 
                      onClick={handleBooking} 
                      disabled={isProcessing}
                      className="w-full h-18 bg-black hover:bg-green-600 text-white rounded-[2rem] font-black uppercase italic text-lg shadow-xl"
                    >
                       {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : "CONFIRM BOOKING"}
                    </Button>
                 </>
               )}
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

export default function HotelDetailsPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
      <HotelDetailsInner />
    </Suspense>
  );
}
