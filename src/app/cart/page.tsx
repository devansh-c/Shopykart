'use client';

import { useCart } from '@/components/cart/CartProvider';
import { BottomNav } from '@/components/shared/BottomNav';
import { Button } from '@/components/ui/button';
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
  MessageSquareQuote
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, increment, query, where, getDocs } from 'firebase/firestore';
import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-3xl" />
});

// ULTRA-RELIABLE MODERN SLIDER (Using Pointer Events API)
const SlideToOrder = memo(({ onConfirm, total, isDisabled, label }: { onConfirm: () => void, total: number, isDisabled: boolean, label?: string }) => {
  const [slideX, setSlideX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const slideXRef = useRef(0);

  const onPointerDown = (e: React.PointerEvent) => {
    if (isDisabled) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const maxX = rect.width - 68;
    let x = e.clientX - rect.left - 34;
    x = Math.max(0, Math.min(x, maxX));
    
    setSlideX(x);
    slideXRef.current = x;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!isDragging || !sliderRef.current) return;
    setIsDragging(false);
    
    const maxX = sliderRef.current.clientWidth - 68;
    if (slideXRef.current > maxX * 0.8) {
      setSlideX(maxX);
      onConfirm();
    } else {
      setSlideX(0);
      slideXRef.current = 0;
    }
  };

  return (
    <div 
      ref={sliderRef} 
      className={cn(
        "relative h-[68px] w-full rounded-full p-2 flex items-center overflow-hidden shadow-xl select-none touch-none transform-gpu transition-all duration-300",
        isDisabled ? "bg-gray-200" : isDragging ? "bg-emerald-600" : "bg-[#10B981]"
      )}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className={cn(
          "text-[13px] font-black text-white uppercase italic tracking-widest transition-all duration-200", 
          (slideX > 40 || isDisabled) ? "opacity-0 scale-95" : "opacity-100 scale-100"
        )}>
          {label || `SLIDE TO ORDER • ₹${total.toFixed(2)}`}
        </span>
        {isDisabled && <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">INCOMPLETE DETAILS</span>}
      </div>

      <div 
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn(
          "relative z-10 h-[52px] w-[52px] rounded-full bg-white flex items-center justify-center shadow-2xl cursor-grab active:cursor-grabbing transform-gpu transition-shadow", 
          isDisabled ? "opacity-30 pointer-events-none" : "opacity-100",
          isDragging && "shadow-[0_0_30px_rgba(255,255,255,0.5)]"
        )} 
        style={{ 
          transform: `translate3d(${slideX}px, 0, 0)`,
          willChange: 'transform'
        }}
      >
        <ChevronRight className={cn(
          "h-7 w-7 stroke-[3] transition-colors", 
          isDragging ? "text-emerald-600" : "text-[#10B981]"
        )} />
      </div>

      {!isDisabled && (
        <div 
          className="absolute left-0 top-0 bottom-0 bg-white/20 pointer-events-none" 
          style={{ width: `${slideX + 54}px`, transition: isDragging ? 'none' : 'width 0.3s ease-out' }} 
        />
      )}
    </div>
  );
});
SlideToOrder.displayName = "SlideToOrder";

