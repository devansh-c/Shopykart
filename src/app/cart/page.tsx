
'use client';

import { useCart } from '@/components/cart/CartProvider';
import { BottomNav } from '@/components/shared/BottomNav';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Minus, 
  Plus, 
  ChevronLeft, 
  ShoppingBag, 
  Loader2, 
  MapPin, 
  ChevronRight, 
  CreditCard, 
  Banknote, 
  ShoppingBasket, 
  Coins, 
  Map as MapIcon, 
  Tag, 
  Ticket, 
  X, 
  ChevronUp, 
  QrCode, 
  Smartphone, 
  ShieldCheck,
  CheckCircle2,
  Hash,
  Heart,
  Package,
  MessageSquareQuote,
  AlertCircle,
  Store,
  ArrowRight,
  Crown,
  Sparkles,
  Bike
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, increment, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useState, useEffect, useMemo, useRef, useCallback, memo, Suspense } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-3xl" />
});

function CartContent() {
  const { cart, addToCart, removeFromCart, totalPrice, totalItems, clearCart } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isMounted, setIsMounted] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [useCoins, setUseCoins] = useState(false);
  const [premiumPackaging, setPremiumPackaging] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);

  const [deliveryTip, setDeliveryTip] = useState<number>(0);
  const [customTipInput, setCustomTipInput] = useState('');
  const [isCustomTipOpen, setIsCustomTipOpen] = useState(false);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState(''); 
  const [customerCity, setCustomerCity] = useState('');
  const [customerPincode, setCustomerPincode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'utr'>('selection');

  // Slider State
  const [sliderValue, setSliderValue] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const vendorsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'vendors');
  }, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

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
  const { data: dbCharges, loading: chargesLoading } = useCollection<any>(chargesQuery);

  const customSurchargeTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (Number(item.customSurcharge) || 0), 0);
  }, [cart]);

  const blockedVendorNames = useMemo(() => {
    if (!vendors || cart.length === 0) return [];
    const offlineVendors = new Set<string>();
    cart.forEach(item => {
      const v = vendors.find(v => v.id === item.vendorId);
      if (v && v.isOnline === false) {
        offlineVendors.add(v.storeName || 'Store');
      }
    });
    return Array.from(offlineVendors);
  }, [cart, vendors]);

  const dynamic_charges = useMemo(() => {
    if (!dbCharges || profileLoading || chargesLoading) return [];
    const activeZoneId = typeof window !== 'undefined' ? localStorage.getItem('active_zone_id') : null;
    const relevantCharges = dbCharges.filter(charge => {
      if (!charge.zoneId || charge.zoneId === 'global') return true;
      return charge.zoneId === activeZoneId;
    });

    return relevantCharges.map(charge => {
      let amount = 0;
      const chargeVal = Number(charge.value) || 0;
      const isWaived = isPremium;

      if (isWaived) amount = 0;
      else {
        if (charge.type === 'fixed') amount = chargeVal;
        else if (charge.type === 'percentage') amount = (totalPrice * chargeVal) / 100;
      }
      return { ...charge, calculatedAmount: amount, isWaived };
    });
  }, [dbCharges, totalPrice, isPremium, profileLoading, chargesLoading]);

  const chargesTotalSum = useMemo(() => {
    return dynamic_charges.reduce((acc, curr) => acc + (Number(curr.calculatedAmount) || 0), 0);
  }, [dynamic_charges]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    const discountStr = appliedCoupon.discount || '0';
    if (discountStr.includes('%')) {
      const percentage = parseFloat(discountStr.replace(/[^0-9.]/g, ''));
      return (totalPrice * percentage) / 100;
    } else {
      return parseFloat(discountStr.replace(/[^0-9.]/g, '')) || 0;
    }
  }, [appliedCoupon, totalPrice]);

  const coinDiscount = useMemo(() => {
    if (!useCoins || availableCoins <= 0 || coinValue <= 0) return 0;
    const remainingTotal = Math.max(0, totalPrice - couponDiscount);
    return Math.min(remainingTotal, availableCoins * coinValue);
  }, [useCoins, availableCoins, coinValue, totalPrice, couponDiscount]);

  const grandTotal = Math.max(0, totalPrice + chargesTotalSum + customSurchargeTotal + deliveryTip + (premiumPackaging ? 10 : 0) - coinDiscount - couponDiscount);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedName = localStorage.getItem('user_name') || localStorage.getItem('last_customer_name');
    const savedPhone = localStorage.getItem('user_phone') || localStorage.getItem('last_customer_phone');
    const savedAddress = localStorage.getItem('user_address_line') || localStorage.getItem('last_customer_address');
    const savedCity = localStorage.getItem('user_city');
    const savedPincode = localStorage.getItem('user_pincode');

    setCustomerName(profile?.fullName || savedName || '');
    setCustomerPhone(profile?.phoneNumber || savedPhone || '');
    setCustomerAddress(profile?.address || savedAddress || '');
    setCustomerCity(profile?.city || savedCity || '');
    setCustomerPincode(profile?.pincode || savedPincode || '');
    
    const savedPlusCode = localStorage.getItem('user_plus_code');
    if (savedPlusCode) {
      const [lat, lng] = savedPlusCode.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) { setLatitude(lat); setLongitude(lng); }
    }
  }, [profile]);

  const handleVerifyCoupon = async () => {
    if (!couponInput.trim() || !firestore) return;
    setIsVerifyingCoupon(true);
    try {
      const q = query(collection(firestore, 'coupons'), where('code', '==', couponInput.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const cData = snap.docs[0].data();
        const minVal = parseFloat(cData.minOrder?.replace(/[^0-9.]/g, '')) || 0;
        if (totalPrice < minVal) {
          toast({ variant: "destructive", title: "Coupon not valid", description: `Minimum order of ₹${minVal} required.` });
        } else {
          setAppliedCoupon(cData);
          toast({ title: "Coupon Applied! ✨", description: `You saved ₹${couponDiscount.toFixed(2)}` });
        }
      } else {
        toast({ variant: "destructive", title: "Invalid Coupon" });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error verifying" });
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || !firestore) return;
    if (!customerName || customerPhone.length < 10 || !customerAddress) {
      toast({ variant: "destructive", title: "Missing details", description: "Name, 10-digit Phone and Address are required." });
      setSliderValue(0);
      return;
    }
    if (paymentMethod === 'online' && !utrNumber) {
      setPaymentStep('selection');
      setIsPaymentDialogOpen(true);
      setSliderValue(0);
      return;
    }

    setIsPlacing(true);
    const orderData = {
      userId: user.uid,
      customerName: customerName.toUpperCase(),
      customerPhone,
      address: customerAddress.toUpperCase(),
      city: customerCity.toUpperCase(),
      pincode: customerPincode,
      items: cart,
      subtotal: totalPrice,
      total: grandTotal,
      charges: dynamic_charges.map(c => ({ name: c.name, amount: c.calculatedAmount })),
      instructions: instructions.trim(),
      paymentMethod,
      paymentStatus: paymentMethod === 'online' ? 'UTR_Pending_Verification' : 'Pending',
      utrNumber: paymentMethod === 'online' ? utrNumber : null,
      status: 'Placed',
      isPremiumOrder: isPremium,
      latitude,
      longitude,
      deliveryTip,
      premiumPackaging,
      coinDiscount,
      couponDiscount,
      orderDisplayId: Math.floor(1000 + Math.random() * 9000).toString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      const orderRef = await addDoc(collection(firestore, 'orders'), orderData);
      if (useCoins && coinDiscount > 0) {
        const coinsSpent = Math.ceil(coinDiscount / coinValue);
        await setDoc(doc(firestore, 'users', user.uid), { coins: increment(-coinsSpent) }, { merge: true });
      }
      await setDoc(doc(firestore, 'users', user.uid), { 
        coins: increment(10), 
        lastCustomerName: customerName.toUpperCase(),
        lastCustomerPhone: customerPhone,
        lastCustomerAddress: customerAddress.toUpperCase()
      }, { merge: true });

      setShowSuccessOverlay(true);
      setTimeout(() => {
        clearCart();
        router.replace(`/orders/track?id=${orderRef.id}`);
      }, 1500);
    } catch (e) {
      toast({ variant: "destructive", title: "Checkout failed" });
      setSliderValue(0);
    } finally {
      setIsPlacing(false);
    }
  };

  // Slider Handlers
  const handleTouchStart = () => { isDragging.current = true; };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !sliderRef.current) return;
    const rect = sliderRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const val = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderValue(val);
  };
  const handleTouchEnd = () => {
    isDragging.current = false;
    if (sliderValue >= 90) {
      setSliderValue(100);
      handlePlaceOrder();
    } else {
      setSliderValue(0);
    }
  };

  if (!isMounted) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-white">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />
      
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b border-gray-100 shadow-sm">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100"><ChevronLeft className="h-6 w-6 text-gray-700" /></button>
        <h1 className="text-lg font-bold text-gray-800 italic uppercase tracking-tighter">Secure Checkout</h1>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto transform-gpu pb-44">
        
        {isPremium && !profileLoading && (
          <div className="bg-amber-50 border-2 border-dashed border-amber-200 rounded-[2rem] p-6 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
             <div className="h-12 w-12 bg-amber-400 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Crown className="h-6 w-6 fill-white" />
             </div>
             <div>
                <h4 className="font-black italic uppercase text-amber-900 text-sm">Elite Privilege Active</h4>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-relaxed">Unlimited Free Delivery & Taxes waived for you!</p>
             </div>
          </div>
        )}

        {blockedVendorNames.length > 0 && (
          <div className="bg-red-50 border-2 border-dashed border-red-200 rounded-[2rem] p-6 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-500">
             <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="h-6 w-6 animate-pulse" />
                <h4 className="font-black italic uppercase text-sm">Store is Closed</h4>
             </div>
             <p className="text-[10px] font-bold text-red-700 uppercase leading-relaxed">Currently <b>{blockedVendorNames.join(', ')}</b> is not accepting orders. Please remove their products to proceed.</p>
          </div>
        )}

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40">
          <div className="flex items-center gap-2 mb-4"><ShoppingBasket className="h-5 w-5 text-[#C5A021]" /><h2 className="text-sm font-black text-gray-800 uppercase tracking-widest italic">Items In Bag</h2></div>
          <div className="space-y-4">
            {cart.map((item) => {
              const vendor = vendors?.find(v => v.id === item.vendorId);
              const isItemOffline = vendor?.isOnline === false;
              return (
                <div key={item.id + (item.selectedOption?.name || '')} className={cn("flex gap-4 items-start transition-opacity", isItemOffline && "opacity-60")}>
                  <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-muted shrink-0 border border-gray-100 shadow-sm mt-1">
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                    {isItemOffline && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><X className="h-5 w-5 text-white" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                       <h3 className="font-bold text-xs text-gray-800 truncate uppercase">{item.name}</h3>
                    </div>
                    {item.selectedOption && <p className="text-[8px] font-black text-primary uppercase italic">{item.selectedOption.name}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg h-7 px-1">
                        <button onClick={() => removeFromCart(item.id)} className="w-6 h-full flex items-center justify-center font-bold text-gray-500">-</button>
                        <span className="w-5 text-center text-[10px] font-black">{item.quantity}</span>
                        <button onClick={() => !isItemOffline && addToCart(item)} disabled={isItemOffline} className={cn("w-6 h-full flex items-center justify-center font-bold text-gray-500", isItemOffline && "opacity-20 cursor-not-allowed")}>+</button>
                      </div>
                      <div className="text-sm font-black text-gray-900 italic">₹{(item.price * item.quantity).toFixed(0)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40">
           <div className="flex items-center gap-2 mb-4"><Ticket className="h-5 w-5 text-[#C5A021]" /><h2 className="text-sm font-black text-gray-800 uppercase italic">Coupons</h2></div>
           <div className="flex gap-2">
              <Input 
                value={couponInput} 
                onChange={e => setCouponInput(e.target.value)} 
                placeholder="PROMO CODE" 
                className="h-12 rounded-xl bg-gray-50 border-none font-black italic uppercase text-[10px] tracking-[0.2em]" 
              />
              <Button onClick={handleVerifyCoupon} disabled={isVerifyingCoupon || !couponInput.trim()} className="bg-black text-white h-12 rounded-xl px-6 font-black uppercase text-[10px]">{isVerifyingCoupon ? <Loader2 className="animate-spin h-4 w-4" /> : 'APPLY'}</Button>
           </div>
           {appliedCoupon && (
             <div className="mt-3 flex items-center justify-between bg-green-50 p-3 rounded-xl border border-green-100 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 text-green-700">
                   <CheckCircle2 className="h-4 w-4" />
                   <span className="text-[10px] font-black uppercase">'{appliedCoupon.code}' Applied</span>
                </div>
                <button onClick={() => setAppliedCoupon(null)} className="text-green-700"><X className="h-3.5 w-3.5" /></button>
             </div>
           )}
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40">
          <div className="flex items-center gap-2 mb-4"><MapPin className="h-5 w-5 text-[#C5A021]" /><h2 className="text-sm font-black text-gray-800 uppercase italic">Delivery Spot</h2></div>
          <div className="space-y-4">
              <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                <DialogTrigger asChild>
                  <button className="w-full h-11 bg-black text-white rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all"><MapIcon className="h-4 w-4" /> PIN ON GOOGLE MAP</button>
                </DialogTrigger>
                <DialogContent className="max-w-md p-0 h-[80vh] rounded-[2.5rem] overflow-hidden focus:outline-none">
                  <MapPicker onConfirm={(lat, lng) => { setLatitude(lat); setLongitude(lng); setIsMapOpen(false); toast({title:"Location Pinned!"}); }} />
                </DialogContent>
              </Dialog>

              <div className="space-y-3">
                <Input placeholder="FULL NAME *" value={customerName} onChange={e => setCustomerName(e.target.value.toUpperCase())} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                <div className="grid grid-cols-2 gap-3">
                   <Input placeholder="PINCODE *" value={customerPincode} onChange={e => setCustomerPincode(e.target.value.replace(/\D/g,'').slice(0, 6))} className="h-12 rounded-xl bg-gray-50 border-none font-bold text-center" />
                   <Input placeholder="CITY *" value={customerCity} readOnly className="h-12 rounded-xl bg-gray-50 border-none font-bold opacity-60 text-center" />
                </div>
                <Input placeholder="10 DIGIT PHONE NUMBER *" value={customerPhone} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g,'').slice(0, 10))} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                <Textarea placeholder="FULL ADDRESS / LANDMARK *" value={customerAddress} onChange={e => setCustomerAddress(e.target.value.toUpperCase())} className="min-h-[100px] rounded-2xl bg-gray-50 border-none font-bold p-4 text-xs" />
              </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-rose-500">
                 <Package className="h-5 w-5" />
                 <h2 className="text-sm font-black uppercase italic">Premium Packing</h2>
              </div>
              <Switch checked={premiumPackaging} onCheckedChange={setPremiumPackaging} className="data-[state=checked]:bg-rose-500" />
           </div>
           <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex items-center justify-between">
              <p className="text-[9px] font-bold text-rose-700 uppercase leading-relaxed italic">Double layered leak-proof packing for your gourmet safety.</p>
              <span className="text-xs font-black text-rose-600 shrink-0">+₹10</span>
           </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40">
           <div className="flex items-center gap-2 mb-4"><Bike className="h-5 w-5 text-[#C5A021]" /><h2 className="text-sm font-black text-gray-800 uppercase italic">Delivery Tip</h2></div>
           <div className="flex gap-2">
              {[10, 20, 30].map(amt => (
                <button 
                  key={amt} 
                  onClick={() => setDeliveryTip(deliveryTip === amt ? 0 : amt)}
                  className={cn(
                    "flex-1 h-12 rounded-xl border-2 font-black uppercase text-[10px] transition-all",
                    deliveryTip === amt ? "bg-primary border-primary text-white shadow-lg shadow-primary/20" : "bg-white border-gray-100 text-gray-400"
                  )}
                >
                  ₹{amt}
                </button>
              ))}
              <Dialog open={isCustomTipOpen} onOpenChange={setIsCustomTipOpen}>
                 <DialogTrigger asChild>
                    <button className={cn("flex-1 h-12 rounded-xl border-2 font-black uppercase text-[10px] transition-all", ![0, 10, 20, 30].includes(deliveryTip) ? "bg-primary border-primary text-white shadow-lg" : "bg-white border-gray-100 text-gray-400")}>CUSTOM</button>
                 </DialogTrigger>
                 <DialogContent className="max-w-xs rounded-3xl p-6">
                    <DialogHeader><DialogTitle className="font-black italic uppercase text-center">Add Custom Tip</DialogTitle></DialogHeader>
                    <Input type="number" placeholder="Enter amount ₹" value={customTipInput} onChange={e => setCustomTipInput(e.target.value)} className="h-12 rounded-xl text-center font-black" />
                    <Button onClick={() => { setDeliveryTip(Number(customTipInput)); setIsCustomTipOpen(false); }} className="w-full h-12 rounded-xl bg-black">APPLY TIP</Button>
                 </DialogContent>
              </Dialog>
           </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40">
           <div className="flex items-center gap-2 mb-4"><MessageSquareQuote className="h-5 w-5 text-[#C5A021]" /><h2 className="text-sm font-black text-gray-800 uppercase italic">Cooking Instructions</h2></div>
           <Textarea 
            placeholder="E.G. Don't add onion, make it extra spicy..." 
            value={instructions} 
            onChange={e => setInstructions(e.target.value)} 
            className="min-h-[80px] rounded-xl bg-gray-50 border-none font-medium p-4 text-[10px]" 
           />
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40">
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-amber-600">
                 <Coins className="h-5 w-5" />
                 <h2 className="text-sm font-black uppercase italic">Redeem Coins</h2>
              </div>
              <Switch checked={useCoins} onCheckedChange={setUseCoins} disabled={availableCoins <= 0} className="data-[state=checked]:bg-amber-500" />
           </div>
           <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center justify-between">
              <div className="flex flex-col">
                 <span className="text-[10px] font-black text-amber-700 uppercase">Current Balance</span>
                 <span className="text-lg font-black text-amber-600 italic tracking-tighter">{availableCoins} Coins</span>
              </div>
              <span className="text-[9px] font-bold text-amber-700 uppercase italic">Worth ₹{(availableCoins * coinValue).toFixed(0)}</span>
           </div>
        </div>

        <div className="bg-white rounded-[2rem] p-7 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 space-y-4">
          <h3 className="text-sm font-black text-gray-800 uppercase italic">Billing Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between font-bold text-[11px] text-gray-500 uppercase tracking-widest"><span>Item Total</span><span>₹{totalPrice.toFixed(2)}</span></div>
            {dynamic_charges.map((charge: any) => (
              <div key={charge.id} className="flex justify-between font-bold text-[11px] text-gray-400 uppercase tracking-widest">
                <span>{charge.name}</span>
                {charge.isWaived ? <span className="text-green-600 font-black flex items-center gap-1"><ShieldCheck className="h-2.5 w-2.5" /> FREE (Elite)</span> : <span>₹{charge.calculatedAmount.toFixed(2)}</span>}
              </div>
            ))}
            {appliedCoupon && <div className="flex justify-between font-bold text-[11px] text-green-600 uppercase tracking-widest"><span>Coupon Discount</span><span>-₹{couponDiscount.toFixed(2)}</span></div>}
            {useCoins && coinDiscount > 0 && <div className="flex justify-between font-bold text-[11px] text-amber-600 uppercase tracking-widest"><span>Coins Redeemed</span><span>-₹{coinDiscount.toFixed(2)}</span></div>}
            {deliveryTip > 0 && <div className="flex justify-between font-bold text-[11px] text-blue-600 uppercase tracking-widest"><span>Rider Tip</span><span>₹{deliveryTip.toFixed(2)}</span></div>}
            {premiumPackaging && <div className="flex justify-between font-bold text-[11px] text-rose-500 uppercase tracking-widest"><span>Premium Packing</span><span>₹10.00</span></div>}
          </div>
          <div className="pt-5 border-t border-dashed border-gray-100 flex justify-between items-center"><span className="text-base font-black text-gray-800 uppercase italic tracking-tighter">Total Payable</span><span className="text-3xl font-black text-primary italic tracking-tighter">₹{grandTotal.toFixed(0)}</span></div>
        </div>

        <div className="bg-[#0B0B0B] rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden text-white">
           <div className="flex flex-col items-center text-center gap-6 relative z-10">
              <div className="h-16 w-16 bg-white/10 rounded-3xl flex items-center justify-center text-primary border border-white/10"><Smartphone className="h-8 w-8" /></div>
              <div className="space-y-1">
                 <h2 className="text-2xl font-black italic uppercase tracking-tighter">Payment Mode</h2>
                 <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select how you want to pay</p>
              </div>
              <div className="grid grid-cols-2 gap-4 w-full">
                 <button onClick={() => { setPaymentMethod('online'); setPaymentStep('selection'); setIsPaymentDialogOpen(true); }} className={cn("h-20 rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center gap-2", paymentMethod === 'online' ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-white/5 border-white/10 opacity-50")}>
                    <CreditCard className="h-6 w-6" /><span className="text-[9px] font-black uppercase">Online UPI</span>
                 </button>
                 <button onClick={() => setPaymentMethod('cod')} className={cn("h-20 rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center gap-2", paymentMethod === 'cod' ? "bg-primary border-primary shadow-lg shadow-primary/20" : "bg-white/5 border-white/10 opacity-50")}>
                    <Banknote className="h-6 w-6" /><span className="text-[9px] font-black uppercase">CASH (COD)</span>
                 </button>
              </div>
           </div>
        </div>
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
         <DialogContent className="rounded-t-[3rem] sm:rounded-[3rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl focus:outline-none bottom-0 top-auto translate-y-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2">
            <DialogHeader className="p-8 pb-4">
               <DialogTitle className="font-black italic uppercase text-center text-xl">{paymentStep === 'selection' ? 'Online Payment' : 'Verify Transaction'}</DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
               {paymentStep === 'selection' ? (
                 <div className="space-y-6">
                    <div className="bg-gray-50 p-6 rounded-[2rem] text-center space-y-1">
                       <span className="text-[10px] font-black text-gray-400 uppercase">Amount Payable</span>
                       <div className="text-4xl font-black italic tracking-tighter">₹{grandTotal.toFixed(0)}</div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center gap-4">
                       <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${grandTotal.toFixed(2)}&cu=INR`)}`} className="h-44 w-44" alt="QR" crossOrigin="anonymous" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-primary italic">Scan with PhonePe / GPay</p>
                    </div>
                    <div className="space-y-3">
                       <Button onClick={() => { window.open(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${grandTotal.toFixed(2)}&cu=INR`); setPaymentStep('utr'); }} className="w-full h-16 bg-primary text-white rounded-3xl font-black italic text-lg uppercase shadow-xl">OPEN UPI APP</Button>
                       <button onClick={() => setPaymentStep('utr')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest underline">Already Paid? Enter UTR</button>
                    </div>
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="text-center space-y-1">
                       <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-2"><Hash className="h-8 w-8" /></div>
                       <h3 className="text-lg font-black italic uppercase">Confirm UTR Number</h3>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">Enter 12-digit UTR from your bank app</p>
                    </div>
                    <Input 
                      placeholder="12 DIGIT UTR NO." 
                      value={utrNumber} 
                      onChange={e => setUtrNumber(e.target.value.replace(/\D/g,'').slice(0,12))} 
                      className="h-16 rounded-2xl bg-gray-50 border-none font-black italic text-2xl tracking-[0.2em] text-center" 
                    />
                    <Button onClick={() => { if(utrNumber.length === 12) setIsPaymentDialogOpen(false); }} disabled={utrNumber.length !== 12} className="w-full h-16 bg-black text-white rounded-3xl font-black italic text-lg uppercase shadow-xl">DONE</Button>
                 </div>
               )}
            </div>
         </DialogContent>
      </Dialog>

      <div className="fixed bottom-0 left-0 right-0 z-[5000] bg-white border-t border-gray-100 p-5 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transform-gpu">
         <div className="max-w-lg mx-auto">
            {/* SLIDE TO ORDER UX */}
            <div 
              ref={sliderRef}
              className="relative w-full h-20 bg-gray-100 rounded-[2.5rem] overflow-hidden flex items-center p-2 group select-none shadow-inner"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={() => { isDragging.current = true; }}
              onMouseMove={(e) => {
                if (!isDragging.current || !sliderRef.current) return;
                const rect = sliderRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const val = Math.max(0, Math.min(100, (x / rect.width) * 100));
                setSliderValue(val);
              }}
              onMouseUp={handleTouchEnd}
              onMouseLeave={handleTouchEnd}
            >
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.3em] transition-opacity duration-300",
                    sliderValue > 20 ? "opacity-0" : "opacity-40 animate-pulse text-gray-500"
                  )}>
                    Slide to Place Order
                  </span>
               </div>

               {/* Background Progress Fill */}
               <div 
                 className="absolute left-0 top-0 bottom-0 bg-primary transition-all duration-75"
                 style={{ width: `${sliderValue}%` }}
               />

               {/* The Handle */}
               <div 
                 className="relative z-10 h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-xl cursor-grab active:cursor-grabbing transition-all duration-75"
                 style={{ transform: `translateX(${sliderValue * 2.5}px)` }}
               >
                  {isPlacing ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : sliderValue > 90 ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : (
                    <ArrowRight className="h-6 w-6 text-primary stroke-[3]" />
                  )}
               </div>

               <div className="absolute right-6 pointer-events-none z-10 flex items-center gap-3">
                  <span className="text-lg font-black italic tracking-tighter text-gray-900">₹{grandTotal.toFixed(0)}</span>
                  <div className="h-8 w-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                     <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <CartContent />
    </Suspense>
  );
}
