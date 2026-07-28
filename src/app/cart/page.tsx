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
  Ticket, 
  X, 
  CheckCircle2, 
  Hash,
  Package,
  MessageSquareQuote,
  AlertCircle,
  ArrowRight,
  Crown,
  Bike,
  Camera,
  ImageIcon,
  Trash2,
  Smartphone,
  UserCheck,
  Wallet,
  Save,
  Pencil,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, increment, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { compressImage } from '@/lib/image-utils';

function CartContent() {
  const { cart, addToCart, removeFromCart, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [useCoins, setUseCoins] = useState(false);
  const [premiumPackaging, setPremiumPackaging] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [housePhoto, setHousePhoto] = useState<string | null>(null);
  
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);

  const [deliveryTip, setDeliveryTip] = useState<number>(0);
  
  // ADDRESS EDITING STATE
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState(''); 
  const [customerCity, setCustomerCity] = useState('');

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
  const { data: dbCharges, loading: chargesLoading } = useCollection<any>(chargesQuery);

  const customSurchargeTotal = useMemo(() => {
    if (isPremium) return 0;
    return cart.reduce((acc, item) => acc + (Number(item.customSurcharge) || 0), 0);
  }, [cart, isPremium]);

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
      if (isPremium) {
        amount = 0;
      } else {
        if (charge.type === 'fixed') amount = chargeVal;
        else if (charge.type === 'percentage') amount = (totalPrice * chargeVal) / 100;
      }
      return { ...charge, calculatedAmount: amount, isWaived: isPremium };
    });
  }, [dbCharges, totalPrice, isPremium, profileLoading, chargesLoading]);

  const chargesTotalSum = useMemo(() => {
    return dynamic_charges.reduce((acc, curr) => acc + (Number(curr.calculatedAmount) || 0), 0);
  }, [dynamic_charges]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return (totalPrice * (appliedCoupon.discountValue || 0)) / 100;
    } else if (appliedCoupon.discountType === 'fixed') {
      return appliedCoupon.discountValue || 0;
    }
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

  const grandTotal = Math.max(0, totalPrice + chargesTotalSum + customSurchargeTotal + deliveryTip + (premiumPackaging && !isPremium ? 10 : 0) - coinDiscount - couponDiscount);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedName = localStorage.getItem('user_name') || localStorage.getItem('last_customer_name');
    const savedPhone = localStorage.getItem('user_phone') || localStorage.getItem('last_customer_phone');
    const savedAddress = localStorage.getItem('user_address_line') || localStorage.getItem('last_customer_address');
    const savedCity = localStorage.getItem('user_city');

    setCustomerName(profile?.fullName || savedName || '');
    setCustomerPhone(profile?.phoneNumber || savedPhone || '');
    setCustomerAddress(profile?.address || savedAddress || '');
    setCustomerCity(profile?.city || savedCity || '');
  }, [profile]);

  const handleSaveAddress = async () => {
    if (!customerName || customerPhone.length < 10 || !customerAddress) {
      toast({ variant: "destructive", title: "Missing details" });
      return;
    }
    
    if (user && firestore) {
      try {
        await setDoc(doc(firestore, 'users', user.uid), {
          fullName: customerName.toUpperCase(),
          phoneNumber: customerPhone,
          address: customerAddress.toUpperCase(),
          updatedAt: serverTimestamp()
        }, { merge: true });
        localStorage.setItem('user_name', customerName.toUpperCase());
        localStorage.setItem('user_phone', customerPhone);
      } catch (e) {}
    }
    setIsEditingAddress(false);
    toast({ title: "Address Saved!" });
  };

  const handleVerifyCoupon = async () => {
    if (!couponInput.trim() || !firestore) return;
    setIsVerifyingCoupon(true);
    try {
      const q = query(collection(firestore, 'coupons'), where('code', '==', couponInput.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const cData = snap.docs[0].data();
        const minVal = cData.minOrderValue || parseFloat(cData.minOrder?.replace(/[^0-9.]/g, '')) || 0;
        if (totalPrice < minVal) {
          toast({ variant: "destructive", title: "Coupon not valid", description: `Minimum order of ₹${minVal} required.` });
        } else {
          setAppliedCoupon(cData);
          toast({ title: "Coupon Applied! ✨" });
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
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth-overlay'));
      setSliderValue(0);
      return;
    }
    if (!firestore) return;
    if (!customerName || customerPhone.length < 10 || !customerAddress) {
      toast({ variant: "destructive", title: "Address Required" });
      setIsEditingAddress(true);
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
      items: cart,
      subtotal: totalPrice,
      total: grandTotal,
      charges: dynamic_charges.map(c => ({ name: c.name, amount: c.calculatedAmount })),
      instructions: instructions.trim(),
      paymentMethod,
      paymentStatus: paymentMethod === 'online' ? 'UTR_Pending_Verification' : 'Pending',
      utrNumber: paymentMethod === 'online' ? utrNumber : null,
      housePhotoUrl: housePhoto,
      status: 'Placed',
      isPremiumOrder: isPremium,
      deliveryTip,
      premiumPackaging: isPremium ? false : premiumPackaging,
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
    <div className="min-h-screen bg-[#FDFBF7]">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />
      
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b border-gray-100 shadow-sm">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"><ChevronLeft className="h-6 w-6 text-gray-700" /></button>
        <h1 className="text-lg font-bold text-gray-800 italic uppercase tracking-tighter">Secure Checkout</h1>
      </div>

      <div className="p-4 space-y-5 max-w-lg mx-auto transform-gpu pb-52">
        
        {/* 1. ADDED PRODUCTS SECTION */}
        <div className="space-y-3">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Your Selection</h3>
           <div className="flex overflow-x-auto space-x-3 no-scrollbar pb-2 px-1">
              {cart.map((item, i) => (
                <div key={i} className="min-w-[120px] bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center gap-2">
                   <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-muted">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                   </div>
                   <div className="min-w-0 w-full">
                      <p className="text-[9px] font-black uppercase italic truncate leading-none mb-1">{item.name}</p>
                      <p className="text-[8px] font-bold text-primary">QTY: {item.quantity}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* 2. GOURMET ADDRESS BAR */}
        <div className="bg-gradient-to-r from-[#4A4232] to-[#2D281E] rounded-2xl p-4 shadow-xl flex items-center justify-between border border-white/5">
           <div className="flex items-center gap-3 min-w-0">
              <div className="bg-amber-400 p-2 rounded-xl text-black shadow-lg shrink-0">
                 <MapPin className="h-5 w-5 fill-current" />
              </div>
              {!isEditingAddress ? (
                <div className="min-w-0">
                   <p className="text-[11px] font-black text-[#D9C4A9] leading-tight truncate">Delivery to: {customerName || 'Set Recipient'}</p>
                   <p className="text-[10px] font-bold text-[#D9C4A9]/70 truncate uppercase tracking-tighter">{customerAddress || 'Enter Full Address'}</p>
                </div>
              ) : (
                <div className="flex-1 space-y-2 py-2">
                   <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Recipient Name" className="h-9 bg-white/5 border-white/10 text-white text-xs font-bold rounded-lg placeholder:text-gray-500" />
                   <Input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="10 Digit Phone" className="h-9 bg-white/5 border-white/10 text-white text-xs font-bold rounded-lg placeholder:text-gray-500" />
                   <Textarea value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Full Address / Landmark" className="min-h-[60px] bg-white/5 border-white/10 text-white text-xs font-bold rounded-lg placeholder:text-gray-500" />
                </div>
              )}
           </div>
           {!isEditingAddress ? (
             <button onClick={() => setIsEditingAddress(true)} className="bg-[#D9C4A9]/10 border border-[#D9C4A9]/20 text-[#D9C4A9] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest active:scale-90 transition-all ml-3">Change</button>
           ) : (
             <button onClick={handleSaveAddress} className="bg-amber-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest active:scale-90 transition-all ml-3 shadow-lg">Save</button>
           )}
        </div>

        {/* 3. GOURMET ENHANCEMENTS BOX (Premium Packing & Wallet Points) */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-5">
           <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-900">Gourmet Enhancements</h3>
           </div>

           <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                 <div className="bg-rose-50 p-2.5 rounded-xl text-rose-500">
                    <Package className="h-5 w-5" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xs font-black uppercase italic leading-none">Premium Packing</span>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Extra layered protection • ₹10</span>
                 </div>
              </div>
              <Switch checked={isPremium ? true : premiumPackaging} onCheckedChange={setPremiumPackaging} disabled={isPremium} className="data-[state=checked]:bg-rose-500" />
           </div>

           <div className="h-[1px] w-full bg-gray-50" />

           <div className="flex items-center justify-between group">
              <div className="flex items-center gap-3">
                 <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
                    <Coins className="h-5 w-5 fill-amber-500/20" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-xs font-black uppercase italic leading-none">Redeem Wallet Coins</span>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Available: {availableCoins} Coins (₹{(availableCoins * coinValue).toFixed(0)})</span>
                 </div>
              </div>
              <Switch checked={useCoins} onCheckedChange={setUseCoins} disabled={availableCoins <= 0} className="data-[state=checked]:bg-amber-500" />
           </div>
        </div>

        {/* 4. BILL DETAILS CARD */}
        <div className="bg-gradient-to-b from-[#4A4232] to-[#2D281E] rounded-[2rem] p-8 shadow-2xl border border-white/5 text-[#D9C4A9]">
           <h2 className="text-xl font-black italic uppercase tracking-tight mb-6">Bill Summary</h2>
           
           <div className="space-y-4 mb-8">
              {cart.map((item, i) => (
                <div key={i} className="flex justify-between items-center group">
                   <span className="text-sm font-bold uppercase italic tracking-tight truncate flex-1 mr-4">{item.name}</span>
                   <span className="text-xs font-black opacity-60">x {item.quantity}</span>
                </div>
              ))}
           </div>

           <div className="h-[1px] w-full bg-[#D9C4A9]/10 mb-6" />

           <div className="space-y-4">
              <h3 className="text-sm font-black italic uppercase tracking-widest opacity-80 mb-2">Detailed Breakdown:</h3>
              <div className="flex justify-between items-center text-sm font-medium">
                 <span>Items Subtotal:</span>
                 <span className="font-black italic text-white">₹{totalPrice.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                 <span>Delivery & Handling:</span>
                 <span className="font-black italic text-white">₹{chargesTotalSum.toFixed(0)}</span>
              </div>
              {premiumPackaging && !isPremium && (
                <div className="flex justify-between items-center text-sm font-medium">
                   <span>Premium Packing:</span>
                   <span className="font-black italic text-white">₹10</span>
                </div>
              )}
              {coinDiscount > 0 && (
                <div className="flex justify-between items-center text-sm font-medium text-amber-400">
                   <span>Coin Discount:</span>
                   <span className="font-black italic">-₹{coinDiscount.toFixed(0)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between items-center text-sm font-medium text-green-400">
                   <span>Promo Discount:</span>
                   <span className="font-black italic">-₹{couponDiscount.toFixed(0)}</span>
                </div>
              )}
              
              <div className="pt-6 mt-6 border-t border-dashed border-[#D9C4A9]/20 flex justify-between items-center">
                 <span className="text-lg font-black italic uppercase tracking-tighter">Grand Total:</span>
                 <span className="text-3xl font-black text-amber-400 italic tracking-tighter">₹{grandTotal.toFixed(0)}</span>
              </div>
           </div>
        </div>

        {/* 5. SELECT PAYMENT MODE CARD */}
        <div className="bg-gradient-to-b from-[#4A4232] to-[#2D281E] rounded-[2rem] p-8 shadow-2xl border border-white/5 text-[#D9C4A9]">
           <h2 className="text-lg font-black italic uppercase tracking-tight mb-6">Select Payment Mode:</h2>
           
           <div className="space-y-5">
              <button 
                onClick={() => { setPaymentMethod('online'); setPaymentStep('selection'); setIsPaymentDialogOpen(true); }}
                className="w-full flex items-center gap-4 group active:scale-[0.98] transition-all"
              >
                 <div className={cn(
                   "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                   paymentMethod === 'online' ? "border-amber-400 bg-amber-400" : "border-[#D9C4A9]/30"
                 )}>
                    {paymentMethod === 'online' && <div className="h-2 w-2 rounded-full bg-black" />}
                 </div>
                 <div className="text-left">
                    <p className="text-sm font-black uppercase italic tracking-tight">Pay with UPI / QR / App</p>
                    <span className="text-[8px] font-bold text-[#D9C4A9]/50 uppercase tracking-widest">PhonePe, GPay, Paytm</span>
                 </div>
              </button>

              <button 
                onClick={() => setPaymentMethod('cod')}
                className="w-full flex items-center gap-4 group active:scale-[0.98] transition-all"
              >
                 <div className={cn(
                   "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                   paymentMethod === 'cod' ? "border-amber-400 bg-amber-400" : "border-[#D9C4A9]/30"
                 )}>
                    {paymentMethod === 'cod' && <div className="h-2 w-2 rounded-full bg-black" />}
                 </div>
                 <div className="text-left">
                    <p className="text-sm font-black uppercase italic tracking-tight">Cash on Delivery</p>
                    <span className="text-[8px] font-bold text-[#D9C4A9]/50 uppercase tracking-widest">Pay at your doorstep</span>
                 </div>
              </button>
           </div>
        </div>

        {/* 6. COUPON SECTION */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
           <div className="flex items-center gap-2 mb-4 text-primary"><Ticket className="h-4 w-4" /><h3 className="text-[10px] font-black uppercase tracking-widest">Add Coupon</h3></div>
           <div className="flex gap-2">
              <Input value={couponInput} onChange={e => setCouponInput(e.target.value)} placeholder="PROMO CODE" className="h-11 bg-gray-50 border-none font-bold uppercase text-[10px] tracking-widest" />
              <Button onClick={handleVerifyCoupon} disabled={isVerifyingCoupon} className="h-11 rounded-xl px-6 bg-black">{isVerifyingCoupon ? <Loader2 className="animate-spin h-4 w-4" /> : 'APPLY'}</Button>
           </div>
           {appliedCoupon && <div className="mt-3 flex items-center justify-between bg-green-50 p-3 rounded-xl border border-green-100 text-green-700 text-[10px] font-black uppercase animate-in slide-in-from-top-2"><span>'{appliedCoupon.code}' Applied</span><button onClick={() => setAppliedCoupon(null)}><X className="h-3.5 w-3.5" /></button></div>}
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

      {/* 7. SMOOTH SLIDER TO ORDER */}
      <div className="fixed bottom-0 left-0 right-0 z-[5000] bg-white/80 backdrop-blur-xl border-t border-gray-100 p-5 pb-8 shadow-[0_-20px_40px_rgba(0,0,0,0.1)] transform-gpu flex justify-center">
         <div className="max-w-md w-full">
            <div 
              ref={sliderRef}
              className="relative w-full h-20 bg-gray-100/50 rounded-[2.5rem] overflow-hidden flex items-center p-2 group select-none shadow-inner border border-gray-200/50"
              onTouchStart={() => { isDragging.current = true; }}
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
                    "text-[10px] font-black uppercase tracking-[0.4em] transition-opacity duration-300",
                    sliderValue > 15 ? "opacity-0" : "opacity-30 animate-pulse text-gray-600"
                  )}>
                    Slide to Order
                  </span>
               </div>

               <div 
                 className="absolute left-0 top-0 bottom-0 bg-primary transition-[width] duration-75 ease-out"
                 style={{ width: `${sliderValue}%` }}
               />

               <div 
                 className="relative z-10 h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-2xl cursor-grab active:cursor-grabbing transition-[transform] duration-75 ease-out flex-shrink-0"
                 style={{ transform: `translateX(${sliderValue * 0.01 * ((sliderRef.current?.clientWidth || 0) - 80)}px)` }}
               >
                  {isPlacing ? (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  ) : sliderValue > 90 ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : (
                    <ArrowRight className="h-7 w-7 text-primary stroke-[3]" />
                  )}
               </div>

               <div className="absolute right-6 pointer-events-none z-10 flex items-center gap-3">
                  <span className="text-xl font-black italic tracking-tighter text-gray-900">₹{grandTotal.toFixed(0)}</span>
                  <div className="h-7 w-7 rounded-full bg-black/5 flex items-center justify-center">
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
