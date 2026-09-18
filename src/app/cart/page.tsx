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
  ArrowRight, 
  Navigation, 
  IndianRupee,
  AlertCircle,
  Clock,
  Coins,
  PackageCheck,
  MessageSquare,
  Bike,
  Tag,
  Ticket,
  X
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, query, updateDoc, increment, getDocs, where } from 'firebase/firestore';
import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { isStoreScheduleOpen } from '@/components/home/PopularProducts';

/**
 * @fileOverview Rebuilt Premium Checkout Page.
 * Added: Delivery Tip section and detailed bill breakdown.
 */
export default function CartPage() {
  const { cart, addToCart, removeFromCart, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [isMounted, setIsMounted] = useState(false);
  const [activeZoneId, setActiveZoneId] = useState<string | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [currentMinutes, setCurrentMinutes] = useState<number | null>(null);
  
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [recipientForm, setRecipientForm] = useState({ name: '', phone: '', address: '' });
  
  const [deliveryTip, setDeliveryTip] = useState(0);
  const [isPremiumPacking, setIsPremiumPacking] = useState(false);
  const [isRedeemingCoins, setIsRedeemingCoins] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const [sliderOffset, setSliderOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('user_name') || '';
      const savedPhone = localStorage.getItem('user_phone') || '';
      const savedAddress = localStorage.getItem('user_address_line') || '';
      const savedZone = localStorage.getItem('active_zone_id');
      setRecipientForm({ name: savedName, phone: savedPhone, address: savedAddress });
      setActiveZoneId(savedZone);
      
      const syncTime = () => { 
        const now = new Date(); 
        setCurrentMinutes(now.getHours() * 60 + now.getMinutes()); 
      };
      syncTime(); 
      const interval = setInterval(syncTime, 60000);
      return () => clearInterval(interval);
    }
  }, []);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<any>(userRef);
  const userCoins = profile?.coins || 0;

  const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery, 'cart_vendors_check');

  const cartItemsWithStatus = useMemo(() => {
    if (!vendors) return cart.map(item => ({ ...item, isClosed: false }));
    const vMap = new Map(vendors.map(v => [String(v.id), v]));
    return cart.map(item => {
      const v = vMap.get(String(item.vendorId || ''));
      const isClosed = v ? (v.isOnline === false || !isStoreScheduleOpen(v, currentMinutes)) : false;
      return { ...item, isClosed };
    });
  }, [cart, vendors, currentMinutes]);

  const hasClosedItems = useMemo(() => cartItemsWithStatus.some(it => it.isClosed), [cartItemsWithStatus]);

  const zoneRef = useMemoFirebase(() => (firestore && activeZoneId) ? doc(firestore, 'zones', activeZoneId) : null, [firestore, activeZoneId]);
  const { data: zoneData } = useDoc<any>(zoneRef);
  
  const deliveryFee = zoneData?.deliveryCharge || 0;
  const minOrderValue = zoneData?.minOrder || 0;
  const isMinOrderMet = totalPrice >= minOrderValue;

  const coinDiscount = isRedeemingCoins ? 5 : 0; 
  const packingFee = isPremiumPacking ? 10 : 0;

  const handleApplyCoupon = async () => {
    if (!firestore || !couponCode.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const q = query(collection(firestore, 'coupons'), where('code', '==', couponCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ variant: "destructive", title: "Invalid Coupon" });
        setAppliedCoupon(null);
      } else {
        const data = snap.docs[0].data();
        if (totalPrice < (data.minOrderValue || 0)) {
          toast({ variant: "destructive", title: "Min Order Not Met" });
        } else {
          setAppliedCoupon({ id: snap.docs[0].id, ...data });
          toast({ title: "Coupon Applied!" });
        }
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return (totalPrice * appliedCoupon.discountValue) / 100;
    }
    return appliedCoupon.discountValue;
  }, [appliedCoupon, totalPrice]);

  const totalPayable = useMemo(() => {
    return Math.max(0, totalPrice + deliveryFee + deliveryTip + packingFee - coinDiscount - couponDiscount);
  }, [totalPrice, deliveryFee, deliveryTip, packingFee, coinDiscount, couponDiscount]);

  const finalizeOrder = async () => {
    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth-overlay'));
      setSliderOffset(0);
      return;
    }
    if (!firestore || cart.length === 0 || hasClosedItems || !isMinOrderMet) {
      setSliderOffset(0); 
      return;
    }
    
    if (!recipientForm.name || recipientForm.phone.length !== 10 || !recipientForm.address) {
      setIsAddressModalOpen(true); 
      setSliderOffset(0); 
      return;
    }

    setIsPlacing(true);
    try {
      const orderData = {
        userId: user.uid,
        customerName: recipientForm.name,
        customerPhone: recipientForm.phone,
        address: recipientForm.address,
        items: cart,
        total: totalPayable,
        status: 'Placed',
        createdAt: serverTimestamp(),
        restaurantName: cart[0]?.restaurantName || 'ShopyKart Hub',
        deliveryOTP: Math.floor(100000 + Math.random() * 900000).toString(),
        deliveryFee,
        deliveryTip,
        packingFee,
        coinDiscount,
        couponDiscount,
        couponCode: appliedCoupon?.code || null,
        redeemCoins: isRedeemingCoins,
        isPremiumPacking,
        deliveryInstructions,
        zoneId: activeZoneId,
        customerOrderNumber: Math.floor(1000 + Math.random() * 9000)
      };

      await addDoc(collection(firestore, 'orders'), orderData);
      if (isRedeemingCoins) await updateDoc(doc(firestore, 'users', user.uid), { coins: increment(-20) });

      setShowSuccessOverlay(true);
      setTimeout(() => { clearCart(); router.replace('/orders'); }, 1500);
    } catch (e) { 
      setIsPlacing(false); 
      setSliderOffset(0); 
      toast({ variant: "destructive", title: "Failed" });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => { if (isPlacing || cart.length === 0 || hasClosedItems || !isMinOrderMet) return; setIsDragging(true); startXRef.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { if (!isDragging || !sliderRef.current) return; const diff = e.touches[0].clientX - startXRef.current; if (diff > 0) setSliderOffset(Math.min(diff, sliderRef.current.offsetWidth - 80)); };
  const handleTouchEnd = () => { if (!isDragging) return; setIsDragging(false); if (sliderOffset > (sliderRef.current?.offsetWidth || 0) * 0.75) finalizeOrder(); else setSliderOffset(0); };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-40 max-w-lg mx-auto relative overflow-hidden transform-gpu">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />
      
      <header className="bg-white/80 backdrop-blur-xl py-4 px-6 sticky top-0 z-[100] flex items-center gap-4 border-b border-black/5">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/40 backdrop-blur-md border border-white/20 active:scale-90 transition-all"><ChevronLeft className="h-6 w-6" /></button>
        <h1 className="text-sm font-black uppercase italic tracking-widest text-gray-800 flex-1 text-center">Checkout</h1>
        <Badge variant="outline" className="rounded-xl border-amber-200 bg-amber-50 text-amber-600 font-black text-[9px] uppercase"><Coins className="h-2.5 w-2.5 mr-1" /> {userCoins} COINS</Badge>
      </header>

      <main className="px-4 pt-6 relative z-10 animate-in fade-in duration-700">
        <div className="bg-white rounded-[2.5rem] overflow-hidden border border-border shadow-sm mb-6">
          
          <section className="px-5 py-6 flex items-center justify-between border-b border-gray-50">
             <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="h-12 w-12 bg-[#0B0B0B] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                   <Navigation className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5 italic">Drop Details</h4>
                   <h4 className="text-xs font-black uppercase truncate text-gray-900 leading-none">{recipientForm.name || 'Set Recipient'}</h4>
                   <p className="text-[9px] font-bold text-gray-400 uppercase truncate leading-tight mt-1.5">{recipientForm.address || 'Select House Address'}</p>
                </div>
             </div>
             <button 
              onClick={() => setIsAddressModalOpen(true)} 
              className="bg-primary/5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-primary active:scale-95 transition-all shrink-0 border border-primary/10"
             >
               EDIT
             </button>
          </section>

          <section className="p-6 space-y-6">
             <div className="flex items-center gap-4 mb-2">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                   <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-primary italic leading-none">Bag Summary</h3>
                   <h4 className="text-xs font-black uppercase text-gray-900 mt-1">{cart.length} PREMIUM ITEMS</h4>
                </div>
             </div>
             
             <div className="space-y-6">
                {cartItemsWithStatus.map((item, idx) => (
                  <div key={idx} className={cn("flex gap-4 items-center relative", item.isClosed && "opacity-40 grayscale")}>
                     <div className="h-16 w-16 rounded-2xl overflow-hidden bg-muted border border-black/5 relative shrink-0">
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                        {item.isClosed && <div className="absolute inset-0 bg-red-600/60 flex items-center justify-center text-[7px] font-black text-white px-1 text-center">CLOSED</div>}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black uppercase truncate text-gray-900 leading-tight">{item.name}</h4>
                        {item.selectedOption && <p className="text-[7px] font-black uppercase text-primary tracking-widest mt-1 italic">VARIETY: {item.selectedOption.name}</p>}
                        <div className="flex items-center mt-2 bg-gray-50 w-fit rounded-xl p-0.5 border border-gray-100">
                           <button onClick={() => removeFromCart(item.id)} className="h-7 w-7 flex items-center justify-center text-gray-500 active:scale-90"><Minus className="h-3.5 w-3.5" /></button>
                           <span className="mx-2 text-[10px] font-black">{item.quantity}</span>
                           <button onClick={() => addToCart({...item, quantity: 1})} className="h-7 w-7 flex items-center justify-center text-primary active:scale-90"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                     </div>
                     <div className="text-sm font-black italic text-gray-900">₹{(item.price * item.quantity).toFixed(0)}</div>
                  </div>
                ))}
             </div>
          </section>

          <section className="p-6 bg-gray-50/50 border-y border-gray-100">
             <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                   <Ticket className="h-5 w-5" />
                </div>
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 italic leading-none">Apply Offer</h3>
                   <h4 className="text-xs font-black uppercase text-gray-900 mt-1">PROMO CODES</h4>
                </div>
             </div>
             
             {appliedCoupon ? (
               <div className="bg-green-50/50 p-4 rounded-2xl flex items-center justify-between border border-green-100 animate-in zoom-in duration-300">
                  <div className="flex items-center gap-3">
                     <div className="bg-green-500 text-white p-1.5 rounded-lg"><Tag className="h-3 w-3" /></div>
                     <span className="text-xs font-black text-green-700 uppercase">'{appliedCoupon.code}' APPLIED!</span>
                  </div>
                  <button onClick={() => setAppliedCoupon(null)} className="text-gray-400 p-1 active:scale-90"><X className="h-4 w-4" /></button>
               </div>
             ) : (
               <div className="flex gap-2">
                 <Input 
                   value={couponCode}
                   onChange={e => setCouponCode(e.target.value.toUpperCase())}
                   placeholder="ENTER PROMO CODE"
                   className="h-12 rounded-xl bg-white border-gray-200 font-black text-xs uppercase"
                 />
                 <button 
                   onClick={handleApplyCoupon}
                   disabled={isValidatingCoupon || !couponCode.trim()}
                   className="h-12 bg-black text-white px-6 rounded-xl font-black text-[10px] uppercase active:scale-95 transition-all shadow-lg"
                 >
                   {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'APPLY'}
                 </button>
               </div>
             )}
          </section>

          <section className="p-6 flex items-center justify-between border-b border-gray-50 bg-amber-50/20">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-amber-400 rounded-xl flex items-center justify-center text-black">
                   <Coins className="h-5 w-5" />
                </div>
                <div>
                   <h3 className="text-xs font-black uppercase italic text-amber-900 leading-none">Redeem Reward</h3>
                   <p className="text-[8px] font-bold text-amber-600 uppercase tracking-widest mt-1.5">Use 20 Coins for ₹5 Discount</p>
                </div>
             </div>
             <Switch 
              disabled={userCoins < 20}
              checked={isRedeemingCoins} 
              onCheckedChange={setIsRedeemingCoins}
              className="data-[state=checked]:bg-amber-500 scale-90"
             />
          </section>

          <section className="p-6 space-y-4 border-b border-gray-50">
             <div className="flex items-center gap-4 mb-2">
                <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                   <Bike className="h-5 w-5" />
                </div>
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-600 italic leading-none">Support Rider</h3>
                   <h4 className="text-xs font-black uppercase text-gray-900 mt-1">DELIVERY TIP</h4>
                </div>
             </div>
             
             <div className="flex gap-3">
                {[10, 20, 30, 50].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setDeliveryTip(deliveryTip === amount ? 0 : amount)}
                    className={cn(
                      "flex-1 py-3 rounded-xl border-2 font-black text-xs transition-all active:scale-95",
                      deliveryTip === amount 
                        ? "border-orange-500 bg-orange-50 text-orange-600 shadow-inner" 
                        : "border-gray-100 bg-white text-gray-400"
                    )}
                  >
                    ₹{amount}
                  </button>
                ))}
             </div>
             <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest text-center mt-2 italic">100% of the tip goes to your delivery partner.</p>
          </section>

          <section className="p-6 space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                      <PackageCheck className="h-5 w-5" />
                   </div>
                   <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900 leading-none">Premium Packing</h4>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1.5">+ ₹10 Safety Surcharge</p>
                   </div>
                </div>
                <Switch checked={isPremiumPacking} onCheckedChange={setIsPremiumPacking} className="data-[state=checked]:bg-green-600 scale-90" />
             </div>
             <div className="relative">
                <MessageSquare className="absolute left-4 top-4 h-4 w-4 text-gray-300" />
                <textarea 
                  value={deliveryInstructions}
                  onChange={e => setDeliveryInstructions(e.target.value.toUpperCase())}
                  placeholder="DELIVERY INSTRUCTIONS (E.G. DON'T RING BELL)"
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 pl-12 text-[10px] font-black uppercase italic focus:outline-none min-h-[80px] resize-none focus:bg-white focus:border-primary/20 transition-all"
                />
             </div>
          </section>

          <section className="p-6 space-y-6 bg-muted/10">
             <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">Final Bill</h3>
             <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Item Subtotal</span><span className="text-gray-900 font-black">₹{totalPrice.toFixed(0)}</span></div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Delivery & Handling</span><span className="text-gray-900 font-black">₹{deliveryFee.toFixed(0)}</span></div>
                {deliveryTip > 0 && <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Delivery Tip</span><span className="text-gray-900 font-black">₹{deliveryTip}</span></div>}
                {packingFee > 0 && <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Safety Pack</span><span className="text-gray-900 font-black">₹{packingFee}</span></div>}
                {coinDiscount > 0 && <div className="flex justify-between text-[10px] font-black text-green-600 uppercase tracking-widest"><span>Loyalty Discount</span><span className="font-black">- ₹{coinDiscount}</span></div>}
                {couponDiscount > 0 && <div className="flex justify-between text-[10px] font-black text-indigo-600 uppercase tracking-widest"><span>Promo Discount</span><span className="font-black">- ₹{couponDiscount.toFixed(0)}</span></div>}
             </div>
             <div className="pt-6 border-t-2 border-dashed border-black/5 flex justify-between items-end">
                <div className="flex flex-col"><span className="text-[8px] font-black uppercase tracking-widest text-primary mb-1">To Pay</span><div className="flex items-center gap-1 text-4xl font-black italic text-gray-900 tracking-tighter leading-none"><IndianRupee className="h-6 w-6 text-primary" /><span>{totalPayable.toFixed(0)}</span></div></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase italic">INC. ALL TAXES</span>
             </div>
          </section>
        </div>

        <div className="pt-4 pb-32">
           <div className="space-y-4">
              {hasClosedItems && <div className="bg-red-50 p-4 rounded-3xl border border-red-100 text-center text-[9px] font-black text-red-800 uppercase animate-pulse">SOME STORES ARE CLOSED. REMOVE ITEMS TO ORDER.</div>}
              {!isMinOrderMet && <div className="bg-amber-50 p-4 rounded-3xl border border-amber-100 text-center text-[9px] font-black text-amber-800 uppercase">MIN. ORDER ₹{minOrderValue} REQUIRED FOR THIS ZONE.</div>}

              <div 
                ref={sliderRef} 
                className={cn(
                  "w-full h-24 rounded-[3rem] p-3 flex items-center relative overflow-hidden transition-all duration-300 transform-gpu", 
                  (hasClosedItems || !isMinOrderMet || cart.length === 0) ? "bg-gray-100 opacity-50 grayscale" : "bg-[#0B0B0B] border-white/10 shadow-2xl"
                )}
              >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black uppercase italic tracking-[0.4em] text-white/20">SLIDE TO PLACE ORDER</span>
                  </div>
                  <div 
                    onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} 
                    style={{ transform: `translateX(${sliderOffset}px)` }} 
                    className="h-16 w-16 rounded-[1.5rem] bg-white text-primary flex items-center justify-center z-10 transition-transform cursor-grab shadow-xl"
                  >
                    <ArrowRight className="h-8 w-8 stroke-[3]" />
                  </div>
                  <div className="flex-1 text-right pr-8 relative z-10">
                    <div className="text-[9px] font-black uppercase tracking-widest text-primary italic">Total</div>
                    <div className="text-3xl font-black italic text-white tracking-tighter leading-none mt-0.5">₹{totalPayable.toFixed(0)}</div>
                  </div>
                  {isPlacing && <div className="absolute inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-20 animate-in fade-in duration-300"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
              </div>
           </div>
        </div>
      </main>

      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="rounded-t-[3.5rem] p-8 border-none shadow-2xl bg-white bottom-0 top-auto translate-y-0 h-[580px] flex flex-col focus:outline-none">
          <DialogHeader className="pb-4 shrink-0 text-center">
             <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-3"><MapPin className="h-8 w-8" /></div>
             <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">Drop Address</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4">
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Recipient Name</label>
                 <Input placeholder="E.G. RAHUL SINGH" value={recipientForm.name} onChange={e => setRecipientForm({...recipientForm, name: e.target.value.toUpperCase()})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xs uppercase" />
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Phone Number</label>
                 <Input placeholder="10 DIGIT MOBILE" value={recipientForm.phone} onChange={e => setRecipientForm({...recipientForm, phone: e.target.value.replace(/\D/g,'').slice(0, 10)})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xs" />
              </div>
              <div className="space-y-1">
                 <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">House No / Street / Area</label>
                 <textarea placeholder="COMPLETE ADDRESS" value={recipientForm.address} onChange={e => setRecipientForm({...recipientForm, address: e.target.value.toUpperCase()})} className="w-full h-28 p-4 rounded-2xl bg-gray-50 border-none font-bold text-xs uppercase focus-outline-none resize-none" />
              </div>
          </div>
          <button 
            onClick={() => { 
              if(recipientForm.phone.length===10 && recipientForm.name && recipientForm.address) { 
                localStorage.setItem('user_name', recipientForm.name); 
                localStorage.setItem('user_phone', recipientForm.phone); 
                localStorage.setItem('user_address_line', recipientForm.address); 
                setIsAddressModalOpen(false); 
              } else {
                toast({ variant: "destructive", title: "Missing Info" });
              }
            }} 
            className="w-full h-20 bg-[#0B0B0B] text-white rounded-[2rem] font-black uppercase italic shadow-xl text-xl transition-all active:scale-95 mt-4"
          >
            SAVE DETAILS
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
