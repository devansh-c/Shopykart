
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
  ArrowRight,
  Timer,
  Receipt,
  Navigation,
  X,
  Coins,
  Sparkles,
  Heart,
  ShieldCheck,
  Zap,
  MessageSquare,
  BellOff,
  Package,
  Bike,
  Phone
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, increment, query, where, addDoc, getCountFromServer, GeoPoint } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';

const GoogleMapPicker = dynamic(() => import('@/components/shared/GoogleMapPicker'), { 
  ssr: false,
  loading: () => <div className="h-full w-full flex flex-col items-center justify-center gap-4 bg-white">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
    <p className="text-[10px] font-black uppercase tracking-widest italic">Syncing Maps...</p>
  </div>
});

const FREE_DELIVERY_THRESHOLD = 400;
const TIP_OPTIONS = [10, 20, 30, 50];

const INSTRUCTIONS = [
  { id: 'no_bell', label: 'Avoid ringing bell', icon: BellOff },
  { id: 'leave_door', label: 'Leave at the door', icon: Package },
  { id: 'avoid_call', label: 'Avoid calling', icon: Phone },
];

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
  const [calculatedDeliveryTime, setCalculatedDeliveryTime] = useState<string>('10 MIN');
  
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState(''); 
  const [customerCity, setCustomerCity] = useState('');
  const [customerLocation, setCustomerLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // Tips & Instructions State
  const [deliveryTip, setDeliveryTip] = useState<number>(0);
  const [selectedInstructions, setSelectedInstructions] = useState<string[]>([]);
  const [cookingNote, setCookingNote] = useState('');

  // Coins State
  const [useCoins, setUseCoins] = useState(false);
  const [redeemedCoins, setRedeemedCoins] = useState(0);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'utr'>('selection');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile } = useDoc<any>(profileRef);

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: branding } = useDoc<any>(brandingRef);

  const coinRate = branding?.coinValue || 0.5;

  const chargesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'checkout_charges');
  }, [firestore]);
  const { data: dbCharges } = useCollection<any>(chargesQuery);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: allVendors } = useCollection<any>(vendorsQuery);

  useEffect(() => {
    if (typeof window === 'undefined' || !cart.length || !allVendors || !isMounted) return;
    const userLat = localStorage.getItem('user_lat');
    const userLng = localStorage.getItem('user_lng');
    if (!userLat || !userLng) return;

    const calculateCheckoutTime = () => {
      if (typeof google === 'undefined' || !google.maps) return;
      const service = new google.maps.DistanceMatrixService();
      const origin = new google.maps.LatLng(parseFloat(userLat), parseFloat(userLng));
      const uniqueVendorIds = Array.from(new Set(cart.map(item => item.vendorId).filter(Boolean)));
      const targetVendors = allVendors.filter(v => uniqueVendorIds.includes(v.id) && v.lat && v.lng);
      if (targetVendors.length === 0) return;

      service.getDistanceMatrix({
        origins: [origin],
        destinations: targetVendors.map(v => new google.maps.LatLng(v.lat, v.lng)),
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      }, (response, status) => {
        if (status === 'OK' && response && response.rows[0]) {
          let maxMinutes = 0;
          response.rows[0].elements.forEach((element) => {
            if (element.status === 'OK') {
              const travelMins = Math.ceil(element.duration.value / 60);
              const totalMins = travelMins + 12;
              if (totalMins > maxMinutes) maxMinutes = totalMins;
            }
          });
          if (maxMinutes > 0) setCalculatedDeliveryTime(`${maxMinutes} MIN`);
        }
      });
    };
    const timer = setTimeout(calculateCheckoutTime, 1000);
    return () => clearTimeout(timer);
  }, [cart, allVendors, isMounted]);

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
  
  const maxRedeemableCoins = useMemo(() => {
    if (!profile?.coins) return 0;
    const currentBalance = Number(profile.coins);
    const availableValue = currentBalance * coinRate;
    if (availableValue > totalPrice) return Math.floor(totalPrice / coinRate);
    return currentBalance;
  }, [profile, totalPrice, coinRate]);

  const coinDiscount = useMemo(() => {
    if (!useCoins) return 0;
    return Math.min(redeemedCoins, maxRedeemableCoins) * coinRate;
  }, [useCoins, redeemedCoins, maxRedeemableCoins, coinRate]);

  const grandTotal = Math.max(0, totalPrice + chargesTotalSum + deliveryTip - coinDiscount);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCustomerName(profile?.fullName || localStorage.getItem('user_name') || '');
    setCustomerPhone(profile?.phoneNumber || localStorage.getItem('user_phone') || '');
    setCustomerAddress(profile?.address || localStorage.getItem('user_address_line') || '');
    setCustomerCity(profile?.city || localStorage.getItem('user_city') || '');
  }, [profile]);

  const handleToggleInstruction = (id: string) => {
    setSelectedInstructions(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleConfirmMapLocation = (lat: number, lng: number, address?: string) => {
    localStorage.setItem('user_lat', lat.toString());
    localStorage.setItem('user_lng', lng.toString());
    if (address) localStorage.setItem('user_address_line', address);
    
    setCustomerLocation({ lat, lng });
    if (address) setCustomerAddress(address);
    setIsMapOpen(false);
    toast({ title: "Drop Spot Locked! 🏠" });
  };

  const handlePlaceOrder = async () => {
    if (!user) { window.dispatchEvent(new CustomEvent('open-auth-overlay')); return; }
    if (!firestore || !customerName || customerPhone.length < 10 || !customerAddress) {
      toast({ variant: "destructive", title: "Address Required" }); setIsEditingAddress(true); return;
    }
    const lat = localStorage.getItem('user_lat');
    const lng = localStorage.getItem('user_lng');
    if (!lat || !lng) {
      toast({ variant: "destructive", title: "Precise Drop Pin Required" });
      setIsMapOpen(true);
      return;
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
        customerLocation: new GeoPoint(parseFloat(lat), parseFloat(lng)),
        items: cart,
        total: grandTotal,
        coinDiscount: coinDiscount,
        deliveryTip: deliveryTip,
        instructions: selectedInstructions,
        cookingNote: cookingNote,
        coinsRedeemed: useCoins ? redeemedCoins : 0,
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
      const coinBalanceChange = (useCoins ? -redeemedCoins : 0) + 10;
      await setDoc(doc(firestore, 'users', user.uid), { coins: increment(coinBalanceChange) }, { merge: true });

      setShowSuccessOverlay(true);
      setTimeout(() => { clearCart(); router.replace(`/order/track/#${customerOrderNumber}`); }, 1500);
    } catch (e) { toast({ variant: "destructive", title: "Failed" }); }
    finally { setIsPlacing(false); }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F5F7F9] pb-44 transform-gpu">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />
      
      <div className="bg-white sticky top-0 z-50 px-4 py-3 flex items-center gap-4 border-b shadow-sm">
        <button onClick={() => router.back()} className="h-9 w-9 flex items-center justify-center rounded-xl bg-gray-50 border border-gray-100 active:scale-90 transition-transform"><ChevronLeft className="h-5 w-5 text-gray-800" /></button>
        <div>
          <h1 className="text-base font-black italic uppercase leading-none">Checkout Bag</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase mt-1 tracking-tight">{cart.length} Item{cart.length > 1 ? 's' : ''} in Bag</p>
        </div>
      </div>

      <div className="p-3 space-y-4 max-w-lg mx-auto animate-in fade-in duration-500">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4">
           <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <Timer className="h-6 w-6 animate-pulse" />
           </div>
           <div>
              <h3 className="text-sm font-black italic uppercase leading-none text-gray-900">{calculatedDeliveryTime} Delivery</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Real-time arrival from nearest hub</p>
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
              <ShoppingBasket className="h-4 w-4 text-gray-400" />
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Order Summary</span>
           </div>
           <div className="divide-y divide-gray-50">
              {cart.map((item, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                   <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black uppercase italic text-gray-800 leading-tight truncate">{item.name}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{item.restaurantName || 'Gourmet Selection'}</p>
                      <div className="flex items-center gap-3 mt-3">
                         <div className="flex items-center bg-gray-100 rounded-lg h-8 px-1">
                            <button onClick={() => removeFromCart(item.id)} className="h-6 w-6 flex items-center justify-center text-gray-600"><Minus className="h-3 w-3 stroke-[3]" /></button>
                            <span className="w-6 text-center text-xs font-black italic">{item.quantity}</span>
                            <button onClick={() => addToCart({...item, quantity: 1})} className="h-6 w-6 flex items-center justify-center text-gray-600"><Plus className="h-3 w-3 stroke-[3]" /></button>
                         </div>
                         <span className="text-sm font-black text-gray-900 italic">₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
           
           <div className="p-4 bg-muted/20 border-t">
              <div className="flex items-center gap-2 mb-2">
                 <MessageSquare className="h-3 w-3 text-gray-400" />
                 <span className="text-[9px] font-black uppercase text-gray-500">Cooking Instructions?</span>
              </div>
              <Input 
                value={cookingNote}
                onChange={e => setCookingNote(e.target.value)}
                placeholder="e.g. Less spicy, Extra ketchup..." 
                className="h-10 rounded-xl bg-white border-none font-bold text-xs"
              />
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="px-5 py-4 border-b bg-amber-50/30 flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary fill-primary/20" />
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Support Delivery Partner</span>
           </div>
           <div className="p-5 space-y-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">Your tip motivates them to deliver faster and safer. 100% of the tip goes to the rider.</p>
              <div className="flex flex-wrap gap-2">
                 {TIP_OPTIONS.map(val => (
                   <button 
                    key={val} 
                    onClick={() => setDeliveryTip(deliveryTip === val ? 0 : val)}
                    className={cn(
                      "h-10 px-4 rounded-xl border-2 flex items-center gap-1.5 transition-all active:scale-95",
                      deliveryTip === val ? "bg-primary/5 border-primary text-primary" : "bg-gray-50 border-transparent text-gray-500"
                    )}
                   >
                     <Plus className="h-3 w-3" />
                     <span className="text-xs font-black italic">₹{val}</span>
                   </button>
                 ))}
                 {deliveryTip > 0 && !TIP_OPTIONS.includes(deliveryTip) && (
                    <Badge className="bg-primary text-white h-10 px-4 rounded-xl font-black italic">₹{deliveryTip}</Badge>
                 )}
              </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="px-5 py-4 border-b bg-gray-50 flex items-center gap-2">
              <Bike className="h-4 w-4 text-gray-400" />
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Delivery Instructions</span>
           </div>
           <div className="p-4">
              <div className="flex overflow-x-auto space-x-3 no-scrollbar pb-1">
                 {INSTRUCTIONS.map(item => (
                   <button 
                    key={item.id}
                    onClick={() => handleToggleInstruction(item.id)}
                    className={cn(
                      "flex flex-col items-center justify-center min-w-[100px] h-20 rounded-2xl border-2 transition-all p-2 gap-1.5",
                      selectedInstructions.includes(item.id) ? "bg-primary/5 border-primary text-primary shadow-inner" : "bg-gray-50 border-transparent text-gray-400"
                    )}
                   >
                      <item.icon className="h-5 w-5" />
                      <span className="text-[8px] font-black uppercase text-center leading-tight">{item.label}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="px-5 py-4 border-b bg-amber-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <Coins className="h-4 w-4 text-amber-600" />
                 <span className="text-[10px] font-black uppercase text-amber-700 tracking-widest">ShopyKart Coins</span>
              </div>
              <Switch checked={useCoins} onCheckedChange={setUseCoins} className="data-[state=checked]:bg-amber-500 scale-90" />
           </div>
           <div className={cn("p-5 space-y-4 transition-all duration-300", !useCoins && "opacity-40 grayscale pointer-events-none")}>
              <div className="flex items-center justify-between">
                 <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Available: {profile?.coins || 0} Coins</p>
                    <span className="text-[9px] font-black text-amber-600 uppercase">Value: ₹{(Number(profile?.coins || 0) * coinRate).toFixed(0)}</span>
                 </div>
                 <button onClick={() => setRedeemedCoins(maxRedeemableCoins)} className="bg-amber-100 text-amber-700 text-[9px] font-black uppercase px-3 py-1.5 rounded-lg active:scale-95 transition-all">MAX REDEEM</button>
              </div>
              {useCoins && (
                <div className="flex items-center gap-2 animate-in slide-in-from-top-2">
                   <Input type="number" placeholder="Coins to use" value={redeemedCoins || ''} onChange={(e) => setRedeemedCoins(Math.min(Number(e.target.value), maxRedeemableCoins))} className="h-11 rounded-xl bg-gray-50 border-none font-black text-amber-700" />
                   <div className="bg-gray-100 h-11 px-4 rounded-xl flex items-center justify-center shrink-0"><span className="text-xs font-black italic text-gray-400">= ₹{(redeemedCoins * coinRate).toFixed(0)}</span></div>
                </div>
              )}
           </div>
        </div>

        <div className="bg-[#0B0B0B] p-5 rounded-2xl flex items-center gap-4 text-white shadow-xl">
           <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center text-primary shrink-0 border border-primary/20">
              <ShieldCheck className="h-6 w-6" />
           </div>
           <div className="space-y-0.5">
              <h4 className="text-[11px] font-black uppercase italic tracking-tighter">Safety Assurance</h4>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">Kitchen Sanitized • Temperature Checked riders • Sealed Packing</p>
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
           <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <MapPin className="h-4 w-4 text-gray-400" />
                 <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Delivery Identity</span>
              </div>
              <button onClick={() => setIsEditingAddress(!isEditingAddress)} className="text-[9px] font-black uppercase text-primary underline underline-offset-2">{isEditingAddress ? 'Save' : 'Change'}</button>
           </div>
           <div className="p-5 space-y-4">
              {!isEditingAddress ? (
                 <div className="space-y-1">
                    <p className="text-sm font-black uppercase italic text-gray-900 leading-none mb-1">{customerName || 'Set Name'}</p>
                    <p className="text-[11px] font-bold text-gray-500 uppercase leading-relaxed line-clamp-2">{customerAddress || 'Please pin your address.'}</p>
                    <div className="flex items-center gap-1 text-[10px] font-black text-gray-400 mt-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> Verified: {customerPhone}</div>
                 </div>
              ) : (
                 <div className="space-y-3">
                    <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="NAME" className="h-12 rounded-xl bg-gray-50 border-none font-bold text-xs" />
                    <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="PHONE" className="h-12 rounded-xl bg-gray-50 border-none font-bold text-xs" />
                    <Textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="FULL ADDRESS WITH LANDMARK" className="min-h-[80px] rounded-2xl bg-gray-50 border-none font-bold text-xs p-4" />
                 </div>
              )}
              <button onClick={() => setIsMapOpen(true)} className={cn("w-full h-12 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 transition-all", customerLocation || (isMounted && localStorage.getItem('user_lat')) ? "bg-green-50 border-green-200 text-green-700" : "bg-primary/5 border-primary/20 text-primary")}>
                <Navigation className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase italic tracking-widest">{customerLocation || (isMounted && localStorage.getItem('user_lat')) ? 'House Pinned' : 'Pin House on Map'}</span>
              </button>
           </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-8">
           <div className="px-5 py-4 border-b bg-gray-50 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-gray-400" />
              <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Bill Summary</span>
           </div>
           <div className="p-6 space-y-4">
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase"><span>Item Total</span><span className="text-gray-900">₹{totalPrice.toFixed(0)}</span></div>
              {dynamic_charges.map((charge, idx) => (
                <div key={idx} className="flex justify-between text-xs font-bold text-gray-500 uppercase"><span>{charge.name}</span>{Number(charge.calculatedAmount) === 0 ? <span className="text-green-600 italic">FREE</span> : <span className="text-gray-900">₹{charge.calculatedAmount?.toFixed(0)}</span>}</div>
              ))}
              {deliveryTip > 0 && (
                <div className="flex justify-between text-xs font-bold text-primary uppercase"><span>Rider Tip</span><span>₹{deliveryTip}</span></div>
              )}
              {useCoins && coinDiscount > 0 && (
                <div className="flex justify-between text-xs font-bold text-amber-600 uppercase italic"><span>Coin Discount</span><span>- ₹{coinDiscount.toFixed(0)}</span></div>
              )}
              <div className="pt-4 border-t border-dashed flex justify-between items-center">
                 <span className="text-sm font-black uppercase italic text-gray-900">Grand Total</span>
                 <span className="text-2xl font-black italic text-primary tracking-tighter">₹{grandTotal.toFixed(0)}</span>
              </div>
           </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t p-4 pb-8 flex items-center justify-center shadow-2xl">
         <div className="w-full max-w-lg flex items-center justify-between gap-6">
            <div className="flex flex-col">
               <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Payable Amount</span>
               <span className="text-3xl font-black italic text-gray-900 leading-none">₹{grandTotal.toFixed(0)}</span>
            </div>
            <button onClick={handlePlaceOrder} disabled={isPlacing} className="flex-[2] h-16 bg-black text-white rounded-2xl font-black uppercase italic text-lg shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
              {isPlacing ? <Loader2 className="h-6 w-6 animate-spin" /> : <>PLACE ORDER <ArrowRight className="h-6 w-6" /></>}
            </button>
         </div>
      </div>

      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="p-0 border-none max-w-2xl h-full sm:h-[85vh] focus:outline-none flex flex-col z-[20000] bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
           <DialogHeader className="sr-only"><DialogTitle>Pin Drop Spot</DialogTitle></DialogHeader>
           <div className="flex-1 min-h-0 relative"><GoogleMapPicker onConfirm={handleConfirmMapLocation} /></div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
         <DialogContent className="rounded-t-[2.5rem] sm:rounded-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
            <div className="bg-primary h-1.5 w-full" />
            <div className="p-10 space-y-8">
               {paymentStep === 'selection' ? (
                 <div className="space-y-8">
                    <div className="text-center space-y-2">
                       <h3 className="text-2xl font-black italic uppercase tracking-tighter">Fast Payment</h3>
                       <div className="text-5xl font-black italic text-gray-900">₹{grandTotal.toFixed(0)}</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2.5rem] border-2 border-dashed border-gray-200 flex flex-col items-center gap-4 shadow-inner">
                       <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${grandTotal.toFixed(2)}&cu=INR`)}`} className="h-56 w-56 grayscale contrast-125" alt="QR" />
                       <span className="text-[10px] font-black uppercase text-primary tracking-widest italic animate-pulse">Scan & Pay securely</span>
                    </div>
                    <Button onClick={() => { window.open(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${grandTotal.toFixed(2)}&cu=INR`); setPaymentStep('utr'); }} className="w-full h-18 bg-primary text-white rounded-3xl font-black italic uppercase text-lg shadow-xl shadow-primary/20">OPEN UPI APP</Button>
                    <button onClick={() => setPaymentStep('utr')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest underline underline-offset-4">Enter UTR Manually</button>
                 </div>
               ) : (
                 <div className="space-y-8">
                    <div className="text-center space-y-2">
                       <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto"><CheckCircle2 className="h-8 w-8" /></div>
                       <h3 className="text-2xl font-black italic uppercase tracking-tighter">Verify Payment</h3>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-black uppercase text-gray-400 ml-1">12-Digit UTR Number</label>
                       <Input placeholder="0 0 0 0 0 0 0 0 0 0 0 0" value={utrNumber} onChange={e => setUtrNumber(e.target.value.replace(/\D/g,'').slice(0,12))} className="h-16 rounded-2xl bg-gray-50 border-none font-black italic text-2xl text-center tracking-widest" />
                    </div>
                    <Button onClick={() => { if(utrNumber.length === 12) setIsPaymentDialogOpen(false); }} disabled={utrNumber.length !== 12} className="w-full h-18 bg-black text-white rounded-3xl font-black italic uppercase text-lg shadow-xl">CONFIRM & FINISH</Button>
                    <button onClick={() => setPaymentStep('selection')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest">Back to QR</button>
                 </div>
               )}
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

