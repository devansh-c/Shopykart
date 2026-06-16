
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
  FileText,
  MapPin,
  ChevronRight,
  CreditCard,
  Banknote,
  ShoppingBasket,
  Coins,
  Map as MapIcon,
  Tag,
  Ticket,
  CheckCircle2,
  X,
  History,
  ChevronUp,
  AlertTriangle,
  QrCode,
  Smartphone,
  ShieldCheck,
  ExternalLink,
  Zap
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, increment, query, where, getDocs, getDoc } from 'firebase/firestore';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { RadioGroup } from "@/components/ui/radio-group";
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

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
  
  const [instructions, setInstructions] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [useCoins, setUseCoins] = useState(false);
  
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState(''); 
  const [customerCity, setCustomerCity] = useState('');
  const [customerPincode, setCustomerPincode] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const [deliveryTip, setDeliveryTip] = useState(0);
  const [isCustomTipOpen, setIsCustomTipOpen] = useState(false);
  const [customTipValue, setCustomTipValue] = useState('');

  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

  const [slideX, setSlideX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const paymentSectionRef = useRef<HTMLDivElement>(null);

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
    return dbCharges.map(charge => {
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
      const fixed = parseFloat(discountStr.replace(/[^0-9.]/g, ''));
      return fixed;
    }
  }, [appliedCoupon, totalPrice]);

  const coinDiscount = useMemo(() => {
    if (!useCoins || availableCoins <= 0 || coinValue <= 0) return 0;
    const remainingTotal = Math.max(0, totalPrice - couponDiscount);
    return Math.min(remainingTotal, availableCoins * coinValue);
  }, [useCoins, availableCoins, coinValue, totalPrice, couponDiscount]);

  const grandTotal = Math.max(0, totalPrice + chargesTotalSum + customSurchargeTotal + Number(deliveryTip) - coinDiscount - couponDiscount);

  const upiId = "9450355709@axl";
  const upiUri = useMemo(() => {
    return `upi://pay?pa=${upiId}&pn=ShopyKart&am=${grandTotal.toFixed(2)}&cu=INR&tn=Order_from_ShopyKart`;
  }, [grandTotal]);

  const qrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiUri)}`;
  }, [upiUri]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedName = localStorage.getItem('last_customer_name');
    const savedPhone = localStorage.getItem('last_customer_phone');
    const savedAddress = localStorage.getItem('last_customer_address');
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

  const executeOrderPlacement = async () => {
    if (!firestore || isPlacing) return;

    setIsPlacing(true);
    const orderId = Math.floor(10000 + Math.random() * 90000).toString();
    const finalUid = user?.uid || 'guest_' + Date.now();

    const coinsUsed = (useCoins && coinValue > 0) ? Math.ceil(coinDiscount / coinValue) : 0;
    const fullFinalAddress = `${customerAddress}, ${customerCity} - ${customerPincode}`;

    const allVendorIds = Array.from(new Set(cart.map(item => String(item.vendorId)).filter(id => id !== 'undefined' && id !== 'null')));

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
        restaurantName: item.restaurantName || 'ShopyKart Store'
      })),
      subtotal: totalPrice,
      charges: dynamic_charges.map(c => ({ name: c.name, amount: c.calculatedAmount })),
      total: grandTotal,
      deliveryTip: Number(deliveryTip),
      status: 'Placed',
      paymentMethod,
      paymentStatus: paymentMethod === 'online' ? 'Paid_Success_Verified' : 'Pending',
      address: fullFinalAddress,
      latitude: latitude || null,
      longitude: longitude || null,
      createdAt: serverTimestamp(),
      vendorId: cart[0]?.vendorId || 'global',
      vendorIds: allVendorIds, 
      restaurantName: cart[0]?.restaurantName || 'ShopyKart Store',
      coinsEarned: 10,
      coinsUsed,
      coinDiscount,
      couponDiscount,
      couponCode: appliedCoupon?.code || null,
      instructions
    };

    try {
      await setDoc(doc(firestore, 'orders', orderId), orderData);
      
      if (user) {
        await setDoc(doc(firestore, 'users', user.uid), {
          fullName: customerName, phoneNumber: customerPhone, address: customerAddress, 
          city: customerCity, pincode: customerPincode, latitude, longitude,
          coins: increment(10 - coinsUsed), updatedAt: serverTimestamp()
        }, { merge: true });
      }

      clearCart();
      setIsPaymentDialogOpen(false);
      setIsVerifyingPayment(false);
      router.replace(`/orders/track?id=${orderId}`);
    } catch (serverError) {
      setIsPlacing(false);
      setIsVerifyingPayment(false);
      setSlideX(0);
      toast({ variant: "destructive", title: "Checkout Error" });
    }
  };

  const handleOnlinePaymentFlow = async () => {
    setIsVerifyingPayment(true);
    
    // 1. Open the UPI app link
    window.open(upiUri);

    // 2. Start Verification Timer (Simulating Bank Verification)
    // We wait for a realistic amount of time or until user returns to browser
    setTimeout(() => {
      executeOrderPlacement();
    }, 5000); // 5 seconds wait for verification
  };

  const handleCheckout = async () => {
    if (totalPrice < 35) {
      toast({ variant: "destructive", title: "Order Value Low", description: "Minimum order value is ₹35." });
      setSlideX(0);
      return;
    }

    if (!customerName.trim() || customerPhone.length !== 10 || customerAddress.trim().length < 5) {
      toast({ variant: "destructive", title: "Incomplete Details", description: "Please check your delivery details." });
      setSlideX(0);
      return;
    }

    if (paymentMethod === 'online') {
      setIsPaymentDialogOpen(true);
      setSlideX(0);
    } else {
      executeOrderPlacement();
    }
  };

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

  const onStart = useCallback(() => {
    if (isPlacing || isVerifyingPayment) return;
    setIsDragging(true);
  }, [isPlacing, isVerifyingPayment]);

  const onEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const slider = sliderRef.current;
    if (slider) {
      const maxX = slider.clientWidth - 68;
      if (slideX < maxX * 0.9) {
        setSlideX(0);
      } else {
        setSlideX(maxX);
        handleCheckout();
      }
    }
  }, [isDragging, slideX, handleCheckout]);

  const onMove = useCallback((clientX: number) => {
    if (!isDragging || isPlacing || isVerifyingPayment || !sliderRef.current) return;
    
    const slider = sliderRef.current;
    const rect = slider.getBoundingClientRect();
    const handleWidth = 52;
    const padding = 8;
    const maxX = rect.width - handleWidth - padding * 2;
    
    let x = clientX - rect.left - (handleWidth / 2);
    x = Math.max(0, Math.min(x, maxX));
    setSlideX(x);
  }, [isDragging, isPlacing, isVerifyingPayment]);

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMove = (e: any) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        onMove(clientX);
      };
      const handleGlobalEnd = () => onEnd();

      window.addEventListener('mousemove', handleGlobalMove);
      window.addEventListener('mouseup', handleGlobalEnd);
      window.addEventListener('touchmove', handleGlobalMove, { passive: false });
      window.addEventListener('touchend', handleGlobalEnd);

      return () => {
        window.removeEventListener('mousemove', handleGlobalMove);
        window.removeEventListener('mouseup', handleGlobalEnd);
        window.removeEventListener('touchmove', handleGlobalMove);
        window.removeEventListener('touchend', handleGlobalEnd);
      };
    }
  }, [isDragging, onMove, onEnd]);

  if (totalItems === 0 && !isPlacing) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white h-32 w-32 rounded-full flex items-center justify-center mb-6 shadow-sm"><ShoppingBag className="h-12 w-12 text-gray-200" /></div>
        <h2 className="text-xl font-bold text-gray-800">Your cart is empty</h2>
        <Button onClick={() => router.push('/menu')} className="rounded-xl h-12 px-8 font-bold bg-primary mt-6">BROWSE MENU</Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-64">
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b border-gray-100 shadow-sm">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100"><ChevronLeft className="h-6 w-6 text-gray-700" /></button>
        <h1 className="text-lg font-bold text-gray-800 italic uppercase tracking-tighter">Secure Checkout</h1>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
             <ShoppingBasket className="h-5 w-5 text-primary" />
             <h2 className="text-sm font-black text-gray-800 uppercase tracking-widest italic">Items In Bag</h2>
          </div>
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id + (item.selectedOption?.name || '')} className="flex gap-4 items-center">
                <div className="relative h-14 w-14 rounded-xl overflow-hidden bg-muted shrink-0 border border-gray-100 shadow-sm"><Image src={item.imageUrl} alt={item.name} fill className="object-cover" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xs text-gray-800 truncate uppercase">{item.name}</h3>
                  {item.selectedOption && <p className="text-[8px] font-black text-primary uppercase italic">{item.selectedOption.name}</p>}
                  <div className="flex items-center justify-between mt-1">
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

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4"><MapPin className="h-5 w-5 text-primary" /><h2 className="text-sm font-black text-gray-800 uppercase italic">Delivery Spot</h2></div>
          <div className="space-y-4">
              <button onClick={() => setIsMapOpen(true)} className="w-full h-11 bg-black text-white rounded-xl flex items-center justify-center gap-2 font-black uppercase text-[10px] shadow-lg active:scale-95 transition-all">
                <MapIcon className="h-4 w-4" /> PIN ON GOOGLE MAP
              </button>
              
              <div className="space-y-3">
                <Input placeholder="FULL NAME *" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="PINCODE *" value={customerPincode} onChange={e => setCustomerPincode(e.target.value.replace(/\D/g,'').slice(0, 6))} className="h-12 rounded-xl bg-gray-50 border-none font-bold text-center" />
                  <Input placeholder="CITY *" value={customerCity} readOnly className="h-12 rounded-xl bg-gray-50 border-none font-bold opacity-60 text-center" />
                </div>
                <Textarea placeholder="COMPLETE HOUSE/STREET DETAILS *" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="rounded-xl bg-gray-50 border-none font-medium min-h-[90px] p-4 text-xs" />
                <Input placeholder="10 DIGIT PHONE NUMBER *" value={customerPhone} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g,'').slice(0, 10))} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
              </div>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-4">
           <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Ticket className="h-5 w-5" /></div>
              <h3 className="text-sm font-black uppercase italic tracking-tight">Active Offers</h3>
           </div>
           <div className="flex gap-2">
              <div className="relative flex-1">
                 <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <Input placeholder="PROMO CODE" value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} className="h-12 pl-12 rounded-xl bg-gray-50 border-none font-black tracking-widest text-[10px]" />
              </div>
              <button onClick={handleApplyCoupon} disabled={isVerifyingCoupon || !couponInput.trim()} className="h-12 px-6 rounded-xl bg-black text-white font-black uppercase italic text-[10px] tracking-widest active:scale-95 transition-all">
                 {isVerifyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'APPLY'}
              </button>
           </div>
           {appliedCoupon && (
             <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-green-700 uppercase">'{appliedCoupon.code}' APPLIED!</span>
                <button onClick={() => setAppliedCoupon(null)}><X className="h-3.5 w-3.5 text-green-700" /></button>
             </div>
           )}
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 shadow-inner"><Coins className="h-6 w-6" /></div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight italic">ShopyKart Coins</h3>
              <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1">Balance: {availableCoins} Coins</p>
            </div>
          </div>
          <Switch checked={useCoins} onCheckedChange={setUseCoins} disabled={availableCoins <= 0} className="data-[state=checked]:bg-amber-500" />
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-sm font-black text-gray-800 uppercase italic">Appreciate Partner</h3>
          <div className="flex gap-3">
            {[10, 20, 30].map(tip => (
              <button 
                key={tip} 
                onClick={() => setDeliveryTip(tip)} 
                className={cn(
                  "relative flex-1 h-11 rounded-xl border-2 font-black text-[10px] transition-all", 
                  deliveryTip === tip ? "border-primary bg-primary/5 text-primary" : "border-gray-50 bg-gray-50 text-gray-400"
                )}
              >
                ₹{tip}
                {tip === 20 && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[6px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white">
                    MOST TIPPED
                  </span>
                )}
              </button>
            ))}
            <button onClick={() => setIsCustomTipOpen(true)} className={cn("flex-1 h-11 rounded-xl border-2 font-black text-[10px] transition-all", deliveryTip > 30 ? "border-primary bg-primary/5 text-primary" : "border-gray-50 bg-gray-50 text-gray-400")}>{deliveryTip > 30 ? `₹${deliveryTip}` : 'CUSTOM'}</button>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-100 space-y-4">
          <h3 className="text-sm font-black text-gray-800 uppercase italic">Billing Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between font-bold text-[11px] text-gray-500 uppercase tracking-widest"><span>Item Total</span><span>₹{totalPrice.toFixed(2)}</span></div>
            {dynamic_charges.map((charge: any) => (
              <div key={charge.id} className="flex justify-between font-bold text-[11px] text-gray-400 uppercase tracking-widest"><span>{charge.name}</span><span>₹{charge.calculatedAmount.toFixed(2)}</span></div>
            ))}
            {appliedCoupon && <div className="flex justify-between font-black text-[11px] text-green-600 uppercase tracking-widest"><span>Discount</span><span>- ₹{couponDiscount.toFixed(2)}</span></div>}
            {useCoins && coinDiscount > 0 && <div className="flex justify-between font-black text-[11px] text-amber-600 uppercase tracking-widest"><span>Coins Redeemed</span><span>- ₹{coinDiscount.toFixed(2)}</span></div>}
            {deliveryTip > 0 && <div className="flex justify-between font-black text-[11px] text-amber-500 uppercase tracking-widest"><span>Partner Tip</span><span>₹{deliveryTip.toFixed(2)}</span></div>}
          </div>
          <div className="pt-5 border-t border-dashed border-gray-100 flex justify-between items-center">
            <span className="text-base font-black text-gray-800 uppercase italic tracking-tighter">Total Payable</span>
            <span className="text-3xl font-black text-primary italic tracking-tighter">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div ref={paymentSectionRef} className="bg-white rounded-[2rem] p-7 shadow-sm border border-gray-100 space-y-5 scroll-mt-20">
          <h3 className="text-sm font-black text-gray-800 uppercase italic">Settlement Mode</h3>
          <div className="grid grid-cols-2 gap-4">
            <div onClick={() => setPaymentMethod('online')} className={cn("p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2", paymentMethod === 'online' ? "border-primary bg-primary/5" : "border-gray-50 bg-gray-50")}>
              <CreditCard className={cn("h-6 w-6", paymentMethod === 'online' ? "text-primary" : "text-gray-300")} />
              <span className="text-[9px] font-black uppercase tracking-widest">Online Pay</span>
            </div>
            <div onClick={() => setPaymentMethod('cash')} className={cn("p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2", paymentMethod === 'cash' ? "border-primary bg-primary/5" : "border-gray-50 bg-gray-50")}>
              < Banknote className={cn("h-6 w-6", paymentMethod === 'cash' ? "text-primary" : "text-gray-300")} />
              <span className="text-[9px] font-black uppercase tracking-widest">Cash on Delivery</span>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isPaymentDialogOpen} onOpenChange={(val) => { if(!isVerifyingPayment) setIsPaymentDialogOpen(val); }}>
        <DialogContent className="rounded-[2.5rem] max-w-sm p-0 overflow-hidden border-none shadow-2xl bg-white focus:outline-none">
          <div className="bg-primary h-2 w-full" />
          <div className="p-8 space-y-8 flex flex-col items-center">
            
            {isVerifyingPayment ? (
              <div className="py-10 flex flex-col items-center text-center space-y-6 animate-in fade-in duration-500">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                  <ShieldCheck className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black italic uppercase tracking-tighter">Verifying Payment</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">
                    Connecting with your bank for confirmation.<br />Please do not close this screen.
                  </p>
                </div>
                <div className="bg-muted/30 px-4 py-2 rounded-full flex items-center gap-2">
                   <Zap className="h-3 w-3 text-amber-500 animate-pulse" />
                   <span className="text-[9px] font-black uppercase tracking-widest">Secure Link Active</span>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center space-y-2">
                   <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-2">
                      <QrCode className="h-8 w-8" />
                   </div>
                   <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter">Settlement Hub</DialogTitle>
                   <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">
                     Scan QR or use UPI button to pay and place order.
                   </p>
                </div>

                <div className="relative w-full aspect-square max-w-[240px] bg-white p-4 rounded-3xl border-2 border-dashed border-gray-100 shadow-inner group">
                   <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/40 backdrop-blur-[2px] transition-opacity rounded-3xl pointer-events-none">
                      <div className="bg-black text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase">Scan to Pay</div>
                   </div>
                   <img src={qrCodeUrl} className="w-full h-full object-contain" alt="Payment QR" />
                </div>

                <div className="w-full space-y-4">
                   <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex flex-col items-center text-center gap-2">
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Payable Amount</span>
                      <div className="text-4xl font-black italic text-gray-900 tracking-tighter">₹{grandTotal.toFixed(2)}</div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <ShieldCheck className="h-3 w-3 text-green-600" />
                        <span className="text-[8px] font-black uppercase text-green-600 tracking-widest">Secured by ShopyKart Pay</span>
                      </div>
                   </div>

                   <Button 
                      onClick={handleOnlinePaymentFlow}
                      disabled={isPlacing || isVerifyingPayment}
                      className="w-full h-18 py-8 bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black uppercase italic text-lg shadow-2xl active:scale-95 transition-all"
                    >
                      <Smartphone className="mr-2 h-5 w-5" />
                      PAY & PLACE ORDER
                    </Button>
                </div>

                <button 
                  onClick={() => setIsPaymentDialogOpen(false)} 
                  className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors"
                >
                  Cancel & Change Mode
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-0 left-0 right-0 z-[10000] max-w-lg mx-auto pb-safe pointer-events-none">
        <div className="bg-white border-t border-gray-100 p-5 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] flex flex-col gap-4 pointer-events-auto rounded-t-[2.5rem]">
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <div className="h-11 w-11 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-inner">
                    {paymentMethod === 'online' ? <CreditCard className="h-5 w-5 text-gray-700" /> : <Banknote className="h-5 w-5 text-gray-700" />}
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] leading-none mb-1.5">Settling via</span>
                    <span className="text-sm font-black italic uppercase text-gray-900 leading-none">{paymentMethod === 'online' ? 'UPI / Online' : 'Cash on Delivery'}</span>
                 </div>
              </div>
              <button onClick={() => paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-1.5 bg-rose-50 px-4 py-2 rounded-full text-rose-600 font-black uppercase text-[10px] tracking-widest border border-rose-100">
                CHANGE <ChevronUp className="h-3.5 w-3.5" />
              </button>
           </div>

           <div ref={sliderRef} className="relative h-[68px] w-full bg-[#10B981] rounded-full p-2 flex items-center overflow-hidden shadow-2xl select-none touch-none">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className={cn("text-base font-black text-white uppercase italic tracking-tighter", (slideX > 40 || isPlacing || isVerifyingPayment) && "opacity-0")}>
                   {isPlacing ? 'PROCESSING...' : isVerifyingPayment ? 'VERIFYING...' : `SLIDE TO ORDER • ₹${grandTotal.toFixed(2)}`}
                 </span>
                 {(isPlacing || isVerifyingPayment) && (
                   <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                      <span className="text-sm font-black text-white uppercase italic tracking-tighter">
                        {isVerifyingPayment ? 'WAITING FOR BANK...' : 'CONFIRMING...'}
                      </span>
                   </div>
                 )}
              </div>
              <div 
                onMouseDown={onStart} 
                onTouchStart={onStart} 
                className={cn("relative z-10 h-[52px] w-[52px] rounded-full bg-white flex items-center justify-center text-[#10B981] shadow-2xl cursor-grab active:cursor-grabbing transition-transform will-change-transform", (isPlacing || isVerifyingPayment) && "pointer-events-none opacity-0")} 
                style={{ transform: `translateX(${slideX}px)` }}
              >
                 <ChevronRight className="h-7 w-7 stroke-[3]" />
              </div>
              <div className="absolute left-0 top-0 bottom-0 bg-white/10 pointer-events-none" style={{ width: `${slideX + 54}px` }} />
           </div>
        </div>
      </div>
      
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-sm h-[500px] p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>Pin Delivery Location</DialogTitle>
          </DialogHeader>
          <MapPicker onConfirm={(lat, lng) => { setLatitude(lat); setLongitude(lng); setIsMapOpen(false); }} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={isCustomTipOpen} onOpenChange={setIsCustomTipOpen}>
        <DialogContent className="rounded-[2.5rem] max-w-xs p-8 text-center">
          <DialogHeader>
            <DialogTitle className="font-black uppercase italic text-sm">Appreciation Amount</DialogTitle>
          </DialogHeader>
          <Input type="number" placeholder="₹ 0.00" value={customTipValue} onChange={e => setCustomTipValue(e.target.value)} className="h-16 text-center text-3xl font-black italic text-primary bg-gray-50 border-none rounded-2xl mt-4" />
          <Button onClick={() => { setDeliveryTip(parseFloat(customTipValue) || 0); setIsCustomTipOpen(false); }} className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase italic mt-4 shadow-xl">APPLY TIP</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

