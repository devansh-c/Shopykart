
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
  Phone,
  ArrowUpRight,
  Info
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
      
      {/* PREMIUM STRETCHED HEADER */}
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center justify-between border-b shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 active:scale-90 transition-transform shadow-inner"><ChevronLeft className="h-6 w-6 text-gray-800" /></button>
          <div>
            <h1 className="text-lg font-black italic uppercase leading-none tracking-tighter text-gray-900">Checkout Bag</h1>
            <p className="text-[10px] font-black text-primary uppercase mt-1 tracking-widest">{cart.length} Gourmet Selection{cart.length > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/5">
           <ShoppingBag className="h-5 w-5" />
        </div>
      </div>

      <div className="p-3 space-y-4 max-w-lg mx-auto animate-in fade-in duration-500">
        
        {/* ESTIMATED ARRIVAL WITH PREMIUM BLUE GRADIENT */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-5 shadow-2xl shadow-blue-200 flex items-center gap-4 relative overflow-hidden group">
           <div className="absolute top-0 right-0 h-full w-24 bg-white/10 -skew-x-12 translate-x-10 group-hover:translate-x-5 transition-transform duration-700" />
           <div className="h-14 w-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-white shrink-0 border border-white/20 shadow-inner">
              <Timer className="h-8 w-8 animate-pulse" />
           </div>
           <div>
              <h3 className="text-base font-black italic uppercase leading-none text-white tracking-tighter">{calculatedDeliveryTime} GOURMET DELIVERY</h3>
              <p className="text-[10px] font-bold text-white/70 uppercase mt-1.5 tracking-widest">REAL-TIME TRAFFIC OPTIMIZED</p>
           </div>
        </div>

        {/* ORDER SUMMARY */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
           <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBasket className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Your Selection</span>
              </div>
              <Badge variant="outline" className="rounded-full border-green-200 text-green-600 bg-green-50 font-black text-[8px] uppercase">100% Fresh</Badge>
           </div>
           <div className="divide-y divide-gray-50">
              {cart.map((item, i) => (
                <div key={i} className="p-5 flex items-center gap-5">
                   <div className="relative h-20 w-20 rounded-3xl overflow-hidden bg-muted border border-gray-100 shrink-0 shadow-sm">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="text-base font-black uppercase italic text-gray-900 leading-tight truncate">{item.name}</h4>
                        {item.isVeg && <div className="h-3 w-3 border border-green-600 rounded-sm flex items-center justify-center p-0.5 mt-0.5"><div className="h-full w-full bg-green-600 rounded-full" /></div>}
                      </div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-tight italic">by {item.restaurantName || 'Gourmet Kitchen'}</p>
                      <div className="flex items-center justify-between mt-4">
                         <div className="flex items-center bg-gray-100 rounded-xl h-9 px-1.5 shadow-inner">
                            <button onClick={() => removeFromCart(item.id)} className="h-7 w-7 flex items-center justify-center text-gray-500 hover:text-primary transition-colors"><Minus className="h-3.5 w-3.5 stroke-[3]" /></button>
                            <span className="w-8 text-center text-xs font-black italic text-gray-900">{item.quantity}</span>
                            <button onClick={() => addToCart({...item, quantity: 1})} className="h-7 w-7 flex items-center justify-center text-gray-500 hover:text-primary transition-colors"><Plus className="h-3.5 w-3.5 stroke-[3]" /></button>
                         </div>
                         <span className="text-base font-black text-gray-900 italic tracking-tighter">₹{(item.price * item.quantity).toFixed(0)}</span>
                      </div>
                   </div>
                </div>
              ))}
           </div>
           
           <div className="p-5 bg-muted/20 border-t border-dashed">
              <div className="flex items-center gap-2 mb-3">
                 <MessageSquare className="h-3.5 w-3.5 text-gray-400" />
                 <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Kitchen Note?</span>
              </div>
              <Input 
                value={cookingNote}
                onChange={e => setCookingNote(e.target.value)}
                placeholder="E.g. Extra spicy, less salt, no onion..." 
                className="h-12 rounded-2xl bg-white border-none font-bold text-xs shadow-sm"
              />
           </div>
        </div>

        {/* DELIVERY TIP - ZOMATO STYLE PREMIUM COLORS */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
           <div className="px-6 py-5 border-b bg-amber-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="h-8 w-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <Heart className="h-4.5 w-4.5 text-red-500 fill-red-500" />
                 </div>
                 <span className="text-[11px] font-black uppercase text-amber-800 tracking-widest italic">Rider Support</span>
              </div>
              <span className="text-[9px] font-black text-amber-600 bg-white px-3 py-1 rounded-full border border-amber-100 shadow-sm">100% Goes to Partner</span>
           </div>
           <div className="p-6 space-y-5">
              <p className="text-[11px] font-bold text-gray-500 uppercase leading-relaxed text-center italic">Small appreciation for your safety hero.</p>
              <div className="flex justify-between gap-3">
                 {TIP_OPTIONS.map(val => (
                   <button 
                    key={val} 
                    onClick={() => setDeliveryTip(deliveryTip === val ? 0 : val)}
                    className={cn(
                      "flex-1 h-14 rounded-2xl border-2 flex flex-col items-center justify-center transition-all active:scale-95",
                      deliveryTip === val ? "bg-red-50 border-red-500 text-red-600 shadow-lg shadow-red-100" : "bg-gray-50 border-transparent text-gray-400"
                    )}
                   >
                     <span className="text-base font-black italic tracking-tighter">₹{val}</span>
                     {deliveryTip === val && <span className="text-[7px] font-black uppercase mt-0.5 animate-pulse">LOCKED</span>}
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {/* DELIVERY INSTRUCTIONS */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
           <div className="px-6 py-5 border-b bg-gray-50/50 flex items-center gap-2">
              <Bike className="h-4.5 w-4.5 text-primary" />
              <span className="text-[11px] font-black uppercase text-gray-500 tracking-widest italic">Delivery Preferences</span>
           </div>
           <div className="p-5">
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                 {INSTRUCTIONS.map(item => (
                   <button 
                    key={item.id}
                    onClick={() => handleToggleInstruction(item.id)}
                    className={cn(
                      "flex flex-col items-center justify-center min-w-[110px] h-24 rounded-[2rem] border-2 transition-all p-3 gap-2",
                      selectedInstructions.includes(item.id) ? "bg-primary/5 border-primary text-primary shadow-xl shadow-primary/5" : "bg-gray-50 border-transparent text-gray-400"
                    )}
                   >
                      <item.icon className="h-6 w-6" />
                      <span className="text-[9px] font-black uppercase text-center leading-tight tracking-tighter">{item.label}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {/* COINS SECTION - GOLD PREMIUM */}
        <div className="bg-[#0B0B0B] rounded-[2.5rem] shadow-2xl border border-white/5 overflow-hidden">
           <div className="px-7 py-6 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-amber-400/20 rounded-2xl flex items-center justify-center border border-amber-400/20">
                    <Coins className="h-6 w-6 text-amber-400 animate-pulse" />
                 </div>
                 <div>
                   <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest block mb-0.5">ShopyKart Reward</span>
                   <h4 className="text-sm font-black italic text-white uppercase">REDEEM YOUR COINS</h4>
                 </div>
              </div>
              <Switch checked={useCoins} onCheckedChange={setUseCoins} className="data-[state=checked]:bg-amber-500 scale-110" />
           </div>
           <div className={cn("p-7 space-y-6 transition-all duration-500", !useCoins && "opacity-25 grayscale pointer-events-none")}>
              <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                 <div className="text-left">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Available Balance</p>
                    <span className="text-xl font-black italic text-amber-400 leading-none">{profile?.coins || 0} COINS</span>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Wallet Value</p>
                    <span className="text-xl font-black italic text-green-400 leading-none">₹{(Number(profile?.coins || 0) * coinRate).toFixed(0)}</span>
                 </div>
              </div>
              {useCoins && (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                   <div className="flex items-center gap-3">
                      <Input type="number" placeholder="Enter Amount" value={redeemedCoins || ''} onChange={(e) => setRedeemedCoins(Math.min(Number(e.target.value), maxRedeemableCoins))} className="h-14 rounded-2xl bg-white/10 border-white/10 text-white font-black italic text-lg text-center" />
                      <button onClick={() => setRedeemedCoins(maxRedeemableCoins)} className="h-14 px-6 rounded-2xl bg-amber-400 text-black font-black uppercase italic text-[10px] shadow-lg shadow-amber-400/20">MAX</button>
                   </div>
                   <div className="bg-green-600/10 p-4 rounded-2xl border border-green-600/20 flex items-center justify-center gap-2">
                      <Zap className="h-4 w-4 text-green-400 fill-green-400/20" />
                      <span className="text-[10px] font-black text-green-400 uppercase tracking-widest italic">SAVE ₹{(redeemedCoins * coinRate).toFixed(0)} ON THIS ORDER</span>
                   </div>
                </div>
              )}
           </div>
        </div>

        {/* SAFETY ASSURANCE - ELITE DARK */}
        <div className="bg-gradient-to-r from-gray-900 via-black to-gray-900 p-6 rounded-[2.5rem] flex items-center gap-5 text-white shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 h-full w-20 bg-white/5 -skew-x-12 translate-x-10" />
           <div className="h-14 w-14 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 shrink-0 border border-green-500/20 shadow-inner">
              <ShieldCheck className="h-9 w-9" />
           </div>
           <div className="space-y-1">
              <h4 className="text-sm font-black uppercase italic tracking-widest text-green-500 flex items-center gap-2">SAFETY PROTOCOL <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" /></h4>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">
                Sanitized Kitchens • Sealed & Double-bagged • 4.8★ Rider Network
              </p>
           </div>
        </div>

        {/* DELIVERY ADDRESS - PREMIUM GREEN BORDER */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden group">
           <div className="px-6 py-5 border-b bg-green-50/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="h-9 w-9 bg-green-500/10 rounded-xl flex items-center justify-center text-green-600">
                    <MapPin className="h-5 w-5" />
                 </div>
                 <span className="text-[11px] font-black uppercase text-green-800 tracking-widest italic">Drop Destination</span>
              </div>
              <button onClick={() => setIsEditingAddress(!isEditingAddress)} className="h-9 px-4 rounded-xl bg-white border border-green-100 text-[10px] font-black uppercase text-green-600 shadow-sm active:scale-95 transition-all">{isEditingAddress ? 'SAVE PIN' : 'CHANGE'}</button>
           </div>
           <div className="p-7 space-y-6">
              {!isEditingAddress ? (
                 <div className="space-y-2">
                    <p className="text-xl font-black uppercase italic text-gray-900 leading-none tracking-tight">{customerName || 'Identity Unset'}</p>
                    <p className="text-[12px] font-bold text-gray-500 uppercase leading-relaxed line-clamp-2 italic">{customerAddress || 'Please pinpoint your delivery house on the map.'}</p>
                    <div className="flex items-center gap-2 mt-4">
                       <Badge className="bg-green-600 text-white border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3" /> VERIFIED: {customerPhone}
                       </Badge>
                    </div>
                 </div>
              ) : (
                 <div className="space-y-4 animate-in fade-in duration-300">
                    <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="NAME AS PER IDENTITY" className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xs uppercase" />
                    <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="10-DIGIT MOBILE" className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xs" />
                    <Textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="FULL ADDRESS (E.G. HOUSE NO, STREET, LANDMARK)" className="min-h-[100px] rounded-3xl bg-gray-50 border-none font-bold text-xs p-5 uppercase leading-relaxed" />
                 </div>
              )}
              <button 
                onClick={() => setIsMapOpen(true)} 
                className={cn(
                  "w-full h-16 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all transform-gpu active:scale-98",
                  customerLocation || (isMounted && localStorage.getItem('user_lat')) 
                    ? "bg-green-50 border-green-500 text-green-700 shadow-xl shadow-green-100" 
                    : "bg-blue-50 border-blue-200 text-blue-600 shadow-xl shadow-blue-50"
                )}
              >
                <div className={cn("p-2 rounded-xl", customerLocation || (isMounted && localStorage.getItem('user_lat')) ? "bg-green-600 text-white" : "bg-blue-600 text-white")}>
                  {customerLocation || (isMounted && localStorage.getItem('user_lat')) ? <CheckCircle2 className="h-5 w-5" /> : <Navigation className="h-5 w-5 animate-pulse" />}
                </div>
                <span className="text-[12px] font-black uppercase italic tracking-tighter">
                  {customerLocation || (isMounted && localStorage.getItem('user_lat')) ? 'DROP SPOT LOCKED ON MAP' : 'PIN PRECISE HOUSE ON MAP'}
                </span>
              </button>
           </div>
        </div>

        {/* BILL SUMMARY - CLEAN PREMIUM */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden mb-12">
           <div className="px-7 py-6 border-b bg-gray-50/50 flex items-center gap-3">
              <div className="h-10 w-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                 <Receipt className="h-5 w-5 text-gray-400" />
              </div>
              <span className="text-[11px] font-black uppercase text-gray-500 tracking-[0.3em]">Detailed Breakdown</span>
           </div>
           <div className="p-8 space-y-5">
              <div className="flex justify-between text-xs font-bold text-gray-600 uppercase tracking-tight"><span>Cart Subtotal</span><span className="text-gray-900 font-black italic">₹{totalPrice.toFixed(0)}</span></div>
              
              {dynamic_charges.map((charge, idx) => (
                <div key={idx} className="flex justify-between text-xs font-bold text-gray-600 uppercase tracking-tight">
                   <span>{charge.name}</span>
                   {Number(charge.calculatedAmount) === 0 ? <span className="text-green-600 font-black italic tracking-widest">FREE</span> : <span className="text-gray-900 font-black italic">₹{charge.calculatedAmount?.toFixed(0)}</span>}
                </div>
              ))}
              
              {deliveryTip > 0 && (
                <div className="flex justify-between text-xs font-black text-red-600 uppercase italic bg-red-50 p-2 rounded-lg">
                   <span>Partner Appreciation</span>
                   <span>+ ₹{deliveryTip}</span>
                </div>
              )}
              
              {useCoins && coinDiscount > 0 && (
                <div className="flex justify-between text-xs font-black text-amber-600 uppercase italic bg-amber-50 p-2 rounded-lg border border-amber-100 animate-in zoom-in duration-300">
                   <div className="flex items-center gap-2"><Coins className="h-3 w-3" /> Coin Savings</div>
                   <span>- ₹{coinDiscount.toFixed(0)}</span>
                </div>
              )}

              <div className="pt-6 border-t-2 border-dashed border-gray-100 flex justify-between items-center">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Net Payable</span>
                    <span className="text-base font-black italic uppercase text-gray-900 tracking-tighter">Grand Total</span>
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-4xl font-black italic text-primary tracking-tighter drop-shadow-sm">₹{grandTotal.toFixed(0)}</span>
                    <span className="text-[7px] font-black text-green-600 uppercase tracking-widest">Inclusive of all taxes</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* FIXED FOOTER PAYMENT ACTION - RED PREMIUM */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-t border-gray-100 p-5 pb-10 flex items-center justify-center shadow-[0_-20px_60px_rgba(0,0,0,0.1)]">
         <div className="w-full max-w-lg flex items-center justify-between gap-8">
            <div className="flex flex-col">
               <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total Bill</span>
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
               </div>
               <span className="text-4xl font-black italic text-gray-900 leading-none tracking-tighter">₹{grandTotal.toFixed(0)}</span>
            </div>
            <button 
              onClick={handlePlaceOrder} 
              disabled={isPlacing} 
              className="flex-[2.5] h-18 bg-[#EF4444] hover:bg-black text-white rounded-[2rem] font-black uppercase italic text-xl shadow-2xl shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-4 group border-b-[6px] border-red-800"
            >
              {isPlacing ? <Loader2 className="h-8 w-8 animate-spin" /> : <>PLACE ORDER <ArrowRight className="h-7 w-7 group-hover:translate-x-2 transition-transform" /></>}
            </button>
         </div>
      </div>

      {/* MAP DIALOG */}
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="p-0 border-none max-w-2xl h-full sm:h-[85vh] focus:outline-none flex flex-col z-[20000] bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
           <DialogHeader className="sr-only">
              <DialogTitle>Pin Drop Location</DialogTitle>
              <DialogDescription>Mark your delivery building on map.</DialogDescription>
           </DialogHeader>
           <div className="flex-1 min-h-0 relative"><GoogleMapPicker onConfirm={handleConfirmMapLocation} /></div>
        </DialogContent>
      </Dialog>

      {/* PAYMENT DIALOG */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
         <DialogContent className="rounded-t-[3rem] sm:rounded-[4rem] max-w-sm p-0 overflow-hidden border-none shadow-3xl bg-white focus:outline-none bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
            <div className="bg-primary h-2 w-full" />
            <div className="p-10 space-y-10">
               {paymentStep === 'selection' ? (
                 <div className="space-y-10 animate-in fade-in duration-500">
                    <div className="text-center space-y-2">
                       <h3 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">Elite Payment</h3>
                       <div className="text-6xl font-black italic text-primary tracking-tighter">₹{grandTotal.toFixed(0)}</div>
                    </div>
                    
                    <div className="bg-white p-7 rounded-[3rem] border-2 border-dashed border-gray-200 flex flex-col items-center gap-6 shadow-inner relative group">
                       <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                       <img 
                         src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${grandTotal.toFixed(2)}&cu=INR`)}`} 
                         className="h-60 w-60 grayscale contrast-125 rounded-2xl relative z-10" 
                         alt="UPI QR" 
                       />
                       <div className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-[0.3em] italic animate-pulse relative z-10">
                          <Zap className="h-4 w-4 fill-primary" /> Scan with any UPI App
                       </div>
                    </div>

                    <div className="space-y-4">
                       <Button onClick={() => { window.open(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${grandTotal.toFixed(2)}&cu=INR`); setPaymentStep('utr'); }} className="w-full h-20 bg-primary hover:bg-black text-white rounded-[2.5rem] font-black italic uppercase text-xl shadow-2xl shadow-primary/20 transition-all active:scale-95">OPEN UPI APPS <ArrowUpRight className="ml-2 h-6 w-6" /></Button>
                       <button onClick={() => setPaymentStep('utr')} className="w-full text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2">ALREADY PAID? <span className="text-primary underline underline-offset-4">ENTER UTR</span></button>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                    <div className="text-center space-y-3">
                       <div className="h-20 w-20 bg-green-50 rounded-[2rem] flex items-center justify-center text-green-600 mx-auto shadow-inner border border-green-100">
                          <ShieldCheck className="h-10 w-10 animate-pulse" />
                       </div>
                       <h3 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Verify UTR</h3>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Compulsory for secure processing</p>
                    </div>
                    
                    <div className="space-y-3">
                       <label className="text-[11px] font-black uppercase text-gray-400 ml-2 tracking-widest">12-Digit Reference Number</label>
                       <div className="relative">
                          <Input 
                            placeholder="0 0 0 0 0 0 0 0 0 0 0 0" 
                            value={utrNumber} 
                            onChange={e => setUtrNumber(e.target.value.replace(/\D/g,'').slice(0,12))} 
                            className="h-20 rounded-[2rem] bg-gray-50 border-none font-black italic text-3xl text-center tracking-[0.2em] focus-visible:ring-1 focus-visible:ring-primary/20" 
                          />
                          {utrNumber.length === 12 && <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-green-500 text-white rounded-full p-1"><CheckCircle2 className="h-5 w-5" /></div>}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <Button onClick={handlePlaceOrder} disabled={utrNumber.length !== 12 || isPlacing} className="w-full h-20 bg-black hover:bg-green-600 text-white rounded-[2.5rem] font-black italic uppercase text-xl shadow-2xl transition-all">
                          {isPlacing ? <Loader2 className="h-8 w-8 animate-spin" /> : "AUTHENTICATE & FINISH"}
                       </Button>
                       <button onClick={() => setPaymentStep('selection')} className="w-full text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center justify-center gap-2 transition-colors hover:text-gray-900"><ChevronLeft className="h-4 w-4" /> RE-SCAN QR</button>
                    </div>
                 </div>
               )}
            </div>
            
            <div className="p-6 bg-gray-50 flex items-center justify-center gap-2 border-t border-gray-100">
               <ShieldCheck className="h-3.5 w-3.5 text-gray-400" />
               <span className="text-[8px] font-black text-gray-400 uppercase tracking-[0.4em]">IDENTITY SECURED BY GOOGLE CLOUD</span>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
