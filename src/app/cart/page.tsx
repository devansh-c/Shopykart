'use client';

import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/button';
import { 
  Minus, 
  Plus, 
  ChevronLeft, 
  ShoppingBag, 
  Loader2, 
  MapPin, 
  CheckCircle2, 
  ShoppingBasket, 
  Hash,
  ArrowRight,
  Crosshair,
  Timer,
  Receipt,
  CreditCard,
  Banknote,
  Navigation
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, increment, query, where, addDoc, getCountFromServer, GeoPoint } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';

const FREE_DELIVERY_THRESHOLD = 400;

export default function CartPage() {
  const { cart, addToCart, removeFromCart, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState(''); 
  const [customerCity, setCustomerCity] = useState('');
  const [customerLocation, setCustomerLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'utr'>('selection');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile } = useDoc<any>(profileRef);

  const chargesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'checkout_charges');
  }, [firestore]);
  const { data: dbCharges } = useCollection<any>(chargesQuery);

  const isFreeDeliveryEligible = totalPrice >= FREE_DELIVERY_THRESHOLD;

  const dynamic_charges = useMemo(() => {
    if (!dbCharges) return [];
    const activeZoneId = typeof window !== 'undefined' ? localStorage.getItem('active_zone_id') : null;
    
    return dbCharges.filter(charge => {
      if (!charge.zoneId || charge.zoneId === 'global') return true;
      return charge.zoneId === activeZoneId;
    }).map(charge => {
      let amount = 0;
      const chargeVal = Number(charge.value) || 0;
      const isWaivable = (charge.name || '').toLowerCase().includes('delivery') || (charge.name || '').toLowerCase().includes('handling');
      const shouldWaive = isWaivable && isFreeDeliveryEligible;

      if (shouldWaive) amount = 0;
      else {
        if (charge.type === 'fixed') amount = chargeVal;
        else if (charge.type === 'percentage') amount = (totalPrice * chargeVal) / 100;
      }
      return { ...charge, calculatedAmount: amount };
    });
  }, [dbCharges, totalPrice, isFreeDeliveryEligible]);

  const chargesTotalSum = useMemo(() => dynamic_charges.reduce((acc, curr) => acc + (Number(curr.calculatedAmount) || 0), 0), [dynamic_charges]);
  const grandTotal = Math.max(0, totalPrice + chargesTotalSum);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCustomerName(profile?.fullName || localStorage.getItem('user_name') || '');
    setCustomerPhone(profile?.phoneNumber || localStorage.getItem('user_phone') || '');
    setCustomerAddress(profile?.address || localStorage.getItem('user_address_line') || '');
    setCustomerCity(profile?.city || localStorage.getItem('user_city') || '');
  }, [profile]);

  const handleFetchLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast({ variant: "destructive", title: "GPS Error" });
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsFetchingLocation(false);
        toast({ title: "Exact Location Locked! 📍" });
      },
      () => {
        setIsFetchingLocation(false);
        toast({ variant: "destructive", title: "Accuracy Error", description: "Allow GPS for doorstep delivery." });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  const handlePlaceOrder = async () => {
    if (!user) { window.dispatchEvent(new CustomEvent('open-auth-overlay')); return; }
    if (!firestore || !customerName || customerPhone.length < 10 || !customerAddress) {
      toast({ variant: "destructive", title: "Address Required" }); setIsEditingAddress(true); return;
    }
    if (totalPrice < 40) { toast({ variant: "destructive", title: "Min. Order ₹40" }); return; }
    if (!utrNumber) { setPaymentStep('selection'); setIsPaymentDialogOpen(true); return; }

    setIsPlacing(true);
    try {
      const q = query(collection(firestore, 'orders'), where('userId', '==', user.uid));
      const countSnap = await getCountFromServer(q);
      const customerOrderNumber = countSnap.data().count + 1;

      const orderData = {
        userId: user.uid,
        customerName: customerName.toUpperCase(),
        customerPhone,
        address: customerAddress.toUpperCase(),
        city: customerCity.toUpperCase(),
        location: customerLocation ? new GeoPoint(customerLocation.lat, customerLocation.lng) : null,
        items: cart,
        total: grandTotal,
        status: 'Placed',
        paymentMethod: 'online',
        paymentStatus: 'UTR_Pending_Verification',
        utrNumber: utrNumber,
        deliveryOTP: Math.floor(100000 + Math.random() * 900000).toString(),
        pickupOTP: Math.floor(1000 + Math.random() * 9000).toString(),
        customerOrderNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'orders'), orderData);
      await setDoc(doc(firestore, 'users', user.uid), { coins: increment(10) }, { merge: true });

      setShowSuccessOverlay(true);
      setTimeout(() => { clearCart(); router.replace(`/order/track/#${customerOrderNumber}`); }, 1500);
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); }
    finally { setIsPlacing(false); }
  };

  if (!isMounted) return null;

  if (cart.length === 0 && !showSuccessOverlay) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="bg-gray-50 h-32 w-32 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-gray-200">
          <ShoppingBag className="h-14 w-14 text-gray-300" />
        </div>
        <h2 className="text-2xl font-black italic uppercase text-gray-800">Your bag is empty</h2>
        <p className="text-xs font-bold text-gray-400 uppercase mt-2">Add some items from the menu to start checkout.</p>
        <Button onClick={() => router.push('/')} className="mt-8 bg-black text-white rounded-xl h-12 px-8 font-black uppercase italic shadow-xl">Back to Explore</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7F9] pb-44 transform-gpu">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />
      
      {/* Sticky Header */}
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b shadow-sm">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 active:scale-90 transition-transform"><ChevronLeft className="h-6 w-6 text-gray-800" /></button>
        <div>
          <h1 className="text-base font-black italic uppercase leading-none">Checkout</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{cart.length} Item{cart.length > 1 ? 's' : ''} in Bag</p>
        </div>
      </div>

      <div className="p-3 space-y-4 max-w-lg mx-auto">
        
        {/* Delivery Timing Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
              <Timer className="h-6 w-6" />
           </div>
           <div>
              <h3 className="text-sm font-black italic uppercase leading-none">10 Mins Delivery</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">From your nearest ShopyKart hub</p>
           </div>
        </div>

        {/* Items Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
              <ShoppingBasket className="h-4 w-4 text-gray-400" />
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Selected Items</span>
           </div>
           <div className="divide-y divide-gray-50">
              {cart.map((item, i) => (
                <div key={i} className="p-4 flex items-center gap-4 group">
                   <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black uppercase italic text-gray-800 leading-tight line-clamp-1">{item.name}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{item.restaurantName || 'Gourmet Selection'}</p>
                      <div className="flex items-center gap-3 mt-3">
                         <div className="flex items-center bg-gray-100 rounded-lg h-8 px-1">
                            <button onClick={() => removeFromCart(item.id)} className="h-6 w-6 flex items-center justify-center text-gray-600 hover:text-primary"><Minus className="h-3 w-3 stroke-[3]" /></button>
                            <span className="w-6 text-center text-xs font-black italic">{item.quantity}</span>
                            <button onClick={() => addToCart({...item, quantity: 1})} className="h-6 w-6 flex items-center justify-center text-gray-600 hover:text-primary"><Plus className="h-3 w-3 stroke-[3]" /></button>
                         </div>
                         <span className="text-sm font-black text-gray-900 italic">₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Address & GPS Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <MapPin className="h-4 w-4 text-gray-400" />
                 <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Delivery Address</span>
              </div>
              <button onClick={() => setIsEditingAddress(!isEditingAddress)} className="text-[9px] font-black uppercase text-primary underline underline-offset-2">{isEditingAddress ? 'Save' : 'Change'}</button>
           </div>
           
           <div className="p-4 space-y-4">
              {!isEditingAddress ? (
                 <div className="space-y-1">
                    <p className="text-sm font-black uppercase italic text-gray-900 leading-none mb-1">{customerName || 'Add Name'}</p>
                    <p className="text-[11px] font-bold text-gray-500 uppercase leading-relaxed">{customerAddress || 'Please update your delivery address.'}</p>
                    <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 mt-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> Verified: {customerPhone}</div>
                 </div>
              ) : (
                 <div className="space-y-3">
                    <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="CUSTOMER NAME" className="h-12 rounded-xl bg-gray-50 border-none font-bold text-xs uppercase" />
                    <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="PHONE NUMBER" className="h-12 rounded-xl bg-gray-50 border-none font-bold text-xs" />
                    <Textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="HOUSE NO, STREET, LANDMARK" className="min-h-[100px] rounded-2xl bg-gray-50 border-none font-bold text-xs uppercase p-4" />
                 </div>
              )}

              <div className={cn("p-4 rounded-xl border-2 border-dashed flex items-center justify-between transition-all", customerLocation ? "bg-green-50 border-green-200" : "bg-primary/5 border-primary/20")}>
                 <div className="flex items-center gap-3">
                    <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shadow-sm", customerLocation ? "bg-green-500 text-white" : "bg-primary text-white")}>
                       <Crosshair className={cn("h-5 w-5", isFetchingLocation && "animate-spin")} />
                    </div>
                    <div className="text-left">
                       <span className="text-[9px] font-black uppercase block leading-none mb-1 text-gray-400">Doorstep GPS</span>
                       <p className="text-[11px] font-black italic uppercase leading-none">{customerLocation ? 'Exact Spot Locked' : 'Highly Recommended'}</p>
                    </div>
                 </div>
                 <button 
                  onClick={handleFetchLocation} 
                  disabled={isFetchingLocation}
                  className="bg-white border border-gray-200 h-9 px-4 rounded-lg font-black text-[9px] uppercase shadow-sm active:scale-95 transition-all"
                 >
                   {customerLocation ? 'UPDATE' : 'CAPTURE'}
                 </button>
              </div>
           </div>
        </div>

        {/* Bill Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
           <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-gray-400" />
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Bill Summary</span>
           </div>
           <div className="p-5 space-y-4">
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                 <span>Item Total</span>
                 <span className="text-gray-900">₹{totalPrice.toFixed(0)}</span>
              </div>
              
              {dynamic_charges.map((charge, idx) => (
                <div key={idx} className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                   <span>{charge.name}</span>
                   {Number(charge.calculatedAmount) === 0 ? (
                     <span className="text-green-600 italic">FREE</span>
                   ) : (
                     <span className="text-gray-900">₹{charge.calculatedAmount?.toFixed(0)}</span>
                   )}
                </div>
              ))}

              <div className="pt-4 border-t border-dashed flex justify-between items-center">
                 <span className="text-sm font-black uppercase italic text-gray-900">Grand Total</span>
                 <span className="text-xl font-black italic text-primary tracking-tighter">₹{grandTotal.toFixed(0)}</span>
              </div>
           </div>
           <div className="bg-blue-50 px-4 py-3 border-t border-blue-100 flex items-center gap-3">
              <div className="h-6 w-6 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600"><CheckCircle2 className="h-3.5 w-3.5" /></div>
              <p className="text-[9px] font-black text-blue-800 uppercase tracking-tight">You will earn 10 coins on this order!</p>
           </div>
        </div>

      </div>

      {/* Sticky Bottom Payment Bar (Blinkit Style) */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t p-4 pb-8 flex items-center justify-center shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
         <div className="w-full max-w-lg flex items-center justify-between gap-4">
            <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest leading-none mb-1">Final Amount</span>
               <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black italic text-gray-900 leading-none">₹{grandTotal.toFixed(0)}</span>
                  <button onClick={() => document.querySelector('.divide-y')?.scrollIntoView({ behavior: 'smooth' })} className="text-[8px] font-black text-primary uppercase underline underline-offset-2">VIEW BILL</button>
               </div>
            </div>
            <Button 
              onClick={handlePlaceOrder} 
              disabled={isPlacing}
              className="flex-[2] h-14 bg-black hover:bg-gray-900 text-white rounded-2xl font-black uppercase italic text-base tracking-tighter shadow-xl shadow-black/10 active:scale-95 transition-all group"
            >
              {isPlacing ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  PLACE ORDER
                  <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
         </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
         <DialogContent className="rounded-t-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none bottom-0 top-auto translate-y-0">
            <div className="bg-primary h-2 w-full" />
            <DialogHeader className="p-8 pb-4"><DialogTitle className="font-black italic uppercase text-center text-xl tracking-tighter">Secure Payment</DialogTitle></DialogHeader>
            <div className="p-8 space-y-6 pt-0">
               {paymentStep === 'selection' ? (
                 <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-[2rem] text-center border border-gray-100"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payable to ShopyKart</span><div className="text-4xl font-black italic text-gray-900">₹{grandTotal.toFixed(0)}</div></div>
                    <div className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center gap-4 relative overflow-hidden group">
                       <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${grandTotal.toFixed(2)}&cu=INR`)}`} className="h-44 w-44 grayscale opacity-80 group-hover:opacity-100 transition-opacity" alt="QR" /><p className="text-[10px] font-black uppercase text-primary italic tracking-widest">Scan with GPay / PhonePe</p>
                    </div>
                    <Button onClick={() => { window.open(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${grandTotal.toFixed(2)}&cu=INR`); setPaymentStep('utr'); }} className="w-full h-16 bg-primary text-white rounded-3xl font-black italic uppercase text-lg shadow-xl shadow-primary/20">OPEN UPI APP</Button>
                    <button onClick={() => setPaymentStep('utr')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest underline underline-offset-4">Already Paid? Enter UTR</button>
                 </div>
               ) : (
                 <div className="space-y-8 py-4">
                    <div className="text-center space-y-2">
                       <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto border border-green-100"><CheckCircle2 className="h-8 w-8" /></div>
                       <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">Confirm Payment</h3>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-gray-400 ml-1 tracking-widest">12-Digit UTR Number</label>
                       <Input placeholder="0 0 0 0 0 0 0 0 0 0 0 0" value={utrNumber} onChange={e => setUtrNumber(e.target.value.replace(/\D/g,'').slice(0,12))} className="h-16 rounded-2xl bg-gray-50 border-none font-black italic text-2xl text-center tracking-[0.2em] text-primary" />
                    </div>
                    <Button onClick={() => { if(utrNumber.length === 12) setIsPaymentDialogOpen(false); }} disabled={utrNumber.length !== 12} className="w-full h-16 bg-black text-white rounded-3xl font-black italic uppercase text-lg shadow-xl">AUTHENTICATE & DONE</Button>
                    <button onClick={() => setPaymentStep('selection')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest">← Back to QR</button>
                 </div>
               )}
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}