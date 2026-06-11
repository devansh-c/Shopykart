
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
  Bike, 
  FileText,
  MapPin,
  ChevronRight,
  CreditCard,
  Banknote,
  ShoppingBasket,
  Coins,
  Map as MapIcon,
  Navigation,
  Heart,
  Tag,
  Ticket,
  CheckCircle2,
  X,
  History,
  ArrowRight,
  ChevronUp
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { doc, setDoc, serverTimestamp, collection, increment, query, where, getDocs } from 'firebase/firestore';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/shared/MapPicker'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted animate-pulse rounded-3xl" />
});

function isPointInPolygon(lat: number, lng: number, vs: any[]) {
  if (!vs || !Array.isArray(vs) || vs.length < 3) return false;
  const x = Number(lng);
  const y = Number(lat);
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = Number(vs[i].lng ?? vs[i].longitude ?? (Array.isArray(vs[i]) ? vs[i][1] : 0));
    const yi = Number(vs[i].lat ?? vs[i].latitude ?? (Array.isArray(vs[i]) ? vs[i][0] : 0));
    const xj = Number(vs[j].lng ?? vs[j].longitude ?? (Array.isArray(vs[j]) ? vs[j][1] : 0));
    const yj = Number(vs[j].lat ?? vs[j].latitude ?? (Array.isArray(vs[j]) ? vs[j][0] : 0));
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !intersect;
  }
  return inside;
}

