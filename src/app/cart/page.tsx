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
  Crosshair
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

function CartContent() {
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-muted h-32 w-32 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="h-16 w-16 text-muted-foreground/30" />
        </div>
        <h2 className="text-2xl font-black italic uppercase">Empty Bag</h2>
        <Button onClick={() => router.push('/')} className="mt-8 bg-black rounded-xl">Back to Explore</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-32">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100"><ChevronLeft className="h-6 w-6" /></button>
        <h1 className="text-lg font-bold italic uppercase">Checkout</h1>
      </div>

      <div className="p-4 space-y-5 max-w-lg mx-auto">
        {/* GPS Capture */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-2.5 rounded-xl text-primary"><Crosshair className={cn("h-5 w-5", isFetchingLocation && "animate-spin")} /></div>
              <div><h3 className="text-sm font-black uppercase italic leading-none">Doorstep GPS</h3><p className="text-[9px] font-bold opacity-60 uppercase mt-1">Required for accurate delivery</p></div>
           </div>
           <Button onClick={handleFetchLocation} disabled={isFetchingLocation} className={cn("rounded-xl h-10 px-4 font-black uppercase text-[9px]", customerLocation ? "bg-green-600" : "bg-black")}>
              {customerLocation ? 'LOCATION LOCKED ✅' : 'GET GPS'}
           </Button>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border space-y-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /><h3 className="text-sm font-black uppercase italic">Address</h3></div>
              <button onClick={() => setIsEditingAddress(!isEditingAddress)} className="text-primary text-[10px] font-black uppercase underline">{isEditingAddress ? 'Save' : 'Edit'}</button>
           </div>
           {!isEditingAddress ? (
              <div className="space-y-1"><p className="text-xs font-black uppercase">{customerName}</p><p className="text-[10px] font-bold text-muted-foreground uppercase">{customerAddress}</p><p className="text-[10px] font-bold text-muted-foreground">{customerPhone}</p></div>
           ) : (
              <div className="space-y-3">
                 <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="NAME" className="h-11 rounded-xl bg-muted/20 border-none font-bold text-xs" />
                 <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="PHONE" className="h-11 rounded-xl bg-muted/20 border-none font-bold text-xs" />
                 <Textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="FULL ADDRESS" className="min-h-[80px] rounded-xl bg-muted/20 border-none font-bold text-xs" />
              </div>
           )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border space-y-6">
           {cart.map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                 <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-muted"><Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized /></div>
                 <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black uppercase italic truncate">{item.name}</h4>
                    <div className="flex items-center gap-3 mt-1.5">
                       <button onClick={() => removeFromCart(item.id)} className="h-6 w-6 rounded-lg border flex items-center justify-center text-primary"><Minus className="h-3 w-3 stroke-[3]" /></button>
                       <span className="text-[10px] font-black">{item.quantity}</span>
                       <button onClick={() => addToCart({...item, quantity: 1})} className="h-6 w-6 rounded-lg border flex items-center justify-center text-primary"><Plus className="h-3 w-3 stroke-[3]" /></button>
                    </div>
                 </div>
                 <span className="text-xs font-black italic">₹{(item.price * item.quantity).toFixed(0)}</span>
              </div>
           ))}
        </div>

        {/* Bill */}
        <div className="bg-[#0B0B0B] rounded-[2.5rem] p-8 text-white shadow-2xl">
           <h2 className="text-xl font-black italic uppercase mb-6 tracking-tighter">Bill Summary</h2>
           <div className="space-y-4 mb-8 opacity-70">
              <div className="flex justify-between text-[11px] font-bold uppercase"><span>Subtotal:</span><span>₹{totalPrice.toFixed(0)}</span></div>
              <div className="flex justify-between text-[11px] font-bold uppercase"><span>Charges:</span><span>₹{chargesTotalSum.toFixed(0)}</span></div>
           </div>
           <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-lg font-black italic uppercase">Total:</span>
              <span className="text-3xl font-black text-primary italic">₹{grandTotal.toFixed(0)}</span>
           </div>
           <Button onClick={handlePlaceOrder} disabled={isPlacing} className="w-full h-16 bg-primary text-white rounded-2xl font-black uppercase italic text-lg shadow-xl shadow-primary/20 mt-8">
              {isPlacing ? <Loader2 className="h-6 w-6 animate-spin" /> : 'PLACE ORDER NOW'}
           </Button>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
         <DialogContent className="rounded-t-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none">
            <DialogHeader className="p-8 pb-4"><DialogTitle className="font-black italic uppercase text-center text-xl">Payment Required</DialogTitle></DialogHeader>
            <div className="p-8 space-y-6">
               {paymentStep === 'selection' ? (
                 <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-[2rem] text-center"><span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Payable Amount</span><div className="text-4xl font-black italic">₹{grandTotal.toFixed(0)}</div></div>
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

export default function CartPage() { return <CartContent />; }
