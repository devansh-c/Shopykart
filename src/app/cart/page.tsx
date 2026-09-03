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
  Coins, 
  ArrowRight, 
  Navigation, 
  Clock, 
  User, 
  Phone, 
  X, 
  Heart,
  Smile,
  ShieldCheck,
  Smartphone,
  Tag,
  Gift,
  CheckCircle2,
  Trash2,
  Bike
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, getCountFromServer, query, where, getDocs, limit } from 'firebase/firestore';
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
  
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [recipientForm, setRecipientForm] = useState({
    name: '',
    phone: '',
    address: '',
    lat: '',
    lng: ''
  });

  // NEW STATES: Coupon & Tip
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [deliveryTip, setDeliveryTip] = useState(0);

  const [paymentMode, setPaymentMode] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);

  const [sliderOffset, setSliderOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('user_name') || '';
      const savedPhone = localStorage.getItem('user_phone') || '';
      const savedDetailedAddress = localStorage.getItem('user_address_line') || '';
      const savedLat = localStorage.getItem('user_lat') || '';
      const savedLng = localStorage.getItem('user_lng') || '';

      setRecipientForm({
        name: savedName,
        phone: savedPhone,
        address: savedDetailedAddress,
        lat: savedLat,
        lng: savedLng
      });
    }
  }, []);

  const activeZoneId = typeof window !== 'undefined' ? localStorage.getItem('active_zone_id') : null;
  const zoneRef = useMemoFirebase(() => {
    if (!firestore || !activeZoneId) return null;
    return doc(firestore, 'zones', activeZoneId);
  }, [firestore, activeZoneId]);
  const { data: zoneData } = useDoc<any>(zoneRef);

  const deliveryFee = zoneData?.deliveryCharge || 0;

  const chargesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'checkout_charges');
  }, [firestore]);
  const { data: adminCharges } = useCollection<any>(chargesQuery);

  const calculatedAdminCharges = useMemo(() => {
    if (!adminCharges) return [];
    return adminCharges.filter((c: any) => !c.zoneId || c.zoneId === 'global' || c.zoneId === activeZoneId)
      .map((c: any) => {
        const value = c.type === 'percentage' ? (totalPrice * (c.value / 100)) : c.value;
        return { name: c.name, value: Math.round(value) };
      });
  }, [adminCharges, totalPrice, activeZoneId]);

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return (totalPrice * (appliedCoupon.discountValue / 100));
    }
    return appliedCoupon.discountValue;
  }, [appliedCoupon, totalPrice]);

  const totalPayable = useMemo(() => {
    let base = totalPrice + deliveryFee + deliveryTip;
    calculatedAdminCharges.forEach(c => base += c.value);
    if (isPremiumPacking) base += 10;
    if (isRedeemCoins) base -= 5;
    base -= couponDiscount;
    return Math.max(0, base);
  }, [totalPrice, deliveryFee, calculatedAdminCharges, isPremiumPacking, isRedeemCoins, deliveryTip, couponDiscount]);

  const handleApplyCoupon = async () => {
    if (!firestore || !couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const q = query(collection(firestore, 'coupons'), where('code', '==', couponCode.toUpperCase().trim()), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast({ variant: "destructive", title: "Invalid Code", description: "This coupon does not exist." });
      } else {
        const data = snap.docs[0].data();
        if (data.minOrderValue && totalPrice < data.minOrderValue) {
          toast({ variant: "destructive", title: "Min Order Not Met", description: `Add ₹${data.minOrderValue - totalPrice} more to use this code.` });
        } else {
          setAppliedCoupon({ id: snap.docs[0].id, ...data });
          toast({ title: "Coupon Applied! 🎟️" });
        }
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not verify coupon." });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const finalizeOrder = async () => {
    if (!user || !firestore) return;
    
    if (!recipientForm.name.trim() || !recipientForm.phone || recipientForm.phone.length < 10 || !recipientForm.address.trim()) {
      setIsAddressModalOpen(true);
      setSliderOffset(0);
      return;
    }
    
    setIsPlacing(true);
    try {
      const q = query(collection(firestore, 'orders'), where('userId', '==', user.uid));
      const countSnap = await getCountFromServer(q);
      const customerOrderNumber = countSnap.data().count + 1;

      const orderData = {
        userId: user.uid,
        customerName: recipientForm.name.toUpperCase(),
        customerPhone: recipientForm.phone,
        address: recipientForm.address.toUpperCase(),
        customerLat: recipientForm.lat ? parseFloat(recipientForm.lat) : null,
        customerLng: recipientForm.lng ? parseFloat(recipientForm.lng) : null,
        zoneId: activeZoneId,
        items: cart,
        total: totalPayable,
        deliveryFee: deliveryFee,
        deliveryTip: deliveryTip,
        couponId: appliedCoupon?.id || null,
        couponCode: appliedCoupon?.code || null,
        couponDiscount: couponDiscount,
        isPremiumPacking: isPremiumPacking,
        redeemCoins: isRedeemCoins,
        chargesBreakdown: calculatedAdminCharges,
        status: 'Placed',
        paymentMethod: paymentMode,
        paymentStatus: paymentMode === 'ONLINE' ? 'Paid' : 'Pending',
        customerOrderNumber,
        deliveryOTP: Math.floor(100000 + Math.random() * 900000).toString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        restaurantName: cart[0]?.restaurantName || 'ShopyKart'
      };

      await addDoc(collection(firestore, 'orders'), orderData);
      setShowSuccessOverlay(true);
      setTimeout(() => { clearCart(); router.replace(`/order/track/#${customerOrderNumber}`); }, 1500);
    } catch (e) {
      toast({ variant: "destructive", title: "Order Failed" });
    } finally {
      setIsPlacing(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isPlacing) return;
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isPlacing || !sliderRef.current) return;
    const diff = e.touches[0].clientX - startXRef.current;
    const trackWidth = sliderRef.current.offsetWidth - 80;
    if (diff > 0) setSliderOffset(Math.min(diff, trackWidth));
  };

  const handleTouchEnd = () => {
    if (!isDragging || isPlacing || !sliderRef.current) return;
    setIsDragging(false);
    const trackWidth = sliderRef.current.offsetWidth - 80;
    if (sliderOffset > trackWidth * 0.85) {
      if (!user) { setSliderOffset(0); window.dispatchEvent(new CustomEvent('open-auth-overlay')); return; }
      if (!recipientForm.name.trim() || !recipientForm.phone || !recipientForm.address.trim()) {
        setSliderOffset(0);
        setIsAddressModalOpen(true);
        return;
      }
      finalizeOrder();
    } else setSliderOffset(0);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-40">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />
      <header className="bg-white border-b py-4 px-6 sticky top-0 z-[100] flex items-center gap-4">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50"><ChevronLeft className="h-6 w-6" /></button>
        <h1 className="text-sm font-black uppercase italic tracking-widest">SECURE CHECKOUT</h1>
      </header>

      <main className="px-4 pt-6 space-y-6 max-w-lg mx-auto">
        <section className="bg-[#1C1917] rounded-[2.5rem] p-6 text-white shadow-2xl space-y-6">
           <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">ITEMS IN BAG</h3>
           <div className="space-y-6">
              {cart.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                   <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white/5 border border-white/10 relative shrink-0">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black uppercase truncate">{item.name}</h4>
                      <div className="flex items-center mt-2 bg-white/5 w-fit rounded-lg px-2 py-1">
                         <button onClick={() => removeFromCart(item.id)} className="text-amber-400"><Minus className="h-3 w-3" /></button>
                         <span className="mx-2 text-[10px] font-black">{item.quantity}</span>
                         <button onClick={() => addToCart({...item, quantity: 1})} className="text-amber-400"><Plus className="h-3 w-3" /></button>
                      </div>
                   </div>
                   <div className="text-sm font-black italic">₹{(item.price * item.quantity).toFixed(0)}</div>
                </div>
              ))}
           </div>
        </section>

        {/* RECIPIENT SECTION */}
        <section className="bg-[#1C1917] rounded-[2.5rem] p-6 text-white shadow-2xl">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                 <div className="h-10 w-10 bg-amber-400 rounded-xl flex items-center justify-center text-black"><Navigation className="h-5 w-5" /></div>
                 <div>
                    <h4 className="text-xs font-black uppercase">{recipientForm.name || 'SET RECIPIENT'}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase truncate max-w-[150px]">{recipientForm.address || 'TAP TO PIN ADDRESS'}</p>
                 </div>
              </div>
              <button onClick={() => setIsAddressModalOpen(true)} className="bg-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">CHANGE</button>
           </div>
        </section>

        {/* COUPON SECTION */}
        <section className="bg-[#1C1917] rounded-[2.5rem] p-6 text-white shadow-2xl space-y-4">
           <div className="flex items-center gap-3 text-amber-400">
              <Tag className="h-4 w-4" />
              <h3 className="text-xs font-black uppercase tracking-widest">COUPON CODES</h3>
           </div>
           
           {!appliedCoupon ? (
             <div className="flex gap-2">
                <Input 
                  placeholder="ENTER CODE" 
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  className="bg-white/5 border-white/10 text-white rounded-xl h-12 font-black italic tracking-widest"
                />
                <Button 
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon || !couponCode.trim()}
                  className="bg-amber-400 text-black rounded-xl h-12 px-6 font-black uppercase"
                >
                  {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'APPLY'}
                </Button>
             </div>
           ) : (
             <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="bg-green-500 p-1.5 rounded-lg"><CheckCircle2 className="h-4 w-4 text-white" /></div>
                   <div>
                      <h4 className="text-xs font-black uppercase text-green-400">{appliedCoupon.code} APPLIED</h4>
                      <p className="text-[9px] font-bold text-green-500/60 uppercase">Saving ₹{couponDiscount.toFixed(0)}</p>
                   </div>
                </div>
                <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
             </div>
           )}
        </section>

        {/* DELIVERY TIP SECTION */}
        <section className="bg-[#1C1917] rounded-[2.5rem] p-6 text-white shadow-2xl space-y-4">
           <div className="flex items-center gap-3 text-blue-400">
              <Bike className="h-4 w-4" />
              <h3 className="text-xs font-black uppercase tracking-widest">DELIVERY TIP</h3>
           </div>
           <p className="text-[9px] font-bold text-gray-500 uppercase leading-relaxed">
             Support your delivery partner. 100% of the tip goes to them.
           </p>
           <div className="flex justify-between gap-2">
              {[10, 20, 30, 50].map((amt) => (
                <button 
                  key={amt}
                  onClick={() => setDeliveryTip(deliveryTip === amt ? 0 : amt)}
                  className={cn(
                    "flex-1 h-12 rounded-xl border-2 font-black italic text-sm transition-all",
                    deliveryTip === amt ? "bg-amber-400 border-amber-400 text-black shadow-lg shadow-amber-400/20" : "bg-white/5 border-white/5 text-gray-400"
                  )}
                >
                  ₹{amt}
                </button>
              ))}
           </div>
        </section>

        {/* PREMIUM PACKING & COINS */}
        <section className="bg-[#1C1917] rounded-[2.5rem] p-6 text-white shadow-2xl space-y-4">
           <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                 <ShoppingBag className="h-5 w-5 text-amber-400" />
                 <div>
                    <h4 className="text-[11px] font-black uppercase">Premium Packing</h4>
                    <p className="text-[8px] font-bold text-gray-500 uppercase">Double-sealed safe delivery</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black italic text-amber-400">+₹10</span>
                 <Switch checked={isPremiumPacking} onCheckedChange={setIsPremiumPacking} className="data-[state=checked]:bg-amber-400" />
              </div>
           </div>

           <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="flex items-center gap-3">
                 <Coins className="h-5 w-5 text-amber-400" />
                 <div>
                    <h4 className="text-[11px] font-black uppercase">Redeem Coins</h4>
                    <p className="text-[8px] font-bold text-gray-500 uppercase">Use available loyalty points</p>
                 </div>
              </div>
              <div className="flex items-center gap-2">
                 <span className="text-[10px] font-black italic text-green-400">-₹5</span>
                 <Switch checked={isRedeemCoins} onCheckedChange={setIsRedeemCoins} className="data-[state=checked]:bg-green-400" />
              </div>
           </div>
        </section>

        {/* BILL SUMMARY */}
        <section className="bg-[#1C1917] rounded-[2.5rem] p-8 text-white shadow-2xl space-y-4">
           <h3 className="text-xl font-black italic uppercase tracking-tighter">BILL SUMMARY</h3>
           <div className="space-y-3">
              <div className="flex justify-between text-[10px] font-bold text-white/60 uppercase"><span>Subtotal</span><span>₹{totalPrice.toFixed(0)}</span></div>
              <div className="flex justify-between text-[10px] font-bold text-white/60 uppercase"><span>Delivery Fee</span><span>₹{deliveryFee.toFixed(0)}</span></div>
              {deliveryTip > 0 && <div className="flex justify-between text-[10px] font-bold text-white/60 uppercase"><span>Delivery Tip</span><span>₹{deliveryTip}</span></div>}
              {calculatedAdminCharges.map((c, i) => (
                <div key={i} className="flex justify-between text-[10px] font-bold text-white/60 uppercase"><span>{c.name}</span><span>₹{c.value.toFixed(0)}</span></div>
              ))}
              {isPremiumPacking && <div className="flex justify-between text-[10px] font-bold text-white/60 uppercase"><span>Premium Packing</span><span>₹10</span></div>}
              {appliedCoupon && <div className="flex justify-between text-[10px] font-black text-green-400 uppercase"><span>Coupon Discount ({appliedCoupon.code})</span><span>- ₹{couponDiscount.toFixed(0)}</span></div>}
              {isRedeemCoins && <div className="flex justify-between text-[10px] font-bold text-green-400 uppercase"><span>Coins Redeemed</span><span>- ₹5</span></div>}
           </div>
           <div className="pt-4 border-t border-white/5 flex justify-between items-center">
              <span className="text-sm font-black uppercase opacity-40">TOTAL</span>
              <span className="text-3xl font-black italic text-amber-400">₹{totalPayable.toFixed(0)}</span>
           </div>
        </section>

        {/* PAYMENT SELECTOR */}
        <section className="bg-[#1C1917] rounded-[2.5rem] p-8 text-white shadow-2xl space-y-6">
           <h3 className="text-xs font-black uppercase opacity-60 tracking-widest">PAYMENT MODE:</h3>
           <div className="space-y-4">
              <div onClick={() => setPaymentMode('ONLINE')} className={cn("flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer", paymentMode === 'ONLINE' ? "border-amber-400 bg-amber-400/5" : "border-white/5")}>
                 <div className={cn("h-4 w-4 rounded-full border-2", paymentMode === 'ONLINE' ? "bg-amber-400 border-amber-400" : "border-white/20")} />
                 <span className="text-sm font-black uppercase italic">UPI / App Payment</span>
              </div>
              <div onClick={() => setPaymentMode('COD')} className={cn("flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer", paymentMode === 'COD' ? "border-amber-400 bg-amber-400/5" : "border-white/5")}>
                 <div className={cn("h-4 w-4 rounded-full border-2", paymentMode === 'COD' ? "bg-amber-400 border-amber-400" : "border-white/20")} />
                 <span className="text-sm font-black uppercase italic">Cash on Delivery</span>
              </div>
           </div>
        </section>

        {/* SLIDE BUTTON */}
        <div className="fixed bottom-0 left-0 right-0 z-[1000] p-6 bg-gradient-to-t from-white to-transparent">
           <div ref={sliderRef} className="w-full h-20 bg-[#1C1917] rounded-full p-2 flex items-center relative shadow-2xl overflow-hidden select-none">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <span className={cn("text-[10px] font-black uppercase italic tracking-[0.3em] text-white/30", sliderOffset > 20 && "opacity-0")}>SLIDE TO ORDER</span>
              </div>
              <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ transform: `translateX(${sliderOffset}px)` }} className="h-16 w-16 bg-white rounded-full flex items-center justify-center text-primary shadow-xl z-10 transition-transform"><ArrowRight className="h-8 w-8" /></div>
              <div className="flex-1 text-right pr-6 pointer-events-none"><div className="text-xl font-black text-white italic">₹{totalPayable.toFixed(0)}</div></div>
              {isPlacing && <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20"><Loader2 className="h-8 w-8 animate-spin text-amber-400" /></div>}
           </div>
        </div>
      </main>

      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="rounded-t-[3rem] p-0 border-none shadow-2xl bg-white max-w-sm bottom-0 top-auto translate-y-0 focus:outline-none flex flex-col h-[600px]">
          <div className="h-2 w-full bg-primary" />
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-center">DELIVERY DETAILS</DialogTitle>
            <DialogDescription className="text-[9px] font-bold text-gray-500 uppercase text-center tracking-[0.2em]">Enter recipient info for fast delivery</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-6">
             <div className="space-y-4">
                <Input placeholder="FULL NAME" value={recipientForm.name} onChange={e => setRecipientForm({...recipientForm, name: e.target.value.toUpperCase()})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xs uppercase" />
                <Input placeholder="10 DIGIT PHONE" value={recipientForm.phone} onChange={e => setRecipientForm({...recipientForm, phone: e.target.value.replace(/\D/g,'').slice(0, 10)})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xs" />
                <textarea placeholder="HOUSE NO, BUILDING, LANDMARK..." value={recipientForm.address} onChange={e => setRecipientForm({...recipientForm, address: e.target.value.toUpperCase()})} className="w-full h-24 p-4 rounded-2xl bg-gray-50 border-none font-bold text-xs uppercase focus:outline-none" />
             </div>
             <button onClick={() => setIsMapOpen(true)} className="w-full h-14 bg-primary/5 text-primary rounded-2xl font-black uppercase italic text-[10px] tracking-widest border border-primary/20 flex items-center justify-center gap-2"><MapPin className="h-4 w-4" /> PIN ON MAP</button>
          </div>
          <div className="p-8 bg-gray-50 pb-10 border-t">
             <Button onClick={() => { localStorage.setItem('user_name', recipientForm.name); localStorage.setItem('user_phone', recipientForm.phone); localStorage.setItem('user_address_line', recipientForm.address); setIsAddressModalOpen(false); toast({title:'Details Saved'}); }} className="w-full h-16 bg-black text-white rounded-[2rem] font-black uppercase italic shadow-xl">SAVE & PROCEED</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