export default function CartPage() {
  const { cart, addToCart, removeFromCart, totalPrice, totalItems, clearCart } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [showSuccess, setShowSuccess] = useState(false);
  const [instructions, setInstructions] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);
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

  const [slideX, setSlideX] = useState(0);
  const [isSliding, setIsSliding] = useState(false);
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

  const zonesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'zones'), where('isActive', '==', true));
  }, [firestore]);
  const { data: zones } = useCollection<any>(zonesQuery);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setCustomerName(profile?.fullName || localStorage.getItem('user_name') || '');
    setCustomerPhone(profile?.phoneNumber || localStorage.getItem('user_phone') || '');
    setCustomerCity(profile?.city || localStorage.getItem('user_city') || '');
    setCustomerPincode(profile?.pincode || localStorage.getItem('user_pincode') || '');
    
    const savedPlusCode = localStorage.getItem('user_plus_code');
    if (savedPlusCode) {
      const [lat, lng] = savedPlusCode.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) { setLatitude(lat); setLongitude(lng); }
    } else if (profile?.latitude) {
      setLatitude(Number(profile.latitude));
      setLongitude(Number(profile.longitude));
    }
  }, [profile]);

  const scrollToPayment = () => {
    paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        const minVal = parseInt(couponData.minOrder?.match(/\d+/)?.[0] || '0');
        if (totalPrice < minVal) {
          toast({ variant: "destructive", title: "Min Order Not Met", description: `Minimum order ₹${minVal} required.` });
        } else {
          setAppliedCoupon(couponData);
          toast({ title: "Coupon Applied!" });
        }
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Verification Failed" });
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  const validateAndSetCoords = async (lat: number, lng: number) => {
    const matchedZone = zones?.find(zone => isPointInPolygon(lat, lng, zone.boundary || []));
    if (matchedZone) {
      const finalLat = Number(lat.toFixed(8));
      const finalLng = Number(lng.toFixed(8));
      setLatitude(finalLat);
      setLongitude(finalLng);
      setCustomerCity(matchedZone.city || 'Local');
      localStorage.setItem('user_plus_code', `${finalLat},${finalLng}`);
      localStorage.setItem('user_city', matchedZone.city || 'Local');
      if (user && firestore) {
        setDoc(doc(firestore, 'users', user.uid), {
          latitude: finalLat,
          longitude: finalLng,
          city: matchedZone.city || 'Local',
          updatedAt: serverTimestamp()
        }, { merge: true });
      }
      window.dispatchEvent(new CustomEvent('user-address-updated'));
    }
    setIsMapOpen(false);
  };

  const handleCheckout = async () => {
    if (!firestore || isPlacing) return;

    if (totalPrice < 35) {
      toast({ variant: "destructive", title: "Order Value Low", description: "₹35 se kam ka order nahi hoga." });
      setSlideX(0);
      return;
    }

    if (!customerName.trim() || customerPhone.length !== 10 || customerAddress.trim().length < 10) {
      toast({ variant: "destructive", title: "Incomplete Details", description: "Please check your details." });
      setSlideX(0);
      return;
    }

    setShowSuccess(true);
    setIsPlacing(true);

    const orderId = Math.floor(10000 + Math.random() * 90000).toString();
    const finalUid = user?.uid;
    if (!finalUid) return;

    const coinsUsed = (useCoins && coinValue > 0) ? Math.ceil(coinDiscount / coinValue) : 0;
    const fullFinalAddress = `${customerAddress}, ${customerCity} - ${customerPincode}`;

    try {
      await setDoc(doc(firestore, 'orders', orderId), {
        userId: finalUid,
        customerName,
        customerPhone,
        orderDisplayId: orderId,
        items: cart.map(item => ({ 
          id: item.id, name: item.name, quantity: item.quantity, price: item.price, 
          isCustom: !!item.isCustom, vendorId: item.vendorId || 'global' 
        })),
        total: grandTotal,
        deliveryTip,
        status: 'Placed',
        paymentMethod,
        paymentStatus: 'Pending',
        address: fullFinalAddress,
        latitude: latitude || null,
        longitude: longitude || null,
        createdAt: serverTimestamp(),
        vendorId: cart[0]?.vendorId || 'global',
        restaurantName: cart[0]?.restaurantName || 'ShopyKart Store',
        coinsEarned: 10,
        coinsUsed,
        coinDiscount,
        couponDiscount,
        couponCode: appliedCoupon?.code || null,
        instructions
      });
      
      await setDoc(doc(firestore, 'users', finalUid), {
        fullName: customerName, phoneNumber: customerPhone, address: customerAddress, 
        city: customerCity, pincode: customerPincode, latitude, longitude,
        coins: increment(10 - coinsUsed), updatedAt: serverTimestamp()
      }, { merge: true });

      setTimeout(() => {
        clearCart();
        router.replace(`/orders/track?id=${orderId}`);
      }, 1200);

    } catch (err) {
      console.error("Checkout failed:", err);
      setShowSuccess(false);
      setIsPlacing(false);
      setSlideX(0);
    }
  };

  const handleCustomTip = () => {
    const val = parseFloat(customTipValue);
    if (!isNaN(val) && val >= 0) {
      setDeliveryTip(val);
      setIsCustomTipOpen(false);
      setCustomTipValue('');
    }
  };

  const handleStart = () => { if (!isPlacing) setIsSliding(true); };
  
  const handleMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isSliding || isPlacing || !sliderRef.current) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const rect = sliderRef.current.getBoundingClientRect();
    const handleWidth = 48; // Smaller handle Swiggy style
    const maxX = rect.width - handleWidth - 8;
    let x = clientX - rect.left - (handleWidth / 2);
    x = Math.max(0, Math.min(x, maxX));
    setSlideX(x);
    if (x >= maxX * 0.95) {
      setIsSliding(false);
      setSlideX(maxX);
      handleCheckout();
    }
  };

  const handleEnd = () => {
    if (!isSliding || isPlacing) return;
    setIsSliding(false);
    if (slideX < (sliderRef.current?.getBoundingClientRect().width || 0) * 0.8) {
      setSlideX(0);
    }
  };

  useEffect(() => {
    if (isSliding) {
      window.addEventListener('mousemove', handleMove as any);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove as any);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove as any);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove as any);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [isSliding]);

  if (totalItems === 0 && !showSuccess) {
    return (
      <div className="min-h-screen bg-[#F5F6F7] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white h-32 w-32 rounded-full flex items-center justify-center mb-6 shadow-sm"><ShoppingBag className="h-12 w-12 text-gray-300" /></div>
        <h2 className="text-xl font-bold text-gray-800">Your cart is empty</h2>
        <Button onClick={() => router.push('/menu')} className="rounded-xl h-12 px-8 font-bold bg-primary mt-6">BROWSE MENU</Button>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-80">
      <OrderSuccessOverlay isVisible={showSuccess} />
      <div className="bg-white sticky top-0 z-50 px-4 py-4 flex items-center gap-4 border-b border-gray-100">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100"><ChevronLeft className="h-6 w-6 text-gray-700" /></button>
        <h1 className="text-lg font-bold text-gray-800">Checkout</h1>
      </div>

      <div className="p-4 space-y-5">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
             <ShoppingBasket className="h-5 w-5 text-gray-400" />
             <h2 className="text-sm font-bold text-gray-800 uppercase tracking-widest">Order Details</h2>
          </div>
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-muted shrink-0 border border-gray-100"><Image src={item.imageUrl} alt={item.name} fill className="object-cover" /></div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-gray-800 truncate uppercase">{item.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center bg-primary text-white rounded-lg h-8 px-1">
                      <button onClick={() => removeFromCart(item.id)} className="h-6 w-6 flex items-center justify-center font-bold text-lg">-</button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="h-6 w-6 flex items-center justify-center font-bold text-lg">+</button>
                    </div>
                    <div className="text-sm font-black text-gray-800 italic">₹{item.price.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wallet Coins Section */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex items-center justify-between animate-in fade-in duration-500">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
              <Coins className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-tight">Wallet Coins</h3>
              <p className="text-[9px] font-bold text-muted-foreground uppercase leading-none mt-1">
                Balance: {availableCoins} Coins (₹{(availableCoins * coinValue).toFixed(2)})
              </p>
            </div>
          </div>
          <Switch 
            checked={useCoins} 
            onCheckedChange={setUseCoins} 
            disabled={availableCoins <= 0}
            className="data-[state=checked]:bg-amber-500"
          />
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-4">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Ticket className="h-5 w-5" /></div>
              <div><h3 className="text-sm font-black uppercase tracking-tight">Apply Coupon</h3><p className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Save extra on this order</p></div>
           </div>
           <div className="flex gap-2">
              <div className="relative flex-1">
                 <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                 <Input placeholder="Enter Code" value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())} className="h-12 pl-12 rounded-xl bg-gray-50 border-none font-black tracking-widest" />
              </div>
              <button onClick={handleApplyCoupon} disabled={isVerifyingCoupon || !couponInput.trim()} className="h-12 px-6 rounded-xl bg-black text-white font-black uppercase italic text-[10px] tracking-widest active:scale-95">
                 {isVerifyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'APPLY'}
              </button>
           </div>
           {appliedCoupon && (
             <div className="bg-green-50 p-3 rounded-xl border border-green-100 flex items-center justify-between">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-600" /><span className="text-[10px] font-black text-green-700 uppercase">'{appliedCoupon.code}' APPLIED!</span></div>
                <button onClick={() => setAppliedCoupon(null)} className="text-green-700 p-1"><X className="h-3.5 w-3.5" /></button>
             </div>
           )}
        </div>

        {/* Delivery Tip Section */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-tight">Tip your delivery partner</h3>
          </div>
          <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
            Your small token of appreciation goes a long way. 100% of the tip goes to the partner.
          </p>
          <div className="flex gap-3">
            {[10, 20, 30].map(tip => (
              <button 
                key={tip}
                onClick={() => setDeliveryTip(tip)}
                className={cn(
                  "flex-1 h-10 rounded-xl border-2 font-black text-xs transition-all",
                  deliveryTip === tip ? "border-primary bg-primary/5 text-primary" : "border-gray-50 bg-gray-50 text-gray-400"
                )}
              >
                ₹{tip}
              </button>
            ))}
            <Dialog open={isCustomTipOpen} onOpenChange={setIsCustomTipOpen}>
              <DialogTrigger asChild>
                <button 
                  className={cn(
                    "flex-1 h-10 rounded-xl border-2 font-black text-xs transition-all",
                    deliveryTip > 30 || (deliveryTip > 0 && ![10,20,30].includes(deliveryTip)) ? "border-primary bg-primary/5 text-primary" : "border-gray-50 bg-gray-50 text-gray-400"
                  )}
                >
                  {deliveryTip > 30 || (deliveryTip > 0 && ![10,20,30].includes(deliveryTip)) ? `₹${deliveryTip}` : 'Custom'}
                </button>
              </DialogTrigger>
              <DialogContent className="rounded-[2rem] max-w-xs">
                <DialogHeader><DialogTitle className="text-center font-black uppercase text-sm">Enter Custom Tip</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                   <Input type="number" placeholder="Enter Amount" value={customTipValue} onChange={e => setCustomTipValue(e.target.value)} className="h-12 rounded-xl text-center text-xl font-black" />
                   <Button onClick={handleCustomTip} className="w-full h-12 bg-primary rounded-xl font-black">APPLY TIP</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /><h2 className="text-sm font-bold text-gray-800 uppercase">Delivery To</h2></div>
          </div>
          <div className="space-y-4">
              <button onClick={() => setIsMapOpen(true)} className="w-full h-12 bg-black/5 border-2 border-black/5 rounded-xl flex items-center justify-center gap-2 text-gray-700 font-black uppercase text-[10px]">
                <MapIcon className="h-4 w-4" /> PIN LOCATION ON MAP
              </button>
              {profile?.address && customerAddress !== profile.address && (
                <button onClick={() => {
                  setCustomerAddress(profile.address);
                  if (profile.fullName) setCustomerName(profile.fullName);
                  if (profile.phoneNumber) setCustomerPhone(profile.phoneNumber);
                  if (profile.city) setCustomerCity(profile.city);
                  if (profile.pincode) setCustomerPincode(profile.pincode);
                  if (profile.latitude) setLatitude(profile.latitude);
                  if (profile.longitude) setLongitude(profile.longitude);
                  toast({ title: "Address Applied!" });
                }} className="w-full p-4 rounded-2xl bg-primary/5 border border-dashed border-primary/20 flex items-center justify-between text-left">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><History className="h-4 w-4" /></div>
                    <div><span className="text-[8px] font-black uppercase text-primary">Use Saved</span><p className="text-[10px] font-bold text-gray-600 line-clamp-1">{profile.address}</p></div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-primary" />
                </button>
              )}
              <div className="space-y-3">
                <Input placeholder="Full Name *" value={customerName} onChange={e => setCustomerName(e.target.value)} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Pincode *" value={customerPincode} onChange={e => setCustomerPincode(e.target.value.replace(/\D/g,'').slice(0, 6))} className="h-12 rounded-xl bg-gray-50 border-none font-bold text-center" />
                  <Input placeholder="City *" value={customerCity} readOnly className="h-12 rounded-xl bg-gray-50 border-none font-bold opacity-70" />
                </div>
                <Textarea placeholder="Full Address Details *" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} className="rounded-xl bg-gray-50 border-none font-medium min-h-[80px]" />
                <Input placeholder="10 Digit Phone *" value={customerPhone} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g,'').slice(0, 10))} className="h-12 rounded-xl bg-gray-50 border-none font-bold" />
              </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-2 mb-2"><FileText className="h-5 w-5 text-blue-500" /><h3 className="text-sm font-bold text-gray-800 uppercase">Bill Summary</h3></div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between font-bold text-gray-400"><span>Item Total</span><span>₹{totalPrice.toFixed(2)}</span></div>
            {dynamic_charges.map((charge: any) => (
              <div key={charge.id} className="flex justify-between font-bold text-gray-400"><span>{charge.name}</span><span>₹{charge.calculatedAmount.toFixed(2)}</span></div>
            ))}
            {appliedCoupon && (
              <div className="flex justify-between font-black text-green-600"><span>Coupon ({appliedCoupon.code})</span><span>- ₹{couponDiscount.toFixed(2)}</span></div>
            )}
            {useCoins && coinDiscount > 0 && (
              <div className="flex justify-between font-black text-amber-600"><span>Coins Used</span><span>- ₹{coinDiscount.toFixed(2)}</span></div>
            )}
            {deliveryTip > 0 && (
              <div className="flex justify-between font-bold text-amber-600"><span>Delivery Tip</span><span>₹{deliveryTip.toFixed(2)}</span></div>
            )}
          </div>
          <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
            <span className="text-lg font-black text-gray-700 uppercase italic">Payable</span>
            <span className="text-2xl font-black text-primary italic">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>

        <div ref={paymentSectionRef} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4 scroll-mt-20">
          <div className="flex items-center gap-2 mb-2"><CreditCard className="h-5 w-5 text-purple-500" /><h3 className="text-sm font-bold text-gray-800 uppercase">Payment Mode</h3></div>
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-2 gap-4">
            <div onClick={() => setPaymentMethod('online')} className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2", paymentMethod === 'online' ? "border-primary bg-primary/5" : "border-gray-50 bg-gray-50")}>
              <CreditCard className={cn("h-6 w-6", paymentMethod === 'online' ? "text-primary" : "text-gray-400")} />
              <span className="text-[10px] font-black uppercase">Online Pay</span>
            </div>
            <div onClick={() => setPaymentMethod('cash')} className={cn("p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2", paymentMethod === 'cash' ? "border-primary bg-primary/5" : "border-gray-50 bg-gray-50")}>
              <Banknote className={cn("h-6 w-6", paymentMethod === 'cash' ? "text-primary" : "text-gray-400")} />
              <span className="text-[10px] font-black uppercase">Cash on Delivery</span>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* FIXED FOOTER - SWIGGY STYLE */}
      <div className="fixed bottom-0 left-0 right-0 z-[10000] pointer-events-none">
        <div className="max-w-lg mx-auto bg-white rounded-t-[2.5rem] p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.15)] border-t border-gray-100 pointer-events-auto flex flex-col gap-4">
           {/* Payment Summary Header */}
           <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                    {paymentMethod === 'online' ? <CreditCard className="h-5 w-5 text-gray-700" /> : <Banknote className="h-5 w-5 text-gray-700" />}
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase leading-none mb-1">Pay using</span>
                    <span className="text-sm font-black italic uppercase leading-none">
                      {paymentMethod === 'online' ? 'Google Pay' : 'Cash on Delivery'}
                    </span>
                 </div>
              </div>
              <button 
                onClick={scrollToPayment}
                className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1 group"
              >
                Change <ChevronUp className="h-3 w-3 group-hover:-translate-y-0.5 transition-transform" />
              </button>
           </div>

           {/* SWIGGY GREEN SLIDER */}
           <div 
             ref={sliderRef} 
             className="relative h-14 w-full bg-[#10B981] rounded-full p-1.5 flex items-center overflow-hidden shadow-xl select-none"
           >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className={cn(
                   "text-sm font-black text-white uppercase italic tracking-tight transition-all",
                   slideX > 50 ? "opacity-0" : "opacity-100"
                 )}>
                   {isPlacing ? 'PROCESSING...' : `Slide to Pay | ₹${grandTotal.toFixed(2)}`}
                 </span>
              </div>
              
              <div 
                onMouseDown={handleStart} 
                onTouchStart={handleStart} 
                className={cn(
                  "relative z-10 h-11 w-11 rounded-full bg-white flex items-center justify-center text-[#10B981] shadow-lg cursor-grab transition-transform",
                  isPlacing && "pointer-events-none"
                )} 
                style={{ transform: `translateX(${slideX}px)` }}
              >
                 {isPlacing ? (
                   <Loader2 className="h-5 w-5 animate-spin" />
                 ) : (
                   <div className="flex items-center">
                     <span className="text-[10px] font-black">❯</span>
                     <span className="text-[10px] font-black -ml-0.5 opacity-50">❯</span>
                     <span className="text-[10px] font-black -ml-0.5 opacity-25">❯</span>
                   </div>
                 )}
              </div>
              
              {/* Green Progress bar behind handle */}
              <div className="absolute left-0 top-0 bottom-0 bg-white/10" style={{ width: `${slideX + 56}px` }} />
           </div>
        </div>
      </div>
      
      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}><DialogContent className="rounded-[2.5rem] max-w-sm h-[500px] p-0 overflow-hidden border-none shadow-2xl"><DialogHeader className="sr-only"><DialogTitle>Pin Location</DialogTitle></DialogHeader><MapPicker onConfirm={validateAndSetCoords} /></DialogContent></Dialog>
    </div>
  );
}
