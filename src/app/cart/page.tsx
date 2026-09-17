
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

  // Coupon States
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
      setInterval(syncTime, 60000);
    }
  }, []);

  const userRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<any>(userRef);
  const userCoins = profile?.coins || 0;

  const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery, 'cart_vendors_check');

  const cartItemsWithStatus = useMemo(() => {
    if (!vendors) return cart.map(item => ({ ...item, isClosed: false }));
    const vMap = new Map(vendors.map(v => [v.id, v]));
    return cart.map(item => {
      const v = vMap.get(item.vendorId || '');
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

  // Coupon Logic
  const handleApplyCoupon = async () => {
    if (!firestore || !couponCode.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const q = query(collection(firestore, 'coupons'), where('code', '==', couponCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast({ variant: "destructive", title: "Invalid Coupon", description: "This code does not exist." });
        setAppliedCoupon(null);
      } else {
        const data = snap.docs[0].data();
        if (totalPrice < (data.minOrderValue || 0)) {
          toast({ variant: "destructive", title: "Minimum Order Not Met", description: `Add ₹${data.minOrderValue - totalPrice} more to use this.` });
        } else {
          setAppliedCoupon({ id: snap.docs[0].id, ...data });
          toast({ title: "Coupon Applied! ✨" });
        }
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: "Could not validate coupon." });
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
        restaurantName: cart[0]?.restaurantName || 'ShopyKart',
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
      
      if (isRedeemingCoins) {
        await updateDoc(doc(firestore, 'users', user.uid), {
          coins: increment(-20)
        });
      }

      setShowSuccessOverlay(true);
      setTimeout(() => { clearCart(); router.replace('/orders'); }, 1500);
    } catch (e) { 
      setIsPlacing(false); 
      setSliderOffset(0); 
      toast({ variant: "destructive", title: "Order Failed" });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => { if (isPlacing || cart.length === 0 || hasClosedItems || !isMinOrderMet) return; setIsDragging(true); startXRef.current = e.touches[0].clientX; };
  const handleTouchMove = (e: React.TouchEvent) => { if (!isDragging || !sliderRef.current) return; const diff = e.touches[0].clientX - startXRef.current; if (diff > 0) setSliderOffset(Math.min(diff, sliderRef.current.offsetWidth - 80)); };
  const handleTouchEnd = () => { if (!isDragging) return; setIsDragging(false); if (sliderOffset > (sliderRef.current?.offsetWidth || 0) * 0.75) finalizeOrder(); else setSliderOffset(0); };

  const handleMouseDown = (e: React.MouseEvent) => { if (isPlacing || cart.length === 0 || hasClosedItems || !isMinOrderMet) return; setIsDragging(true); startXRef.current = e.clientX; };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !sliderRef.current) return;
      const diff = e.clientX - startXRef.current;
      if (diff > 0) setSliderOffset(Math.min(diff, sliderRef.current.offsetWidth - 80));
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      setIsDragging(false);
      if (sliderOffset > (sliderRef.current?.offsetWidth || 0) * 0.75) finalizeOrder();
      else setSliderOffset(0);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, sliderOffset]);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-40 max-w-lg mx-auto relative overflow-hidden">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />
      
      <header className="bg-white/60 backdrop-blur-xl py-4 px-6 sticky top-0 z-[100] flex items-center gap-4">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/40 backdrop-blur-md border border-white/20 active:scale-90 transition-all"><ChevronLeft className="h-6 w-6" /></button>
        <h1 className="text-sm font-black uppercase italic tracking-widest text-gray-800 flex-1">CHECKOUT</h1>
        <Badge variant="outline" className="rounded-xl border-amber-200 bg-amber-50 text-amber-600 font-black text-[9px] uppercase"><Coins className="h-2.5 w-2.5 mr-1" /> {userCoins} COINS</Badge>
      </header>

      <main className="px-4 pt-4 relative z-10 animate-in fade-in duration-700">
        <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-white/40">
          
          {/* ADDRESS SECTION - FRAMELESS */}
          <section className="p-6 flex items-center justify-between border-b border-black/[0.03]">
             <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-[#0B0B0B] rounded-2xl flex items-center justify-center text-white">
                   <Navigation className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5 italic">Drop At</h4>
                   <h4 className="text-xs font-black uppercase truncate text-gray-900">{recipientForm.name || 'Set Recipient'}</h4>
                   <p className="text-[9px] font-bold text-gray-400 uppercase truncate leading-tight mt-0.5">{recipientForm.address || 'Select Address'}</p>
                </div>
             </div>
             <button onClick={() => setIsAddressModalOpen(true)} className="bg-primary/10 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-primary active:scale-95 transition-all">EDIT</button>
          </section>

          {/* ITEMS SECTION - FRAMELESS */}
          <section className="p-6 space-y-6">
             <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                   <ShoppingBag className="h-5 w-5" />
                </div>
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-primary italic">Bag Summary</h3>
                   <h4 className="text-xs font-black uppercase text-gray-900">{cart.length} GOURMET ITEMS</h4>
                </div>
             </div>
             
             <div className="space-y-6">
                {cartItemsWithStatus.map((item, idx) => (
                  <div key={idx} className={cn("flex gap-4 items-center relative", item.isClosed && "opacity-40 grayscale")}>
                     <div className="h-16 w-16 rounded-2xl overflow-hidden bg-white border border-black/5 relative shrink-0">
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                        {item.isClosed && <div className="absolute inset-0 bg-red-600/60 flex items-center justify-center text-[7px] font-black text-white px-1 text-center">CLOSED</div>}
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black uppercase truncate text-gray-900">{item.name}</h4>
                        {item.selectedOption && <p className="text-[7px] font-black uppercase text-primary tracking-widest mt-0.5 italic">VARIETY: {item.selectedOption.name}</p>}
                        <div className="flex items-center mt-2 bg-black/5 w-fit rounded-xl p-0.5">
                           <button onClick={() => removeFromCart(item.id)} className="h-7 w-7 flex items-center justify-center text-gray-500"><Minus className="h-3.5 w-3.5" /></button>
                           <span className="mx-2 text-[10px] font-black">{item.quantity}</span>
                           <button onClick={() => addToCart({...item, quantity: 1})} className="h-7 w-7 flex items-center justify-center text-primary"><Plus className="h-3.5 w-3.5" /></button>
                        </div>
                     </div>
                     <div className="text-sm font-black italic text-gray-900">₹{(item.price * item.quantity).toFixed(0)}</div>
                  </div>
                ))}
             </div>
          </section>

          {/* COUPON SECTION - NEW */}
          <section className="p-6 bg-white/20 border-y border-black/[0.03]">
             <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                   <Ticket className="h-5 w-5" />
                </div>
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 italic">Apply Offer</h3>
                   <h4 className="text-xs font-black uppercase text-gray-900">PROMO CODES</h4>
                </div>
             </div>
             
             {appliedCoupon ? (
               <div className="bg-green-50/50 p-4 rounded-2xl flex items-center justify-between border border-green-100 animate-in zoom-in duration-300">
                  <div className="flex items-center gap-3">
                     <div className="bg-green-500 text-white p-1.5 rounded-lg"><Tag className="h-3 w-3" /></div>
                     <span className="text-xs font-black text-green-700 uppercase">'{appliedCoupon.code}' APPLIED!</span>
                  </div>
                  <button onClick={() => setAppliedCoupon(null)} className="text-gray-400 p-1"><X className="h-4 w-4" /></button>
               </div>
             ) : (
               <div className="flex gap-2">
                 <Input 
                   value={couponCode}
                   onChange={e => setCouponCode(e.target.value.toUpperCase())}
                   placeholder="ENTER CODE"
                   className="h-12 rounded-xl bg-white/40 border-none font-black text-xs placeholder:text-gray-300"
                 />
                 <Button 
                   onClick={handleApplyCoupon}
                   disabled={isValidatingCoupon || !couponCode.trim()}
                   className="h-12 bg-black text-white px-6 rounded-xl font-black text-[10px] uppercase"
                 >
                   {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'APPLY'}
                 </Button>
               </div>
             )}
          </section>

          {/* REWARD REDEEM - FRAMELESS */}
          <section className="p-6 flex items-center justify-between border-b border-black/[0.03] bg-amber-50/10">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-amber-400 rounded-xl flex items-center justify-center text-black">
                   <Coins className="h-5 w-5" />
                </div>
                <div>
                   <h3 className="text-xs font-black uppercase italic text-amber-900">Redeem Reward</h3>
                   <p className="text-[8px] font-bold text-amber-600 uppercase tracking-widest mt-1">Use 20 Coins for ₹5 Discount</p>
                </div>
             </div>
             <Switch 
              disabled={userCoins < 20}
              checked={isRedeemingCoins} 
              onCheckedChange={setIsRedeemingCoins}
              className="data-[state=checked]:bg-amber-500"
             />
          </section>

          {/* SAFETY & INSTRUCTIONS - FRAMELESS */}
          <section className="p-6 space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                      <PackageCheck className="h-5 w-5" />
                   </div>
                   <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">Premium Safety Pack</h4>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">+ ₹10 for safety</p>
                   </div>
                </div>
                <Switch checked={isPremiumPacking} onCheckedChange={setIsPremiumPacking} className="data-[state=checked]:bg-green-600" />
             </div>

             <div className="space-y-4">
                <div className="flex items-center gap-3">
                   <MessageSquare className="h-4 w-4 text-gray-400" />
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">Delivery Instructions</h4>
                </div>
                <textarea 
                  value={deliveryInstructions}
                  onChange={e => setDeliveryInstructions(e.target.value)}
                  placeholder="e.g. Call before arrival..."
                  className="w-full bg-white/40 border border-black/5 rounded-2xl p-4 text-[10px] font-bold uppercase italic focus:outline-none min-h-[80px] resize-none"
                />
             </div>
          </section>

          {/* RIDER TIP - FRAMELESS */}
          <section className="p-6 space-y-6 bg-blue-50/10 border-y border-black/[0.03]">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-blue-600 border border-blue-50">
                   <Bike className="h-5 w-5" />
                </div>
                <div>
                   <h3 className="text-sm font-black italic uppercase text-gray-900">Rider Appreciation</h3>
                   <p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest">100% goes to the hero</p>
                </div>
             </div>
             
             <div className="grid grid-cols-4 gap-3">
                {[10, 20, 30, 50].map(val => (
                  <button 
                    key={val}
                    onClick={() => setDeliveryTip(deliveryTip === val ? 0 : val)}
                    className={cn(
                      "h-10 rounded-xl border-2 flex items-center justify-center font-black text-[10px] transition-all active:scale-90",
                      deliveryTip === val ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100" : "bg-white/40 border-blue-100 text-gray-400"
                    )}
                  >
                    ₹{val}
                  </button>
                ))}
             </div>
          </section>

          {/* BILLING SECTION - FRAMELESS */}
          <section className="p-6 space-y-6">
             <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">Billing Breakdown</h3>
             <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Item Total</span><span className="text-gray-900 font-black">₹{totalPrice.toFixed(0)}</span></div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Delivery Fee</span><span className="text-gray-900 font-black">₹{deliveryFee.toFixed(0)}</span></div>
                {packingFee > 0 && <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Packing Fee</span><span className="text-gray-900 font-black">₹{packingFee}</span></div>}
                {deliveryTip > 0 && <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Rider Tip</span><span className="text-gray-900 font-black">₹{deliveryTip}</span></div>}
                {coinDiscount > 0 && <div className="flex justify-between text-[10px] font-black text-green-600 uppercase tracking-widest"><span>Coin Discount</span><span className="font-black">- ₹{coinDiscount}</span></div>}
                {couponDiscount > 0 && <div className="flex justify-between text-[10px] font-black text-indigo-600 uppercase tracking-widest"><span>Coupon Discount</span><span className="font-black">- ₹{couponDiscount.toFixed(0)}</span></div>}
             </div>
             <div className="pt-6 border-t-2 border-dashed border-black/5 flex justify-between items-end">
                <div className="flex flex-col"><span className="text-[8px] font-black uppercase tracking-widest text-primary mb-1">To Pay</span><div className="flex items-center gap-1 text-4xl font-black italic text-gray-900 tracking-tighter leading-none"><IndianRupee className="h-6 w-6 text-primary" /><span>{totalPayable.toFixed(0)}</span></div></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase italic">INC. ALL TAXES</span>
             </div>
          </section>
        </div>

        {/* ORDER ACTION AREA */}
        <div className="pt-8 pb-32">
           <div className="space-y-4">
              {hasClosedItems && (
                <div className="bg-red-50/80 backdrop-blur-md border border-red-100 p-4 rounded-3xl flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
                  <p className="text-[9px] font-black text-red-800 uppercase leading-tight">STORE CLOSED: REMOVE ITEMS TO CONTINUE.</p>
                </div>
              )}
              
              {!isMinOrderMet && minOrderValue > 0 && (
                <div className="bg-amber-50/80 backdrop-blur-md border border-amber-100 p-4 rounded-3xl flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                  <p className="text-[9px] font-black text-amber-800 uppercase leading-tight">MIN. ORDER ₹{minOrderValue} REQUIRED.</p>
                </div>
              )}

              <div 
                ref={sliderRef} 
                className={cn(
                  "w-full h-24 rounded-[3rem] p-3 flex items-center relative overflow-hidden select-none border-t-2 transition-all duration-300", 
                  (hasClosedItems || !isMinOrderMet) 
                    ? "bg-gray-100 border-gray-200 opacity-50 grayscale cursor-not-allowed" 
                    : "bg-[#0B0B0B] border-white/10"
                )}
              >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black uppercase italic tracking-[0.4em] text-white/20">
                      {hasClosedItems ? 'ACTION LOCKED' : !isMinOrderMet ? 'MIN ORDER REQ' : 'SLIDE TO PLACE ORDER'}
                    </span>
                  </div>
                  <div className="absolute inset-y-0 left-0 opacity-30 pointer-events-none bg-primary blur-3xl" style={{ width: `${sliderOffset + 80}px` }} />
                  <div 
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart} 
                    onTouchMove={handleTouchMove} 
                    onTouchEnd={handleTouchEnd} 
                    style={{ transform: `translateX(${sliderOffset}px)` }} 
                    className={cn(
                      "h-16 w-16 rounded-[1.5rem] flex items-center justify-center z-10 transition-transform bg-white text-primary cursor-grab active:cursor-grabbing", 
                      (hasClosedItems || !isMinOrderMet) && "bg-gray-300"
                    )}
                  >
                    <ArrowRight className="h-8 w-8 stroke-[3]" />
                  </div>
                  <div className="flex-1 text-right pr-8 relative z-10">
                    <div className="text-[9px] font-black uppercase tracking-widest text-primary opacity-60 italic">Total</div>
                    <div className="text-3xl font-black italic text-white tracking-tighter leading-none mt-0.5">₹{totalPayable.toFixed(0)}</div>
                  </div>
                  {isPlacing && <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}
              </div>
           </div>
        </div>
      </main>

      {/* ADDRESS MODAL */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="rounded-t-[3.5rem] p-8 border-none shadow-2xl bg-white max-w-sm bottom-0 top-auto translate-y-0 focus:outline-none flex flex-col h-[550px]">
          <div className="h-1.5 w-16 bg-gray-100 rounded-full mx-auto mb-6 shrink-0" />
          <DialogHeader className="pb-4 shrink-0">
             <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-primary/10 rounded-[1.75rem] flex items-center justify-center text-primary mb-3 shadow-inner"><MapPin className="h-8 w-8" /></div>
                <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">Drop Address</DialogTitle>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Identity & Location Sync</p>
             </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pt-2">
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                 <Input placeholder="RECIPIENT NAME" value={recipientForm.name} onChange={e => setRecipientForm({...recipientForm, name: e.target.value.toUpperCase()})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xs uppercase" />
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                 <Input placeholder="10 DIGIT NUMBER" value={recipientForm.phone} onChange={e => setRecipientForm({...recipientForm, phone: e.target.value.replace(/\D/g,'').slice(0, 10)})} className="h-14 rounded-2xl bg-gray-50 border-none font-black text-xs" />
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">House/Street Address</label>
                 <textarea placeholder="e.g. House No. 42, Near Main Market" value={recipientForm.address} onChange={e => setRecipientForm({...recipientForm, address: e.target.value.toUpperCase()})} className="w-full h-28 p-4 rounded-2xl bg-gray-50 border-none font-bold text-xs uppercase focus:outline-none resize-none" />
              </div>
          </div>
          <div className="pt-4 pb-4">
             <Button onClick={() => { 
                if (!recipientForm.name || recipientForm.phone.length !== 10 || !recipientForm.address) {
                  toast({ variant: "destructive", title: "Details Incomplete" });
                  return;
                }
                localStorage.setItem('user_name', recipientForm.name); 
                localStorage.setItem('user_phone', recipientForm.phone); 
                localStorage.setItem('user_address_line', recipientForm.address); 
                setIsAddressModalOpen(false); 
             }} className="w-full h-18 bg-[#0B0B0B] text-white rounded-[2rem] font-black uppercase italic shadow-xl text-lg transition-all active:scale-95">SAVE & CONTINUE</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
