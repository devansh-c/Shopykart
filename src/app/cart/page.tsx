
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
  ChevronRight, 
  CheckCircle2, 
  ShoppingBasket, 
  Coins, 
  Ticket, 
  X, 
  Hash,
  Package,
  MessageSquareQuote,
  ArrowRight,
  Bike,
  Sparkles,
  Camera,
  ImageIcon,
  XCircle,
  Undo2,
  IndianRupee,
  Percent,
  Truck,
  Crosshair
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, increment, query, where, getDocs, addDoc, getCountFromServer, GeoPoint } from 'firebase/firestore';
import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { compressImage } from '@/lib/image-utils';

const FREE_DELIVERY_THRESHOLD = 400;

function CartContent() {
  const { cart, addToCart, removeFromCart, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [verificationImage, setVerificationImage] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [useCoins, setUseCoins] = useState(false);
  const [premiumPackaging, setPremiumPackaging] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState(''); 
  const [customerCity, setCustomerCity] = useState('');
  const [customerLocation, setCustomerLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'utr'>('selection');

  const [sliderValue, setSliderValue] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: settings } = useDoc<any>(brandingRef);
  const coinValue = settings?.coinValue || 0.5;

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile, loading: profileLoading } = useDoc<any>(profileRef);
  const availableCoins = profile?.coins || 0;

  const isPremium = useMemo(() => {
    if (!profile?.isPremium || !profile?.premiumExpiry) return false;
    const expiry = new Date(profile.premiumExpiry).getTime();
    return expiry > Date.now();
  }, [profile]);

  const chargesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'checkout_charges');
  }, [firestore]);
  const { data: dbCharges, loading: chargesLoading } = useCollection<any>(chargesQuery, 'checkout_charges_v4');

  const isFreeDeliveryEligible = totalPrice >= FREE_DELIVERY_THRESHOLD;

  const dynamic_charges = useMemo(() => {
    if (!dbCharges || profileLoading || chargesLoading) return [];
    const activeZoneId = typeof window !== 'undefined' ? localStorage.getItem('active_zone_id') : null;
    
    return dbCharges.filter(charge => {
      if (!charge.zoneId || charge.zoneId === 'global') return true;
      return charge.zoneId === activeZoneId;
    }).map(charge => {
      let amount = 0;
      const chargeVal = Number(charge.value) || 0;
      const isWaivable = (charge.name || '').toLowerCase().includes('delivery') || (charge.name || '').toLowerCase().includes('handling');
      const shouldWaive = isPremium || (isWaivable && isFreeDeliveryEligible);

      if (shouldWaive) amount = 0;
      else {
        if (charge.type === 'fixed') amount = chargeVal;
        else if (charge.type === 'percentage') amount = (totalPrice * chargeVal) / 100;
      }
      return { ...charge, calculatedAmount: amount, isWaived: shouldWaive };
    });
  }, [dbCharges, totalPrice, isPremium, profileLoading, chargesLoading, isFreeDeliveryEligible]);

  const chargesTotalSum = useMemo(() => dynamic_charges.reduce((acc, curr) => acc + (Number(curr.calculatedAmount) || 0), 0), [dynamic_charges]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const val = Number(appliedCoupon.discountValue) || 0;
    return appliedCoupon.discountType === 'percentage' ? (totalPrice * val) / 100 : val;
  }, [appliedCoupon, totalPrice]);

  const coinDiscount = useMemo(() => {
    if (!useCoins || availableCoins <= 0 || coinValue <= 0) return 0;
    return Math.min(totalPrice - couponDiscount, availableCoins * coinValue);
  }, [useCoins, availableCoins, coinValue, totalPrice, couponDiscount]);

  const grandTotal = Math.max(0, totalPrice + chargesTotalSum + ((premiumPackaging && !isPremium) ? 10 : 0) - coinDiscount - couponDiscount);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCustomerName(profile?.fullName || localStorage.getItem('user_name') || '');
    setCustomerPhone(profile?.phoneNumber || localStorage.getItem('user_phone') || '');
    setCustomerAddress(profile?.address || localStorage.getItem('user_address_line') || '');
    setCustomerCity(profile?.city || localStorage.getItem('user_city') || '');
  }, [profile]);

  const handleFetchLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      toast({ variant: "destructive", title: "GPS Error", description: "Geolocation is not supported by your browser." });
      return;
    }

    setIsFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCustomerLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsFetchingLocation(false);
        toast({ title: "Exact Location Captured! 📍", description: "Rider will deliver right to your doorstep." });
      },
      (err) => {
        setIsFetchingLocation(false);
        toast({ variant: "destructive", title: "Accuracy Error", description: "Please enable GPS and give permission for exact delivery." });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  };

  const handlePlaceOrder = async () => {
    if (!user) { window.dispatchEvent(new CustomEvent('open-auth-overlay')); setSliderValue(0); return; }
    if (!firestore || !customerName || customerPhone.length < 10 || !customerAddress) {
      toast({ variant: "destructive", title: "Address Required" }); setIsEditingAddress(true); setSliderValue(0); return;
    }
    if (totalPrice < 40) { toast({ variant: "destructive", title: "Min. Order ₹40" }); setSliderValue(0); return; }
    if (paymentMethod === 'online' && !utrNumber) { setPaymentStep('selection'); setIsPaymentDialogOpen(true); setSliderValue(0); return; }

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
        paymentMethod,
        paymentStatus: paymentMethod === 'online' ? 'UTR_Pending_Verification' : 'Pending',
        utrNumber: paymentMethod === 'online' ? utrNumber : null,
        deliveryOTP: Math.floor(100000 + Math.random() * 900000).toString(),
        pickupOTP: Math.floor(1000 + Math.random() * 9000).toString(),
        customerOrderNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(firestore, 'orders'), orderData);
      if (useCoins && coinDiscount > 0) {
        await setDoc(doc(firestore, 'users', user.uid), { coins: increment(-Math.ceil(coinDiscount / coinValue)) }, { merge: true });
      }
      await setDoc(doc(firestore, 'users', user.uid), { coins: increment(10) }, { merge: true });

      setShowSuccessOverlay(true);
      setTimeout(() => { clearCart(); router.replace(`/order/track/#${customerOrderNumber}`); }, 1500);
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); setSliderValue(0); }
    finally { setIsPlacing(false); }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const val = Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100));
    setSliderValue(val);
  };
  
  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b shadow-sm">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100"><ChevronLeft className="h-6 w-6" /></button>
        <h1 className="text-lg font-bold italic uppercase">Secure Checkout</h1>
      </div>

      <div className="p-4 space-y-5 max-w-lg mx-auto pb-10">
        <div className="bg-gradient-to-b from-[#4A4232] to-[#2D281E] rounded-[2.5rem] p-6 shadow-2xl text-[#D9C4A9]">
           <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-400 p-2.5 rounded-xl text-black shadow-lg"><Crosshair className={cn("h-5 w-5", isFetchingLocation && "animate-spin")} /></div>
              <div className="flex-1">
                 <h3 className="text-sm font-black uppercase italic leading-none">Fetch Doorstep GPS</h3>
                 <p className="text-[9px] font-bold opacity-60 uppercase mt-1">Ensures 100% accurate delivery</p>
              </div>
              <Button onClick={handleFetchLocation} disabled={isFetchingLocation} className={cn("h-10 px-4 rounded-xl font-black uppercase text-[9px] shadow-lg", customerLocation ? "bg-green-600 text-white" : "bg-white text-black")}>
                 {customerLocation ? 'LOCATION SAVED ✅' : (isFetchingLocation ? 'FETCHING...' : 'GET LIVE GPS')}
              </Button>
           </div>
           
           <div className="space-y-6">
              {cart.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                   <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black uppercase italic truncate text-white">{item.name}</h4>
                      <div className="flex items-center bg-white/5 rounded-xl h-8 w-24 px-1 mt-2 border border-white/5">
                        <button onClick={() => removeFromCart(item.id)} className="flex-1 flex items-center justify-center text-amber-400"><Minus className="h-3 w-3 stroke-[3]" /></button>
                        <span className="w-8 text-center text-[10px] font-black text-white">{item.quantity}</span>
                        <button onClick={() => addToCart({...item, quantity: 1})} className="flex-1 flex items-center justify-center text-amber-400"><Plus className="h-3 w-3 stroke-[3]" /></button>
                      </div>
                   </div>
                   <div className="text-right shrink-0"><span className="text-sm font-black text-white italic">₹{(item.price * item.quantity).toFixed(0)}</span></div>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-gradient-to-r from-[#4A4232] to-[#2D281E] rounded-2xl p-4 shadow-xl flex items-center justify-between border border-white/5">
           <div className="flex items-center gap-3 min-w-0">
              <div className="bg-amber-400 p-2 rounded-xl text-black shrink-0"><MapPin className="h-5 w-5 fill-current" /></div>
              {!isEditingAddress ? (
                <div className="min-w-0"><p className="text-[11px] font-black text-[#D9C4A9] leading-tight truncate">Delivery to: {customerName || 'Set Recipient'}</p><p className="text-[10px] font-bold text-[#D9C4A9]/70 truncate uppercase tracking-tighter">{customerAddress || 'Enter Full Address'}</p></div>
              ) : (
                <div className="flex-1 space-y-2 py-2">
                   <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Recipient Name" className="h-9 bg-white/5 border-white/10 text-white text-xs font-bold" />
                   <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="10 Digit Phone" className="h-9 bg-white/5 border-white/10 text-white text-xs font-bold" />
                   <Textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Full Address" className="min-h-[60px] bg-white/5 border-white/10 text-white text-xs font-bold" />
                </div>
              )}
           </div>
           <button onClick={() => isEditingAddress ? setIsEditingAddress(false) : setIsEditingAddress(true)} className="bg-amber-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase shadow-lg ml-3">{isEditingAddress ? 'Save' : 'Edit'}</button>
        </div>

        <div className="bg-gradient-to-b from-[#4A4232] to-[#2D281E] rounded-[2rem] p-8 shadow-2xl border border-white/5 text-[#D9C4A9]">
           <h2 className="text-xl font-black italic uppercase mb-6">Bill Summary</h2>
           <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center group"><span className="text-sm font-bold uppercase italic">Items Total:</span><span className="font-black italic text-white">₹{totalPrice.toFixed(0)}</span></div>
              <div className="flex justify-between items-center group"><span className="text-sm font-bold uppercase italic">Charges:</span><span className="font-black italic text-white">₹{chargesTotalSum.toFixed(0)}</span></div>
              {coinDiscount > 0 && <div className="flex justify-between items-center group text-amber-400"><span className="text-sm font-bold uppercase italic">Coins Discount:</span><span className="font-black italic">- ₹{coinDiscount.toFixed(0)}</span></div>}
           </div>
           <div className="pt-2 flex justify-between items-center border-t border-[#D9C4A9]/10"><span className="text-lg font-black italic uppercase">Grand Total:</span><span className="text-3xl font-black text-amber-400 italic">₹{grandTotal.toFixed(0)}</span></div>
        </div>

        <div className="pt-6 flex justify-center">
           <div className="max-w-md w-full">
              <div ref={sliderRef} className="relative w-full h-20 bg-[#2D281E] rounded-[2.5rem] overflow-hidden flex items-center p-2 shadow-2xl border border-white/5" onTouchStart={() => isDragging.current = true} onTouchMove={handleTouchMove} onTouchEnd={() => { isDragging.current = false; if (sliderValue >= 90) { setSliderValue(100); handlePlaceOrder(); } else setSliderValue(0); }}>
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className={cn("text-[10px] font-black uppercase tracking-[0.4em] transition-opacity", sliderValue > 15 ? "opacity-0" : "opacity-30 animate-pulse text-amber-100")}>{totalPrice < 40 ? 'Min. Order ₹40' : 'Slide to Order'}</span>
                 </div>
                 <div className="absolute left-0 top-0 bottom-0 bg-primary transition-[width]" style={{ width: `${sliderValue}%` }} />
                 <div className="relative z-10 h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-2xl" style={{ transform: `translateX(${sliderValue * 0.01 * ((sliderRef.current?.clientWidth || 0) - 80)}px)` }}>
                    {isPlacing ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : (sliderValue > 90 ? <CheckCircle2 className="h-8 w-8 text-green-500" /> : <ArrowRight className="h-7 w-7 text-primary stroke-[3]" />)}
                 </div>
                 <div className="absolute right-6 pointer-events-none z-10 flex items-center gap-3"><span className="text-xl font-black italic text-amber-100">₹{grandTotal.toFixed(0)}</span><ChevronRight className="h-4 w-4 text-white/50" /></div>
              </div>
           </div>
        </div>
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
         <DialogContent className="rounded-t-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl focus:outline-none">
            <DialogHeader className="p-8 pb-4"><DialogTitle className="font-black italic uppercase text-center text-xl">Online Payment</DialogTitle></DialogHeader>
            <div className="p-8 space-y-6">
               {paymentStep === 'selection' ? (
                 <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-[2rem] text-center"><span className="text-[10px] font-black text-gray-400 uppercase">Amount</span><div className="text-4xl font-black italic">₹{grandTotal.toFixed(0)}</div></div>
                    <div className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center gap-4"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${grandTotal.toFixed(2)}&cu=INR`)}`} className="h-44 w-44" alt="QR" /><p className="text-[10px] font-black uppercase text-primary italic">Scan with PhonePe / GPay</p></div>
                    <Button onClick={() => { window.open(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${grandTotal.toFixed(2)}&cu=INR`); setPaymentStep('utr'); }} className="w-full h-16 bg-primary text-white rounded-3xl font-black italic uppercase">OPEN UPI APP</Button>
                    <button onClick={() => setPaymentStep('utr')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest underline">Already Paid? Enter UTR</button>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="text-center space-y-1"><Hash className="h-16 w-16 text-green-600 mx-auto" /><h3 className="text-lg font-black italic uppercase">Confirm UTR</h3></div>
                    <Input placeholder="12 DIGIT UTR NO." value={utrNumber} onChange={e => setUtrNumber(e.target.value.replace(/\D/g,'').slice(0,12))} className="h-16 rounded-2xl bg-gray-50 border-none font-black italic text-2xl text-center" />
                    <Button onClick={() => { if(utrNumber.length === 12) setIsPaymentDialogOpen(false); }} disabled={utrNumber.length !== 12} className="w-full h-16 bg-black text-white rounded-3xl font-black italic uppercase">DONE</Button>
                 </div>
               )}
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

export default function CartPage() { return <Suspense fallback={null}><CartContent /></Suspense>; }