export default function CartPage() {
  const { cart, addToCart, removeFromCart, totalPrice, totalItems, clearCart } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [instructions, setInstructions] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
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

  const brandingRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, 'app_settings', 'branding');
  }, [firestore]);
  const { data: branding } = useDoc<any>(brandingRef);
  const coinValue = branding?.coinValue || 0.5;

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile } = useDoc<any>(profileRef);
  const availableCoins = profile?.coins || 0;

  const chargesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'checkout_charges');
  }, [firestore]);
  const { data: dbCharges } = useCollection<any>(chargesQuery);

  const customSurchargeTotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (Number(item.customSurcharge) || 0), 0);
  }, [cart]);

  const dynamic_charges = useMemo(() => {
    if (!dbCharges) return [];
    const activeZoneId = typeof window !== 'undefined' ? localStorage.getItem('active_zone_id') : null;
    const relevantCharges = dbCharges.filter(charge => {
      if (!charge.zoneId || charge.zoneId === 'global') return true;
      return charge.zoneId === activeZoneId;
    });
    return relevantCharges.map(charge => {
      let amount = 0;
      const chargeVal = Number(charge.value) || 0;
      if (charge.type === 'fixed') amount = chargeVal;
      else if (charge.type === 'percentage') amount = (totalPrice * chargeVal) / 100;
      return { ...charge, calculatedAmount: amount };
    });
  }, [dbCharges, totalPrice]);

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

  const upiId = "9450355709@axl";
  const upiUri = useMemo(() => {
    return `upi://pay?pa=${upiId}&pn=ShopyKart&am=${grandTotal.toFixed(2)}&cu=INR&tn=Order_from_ShopyKart`;
  }, [grandTotal]);

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

  const executeOrderPlacement = useCallback(() => {
    if (!firestore || isPlacing) return;
    
    const orderId = Math.floor(10000 + Math.random() * 90000).toString();
    setIsPlacing(true);

    const finalUid = user?.uid || 'guest_' + Date.now();
    const coinsUsed = (useCoins && coinValue > 0) ? Math.ceil(coinDiscount / coinValue) : 0;
    const fullFinalAddress = `${customerAddress}, ${customerCity} - ${customerPincode}`;
    const allVendorIds = Array.from(new Set(cart.map(item => String(item.vendorId)).filter(id => id !== 'undefined' && id !== 'null')));

    const finalCharges = [...dynamic_charges.map(c => ({ name: c.name, amount: c.calculatedAmount }))];
    if (premiumPackaging) {
      finalCharges.push({ name: 'Premium Packaging', amount: 10 });
    }

    const orderData = {
      userId: finalUid,
      customerName,
      customerPhone,
      orderDisplayId: orderId,
      items: cart.map(item => ({ 
        id: item.id, 
        name: item.name, 
        quantity: item.quantity, 
        price: item.price, 
        isCustom: !!item.isCustom, 
        vendorId: item.vendorId || 'global',
        restaurantName: item.restaurantName || 'ShopyKart Store',
        instructions: item.instructions || '' // Save per-item instructions
      })),
      subtotal: totalPrice,
      charges: finalCharges,
      total: grandTotal,
      status: 'Placed',
      paymentMethod,
      premiumPackaging,
      utrNumber: paymentMethod === 'online' ? utrNumber : null,
      paymentStatus: paymentMethod === 'online' ? 'UTR_Pending_Verification' : 'Pending',
      address: fullFinalAddress,
      latitude: latitude || null,
      longitude: longitude || null,
      createdAt: serverTimestamp(),
      vendorId: cart[0]?.vendorId || 'global',
      vendorIds: allVendorIds, 
      restaurantName: cart[0]?.restaurantName || 'ShopyKart Store',
      coinsUsed,
      coinDiscount,
      couponDiscount,
      deliveryTip,
      couponCode: appliedCoupon?.code || null,
      instructions // General order instructions
    };

    router.replace(`/orders/track?id=${orderId}`);

    setDoc(doc(firestore, 'orders', orderId), orderData)
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: `orders/${orderId}`,
          operation: 'create',
          requestResourceData: orderData,
        });
        errorEmitter.emit('permission-error', permissionError);
      });

    if (user) {
      setDoc(doc(firestore, 'users', user.uid), {
        fullName: customerName, phoneNumber: customerPhone, address: customerAddress, 
        city: customerCity, pincode: customerPincode, latitude, longitude,
        coins: increment(10 - coinsUsed), updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {});
    }

    setTimeout(() => {
      clearCart();
      setIsPaymentDialogOpen(false);
    }, 100);
    
  }, [firestore, isPlacing, user, useCoins, coinValue, coinDiscount, premiumPackaging, customerAddress, customerCity, customerPincode, cart, customerName, customerPhone, totalPrice, dynamic_charges, grandTotal, paymentMethod, utrNumber, latitude, longitude, appliedCoupon, instructions, clearCart, router, deliveryTip]);

  const handleOnlinePaymentFlow = () => {
    window.open(upiUri);
    setPaymentStep('utr');
  };

  const handleCheckout = useCallback(async () => {
    if (totalPrice < 35 && grandTotal < 35) {
      toast({ variant: "destructive", title: "Order Value Low", description: "Minimum order value is ₹35." });
      return;
    }
    if (!customerName.trim() || customerPhone.length !== 10 || customerAddress.trim().length < 3) {
      toast({ variant: "destructive", title: "Incomplete Details", description: "Please check your delivery details." });
      return;
    }
    
    if (paymentMethod === 'online') {
      setIsPaymentDialogOpen(true);
      setPaymentStep('selection');
    } else {
      executeOrderPlacement();
    }
  }, [totalPrice, grandTotal, customerName, customerPhone, customerAddress, paymentMethod, toast, executeOrderPlacement]);

  const handleApplyCoupon = async () => {
    if (!firestore || !couponInput.trim()) return;
    setIsVerifyingCoupon(true);
    try {
      const q = query(collection(firestore, 'coupons'), where('code', '==', couponInput.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast({ variant: "destructive", title: "Invalid Coupon" });
        setAppliedCoupon(null);
      } else {
        const couponData = snap.docs[0].data();
        setAppliedCoupon(couponData);
        toast({ title: "Coupon Applied!" });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Verification Failed" });
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  const isCheckoutDisabled = !customerName.trim() || customerPhone.length !== 10 || customerAddress.trim().length < 3;

  if (totalItems === 0 && !isPlacing) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white h-32 w-32 rounded-full flex items-center justify-center mb-6 shadow-sm"><ShoppingBag className="h-12 w-12 text-gray-200" /></div>
        <h2 className="text-xl font-bold text-gray-800">Your cart is empty</h2>
        <Button onClick={() => router.push('/menu')} className="rounded-xl h-12 px-8 font-bold bg-primary mt-6">BROWSE MENU</Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-64">
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b border-gray-100 shadow-sm">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100"><ChevronLeft className="h-6 w-6 text-gray-700" /></button>
        <h1 className="text-lg font-bold text-gray-800 italic uppercase tracking-tighter">Secure Checkout</h1>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto transform-gpu">
        {/* ITEMS IN BAG */}
        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 mb-4"><ShoppingBasket className="h-5 w-5 text-[#C5A021]" /><h2 className="text-sm font-black text-gray-800 uppercase tracking-widest italic">Items In Bag</h2></div>
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id + (item.selectedOption?.name || '')} className="flex gap-4 items-start">
                <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-muted shrink-0 border border-gray-100 shadow-sm mt-1"><Image src={item.imageUrl} alt={item.name} fill className="object-cover" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xs text-gray-800 truncate uppercase">{item.name}</h3>
                  {item.selectedOption && <p className="text-[8px] font-black text-primary uppercase italic">{item.selectedOption.name}</p>}
                  
                  {/* ITEM INSTRUCTIONS DISPLAY */}
                  {item.instructions && (
                    <div className="mt-1 flex items-start gap-1 bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">
                      <MessageSquareQuote className="h-2.5 w-2.5 text-primary shrink-0 mt-0.5" />
                      <p className="text-[8px] font-bold text-primary italic leading-tight">{item.instructions}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg h-7 px-1">
                      <button onClick={() => removeFromCart(item.id)} className="w-6 h-full flex items-center justify-center font-bold text-gray-500 hover:text-primary">-</button>
                      <span className="w-5 text-center text-[10px] font-black">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="w-6 h-full flex items-center justify-center font-bold text-gray-500 hover:text-primary">+</button>
                    </div>
                    <div className="text-sm font-black text-gray-900 italic">₹{item.price.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* GENERAL INSTRUCTIONS */}
        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 mb-4"><MessageSquareQuote className="h-5 w-5 text-[#C5A021]" /><h2 className="text-sm font-black text-gray-800 uppercase italic">Cooking Instructions</h2></div>
          <Textarea 
            placeholder="Anything else we should know for the entire order? (e.g. Ring the bell, avoid chilly)" 
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            className="rounded-2xl bg-gray-50 border-none font-medium min-h-[80px] p-4 text-xs"
          />
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 mb-4"><MapPin className="h-5 w-5 text-[#C5A021]" /><h2 className="text-sm font-black text-gray-800 uppercase italic">Delivery Spot</h2></div>
          <div className="space-y-4">
              <button onClick={() => setIsMapOpen(true)} className="w-full h-11 bg-black text-white rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all"><MapIcon className="h-4 w-4" /> PIN ON GOOGLE MAP</button>
              <div className="space-y-3">
                <Input placeholder="FULL NAME *" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="PINCODE *" value={customerPincode} onChange={e => setCustomerPincode(e.target.value.replace(/\D/g,'').slice(0, 6))} className="h-12 rounded-xl bg-gray-50 border-none font-bold text-center" />
                  <Input placeholder="CITY *" value={customerCity} readOnly className="h-12 rounded-xl bg-gray-50 border-none font-bold opacity-60 text-center" />
                </div>
                <Textarea placeholder="HOUSE NO / STREET DETAILS *" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="rounded-xl bg-gray-50 border-none font-medium min-h-[90px] p-4 text-xs" />
                <Input placeholder="10 DIGIT PHONE NUMBER *" value={customerPhone} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g,'').slice(0, 10))} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
              </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 space-y-4 transition-all hover:shadow-lg">
           <div className="flex items-center gap-3"><div className="h-9 w-9 bg-[#C5A021]/10 rounded-xl flex items-center justify-center text-[#C5A021]"><Ticket className="h-5 w-5" /></div><h3 className="text-sm font-black uppercase italic tracking-tight">Active Offers</h3></div>
           <div className="flex gap-2">
              <div className="relative flex-1"><Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="PROMO CODE" value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} className="h-12 pl-12 rounded-xl bg-gray-50 border-none font-black tracking-widest text-[10px]" /></div>
              <button onClick={handleApplyCoupon} disabled={isVerifyingCoupon || !couponInput.trim()} className="h-12 px-6 rounded-xl bg-black text-white font-black uppercase italic text-[10px] tracking-widest active:scale-95 transition-all">{isVerifyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'APPLY'}</button>
           </div>
           {appliedCoupon && (
             <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex items-center justify-between"><span className="text-[10px] font-black text-green-700 uppercase">'{appliedCoupon.code}' APPLIED!</span><button onClick={() => setAppliedCoupon(null)}><X className="h-3.5 w-3.5 text-green-700" /></button></div>
           )}
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 flex items-center justify-between transition-all hover:shadow-lg">
          <div className="flex items-center gap-3"><div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shadow-inner"><Coins className="h-6 w-6" /></div><div><h3 className="text-sm font-black uppercase tracking-tight italic">ShopyKart Coins</h3><p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Balance: {availableCoins} Coins</p></div></div>
          <Switch checked={useCoins} onCheckedChange={setUseCoins} disabled={availableCoins <= 0} className="data-[state=checked]:bg-amber-500" />
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 flex items-center justify-between transition-all hover:shadow-lg">
          <div className="flex items-center gap-3"><div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shadow-inner"><Package className="h-6 w-6" /></div><div><h3 className="text-sm font-black uppercase tracking-tight italic">Premium Packaging</h3><p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Extra safety & premium feel • ₹10</p></div></div>
          <Switch checked={premiumPackaging} onCheckedChange={setPremiumPackaging} className="data-[state=checked]:bg-rose-500" />
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 space-y-4 transition-all hover:shadow-lg">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="h-9 w-9 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                    <Heart className="h-5 w-5 fill-orange-500" />
                 </div>
                 <div className="flex flex-col">
                    <h3 className="text-sm font-black uppercase italic tracking-tight">Delivery Tip</h3>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase">Thank your delivery partner</p>
                 </div>
              </div>
              {deliveryTip > 0 && (
                <button onClick={() => setDeliveryTip(0)} className="text-[10px] font-black text-primary uppercase underline">Remove</button>
              )}
           </div>
           
           <div className="grid grid-cols-4 gap-2">
              {[20, 30, 50].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setDeliveryTip(amount)}
                  className={cn(
                    "relative flex flex-col items-center justify-center h-14 rounded-xl border-2 transition-all active:scale-95",
                    deliveryTip === amount ? "border-orange-500 bg-orange-50" : "border-gray-50 bg-gray-50"
                  )}
                >
                  <span className={cn("text-sm font-black", deliveryTip === amount ? "text-orange-600" : "text-gray-600")}>₹{amount}</span>
                  {amount === 30 && (
                    <div className="absolute -bottom-2 left-0 right-0 flex justify-center">
                       <span className="bg-orange-500 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded-sm whitespace-nowrap shadow-sm">Most Tipped</span>
                    </div>
                  )}
                </button>
              ))}
              <Dialog open={isCustomTipOpen} onOpenChange={setIsCustomTipOpen}>
                 <DialogTrigger asChild>
                    <button
                      className={cn(
                        "flex items-center justify-center h-14 rounded-xl border-2 transition-all active:scale-95",
                        (deliveryTip !== 0 && ![20, 30, 50].includes(deliveryTip)) ? "border-orange-500 bg-orange-50" : "border-gray-50 bg-gray-50"
                      )}
                    >
                      <span className={cn("text-xs font-black", (deliveryTip !== 0 && ![20, 30, 50].includes(deliveryTip)) ? "text-orange-600" : "text-gray-600")}>
                        { (deliveryTip !== 0 && ![20, 30, 50].includes(deliveryTip)) ? `₹${deliveryTip}` : 'Other' }
                      </span>
                    </button>
                 </DialogTrigger>
                 <DialogContent className="rounded-[2rem] max-w-xs">
                    <DialogHeader><DialogTitle className="font-black italic uppercase text-center">Custom Tip</DialogTitle></DialogHeader>
                    <div className="p-4 space-y-4">
                       <Input 
                        type="number" 
                        placeholder="Enter Amount" 
                        value={customTipInput}
                        onChange={(e) => setCustomTipInput(e.target.value)}
                        className="h-12 rounded-xl text-center font-black text-lg"
                       />
                       <Button 
                        onClick={() => { 
                          const val = parseFloat(customTipInput);
                          if(val > 0) {
                            setDeliveryTip(val);
                            setIsCustomTipOpen(false);
                            setCustomTipInput('');
                          }
                        }} 
                        className="w-full h-12 bg-orange-500 hover:bg-orange-600 rounded-xl"
                       >
                        ADD TIP
                       </Button>
                    </div>
                 </DialogContent>
              </Dialog>
           </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 space-y-4 transition-all hover:shadow-lg">
           <h3 className="text-sm font-black text-gray-800 uppercase italic">Settlement Mode</h3>
           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setPaymentMethod('online')}
                className={cn(
                  "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                  paymentMethod === 'online' ? "border-primary bg-primary/5" : "border-gray-50 bg-gray-50"
                )}
              >
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", paymentMethod === 'online' ? "bg-primary text-white" : "bg-white text-gray-400")}>
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className={cn("text-[9px] font-black uppercase tracking-widest", paymentMethod === 'online' ? "text-primary" : "text-gray-400")}>Pay with UPI</span>
              </button>

              <button 
                onClick={() => setPaymentMethod('cod')}
                className={cn(
                  "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
                  paymentMethod === 'cod' ? "border-primary bg-primary/5" : "border-gray-50 bg-gray-50"
                )}
              >
                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", paymentMethod === 'cod' ? "bg-primary text-white" : "bg-white text-gray-400")}>
                  <Banknote className="h-5 w-5" />
                </div>
                <span className={cn("text-[9px] font-black uppercase tracking-widest", paymentMethod === 'cod' ? "text-primary" : "text-gray-400")}>Cash on Del.</span>
              </button>
           </div>
        </div>

        <div className="bg-white rounded-[2rem] p-7 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 space-y-4 transition-all hover:shadow-lg">
          <h3 className="text-sm font-black text-gray-800 uppercase italic">Billing Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between font-bold text-[11px] text-gray-500 uppercase tracking-widest"><span>Item Total</span><span>₹{totalPrice.toFixed(2)}</span></div>
            {dynamic_charges.map((charge: any) => (
              <div key={charge.id} className="flex justify-between font-bold text-[11px] text-gray-400 uppercase tracking-widest"><span>{charge.name}</span><span>₹{charge.calculatedAmount.toFixed(2)}</span></div>
            ))}
            {premiumPackaging && <div className="flex justify-between font-bold text-[11px] text-rose-500 uppercase tracking-widest"><span>Premium Packaging</span><span>₹10.00</span></div>}
            {appliedCoupon && <div className="flex justify-between font-black text-[11px] text-green-600 uppercase tracking-widest"><span>Discount</span><span>- ₹{couponDiscount.toFixed(2)}</span></div>}
            {useCoins && coinDiscount > 0 && <div className="flex justify-between font-black text-[11px] text-amber-600 uppercase tracking-widest"><span>Coins Redeemed</span><span>- ₹{coinDiscount.toFixed(2)}</span></div>}
            {deliveryTip > 0 && <div className="flex justify-between font-black text-[11px] text-orange-600 uppercase tracking-widest"><span>Delivery Tip</span><span>₹{deliveryTip.toFixed(2)}</span></div>}
          </div>
          <div className="pt-5 border-t border-dashed border-gray-100 flex justify-between items-center"><span className="text-base font-black text-gray-800 uppercase italic tracking-tighter">Total Payable</span><span className="text-3xl font-black text-primary italic tracking-tighter">₹{grandTotal.toFixed(2)}</span></div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[10000] max-w-lg mx-auto pb-safe pointer-events-none">
        <div className="bg-white border-t-2 border-[#C5A021]/40 p-5 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] flex flex-col gap-4 rounded-t-[2.5rem] pointer-events-auto">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <div className="h-11 w-11 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">{paymentMethod === 'online' ? <CreditCard className="h-5 w-5 text-gray-700" /> : <Banknote className="h-5 w-5 text-gray-700" />}</div>
                 <div className="flex flex-col"><span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1.5">Settling via</span><span className="text-sm font-black italic uppercase text-gray-900 leading-none">{paymentMethod === 'online' ? 'UPI / Online' : 'Cash on Delivery'}</span></div>
              </div>
              <button onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })} className="flex items-center gap-1.5 bg-rose-50 px-4 py-2 rounded-full text-rose-600 font-black uppercase text-[10px] tracking-widest border border-rose-100">CHANGE <ChevronUp className="h-3.5 w-3.5" /></button>
           </div>
           <SlideToOrder onConfirm={handleCheckout} total={grandTotal} isDisabled={isPlacing || isCheckoutDisabled} />
        </div>
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Secure Payment</DialogTitle>
          </DialogHeader>
          <div className="bg-primary h-2 w-full" />
          <div className="p-8 space-y-8 flex flex-col items-center">
            {paymentStep === 'selection' ? (
              <>
                <div className="text-center space-y-2">
                  <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-2"><Smartphone className="h-8 w-8" /></div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter">Instant Payment</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">Click button to open your UPI app and pay.</p>
                </div>
                <div className="w-full space-y-4">
                   <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex flex-col items-center text-center gap-2">
                     <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Payable Amount</span>
                     <div className="text-4xl font-black italic text-gray-900 tracking-tighter">₹{grandTotal.toFixed(2)}</div>
                   </div>
                   <Button onClick={handleOnlinePaymentFlow} className="w-full h-18 py-8 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase italic text-lg shadow-2xl active:scale-95 transition-all">PAY & PROCEED</Button>
                </div>
              </>
            ) : (
              <div className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center space-y-2">
                  <div className="h-14 w-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-2"><CheckCircle2 className="h-8 w-8" /></div>
                  <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gray-800">Final Verification</h2>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">Enter 12-digit UTR Number from your payment receipt.</p>
                </div>

                <div className="space-y-4">
                   <div className="relative group">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary" />
                      <Input 
                        placeholder="12 DIGIT UTR NO." 
                        value={utrNumber}
                        onChange={e => setUtrNumber(e.target.value.replace(/\D/g,'').slice(0, 12))}
                        className="h-16 pl-12 rounded-2xl bg-gray-50 border-none font-black italic text-xl tracking-[0.2em] text-center"
                      />
                   </div>
                   <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                      <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                      <p className="text-[9px] font-bold text-blue-700 uppercase leading-relaxed">UTR number verify hone ke baad hi order accept hoga. Wrong UTR se order cancel ho sakta hai.</p>
                   </div>
                   
                   <SlideToOrder 
                    onConfirm={executeOrderPlacement} 
                    total={grandTotal} 
                    isDisabled={utrNumber.length !== 12 || isPlacing} 
                    label="SLIDE TO VERIFY & ORDER"
                   />
                </div>
                <button onClick={() => setPaymentStep('selection')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest underline">Wait, I haven't paid yet</button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-sm h-[500px] p-0 overflow-hidden"><DialogHeader className="sr-only"><DialogTitle>Pin Delivery Location</DialogTitle></DialogHeader><MapPicker onConfirm={(lat, lng) => { setLatitude(lat); setLongitude(lng); setIsMapOpen(false); }} /></DialogContent>
      </Dialog>
    </div>
  );
}
