
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
  Tag,
  CheckCircle2,
  Trash2,
  IndianRupee
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, getCountFromServer, query, where, updateDoc, increment, getDocs } from 'firebase/firestore';
import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

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
  const [recipientForm, setRecipientForm] = useState({
    name: '',
    phone: '',
    address: ''
  });

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [deliveryTip, setDeliveryTip] = useState(0);

  const [sliderOffset, setSliderOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  // HYDRATION FIX: Initialize localStorage data only after mount
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setRecipientForm({
        name: localStorage.getItem('user_name') || '',
        phone: localStorage.getItem('user_phone') || '',
        address: localStorage.getItem('user_address_line') || ''
      });
    }
  }, []);

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);
  const { data: profile } = useDoc<any>(userProfileRef);
  const userCoins = profile?.coins || 0;

  const activeZoneId = isMounted ? localStorage.getItem('active_zone_id') : null;
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
    
    // REDEEM LOGIC: Only apply discount if toggle is on AND user has coins
    if (isRedeemCoins && userCoins > 0) {
      base -= 5;
    }
    
    base -= couponDiscount;
    return Math.max(0, base);
  }, [totalPrice, deliveryFee, calculatedAdminCharges, isPremiumPacking, isRedeemCoins, deliveryTip, couponDiscount, userCoins]);

  const handleApplyCoupon = async () => {
    if (!firestore || !couponCode.trim()) return;
    setIsApplyingCoupon(true);
    try {
      const q = query(collection(firestore, 'coupons'), where('code', '==', couponCode.toUpperCase().trim()), where('isActive', '==', true));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast({ variant: "destructive", title: "Invalid Code" });
      } else {
        const data = snap.docs[0].data();
        if (data.minOrderValue && totalPrice < data.minOrderValue) {
          toast({ variant: "destructive", title: `Min Order ₹${data.minOrderValue} Required` });
        } else {
          setAppliedCoupon({ id: snap.docs[0].id, ...data });
          toast({ title: "Coupon Applied! 🎟️" });
        }
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error applying coupon" });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const finalizeOrder = async () => {
    if (!user || !firestore) return;
    
    if (!recipientForm.name.trim() || recipientForm.phone.length !== 10 || !recipientForm.address.trim()) {
      toast({ variant: "destructive", title: "Missing Info", description: "Complete your address and phone." });
      setIsAddressModalOpen(true);
      setSliderOffset(0);
      return;
    }
    
    setIsPlacing(true);
    try {
      const q = query(collection(firestore, 'orders'), where('userId', '==', user.uid));
      const countSnap = await getCountFromServer(q);
      const ordersCount = countSnap.data().count;
      const customerOrderNumber = ordersCount + 1;

      // NEW REWARD LOGIC (20/10/5): 1st=20, 2nd=10, others=5
      let coinsToEarn = 5;
      if (customerOrderNumber === 1) coinsToEarn = 20;
      else if (customerOrderNumber === 2) coinsToEarn = 10;

      const orderData = {
        userId: user.uid,
        customerName: recipientForm.name.toUpperCase(),
        customerPhone: recipientForm.phone,
        address: recipientForm.address.toUpperCase(),
        zoneId: activeZoneId,
        items: cart,
        total: totalPayable,
        deliveryFee: deliveryFee,
        deliveryTip: deliveryTip,
        couponCode: appliedCoupon?.code || null,
        couponDiscount: couponDiscount,
        isPremiumPacking: isPremiumPacking,
        redeemCoins: isRedeemCoins,
        chargesBreakdown: calculatedAdminCharges,
        status: 'Placed',
        paymentMethod: 'ONLINE',
        customerOrderNumber,
        deliveryOTP: Math.floor(100000 + Math.random() * 900000).toString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        restaurantName: cart[0]?.restaurantName || 'ShopyKart'
      };

      await addDoc(collection(firestore, 'orders'), orderData);
      
      const userRef = doc(firestore, 'users', user.uid);
      if (isRedeemCoins) {
        // If redeemed: CLEAR PREVIOUS COINS and only add earned ones
        await updateDoc(userRef, { 
          coins: coinsToEarn, 
          updatedAt: serverTimestamp() 
        });
      } else {
        // Just increment earned coins
        await updateDoc(userRef, { 
          coins: increment(coinsToEarn), 
          updatedAt: serverTimestamp() 
        });
      }

      setShowSuccessOverlay(true);
      setTimeout(() => { 
        clearCart(); 
        router.replace(`/order/track/#${customerOrderNumber}`); 
      }, 1500);
    } catch (e: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: '/orders',
        operation: 'create',
        requestResourceData: recipientForm
      }));
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
      if (!user) { 
        setSliderOffset(0); 
        window.dispatchEvent(new CustomEvent('open-auth-overlay')); 
        return; 
      }
      finalizeOrder();
    } else {
      setSliderOffset(0);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-20 no-scrollbar overflow-x-hidden">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />
      <header className="bg-white border-b py-4 px-6 sticky top-0 z-[100] flex items-center gap-4">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50"><ChevronLeft className="h-6 w-6 text-gray-700" /></button>
        <h1 className="text-sm font-black uppercase italic tracking-widest text-gray-900">CHECKOUT</h1>
      </header>

      <main className="px-4 pt-6 space-y-6 max-w-lg mx-auto">
        {/* ITEMS SECTION */}
        <section className="bg-[#1C1917] rounded-[2.5rem] p-6 text-white shadow-2xl space-y-6 transform-gpu">
           <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">ITEMS IN BAG</h3>
              <Badge className="bg-white/10 text-white border-none text-[8px] font-black">{cart.length} ITEMS</Badge>
           </div>
           <div className="space-y-6">
              {cart.length > 0 ? cart.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center animate-in fade-in slide-in-from-right-2 duration-300">
                   <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white/5 border border-white/10 relative shrink-0">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-black uppercase truncate leading-tight">{item.name}</h4>
                      <p className="text-[8px] font-bold text-gray-500 uppercase mt-0.5 truncate">{item.restaurantName || 'ShopyKart'}</p>
                      <div className="flex items-center mt-2 bg-white/5 w-fit rounded-lg px-2 py-1">
                         <button onClick={() => removeFromCart(item.id)} className="text-amber-400 active:scale-75 transition-all"><Minus className="h-3 w-3" /></button>
                         <span className="mx-2 text-[10px] font-black">{item.quantity}</span>
                         <button onClick={() => addToCart({...item, quantity: 1})} className="text-amber-400 active:scale-75 transition-all"><Plus className="h-3 w-3" /></button>
                      </div>
                   </div>
                   <div className="text-sm font-black italic text-amber-400">₹{(item.price * item.quantity).toFixed(0)}</div>
                </div>
              )) : (
                <div className="text-center py-4 opacity-50 uppercase font-black text-xs">Bag is empty</div>
              )}
           </div>
        </section>

        {/* ADDRESS SECTION */}
        <section className="bg-[#1C1917] rounded-[2.5rem] p-6 text-white shadow-2xl group transition-all hover:bg-black">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-4">
                 <div className="h-12 w-12 bg-amber-400 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-amber-400/20 group-hover:scale-110 transition-transform">
                    <Navigation className="h-6 w-6" />
                 </div>
                 <div className="min-w-0">
                    <h4 className="text-xs font-black uppercase truncate max-w-[150px]">{recipientForm.name || 'SET RECIPIENT'}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase truncate max-w-[150px] leading-tight">
                       {recipientForm.address || 'ENTER DROP ADDRESS'}
                    </p>
                 </div>
              </div>
              <button onClick={() => setIsAddressModalOpen(true)} className="bg-white/10 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0 border border-white/5">CHANGE</button>
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
                <Input placeholder="ENTER CODE" value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} className="bg-white/5 border-white/10 text-white rounded-xl h-12 font-black italic placeholder:text-gray-600" />
                <Button onClick={handleApplyCoupon} disabled={isApplyingCoupon || !couponCode.trim()} className="bg-amber-400 text-black rounded-xl h-12 px-6 font-black uppercase">APPLY</Button>
             </div>
           ) : (
             <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="bg-green-500 p-2 rounded-xl shadow-lg"><CheckCircle2 className="h-4 w-4 text-white" /></div>
                   <div>
                      <h4 className="text-xs font-black uppercase text-green-400">{appliedCoupon.code} ACTIVE</h4>
                      <p className="text-[9px] font-bold text-green-500/60 uppercase">Saving ₹{couponDiscount.toFixed(0)}</p>
                   </div>
                </div>
                <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-red-400"><Trash2 className="h-4 w-4" /></button>
             </div>
           )}
        </section>

        {/* ADDONS & REWARDS */}
        <section className="bg-[#1C1917] rounded-[2.5rem] p-6 text-white shadow-2xl space-y-4">
           <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400"><ShoppingBag className="h-5 w-5" /></div>
                 <div><h4 className="text-[11px] font-black uppercase">Premium Packing</h4><p className="text-[8px] font-bold text-gray-500 uppercase">Double-sealed safe delivery</p></div>
              </div>
              <div className="flex items-center gap-2"><span className="text-[10px] font-black italic text-amber-400">+₹10</span><Switch checked={isPremiumPacking} onCheckedChange={setIsPremiumPacking} className="data-[state=checked]:bg-amber-400" /></div>
           </div>
           <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-xl bg-green-400/10 flex items-center justify-center text-green-400"><Coins className="h-5 w-5" /></div>
                 <div><h4 className="text-[11px] font-black uppercase">Redeem Coins</h4><p className="text-[8px] font-bold text-gray-500 uppercase">Balance: {userCoins} Coins</p></div>
              </div>
              <div className="flex items-center gap-2">
                {userCoins > 0 && <span className="text-[10px] font-black italic text-green-400">-₹5</span>}
                <Switch 
                  disabled={userCoins <= 0} 
                  checked={isRedeemCoins && userCoins > 0} 
                  onCheckedChange={setIsRedeemCoins} 
                  className="data-[state=checked]:bg-green-400" 
                />
              </div>
           </div>
        </section>

        {/* BILL SUMMARY */}
        <section className="bg-white rounded-[2.5rem] p-8 shadow-xl space-y-6 border border-gray-100">
           <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">ORDER SUMMARY</h3>
           <div className="space-y-3 pt-2">
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Items Total</span><span className="text-gray-900">₹{totalPrice.toFixed(0)}</span></div>
              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Delivery Fee</span><span className="text-gray-900">₹{deliveryFee.toFixed(0)}</span></div>
              {calculatedAdminCharges.map((c, i) => (
                <div key={i} className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>{c.name}</span><span className="text-gray-900">₹{c.value.toFixed(0)}</span></div>
              ))}
              {isPremiumPacking && <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Safe Packing</span><span className="text-gray-900">₹10</span></div>}
              {appliedCoupon && <div className="flex justify-between text-[10px] font-black text-green-600 uppercase tracking-widest italic"><span>Promo Saving</span><span>- ₹{couponDiscount.toFixed(0)}</span></div>}
              {isRedeemCoins && userCoins > 0 && <div className="flex justify-between text-[10px] font-black text-green-600 uppercase tracking-widest italic"><span>Coin Reward</span><span>- ₹5</span></div>}
           </div>
           <div className="pt-6 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
              <div className="flex flex-col">
                 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">FINAL BILL</span>
                 <div className="flex items-center gap-1.5 text-4xl font-black italic text-gray-900 tracking-tighter leading-none">
                    <IndianRupee className="h-6 w-6 text-primary" />
                    <span>{totalPayable.toFixed(0)}</span>
                 </div>
              </div>
              <div className="flex flex-col items-end">
                 <span className="text-[7px] font-black text-green-600 uppercase tracking-widest bg-green-50 px-2 py-0.5 rounded-full mb-1">Reward Secured</span>
                 <span className="text-[10px] font-bold text-gray-400 uppercase italic text-right">INC. ALL TAXES</span>
              </div>
           </div>
        </section>

        {/* ORDER SLIDER */}
        <div className="pt-8 pb-20">
           <div ref={sliderRef} className="w-full h-24 bg-[#0B0B0B] rounded-[2.5rem] p-3 flex items-center relative shadow-2xl overflow-hidden select-none border-t-4 border-white/5 transform-gpu">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className={cn("text-[10px] font-black uppercase italic tracking-[0.4em] text-white/20 transition-opacity", sliderOffset > 20 && "opacity-0")}>SLIDE TO PLACE ORDER</span></div>
              <div className="absolute inset-y-0 left-0 bg-primary opacity-20 pointer-events-none" style={{ width: `${sliderOffset + 80}px` }} />
              <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ transform: `translateX(${sliderOffset}px)` }} className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-xl z-10 transition-transform cursor-grab active:cursor-grabbing border-b-4 border-gray-200"><ArrowRight className="h-8 w-8 stroke-[3]" /></div>
              <div className="flex-1 text-right pr-8 pointer-events-none relative z-10">
                <div className="text-[9px] font-black text-primary uppercase tracking-widest opacity-60">Total Payable</div>
                <div className="text-3xl font-black text-white italic tracking-tighter leading-none mt-1">₹{totalPayable.toFixed(0)}</div>
              </div>
              {isPlacing && <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
           </div>
        </div>
      </main>

      {/* ADDRESS MODAL */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="rounded-t-[3rem] p-0 border-none shadow-2xl bg-white max-w-sm bottom-0 top-auto translate-y-0 focus:outline-none flex flex-col h-[520px]">
          <div className="h-2 w-full bg-primary" />
          <DialogHeader className="p-8 pb-2 shrink-0"><div className="flex flex-col items-center text-center"><div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-3 shadow-inner"><MapPin className="h-7 w-7" /></div><DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-gray-900">DELIVERY DETAILS</DialogTitle></div></DialogHeader>
          <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-4 space-y-6">
             <div className="space-y-4">
                <div className="space-y-1"><label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Full Name</label><Input placeholder="E.G. RAHUL SINGH" value={recipientForm.name} onChange={e => setRecipientForm({...recipientForm, name: e.target.value.toUpperCase()})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xs uppercase" /></div>
                <div className="space-y-1"><label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Phone Number</label><Input placeholder="10 DIGIT NUMBER" value={recipientForm.phone} onChange={e => setRecipientForm({...recipientForm, phone: e.target.value.replace(/\D/g,'').slice(0, 10)})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xs" /></div>
                <div className="space-y-1"><label className="text-[9px] font-black uppercase text-muted-foreground ml-1">House No / Landamrk</label><textarea placeholder="DESCRIBE YOUR EXACT LOCATION..." value={recipientForm.address} onChange={e => setRecipientForm({...recipientForm, address: e.target.value.toUpperCase()})} className="w-full h-24 p-4 rounded-2xl bg-gray-50 border-none font-bold text-xs uppercase focus:outline-none" /></div>
             </div>
          </div>
          <div className="p-8 bg-gray-50 shrink-0 pb-10 border-t"><Button onClick={() => { if (!recipientForm.name || recipientForm.phone.length !== 10 || !recipientForm.address) return; localStorage.setItem('user_name', recipientForm.name); localStorage.setItem('user_phone', recipientForm.phone); localStorage.setItem('user_address_line', recipientForm.address); setIsAddressModalOpen(false); }} className="w-full h-16 bg-black text-white rounded-[2rem] font-black uppercase italic shadow-xl">SAVE & PROCEED</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
