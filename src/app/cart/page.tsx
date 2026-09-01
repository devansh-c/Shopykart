'use client';

import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Minus, 
  Plus, 
  ChevronLeft, 
  ShoppingBag, 
  Loader2, 
  MapPin, 
  Sparkles, 
  Coins, 
  CreditCard, 
  Banknote, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  Navigation, 
  Clock, 
  User, 
  Phone, 
  Smartphone, 
  X, 
  AlertCircle,
  Heart,
  Smile,
  ReceiptText
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, getCountFromServer, query, where, setDoc, getDoc } from 'firebase/firestore';
import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import dynamic from 'next/dynamic';

const GoogleMapPicker = dynamic(() => import('@/components/shared/GoogleMapPicker'), { 
  ssr: false,
  loading: () => <div className="h-64 w-full bg-muted animate-pulse flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
});

type PaymentApp = 'phonepe' | 'paytm' | 'googlepay' | 'other';

export default function CartPage() {
  const { cart, addToCart, removeFromCart, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isPlacing, setIsPlacing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [isPremiumPacking, setIsPremiumPacking] = useState(false);
  const [isRedeemCoins, setIsRedeemCoins] = useState(false);
  const [deliveryTip, setDeliveryTip] = useState<number>(0);
  const [realDeliveryTime, setRealDeliveryTime] = useState<string>('Calculating...');
  
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [recipientForm, setRecipientForm] = useState({
    name: '',
    phone: '',
    address: '',
    lat: '',
    lng: ''
  });

  const [paymentMode, setPaymentMode] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [sliderOffset, setSliderOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setRecipientForm({
        name: localStorage.getItem('user_name') || '',
        phone: localStorage.getItem('user_phone') || '',
        address: localStorage.getItem('user_address_line') || localStorage.getItem('user_address') || '',
        lat: localStorage.getItem('user_lat') || '',
        lng: localStorage.getItem('user_lng') || ''
      });
    }
  }, []);

  const activeAddress = recipientForm.address || 'Set delivery location';
  const activeCustomerName = recipientForm.name || 'Guest';
  
  const chargesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'checkout_charges');
  }, [firestore]);
  const { data: adminCharges } = useCollection<any>(chargesQuery);

  const activeZoneId = typeof window !== 'undefined' ? localStorage.getItem('active_zone_id') : null;
  const zonesQuery = useMemoFirebase(() => {
    if (!firestore || !activeZoneId) return null;
    return doc(firestore, 'zones', activeZoneId);
  }, [firestore, activeZoneId]);
  const { data: zoneData } = useDoc<any>(zonesQuery);

  const deliveryFee = zoneData?.deliveryCharge || 0;

  useEffect(() => {
    if (!isMounted || cart.length === 0 || !recipientForm.lat || !recipientForm.lng || !firestore) return;

    const calculateDeliveryTime = async () => {
      if (typeof google === 'undefined' || !google.maps) {
        setTimeout(calculateDeliveryTime, 2000);
        return;
      }

      try {
        const firstVendorId = cart[0].vendorId;
        if (!firstVendorId) return;

        const vendorSnap = await getDoc(doc(firestore, 'vendors', firstVendorId));
        if (!vendorSnap.exists()) return;
        const vendorData = vendorSnap.data();

        if (vendorData.lat && vendorData.lng) {
          const service = new google.maps.DistanceMatrixService();
          const origin = new google.maps.LatLng(parseFloat(recipientForm.lat), parseFloat(recipientForm.lng));
          const destination = new google.maps.LatLng(vendorData.lat, vendorData.lng);

          service.getDistanceMatrix({
            origins: [origin],
            destinations: [destination],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
          }, (response, status) => {
            if (status === 'OK' && response?.rows[0]?.elements[0]?.status === 'OK') {
              const element = response.rows[0].elements[0];
              const durationValue = Math.ceil(element.duration.value / 60); 
              const totalTime = durationValue + 12; 
              setRealDeliveryTime(`${totalTime} MINS`);
            } else {
              setRealDeliveryTime('30-40 MINS');
            }
          });
        } else {
          setRealDeliveryTime('25-35 MINS');
        }
      } catch (err) {
        setRealDeliveryTime('35-45 MINS');
      }
    };

    calculateDeliveryTime();
  }, [isMounted, cart, recipientForm.lat, recipientForm.lng, firestore]);

  const calculatedAdminCharges = useMemo(() => {
    if (!adminCharges) return [];
    return adminCharges.filter((c: any) => !c.zoneId || c.zoneId === 'global' || c.zoneId === activeZoneId)
      .map((c: any) => {
        const value = c.type === 'percentage' ? (totalPrice * (c.value / 100)) : c.value;
        return { name: c.name, value: Math.round(value) };
      });
  }, [adminCharges, totalPrice, activeZoneId]);

  const totalPayable = useMemo(() => {
    let base = totalPrice + deliveryFee + deliveryTip;
    calculatedAdminCharges.forEach(c => base += c.value);
    if (isPremiumPacking) base += 10;
    if (isRedeemCoins) base -= 5;
    return Math.max(0, base);
  }, [totalPrice, deliveryFee, deliveryTip, calculatedAdminCharges, isPremiumPacking, isRedeemCoins]);

  const handleSaveRecipient = async () => {
    if (!recipientForm.name.trim() || !recipientForm.phone || recipientForm.phone.length < 10) {
      toast({ variant: "destructive", title: "Invalid Details", description: "Name and 10-digit Phone are mandatory." });
      return;
    }

    localStorage.setItem('user_name', recipientForm.name.toUpperCase());
    localStorage.setItem('user_phone', recipientForm.phone);
    localStorage.setItem('user_address_line', recipientForm.address);
    localStorage.setItem('user_location_set', 'true');
    
    if (user && firestore) {
      await setDoc(doc(firestore, 'users', user.uid), {
        fullName: recipientForm.name.toUpperCase(),
        phoneNumber: recipientForm.phone,
        address: recipientForm.address,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {});
    }

    setIsAddressModalOpen(false);
    window.dispatchEvent(new CustomEvent('user-address-updated'));
    toast({ title: "Details Updated! ✅" });
  };

  const handleConfirmMapLocation = (lat: number, lng: number, address?: string) => {
    const sLat = lat.toString();
    const sLng = lng.toString();
    setRecipientForm(prev => ({
      ...prev,
      lat: sLat,
      lng: sLng,
      address: address || prev.address
    }));
    localStorage.setItem('user_lat', sLat);
    localStorage.setItem('user_lng', sLng);
    setIsMapOpen(false);
    toast({ title: "House Pinned! 🏠" });
  };

  const triggerUPI = (app: PaymentApp) => {
    const upiID = "9450355709@axl"; 
    const payeeName = "ShopyKart";
    const amount = totalPayable.toFixed(2);
    const txnId = `SK${Date.now()}`;
    
    let baseUri = `upi://pay?pa=${upiID}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tr=${txnId}`;
    
    let finalUri = baseUri;
    if (app === 'phonepe') finalUri = `phonepe://pay?pa=${upiID}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tr=${txnId}`;
    if (app === 'paytm') finalUri = `paytmmp://pay?pa=${upiID}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tr=${txnId}`;
    if (app === 'googlepay') finalUri = `tez://pay?pa=${upiID}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tr=${txnId}`;

    window.location.href = finalUri;
    setShowPaymentSelector(false);
    setIsVerifying(true);
  };

  const finalizeOrder = async () => {
    if (!user || !firestore) return;
    
    setIsPlacing(true);
    try {
      const q = query(collection(firestore, 'orders'), where('userId', '==', user.uid));
      const countSnap = await getCountFromServer(q);
      const customerOrderNumber = countSnap.data().count + 1;

      const orderData = {
        userId: user.uid,
        customerName: activeCustomerName.toUpperCase(),
        customerPhone: recipientForm.phone,
        address: activeAddress,
        customerLat: recipientForm.lat ? parseFloat(recipientForm.lat) : null,
        customerLng: recipientForm.lng ? parseFloat(recipientForm.lng) : null,
        zoneId: activeZoneId,
        pincode: localStorage.getItem('user_pincode') || '284205',
        items: cart,
        total: totalPayable,
        deliveryTip: deliveryTip,
        isPremiumPacking: isPremiumPacking,
        redeemCoins: isRedeemCoins,
        status: 'Placed',
        paymentMethod: paymentMode,
        paymentStatus: paymentMode === 'ONLINE' ? 'Paid' : 'Pending',
        customerOrderNumber,
        deliveryOTP: Math.floor(100000 + Math.random() * 900000).toString(),
        pickupOTP: Math.floor(1000 + Math.random() * 9000).toString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        restaurantName: cart[0]?.restaurantName || 'ShopyKart'
      };

      await addDoc(collection(firestore, 'orders'), orderData);
      
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
        audio.volume = 0.6;
        audio.play().catch(() => {});
      } catch (e) {}

      setShowSuccessOverlay(true);
      
      setTimeout(() => { 
        clearCart(); 
        router.replace(`/order/track/#${customerOrderNumber}`); 
      }, 1500);
    } catch (e) {
      toast({ variant: "destructive", title: "Order Failed" });
    } finally {
      setIsPlacing(false);
      setIsVerifying(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isPlacing) return;
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isPlacing || !sliderRef.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    const trackWidth = sliderRef.current.offsetWidth - 80;
    
    if (diff > 0) {
      setSliderOffset(Math.min(diff, trackWidth));
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || isPlacing || !sliderRef.current) return;
    setIsDragging(false);
    
    const trackWidth = sliderRef.current.offsetWidth - 80;
    if (sliderOffset > trackWidth * 0.85) {
      setSliderOffset(trackWidth);
      if (!user) {
        setSliderOffset(0);
        window.dispatchEvent(new CustomEvent('open-auth-overlay'));
        return;
      }
      
      if (paymentMode === 'ONLINE') {
        setShowPaymentSelector(true);
        setTimeout(() => setSliderOffset(0), 500);
      } else {
        finalizeOrder();
      }
    } else {
      setSliderOffset(0);
    }
  };

  const handleTipSelect = (amount: number) => {
    setDeliveryTip(prev => prev === amount ? 0 : amount);
  };

  if (!isMounted) return null;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-20 scale-150" />
           <div className="relative h-32 w-32 bg-white rounded-[3rem] flex items-center justify-center border-4 border-white shadow-2xl">
              <ShoppingBag className="h-14 w-14 text-gray-200" />
           </div>
        </div>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Your bag is<br /><span className="text-primary">starving!</span></h2>
        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-4 mb-10 max-w-[200px]">Fill it with the best gourmet flavors in town.</p>
        <Button onClick={() => router.push('/')} className="w-full max-w-[240px] h-16 bg-[#0B0B0B] text-white rounded-[2rem] font-black uppercase italic shadow-xl">START SHOPPING</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-40 transform-gpu">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />

      <header className="bg-white border-b border-gray-100 py-4 px-6 sticky top-0 z-[100] flex items-center gap-4">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 active:scale-90 transition-all">
          <ChevronLeft className="h-6 w-6 text-gray-900" />
        </button>
        <h1 className="text-sm font-black uppercase italic tracking-widest text-gray-900">SECURE CHECKOUT</h1>
      </header>

      <main className="px-4 pt-6 space-y-6 max-w-lg mx-auto">
        
        <section className="bg-[#1C1917] rounded-[2.5rem] p-6 text-white shadow-2xl space-y-6">
           <div className="flex items-center gap-3 mb-2">
              <ShoppingBag className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-widest">ITEMS IN BAG</h3>
           </div>
           
           <div className="space-y-6">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                   <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white/5 border border-white/10 relative shrink-0">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black uppercase tracking-tight italic leading-tight truncate">{item.name}</h4>
                      <div className="flex items-center mt-3 gap-3">
                         <div className="flex items-center bg-white/5 rounded-xl h-8 px-1 border border-white/10">
                            <button onClick={() => removeFromCart(item.id)} className="w-6 h-full flex items-center justify-center text-amber-400"><Minus className="h-3 w-3" /></button>
                            <span className="w-4 text-center text-[10px] font-black">{item.quantity}</span>
                            <button onClick={() => addToCart({...item, quantity: 1})} className="w-6 h-full flex items-center justify-center text-amber-400"><Plus className="h-3 w-3" /></button>
                         </div>
                      </div>
                   </div>
                   <div className="text-sm font-black italic">₹{(item.price * item.quantity).toFixed(0)}</div>
                </div>
              ))}
           </div>
        </section>

        <section className="bg-[#1C1917] rounded-[2.5rem] p-6 flex items-center justify-between border border-white/5 shadow-2xl overflow-hidden">
           <div className="flex items-center gap-5 flex-1 min-w-0">
              <div className="h-12 w-12 bg-amber-400 rounded-[1.25rem] flex items-center justify-center text-black shrink-0 shadow-lg shadow-amber-400/20">
                 <MapPin className="h-6 w-6" />
              </div>
              <div className="flex flex-col min-w-0 pr-4">
                 <h4 className="text-[13px] font-black uppercase tracking-tight italic leading-none mb-1.5 text-white truncate">
                   Deliver to: <span className="text-amber-400">{activeCustomerName}</span>
                 </h4>
                 <p className="text-[10px] font-bold text-white/80 uppercase mt-2 line-clamp-1 italic">{activeAddress}</p>
                 <div className="flex items-center gap-2 mt-3 text-[9px] font-black uppercase tracking-widest text-white/60">
                    <Clock className="h-3 w-3 text-amber-400" /> {realDeliveryTime} DELIVERY
                 </div>
              </div>
           </div>
           <button 
            onClick={() => setIsAddressModalOpen(true)} 
            className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase px-5 h-12 rounded-xl border border-white/10 active:scale-95 transition-all shrink-0 flex items-center justify-center"
           >
              CHANGE
           </button>
        </section>

        <section className="bg-[#1C1917] rounded-[2.5rem] p-6 text-white shadow-2xl space-y-5">
           <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-3">
                 <Heart className="h-4 w-4 text-primary fill-primary" />
                 <h3 className="text-xs font-black uppercase tracking-widest">SUPPORT YOUR RIDER</h3>
              </div>
              <div className="flex items-center gap-2">
                {deliveryTip > 0 && (
                  <button 
                    onClick={() => setDeliveryTip(0)}
                    className="flex items-center gap-1.5 bg-red-500/20 text-red-400 px-3 py-1.5 rounded-full border border-red-500/20 active:scale-95 transition-all"
                  >
                    <X className="h-3 w-3 stroke-[4]" />
                    <span className="text-[8px] font-black uppercase tracking-widest">REMOVE</span>
                  </button>
                )}
              </div>
           </div>
           
           <p className="text-[9px] font-bold text-white/40 uppercase leading-relaxed px-1">
              Your small token of appreciation goes a long way. 100% of the tip goes directly to the delivery partner.
           </p>

           <div className="grid grid-cols-4 gap-3">
              {[10, 20, 30, 50].map((amount) => (
                <button 
                  key={amount}
                  onClick={() => handleTipSelect(amount)}
                  className={cn(
                    "h-12 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90",
                    deliveryTip === amount 
                      ? "bg-primary/20 border-primary text-primary shadow-lg shadow-primary/10" 
                      : "bg-white/5 border-white/10 text-white/60"
                  )}
                >
                   <Smile className="h-3 w-3" />
                   <span className="text-[11px] font-black italic">₹{amount}</span>
                </button>
              ))}
           </div>
        </section>

        <section className="bg-[#1C1917] rounded-[2.5rem] p-6 text-white shadow-2xl space-y-6">
           <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-widest">GOURMET ENHANCEMENTS</h3>
           </div>

           <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                 <div className="flex items-center gap-4">
                    <div className="h-9 w-9 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
                       <Truck className="h-4 w-4" />
                    </div>
                    <div>
                       <h4 className="text-[10px] font-black uppercase">PREMIUM PACKING</h4>
                       <p className="text-[8px] font-bold text-white/30 uppercase">Extra Protection • ₹10</p>
                    </div>
                 </div>
                 <Switch checked={isPremiumPacking} onCheckedChange={setIsPremiumPacking} className="data-[state=checked]:bg-amber-400" />
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                 <div className="flex items-center gap-4">
                    <div className="h-9 w-9 bg-white/5 rounded-xl flex items-center justify-center text-white/40">
                       <Coins className="h-4 w-4" />
                    </div>
                    <div>
                       <h4 className="text-[10px] font-black uppercase">REDEEM WALLET COINS</h4>
                       <p className="text-[8px] font-bold text-white/30 uppercase">Value: ₹10</p>
                    </div>
                 </div>
                 <Switch checked={isRedeemCoins} onCheckedChange={setIsRedeemCoins} className="data-[state=checked]:bg-amber-400" />
              </div>
           </div>
        </section>

        <section className="bg-[#1C1917] rounded-[2.5rem] p-8 text-white shadow-2xl space-y-8">
           <h3 className="text-xl font-black italic uppercase tracking-tighter">BILL SUMMARY</h3>
           <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-white/60 uppercase tracking-widest">
                 <span>ITEMS SUBTOTAL:</span>
                 <span className="text-white font-black italic text-sm">₹{totalPrice.toFixed(0)}</span>
              </div>
              
              {calculatedAdminCharges.map((charge, i) => (
                <div key={i} className="flex justify-between items-center text-[10px] font-bold text-white/60 uppercase tracking-widest">
                   <span>{charge.name}:</span>
                   <span className="text-white font-black italic text-sm">₹{charge.value.toFixed(0)}</span>
                </div>
              ))}

              {deliveryTip > 0 && (
                <div className="flex justify-between items-center text-[10px] font-bold text-primary uppercase tracking-widest">
                   <span>DELIVERY TIP:</span>
                   <span className="font-black italic text-sm">₹{deliveryTip}</span>
                </div>
              )}
              {isPremiumPacking && (
                <div className="flex justify-between items-center text-[10px] font-bold text-white/60 uppercase tracking-widest">
                   <span>PREMIUM PACKING:</span>
                   <span className="text-white font-black italic text-sm">₹10</span>
                </div>
              )}
              {isRedeemCoins && (
                <div className="flex justify-between items-center text-[10px] font-bold text-green-400 uppercase tracking-widest">
                   <span>COINS REDEEMED:</span>
                   <span className="font-black italic text-sm">- ₹5</span>
                </div>
              )}
           </div>

           <div className="pt-6 border-t border-white/5 flex justify-between items-center">
              <span className="text-sm font-black italic uppercase tracking-tighter text-white/40">GRAND TOTAL:</span>
              <span className="text-3xl font-black italic tracking-tighter text-amber-400">₹{totalPayable.toFixed(0)}</span>
           </div>
        </section>

        <section className="bg-[#1C1917] rounded-[2.5rem] p-8 text-white shadow-2xl space-y-8">
           <h3 className="text-xs font-black uppercase tracking-widest opacity-60">SELECT PAYMENT MODE:</h3>
           
           <div className="space-y-6">
              <div 
                onClick={() => setPaymentMode('ONLINE')}
                className={cn("flex items-center gap-6 p-2 group cursor-pointer transition-all", paymentMode !== 'ONLINE' && "opacity-30")}
              >
                 <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center p-1", paymentMode === 'ONLINE' ? "border-amber-400" : "border-white/10")}>
                    {paymentMode === 'ONLINE' && <div className="h-full w-full bg-amber-400 rounded-full" />}
                 </div>
                 <div>
                    <h4 className="text-sm font-black uppercase italic tracking-tighter">UPI / QR / APP</h4>
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-0.5">PHONEPE, GPAY, PAYTM</p>
                 </div>
              </div>

              <div 
                onClick={() => setPaymentMode('COD')}
                className={cn("flex items-center gap-6 p-2 group cursor-pointer transition-all", paymentMode !== 'COD' && "opacity-30")}
              >
                 <div className={cn("h-6 w-6 rounded-full border-2 flex items-center justify-center p-1", paymentMode === 'COD' ? "border-amber-400" : "border-white/10")}>
                    {paymentMode === 'COD' && <div className="h-full w-full bg-amber-400 rounded-full" />}
                 </div>
                 <div>
                    <h4 className="text-sm font-black uppercase italic tracking-tighter">CASH ON DELIVERY</h4>
                    <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest mt-0.5">PAY AT DOORSTEP</p>
                 </div>
              </div>
           </div>
        </section>

        <div className="fixed bottom-0 left-0 right-0 z-[1000] p-6 bg-gradient-to-t from-white via-white to-transparent">
           <div 
             ref={sliderRef}
             className="w-full h-20 bg-[#1C1917] rounded-full p-2 flex items-center relative shadow-2xl overflow-hidden select-none"
           >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className={cn(
                   "text-[10px] font-black uppercase italic tracking-[0.3em] transition-opacity duration-300",
                   sliderOffset > 20 ? "opacity-0" : "opacity-40 text-white"
                 )}>
                   SLIDE TO ORDER
                 </span>
                 {sliderOffset > 20 && (
                   <span className="text-[12px] font-black italic text-amber-400 animate-pulse">
                     SHOOOOOP!
                   </span>
                 )}
              </div>

              <div 
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ transform: `translateX(${sliderOffset}px)` }}
                className={cn(
                  "h-16 w-16 bg-white rounded-full flex items-center justify-center text-red-500 shadow-xl z-10 cursor-grab active:cursor-grabbing transition-transform ease-out",
                  !isDragging && "duration-300"
                )}
              >
                 <ArrowRight className={cn("h-8 w-8", isDragging ? "animate-none" : "animate-pulse")} />
              </div>

              <div className="flex-1 text-right pr-6 pointer-events-none">
                 <div className="text-xl font-black text-white italic tracking-tighter">₹{totalPayable.toFixed(0)}</div>
              </div>

              {isPlacing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-20">
                   <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                </div>
              )}
           </div>
        </div>

      </main>

      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="rounded-t-[3rem] sm:rounded-[3rem] p-0 border-none shadow-2xl bg-[#0B0B0B] max-w-sm bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2 focus:outline-none flex flex-col h-[650px]">
          <div className="h-2 w-full bg-amber-400" />
          <DialogHeader className="p-8 pb-4 shrink-0 text-white flex flex-col items-center">
            <div className="h-16 w-16 bg-amber-400/20 rounded-[1.5rem] flex items-center justify-center text-amber-400 mb-2 shadow-inner border border-amber-400/20">
               <MapPin className="h-8 w-8" />
            </div>
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-center">RECIPIENT & ADDRESS</DialogTitle>
            <DialogDescription className="text-[9px] font-bold text-gray-500 uppercase text-center tracking-[0.2em] mt-1">Set house details for accurate delivery</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6">
             <div className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Customer Name</label>
                   <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="WHO IS RECEIVING?" 
                        value={recipientForm.name}
                        onChange={e => setRecipientForm({...recipientForm, name: e.target.value.toUpperCase()})}
                        className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 text-white font-black text-xs uppercase"
                      />
                   </div>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Contact Number</label>
                   <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="MOBILE FOR UPDATES" 
                        value={recipientForm.phone}
                        onChange={e => setRecipientForm({...recipientForm, phone: e.target.value.replace(/\D/g,'').slice(0, 10)})}
                        className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 text-white font-black text-xs"
                      />
                   </div>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Detailed Address</label>
                   <div className="relative">
                      <Navigation className="absolute left-4 top-4 h-4 w-4 text-gray-500" />
                      <textarea 
                        placeholder="HOUSE NO, BUILDING, LANDMARK..." 
                        value={recipientForm.address}
                        onChange={e => setRecipientForm({...recipientForm, address: e.target.value.toUpperCase()})}
                        className="w-full h-24 pl-12 pr-4 pt-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-[11px] uppercase placeholder:text-gray-600 focus:outline-none focus:border-amber-400/50"
                      />
                   </div>
                </div>
             </div>

             <Button 
                onClick={() => setIsMapOpen(true)}
                className="w-full h-14 bg-white/10 hover:bg-white/20 text-amber-400 rounded-2xl font-black uppercase italic text-[10px] tracking-widest border border-amber-400/20 shadow-lg shadow-amber-400/5"
             >
                <MapPin className="h-4 w-4 mr-2" /> PIN HOUSE ON MAP
             </Button>
          </div>

          <div className="p-8 bg-black/40 shrink-0 pb-10 border-t border-white/5">
             <Button 
                onClick={handleSaveRecipient}
                className="w-full h-18 bg-amber-400 hover:bg-amber-500 text-black rounded-[2rem] font-black uppercase italic text-lg shadow-xl shadow-amber-400/20"
             >
                SAVE & PROCEED
             </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
         <DialogContent className="rounded-none sm:rounded-[3rem] max-w-2xl h-full sm:h-[85vh] p-0 overflow-hidden border-none shadow-2xl focus:outline-none flex flex-col">
            <DialogHeader className="p-4 bg-white border-b shrink-0 relative">
               <DialogTitle className="text-center font-black italic uppercase">Pin Your Delivery Location</DialogTitle>
               <DialogDescription className="text-center text-[10px] font-bold uppercase tracking-widest">Mark your house on the map for accurate delivery.</DialogDescription>
               <button onClick={() => setIsMapOpen(false)} className="absolute top-4 right-4 h-10 w-10 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-400 active:scale-90 transition-all"><X className="h-5 w-5" /></button>
            </DialogHeader>
            <div className="flex-1 min-h-0 relative">
               <GoogleMapPicker onConfirm={handleConfirmMapLocation} />
            </div>
         </DialogContent>
      </Dialog>

      <Dialog open={showPaymentSelector} onOpenChange={setShowPaymentSelector}>
        <DialogContent className="rounded-t-[3rem] sm:rounded-[3rem] p-0 border-none shadow-2xl bg-white max-w-sm bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2 focus:outline-none">
          <div className="h-2 w-full bg-primary" />
          <div className="p-8 space-y-8">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-center">PAY SECURELY</DialogTitle>
              <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase text-center tracking-[0.2em]">SELECT YOUR PREFERRED UPI APP</DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4">
               {[
                 { id: 'phonepe', label: 'PhonePe', icon: 'https://cdn-icons-png.flaticon.com/512/10691/10691811.png' },
                 { id: 'googlepay', label: 'Google Pay', icon: 'https://cdn-icons-png.flaticon.com/512/6124/6124998.png' },
                 { id: 'paytm', label: 'Paytm', icon: 'https://cdn-icons-png.flaticon.com/512/825/825454.png' },
                 { id: 'other', label: 'BHIM / Other', icon: 'https://cdn-icons-png.flaticon.com/512/5968/5968313.png' }
               ].map((app) => (
                 <button 
                  key={app.id}
                  onClick={() => triggerUPI(app.id as PaymentApp)}
                  className="bg-gray-50 p-5 rounded-[2rem] border-2 border-transparent hover:border-primary active:scale-95 transition-all flex flex-col items-center gap-3 group"
                 >
                    <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm group-hover:scale-110 transition-transform">
                       <img src={app.icon} className="h-full w-full object-cover" alt={app.label} />
                    </div>
                    <span className="text-[10px] font-black uppercase text-gray-800">{app.label}</span>
                 </button>
               ))}
            </div>

            <div className="flex flex-col items-center gap-1 opacity-40">
               <ShieldCheck className="h-4 w-4 text-green-600" />
               <p className="text-[7px] font-black uppercase tracking-widest">End-to-End Encrypted</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isVerifying} onOpenChange={setIsVerifying}>
         <DialogContent className="rounded-[3rem] p-0 border-none shadow-2xl bg-white max-w-xs focus:outline-none overflow-hidden">
            <div className="h-2 w-full bg-amber-400 animate-pulse" />
            <div className="p-10 space-y-8 flex flex-col items-center text-center">
               <DialogHeader className="space-y-4">
                  <div className="relative mx-auto mb-2">
                    <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-20" />
                    <div className="relative h-24 w-24 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 border-4 border-amber-100 mx-auto">
                       <Smartphone className="h-10 w-10 animate-bounce" />
                    </div>
                  </div>
                  <DialogTitle className="text-xl font-black italic uppercase text-gray-900">VERIFYING PAYMENT</DialogTitle>
                  <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">Please complete the payment in your UPI app and return here.</DialogDescription>
               </DialogHeader>

               <div className="w-full space-y-3">
                  <Button 
                    onClick={finalizeOrder}
                    disabled={isPlacing}
                    className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase italic shadow-lg shadow-green-100"
                  >
                    {isPlacing ? <Loader2 className="h-5 w-5 animate-spin" /> : "I HAVE PAID"}
                  </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
