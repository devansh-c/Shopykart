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
  Sparkles
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
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-3xl" />
});

export default function CartPage() {
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

  const sliderRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const currentXRef = useRef(0);

  const [validationError, setValidationError] = useState<string | null>(null);

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

      if (isWaived) {
        amount = 0;
      } else {
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

  const validateOrderReady = useCallback(() => {
    if (chargesLoading || profileLoading) return "Syncing taxes...";
    if (blockedVendorNames.length > 0) return `Store Closed: ${blockedVendorNames.join(', ')}`;
    if (totalItems === 0) return "Bag is empty";
    if (totalPrice < 40) return "Min items value ₹40 required";
    if (!customerName.trim()) return "Enter Full Name";
    if (customerPhone.length !== 10) return "Enter 10-digit Phone";
    if (customerAddress.trim().length < 3) return "Enter House/Street Details";
    if (customerPincode.length !== 6) return "Enter 6-digit Pincode";
    return null;
  }, [blockedVendorNames, totalPrice, totalItems, customerName, customerPhone, customerAddress, customerPincode, chargesLoading, profileLoading]);

  const executeOrderPlacement = useCallback(() => {
    if (!firestore || isPlacing || blockedVendorNames.length > 0) return;
    
    setIsPlacing(true);
    setValidationError(null);

    const orderId = Math.floor(10000 + Math.random() * 90000).toString();
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
        instructions: item.instructions || ''
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
      instructions,
      isPremiumOrder: isPremium
    };

    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
      audio.volume = 0.8;
      audio.play().catch(() => {});
    } catch (e) {}

    setShowSuccessOverlay(true);

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
      router.replace(`/orders/track?id=${orderId}`);
    }, 1600);
    
  }, [firestore, isPlacing, user, useCoins, coinValue, coinDiscount, premiumPackaging, customerAddress, customerCity, customerPincode, cart, customerName, customerPhone, totalPrice, dynamic_charges, grandTotal, paymentMethod, utrNumber, latitude, longitude, appliedCoupon, instructions, clearCart, router, deliveryTip, blockedVendorNames, isPremium]);

  const updateVisuals = (x: number, isDragging: boolean) => {
    if (!sliderRef.current) return;
    sliderRef.current.style.setProperty('--slide-x', `${x}px`);
    sliderRef.current.style.setProperty('--slide-opacity', isDragging ? '1' : '0');
    sliderRef.current.style.setProperty('--slide-scale', isDragging ? '1.02' : '1');
    sliderRef.current.style.setProperty('--slide-transition', isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.23, 1, 0.32, 1), width 0.4s cubic-bezier(0.23, 1, 0.32, 1)');
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isPlacing || blockedVendorNames.length > 0 || profileLoading || chargesLoading) return;
    
    setValidationError(null);
    isDraggingRef.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    
    const rect = sliderRef.current!.getBoundingClientRect();
    const handleWidth = 64;
    const maxPath = rect.width - handleWidth - 16;
    let x = e.clientX - rect.left - (handleWidth / 2);
    x = Math.max(0, Math.min(x, maxPath));
    currentXRef.current = x;
    updateVisuals(x, true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const handleWidth = 64;
    const maxPath = rect.width - handleWidth - 16;
    
    let x = e.clientX - rect.left - (handleWidth / 2);
    x = Math.max(0, Math.min(x, maxPath));
    
    currentXRef.current = x;
    updateVisuals(x, true);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !sliderRef.current) return;
    isDraggingRef.current = false;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const handleWidth = 64;
    const maxPath = rect.width - handleWidth - 16;
    
    const threshold = maxPath * 0.85;

    if (currentXRef.current >= threshold) {
      const error = validateOrderReady();
      if (error) {
        setValidationError(error);
        toast({ variant: "destructive", title: "Wait...", description: error });
        resetSlider();
        return;
      }

      currentXRef.current = maxPath;
      updateVisuals(maxPath, false);
      
      if (paymentMethod === 'online') {
        setIsPaymentDialogOpen(true);
        setPaymentStep('selection');
        setTimeout(() => resetSlider(), 500);
      } else {
        executeOrderPlacement();
      }
    } else {
      resetSlider();
    }
  };

  const resetSlider = () => {
    currentXRef.current = 0;
    updateVisuals(0, false);
  };

  const handleApplyCoupon = async (e: React.MouseEvent) => {
    e.preventDefault();
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

  const handleOnlinePaymentFlow = (e: React.MouseEvent) => {
    e.preventDefault();
    window.open(upiUri);
    setPaymentStep('utr');
  };

  const handleMapPinConfirm = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    localStorage.setItem('user_plus_code', `${lat},${lng}`);
    setIsMapOpen(false);
    toast({ title: "Location Set! 📍", description: "Your pin has been saved." });
  };

  if (!isMounted) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-white">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />
      
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b border-gray-100 shadow-sm">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100"><ChevronLeft className="h-6 w-6 text-gray-700" /></button>
        <h1 className="text-lg font-bold text-gray-800 italic uppercase tracking-tighter">Secure Checkout</h1>
      </div>

      <div className="p-4 space-y-4 max-w-lg mx-auto transform-gpu pb-20">
        
        {isPremium && !profileLoading && (
          <div className="bg-amber-50 border-2 border-dashed border-amber-200 rounded-[2rem] p-6 flex items-center gap-4 animate-in fade-in zoom-in-95 duration-500">
             <div className="h-12 w-12 bg-amber-400 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Crown className="h-6 w-6 fill-white" />
             </div>
             <div>
                <h4 className="font-black italic uppercase text-amber-900 text-sm">Elite Privilege Active</h4>
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-relaxed">
                   Unlimited Free Delivery & Taxes waived for you!
                </p>
             </div>
          </div>
        )}

        {blockedVendorNames.length > 0 && (
          <div className="bg-red-50 border-2 border-dashed border-red-200 rounded-[2rem] p-6 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-500">
             <div className="flex items-center gap-3 text-red-600">
                <AlertCircle className="h-6 w-6 animate-pulse" />
                <h4 className="font-black italic uppercase text-sm">Store is Closed</h4>
             </div>
             <p className="text-[10px] font-bold text-red-700 uppercase leading-relaxed">
                Currently <b>{blockedVendorNames.join(', ')}</b> is not accepting orders. Please remove their products to proceed.
             </p>
          </div>
        )}

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 mb-4"><ShoppingBasket className="h-5 w-5 text-[#C5A021]" /><h2 className="text-sm font-black text-gray-800 uppercase tracking-widest italic">Items In Bag</h2></div>
          <div className="space-y-4">
            {cart.map((item) => {
              const vendor = vendors?.find(v => v.id === item.vendorId);
              const isItemOffline = vendor?.isOnline === false;

              return (
                <div key={item.id + (item.selectedOption?.name || '')} className={cn("flex gap-4 items-start transition-opacity", isItemOffline && "opacity-60")}>
                  <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-muted shrink-0 border border-gray-100 shadow-sm mt-1">
                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                    {isItemOffline && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <X className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                       <h3 className="font-bold text-xs text-gray-800 truncate uppercase">{item.name}</h3>
                       {isItemOffline && (
                         <span className="text-[7px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 uppercase animate-pulse">Closed</span>
                       )}
                    </div>
                    {item.selectedOption && <p className="text-[8px] font-black text-primary uppercase italic">{item.selectedOption.name}</p>}
                    
                    {item.instructions && (
                      <div className="mt-1 flex items-start gap-1 bg-primary/5 px-2 py-1 rounded-lg border border-primary/10">
                        <MessageSquareQuote className="h-2.5 w-2.5 text-primary shrink-0 mt-0.5" />
                        <p className="text-[8px] font-bold text-primary italic leading-tight">{item.instructions}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg h-7 px-1">
                        <button onClick={() => removeFromCart(item.id)} className="w-6 h-full flex items-center justify-center font-bold text-gray-500">-</button>
                        <span className="w-5 text-center text-[10px] font-black">{item.quantity}</span>
                        <button onClick={() => !isItemOffline && addToCart(item)} disabled={isItemOffline} className={cn("w-6 h-full flex items-center justify-center font-bold text-gray-500", isItemOffline && "opacity-20 cursor-not-allowed")}>+</button>
                      </div>
                      <div className={cn("text-sm font-black text-gray-900 italic", !isMounted && "invisible")}>₹{item.price.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 mb-4"><MessageSquareQuote className="h-5 w-5 text-[#C5A021]" /><h2 className="text-sm font-black text-gray-800 uppercase italic">Cooking Instructions</h2></div>
          <Textarea 
            placeholder="Anything else we should know? (e.g. Ring the bell, avoid chilli)" 
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            className="rounded-2xl bg-gray-50 border-none font-medium min-h-[80px] p-4 text-xs"
          />
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 transition-all hover:shadow-lg">
          <div className="flex items-center gap-2 mb-4"><MapPin className="h-5 w-5 text-[#C5A021]" /><h2 className="text-sm font-black text-gray-800 uppercase italic">Delivery Spot</h2></div>
          <div className="space-y-4">
              <button type="button" onClick={() => setIsMapOpen(true)} className="w-full h-11 bg-black text-white rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all"><MapIcon className="h-4 w-4" /> PIN ON GOOGLE MAP</button>
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Full Name</label>
                      <Input placeholder="E.G. RAHUL SINGH *" value={customerName} onChange={e => setCustomerName(e.target.value.toUpperCase())} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Pincode</label>
                      <Input placeholder="PINCODE *" value={customerPincode} onChange={e => setCustomerPincode(e.target.value.replace(/\D/g,'').slice(0, 6))} className="h-12 rounded-xl bg-gray-50 border-none font-bold text-center" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-gray-400 ml-1">City</label>
                      <Input placeholder="CITY *" value={customerCity} readOnly className="h-12 rounded-xl bg-gray-50 border-none font-bold opacity-60 text-center" />
                   </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Address Details</label>
                   <Textarea placeholder="HOUSE NO / STREET DETAILS *" value={customerAddress} onChange={e => setCustomerAddress(e.target.value.toUpperCase())} className="rounded-xl bg-gray-50 border-none font-medium min-h-[90px] p-4 text-xs" />
                </div>
                <div className="space-y-1">
                   <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Mobile Number</label>
                   <Input placeholder="10 DIGIT PHONE NUMBER *" value={customerPhone} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g,'').slice(0, 10))} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                </div>
              </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 space-y-4 transition-all hover:shadow-lg">
           <div className="flex items-center gap-3"><div className="h-9 w-9 bg-[#C5A021]/10 rounded-xl flex items-center justify-center text-[#C5A021]"><Ticket className="h-5 w-5" /></div><h3 className="text-sm font-black uppercase italic tracking-tight">Active Offers</h3></div>
           <div className="flex gap-2">
              <div className="relative flex-1"><Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="PROMO CODE" value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} className="h-12 pl-12 rounded-xl bg-gray-50 border-none font-black tracking-widest text-[10px]" /></div>
              <button type="button" onClick={handleApplyCoupon} disabled={isVerifyingCoupon || !couponInput.trim()} className="h-12 px-6 rounded-xl bg-black text-white font-black uppercase italic text-[10px] tracking-widest active:scale-95 transition-all">{isVerifyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'APPLY'}</button>
           </div>
           {appliedCoupon && (
             <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex items-center justify-between"><span className="text-[10px] font-black text-green-700 uppercase">'{appliedCoupon.code}' APPLIED!</span><button onClick={() => setAppliedCoupon(null)}><X className="h-3.5 w-3.5 text-green-700" /></button></div>
           )}
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 flex items-center justify-between transition-all hover:shadow-lg">
          <div className="flex items-center gap-3"><div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shadow-inner"><Coins className="h-6 w-6" /></div><div><h3 className="text-sm font-black uppercase tracking-tight italic">ShopyKart Coins</h3><p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Balance: {availableCoins} Coins</p></div></div>
          <Switch checked={useCoins} onCheckedChange={setUseCoins} disabled={availableCoins <= 0} className="data-[state=checked]:bg-amber-50" />
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 flex items-center justify-between transition-all hover:shadow-lg">
          <div className="flex items-center gap-3"><div className="h-10 w-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-500 shadow-inner"><Package className="h-6 w-6" /></div><div><h3 className="text-sm font-black uppercase tracking-tight italic">Premium Packaging</h3><p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Extra safety & premium feel • ₹10</p></div></div>
          <Switch checked={premiumPackaging} onCheckedChange={setPremiumPackaging} className="data-[state=checked]:bg-rose-50" />
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
                <button type="button" onClick={() => setDeliveryTip(0)} className="text-[10px] font-black text-primary uppercase underline">Remove</button>
              )}
           </div>
           
           <div className="grid grid-cols-4 gap-2">
              {[20, 30, 50].map((amount) => (
                <button
                  type="button"
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
                      type="button"
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
                 <DialogContent className="rounded-[2.5rem] max-w-xs">
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
                        type="button"
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
                type="button"
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
                type="button"
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

        {!isPremium && (
          <div className="bg-gradient-to-br from-[#1C1C1C] to-black rounded-[2rem] p-6 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="absolute top-0 right-0 h-full w-24 bg-white/5 -skew-x-12 translate-x-10" />
             <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="h-12 w-12 bg-amber-400 rounded-2xl flex items-center justify-center text-black shadow-xl shadow-amber-500/20">
                      <Crown className="h-6 w-6 fill-black" />
                   </div>
                   <div className="flex flex-col">
                      <h4 className="text-white font-black italic uppercase text-sm leading-none">2 MONTHS UNLIMITED FREE DELIVERY!</h4>
                      <p className="text-amber-400 text-[8px] font-bold uppercase tracking-widest mt-1">Join Elite & Enjoy Exclusive Benefits.</p>
                   </div>
                </div>
                <button 
                  onClick={() => router.push('/profile?upgrade=true')}
                  className="bg-amber-500 text-white h-9 px-4 rounded-xl font-black uppercase italic text-[9px] tracking-widest active:scale-95 transition-all shadow-lg"
                >
                   Upgrade Elite
                </button>
             </div>
          </div>
        )}

        <div className="bg-white rounded-[2rem] p-7 shadow-[0_0_15px_rgba(197,160,33,0.05)] border-2 border-[#C5A021]/40 space-y-4 transition-all hover:shadow-lg">
          <h3 className="text-sm font-black text-gray-800 uppercase italic">Billing Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between font-bold text-[11px] text-gray-500 uppercase tracking-widest"><span>Item Total</span><span className={cn(!isMounted && "invisible")}>₹{totalPrice.toFixed(2)}</span></div>
            {chargesLoading || profileLoading ? (
              <div className="flex justify-between font-bold text-[11px] text-gray-300 uppercase tracking-widest animate-pulse">
                <span>Calculating Taxes...</span>
                <span>--</span>
              </div>
            ) : (
              dynamic_charges.map((charge: any) => {
                return (
                  <div key={charge.id} className="flex justify-between font-bold text-[11px] text-gray-400 uppercase tracking-widest">
                    <span>{charge.name}</span>
                    {charge.isWaived ? (
                      <span className="text-green-600 font-black flex items-center gap-1"><ShieldCheck className="h-2.5 w-2.5" /> FREE (Elite)</span>
                    ) : (
                      <span>₹{charge.calculatedAmount.toFixed(2)}</span>
                    )}
                  </div>
                );
              })
            )}
            {premiumPackaging && <div className="flex justify-between font-bold text-[11px] text-rose-500 uppercase tracking-widest"><span>Premium Packaging</span><span>₹10.00</span></div>}
            {appliedCoupon && <div className="flex justify-between font-black text-[11px] text-green-600 uppercase tracking-widest"><span>Discount</span><span>- ₹{couponDiscount.toFixed(2)}</span></div>}
            {useCoins && coinDiscount > 0 && <div className="flex justify-between font-black text-[11px] text-amber-600 uppercase tracking-widest"><span>Coins Redeemed</span><span>- ₹{coinDiscount.toFixed(2)}</span></div>}
            {deliveryTip > 0 && <div className="flex justify-between font-black text-[11px] text-orange-600 uppercase tracking-widest"><span>Delivery Tip</span><span>₹{deliveryTip.toFixed(2)}</span></div>}
          </div>
          <div className="pt-5 border-t border-dashed border-gray-100 flex justify-between items-center"><span className="text-base font-black text-gray-800 uppercase italic tracking-tighter">Total Payable</span><span className={cn("text-3xl font-black text-primary italic tracking-tighter", !isMounted && "invisible")}>₹{grandTotal.toFixed(2)}</span></div>
        </div>

        <div className="bg-white border-t-2 border-[#C5A021]/40 p-5 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] flex flex-col gap-3 rounded-[3rem] transform-gpu mt-8">
           
           {validationError && (
             <div className="px-4 py-2 bg-red-50 border border-red-100 rounded-xl animate-in slide-in-from-bottom-2 duration-300">
               <p className="text-[10px] font-black text-red-600 uppercase tracking-tight text-center">{validationError}</p>
             </div>
           )}

           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <div className="h-11 w-11 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">{paymentMethod === 'online' ? <CreditCard className="h-5 w-5 text-gray-700" /> : <Banknote className="h-5 w-5 text-gray-700" />}</div>
                 <div className="flex flex-col"><span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1.5">Settling via</span><span className="text-sm font-black italic uppercase text-gray-900 leading-none">{paymentMethod === 'online' ? 'UPI / Online' : 'Cash on Delivery'}</span></div>
              </div>
           </div>
           
           <div 
             ref={sliderRef}
             onPointerDown={handlePointerDown}
             onPointerMove={handlePointerMove}
             onPointerUp={handlePointerUp}
             onPointerLeave={handlePointerUp}
             className={cn(
               "relative h-20 w-full rounded-[2.5rem] flex items-center select-none touch-none transform-gpu overflow-hidden cursor-pointer",
               (isPlacing || blockedVendorNames.length > 0 || chargesLoading || profileLoading) ? "bg-gray-200" : "bg-[#F3F4F6] border-2 border-emerald-600/30"
             )}
             style={{
               ['--slide-x' as any]: '0px',
               ['--slide-opacity' as any]: '0',
               ['--slide-scale' as any]: '1',
               ['--slide-transition' as any]: 'none'
             }}
           >
              <div 
                className="absolute left-0 top-0 bottom-0 bg-emerald-600/10 pointer-events-none"
                style={{ 
                  width: 'calc(var(--slide-x) + 32px)',
                  transition: 'var(--slide-transition)'
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="flex items-center gap-2">
                    <span className="text-sm font-black uppercase italic tracking-tighter text-emerald-900/40">
                      {isPlacing ? 'PLACING...' : blockedVendorNames.length > 0 ? 'STORE CLOSED' : (chargesLoading || profileLoading) ? 'SYNCING TAXES...' : (validationError ? 'CHECK ERRORS ABOVE' : 'SLIDE TO PLACE ORDER')}
                    </span>
                    {!isPlacing && !chargesLoading && !profileLoading && <ArrowRight className="h-4 w-4 text-emerald-600/40 animate-bounce-x" />}
                 </div>
              </div>

              <div 
                className={cn(
                  "absolute left-2 w-16 h-16 bg-emerald-600 rounded-full flex items-center justify-center shadow-2xl transform-gpu z-20 border-4 border-white/20",
                  (isPlacing || chargesLoading || profileLoading) && "animate-pulse"
                )}
                style={{ 
                  transform: 'translateX(var(--slide-x)) scale(var(--slide-scale))',
                  transition: 'var(--slide-transition)'
                }}
              >
                {(isPlacing || chargesLoading || profileLoading) ? (
                  <Loader2 className="h-7 w-7 text-white animate-spin" />
                ) : (
                  <ArrowRight className="h-8 w-8 text-white stroke-[4]" />
                )}
              </div>
           </div>
        </div>
      </div>

      <div className="fixed top-0 left-0 right-0 z-[10001] pointer-events-none">
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="rounded-[2.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none pointer-events-auto">
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
                    <Button type="button" onClick={handleOnlinePaymentFlow} className="w-full h-18 py-8 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase italic text-lg shadow-2xl active:scale-95 transition-all">PAY & PROCEED</Button>
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
                        <p className="text-[9px] font-bold text-blue-700 uppercase leading-relaxed">UTR verify hone ke baad order accept hoga. Wrong UTR se order cancel ho sakta hai.</p>
                    </div>
                    
                    <Button 
                      type="button"
                      onClick={executeOrderPlacement} 
                      disabled={utrNumber.length !== 12 || isPlacing}
                      className="w-full h-16 rounded-[2rem] bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase italic text-lg shadow-xl active:scale-95 transition-all"
                    >
                      {isPlacing ? <Loader2 className="h-6 w-6 animate-spin" /> : "VERIFY & PLACE ORDER"}
                    </Button>
                  </div>
                  <button type="button" onClick={() => setPaymentStep('selection')} className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest underline">Wait, I haven't paid yet</button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="rounded-t-[3rem] sm:rounded-[3rem] max-w-sm h-[650px] p-0 overflow-hidden border-none shadow-2xl bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
          <DialogHeader className="sr-only"><DialogTitle>Pin Delivery Location</DialogTitle></DialogHeader>
          <MapPicker onConfirm={handleMapPinConfirm} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
