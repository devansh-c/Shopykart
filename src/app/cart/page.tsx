
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
  Coins,
  Ticket,
  X,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Heart,
  Receipt,
  ShieldCheck,
  Leaf,
  Utensils,
  BellOff,
  PhoneOff,
  DoorOpen,
  Info,
  Zap,
  MessageSquare,
  Star,
  Check,
  Clock,
  Shield,
  Store
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, query, updateDoc, increment, getDocs, where } from 'firebase/firestore';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

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
  
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [recipientForm, setRecipientForm] = useState({ name: '', phone: '', address: '' });
  
  const [deliveryTip, setDeliveryTip] = useState(0);
  const [isRedeemingCoins, setIsRedeemingCoins] = useState(false);
  const [isDonating, setIsDonating] = useState(false);
  const [noCutlery, setNoCutlery] = useState(false);
  const [isContactless, setIsContactless] = useState(false);
  const [cookingNote, setCookingNote] = useState('');
  const [deliveryInst, setDeliveryInst] = useState<string[]>([]);

  const [couponCode, setCouponCode] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI'>('COD');
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      setRecipientForm({ 
        name: localStorage.getItem('user_name') || '', 
        phone: localStorage.getItem('user_phone') || '', 
        address: localStorage.getItem('user_address_line') || '' 
      });
      setActiveZoneId(localStorage.getItem('active_zone_id'));
    }
  }, []);

  const profileRef = useMemoFirebase(() => (firestore && user) ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<any>(profileRef);
  const userCoins = profile?.coins || 0;

  const extraChargesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'checkout_charges') : null, [firestore]);
  const { data: dbExtraCharges } = useCollection<any>(extraChargesQuery);

  const vendorsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'vendors') : null, [firestore]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  const zoneRef = useMemoFirebase(() => (firestore && activeZoneId) ? doc(firestore, 'zones', activeZoneId) : null, [firestore, activeZoneId]);
  const { data: zoneData } = useDoc<any>(zoneRef);
  
  const deliveryFee = zoneData?.deliveryCharge || 0;
  const minOrderValue = zoneData?.minOrder || 0;
  const isMinOrderMet = totalPrice >= minOrderValue;

  const applicableExtraCharges = useMemo(() => {
    if (!dbExtraCharges) return [];
    return dbExtraCharges.filter(charge => charge.zoneId === 'global' || charge.zoneId === activeZoneId).map(charge => {
      const chargeValue = charge.type === 'percentage' ? (totalPrice * (Number(charge.value) || 0)) / 100 : (Number(charge.value) || 0);
      return { ...charge, calculatedAmount: chargeValue };
    });
  }, [dbExtraCharges, activeZoneId, totalPrice]);

  const extraChargesTotal = useMemo(() => applicableExtraCharges.reduce((sum, c) => sum + c.calculatedAmount, 0), [applicableExtraCharges]);

  const coinDiscount = isRedeemingCoins ? Math.min(userCoins, 5) : 0;
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.discountType === 'percentage' 
      ? (totalPrice * appliedCoupon.discountValue) / 100 
      : appliedCoupon.discountValue;
  }, [appliedCoupon, totalPrice]);

  const totalPayable = useMemo(() => {
    const donation = isDonating ? 2 : 0;
    return Math.max(0, totalPrice + deliveryFee + deliveryTip + extraChargesTotal + donation - coinDiscount - couponDiscount);
  }, [totalPrice, deliveryFee, deliveryTip, extraChargesTotal, coinDiscount, couponDiscount, isDonating]);

  const totalSaved = useMemo(() => coinDiscount + couponDiscount, [coinDiscount, couponDiscount]);

  const handleApplyCoupon = async () => {
    if (!firestore || !couponCode.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const q = query(collection(firestore, 'coupons'), where('code', '==', couponCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast({ variant: "destructive", title: "Invalid Coupon", description: "This code is not valid." });
      } else {
        const data = snap.docs[0].data();
        
        // VENDOR SPECIFIC CHECK
        if (data.vendorId) {
          const cartVendorIds = Array.from(new Set(cart.map(item => String(item.vendorId))));
          if (!cartVendorIds.includes(String(data.vendorId))) {
             toast({ 
               variant: "destructive", 
               title: "Invalid Store", 
               description: `This coupon is only valid for ${data.storeName || 'specific store'}.` 
             });
             setIsValidatingCoupon(false);
             return;
          }
        }

        if (totalPrice < (data.minOrderValue || 0)) {
          toast({ variant: "destructive", title: "Minimum order not met", description: `Add ₹${(data.minOrderValue || 0) - totalPrice} more.` });
        } else {
          setAppliedCoupon({ id: snap.docs[0].id, ...data });
          toast({ title: "Coupon Applied! ✨" });
        }
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Error validating coupon" });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const finalizeOrder = async () => {
    if (!user) { window.dispatchEvent(new CustomEvent('open-auth-overlay')); return; }
    if (!isMinOrderMet) { toast({ variant: "destructive", title: `Add ₹${minOrderValue - totalPrice} more.` }); return; }
    if (!recipientForm.name || !recipientForm.address || recipientForm.phone.length !== 10) { setIsAddressModalOpen(true); return; }
    if (paymentMethod === 'UPI' && !utrNumber) { setIsUpiModalOpen(true); return; }

    setIsPlacing(true);
    try {
      const allVendorIds = Array.from(new Set(cart.map(item => String(item.vendorId)).filter(Boolean)));
      const firstVendor = vendors?.find(v => String(v.id) === String(allVendorIds[0]));
      
      const orderData = {
        userId: user.uid, 
        customerName: recipientForm.name, 
        customerPhone: recipientForm.phone, 
        address: recipientForm.address,
        items: cart, 
        total: totalPayable, 
        status: 'Placed', 
        createdAt: serverTimestamp(),
        vendorIds: allVendorIds, 
        vendorId: allVendorIds[0], 
        vendorPhone: firstVendor?.phone || '',
        deliveryOTP: Math.floor(100000 + Math.random() * 900000).toString(),
        deliveryFee, 
        deliveryTip, 
        extraCharges: applicableExtraCharges, 
        extraChargesTotal,
        paymentMethod, 
        paymentStatus: paymentMethod === 'UPI' ? 'Paid (UTR Provided)' : 'Pending', 
        paymentUTR: utrNumber || null,
        zoneId: activeZoneId, 
        customerOrderNumber: Math.floor(1000 + Math.random() * 9000),
        cookingInstructions: cookingNote.trim().toUpperCase(),
        noCutlery,
        isDonationEnabled: isDonating,
        isContactless,
        deliveryTags: deliveryInst,
        totalSaved,
        couponId: appliedCoupon?.id || null
      };

      await addDoc(collection(firestore!, 'orders'), orderData);
      
      if (isRedeemingCoins) {
        await updateDoc(doc(firestore!, 'users', user.uid), { coins: increment(-coinDiscount) });
      }

      setShowSuccessOverlay(true);
      setTimeout(() => { clearCart(); router.replace('/orders'); }, 2000);
    } catch (e) { 
      setIsPlacing(false); 
      toast({ variant: "destructive", title: "Order Failed", description: "Database busy. Try again." }); 
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-40 max-w-lg mx-auto relative overflow-hidden transform-gpu no-scrollbar">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />
      
      {/* PREMIUM HEADER */}
      <header className="bg-white/80 backdrop-blur-xl py-6 px-6 sticky top-0 z-[100] flex items-center gap-4 border-b border-black/5 shadow-sm">
        <button onClick={() => router.back()} className="h-11 w-11 flex items-center justify-center rounded-2xl bg-gray-50 border border-black/5 active:scale-90 transition-all">
          <ChevronLeft className="h-6 w-6 text-gray-800" />
        </button>
        <div className="flex-1 text-center">
           <h1 className="text-base font-black uppercase italic tracking-widest text-gray-900 leading-none">Checkout</h1>
           <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mt-1">{cart.length} PREMIUM ITEMS</p>
        </div>
        <div className="bg-amber-50 px-3 py-1.5 rounded-2xl border border-amber-200 flex items-center gap-2">
           <Coins className="h-4 w-4 text-amber-600 fill-amber-500" />
           <span className="text-xs font-black text-amber-700">{userCoins}</span>
        </div>
      </header>

      <main className="px-4 pt-6 space-y-8">
        {/* 1. DELIVERY DESTINATION CARD */}
        <section className="bg-white rounded-[2.5rem] border border-black/5 shadow-xl shadow-gray-200/50 overflow-hidden group">
          <div className="p-6 flex items-center justify-between bg-gradient-to-br from-gray-50 to-white">
             <div className="flex items-center gap-5 min-w-0">
                <div className="h-14 w-14 bg-[#0B0B0B] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:rotate-6 transition-transform">
                   <Navigation className="h-7 w-7 text-primary" />
                </div>
                <div className="min-w-0">
                   <span className="text-[9px] font-black uppercase text-primary tracking-widest block mb-1 italic">Deliver To</span>
                   <h4 className="text-sm font-black uppercase truncate text-gray-900 leading-none">{recipientForm.name || 'GUEST USER'}</h4>
                   <p className="text-[10px] font-bold text-gray-400 truncate mt-2 italic">{recipientForm.address || 'Pick delivery spot'}</p>
                </div>
             </div>
             <button onClick={() => setIsAddressModalOpen(true)} className="bg-primary/10 px-5 h-10 rounded-xl text-[10px] font-black uppercase text-primary border border-primary/5 active:scale-95 transition-all">CHANGE</button>
          </div>
        </section>

        {/* 2. ORDER INVENTORY CARD */}
        <section className="bg-white rounded-[2.5rem] border border-black/5 shadow-xl shadow-gray-200/50 p-7 space-y-8">
           <div className="flex items-center justify-between border-b border-gray-50 pb-5">
              <div className="flex items-center gap-3">
                 <div className="bg-primary/5 p-2 rounded-xl text-primary"><Store className="h-5 w-5" /></div>
                 <h2 className="text-lg font-black italic uppercase tracking-tighter text-gray-900">Order Summary</h2>
              </div>
              <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-xl border border-green-100">
                 <Star className="h-3 w-3 fill-green-600 text-green-600" />
                 <span className="text-[10px] font-black text-green-700">TOP RATED HUB</span>
              </div>
           </div>

           <div className="space-y-6">
             {cart.map((item, idx) => (
                <div key={idx} className="flex gap-5 items-center animate-in fade-in slide-in-from-right-2 duration-500">
                   <div className="h-20 w-20 rounded-3xl overflow-hidden bg-muted relative shrink-0 border-2 border-white shadow-xl">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-black uppercase truncate text-gray-900 leading-none mb-2 italic tracking-tight">{item.name}</h4>
                      {item.selectedOption && (
                        <Badge className="bg-primary/5 text-primary border-none text-[8px] font-black uppercase mb-3 px-2">VARIETY: {item.selectedOption.name}</Badge>
                      )}
                      <div className="flex items-center bg-gray-50 w-fit rounded-2xl p-1 border border-black/5">
                         <button onClick={() => removeFromCart(item.id)} className="h-8 w-8 flex items-center justify-center text-gray-400 active:scale-75 transition-transform"><Minus className="h-4 w-4" /></button>
                         <span className="mx-3 text-xs font-black italic">{item.quantity}</span>
                         <button onClick={() => addToCart({...item, quantity: 1})} className="h-8 w-8 flex items-center justify-center text-primary active:scale-75 transition-transform"><Plus className="h-4 w-4" /></button>
                      </div>
                   </div>
                   <div className="text-lg font-black italic text-gray-900">₹{(item.price * item.quantity).toFixed(0)}</div>
                </div>
             ))}
           </div>
        </section>

        {/* 3. OFFERS & LOYALTY GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* COUPON CARD */}
           <div className="bg-white rounded-[2.5rem] p-7 border border-black/5 shadow-lg relative overflow-hidden group">
              <div className="flex items-center gap-3 mb-5">
                 <div className="h-10 w-10 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                    <Ticket className="h-5 w-5" />
                 </div>
                 <h4 className="text-xs font-black uppercase italic tracking-tighter">Gourmet Offers</h4>
              </div>

              {appliedCoupon ? (
                <div className="bg-green-50 border-2 border-dashed border-green-200 p-4 rounded-2xl flex items-center justify-between animate-in zoom-in">
                   <div>
                      <p className="text-[10px] font-black uppercase text-green-700 leading-none mb-1">{appliedCoupon.code}</p>
                      <p className="text-[9px] font-bold text-green-600 uppercase">SAVED ₹{couponDiscount.toFixed(0)}</p>
                   </div>
                   <button onClick={() => setAppliedCoupon(null)} className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm active:scale-90"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                   <Input 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="ENTER CODE" 
                    className="h-14 bg-gray-50 border-dashed border-2 border-gray-200 rounded-2xl text-xs font-black tracking-widest uppercase focus-visible:ring-primary/20"
                   />
                   <Button onClick={handleApplyCoupon} disabled={isValidatingCoupon || !couponCode.trim()} className="h-14 bg-black text-white rounded-2xl px-6 font-black uppercase italic text-[10px]">APPLY</Button>
                </div>
              )}
           </div>

           {/* COINS CARD - LOCKED (Always Visible) */}
           <div className={cn(
             "rounded-[2.5rem] p-7 border-2 transition-all shadow-lg flex flex-col justify-between",
             isRedeemingCoins ? "border-amber-400 bg-amber-50" : "border-black/5 bg-white"
           )}>
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                      <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center transition-all", isRedeemingCoins ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400 shadow-inner")}>
                         <Coins className={cn("h-6 w-6", isRedeemingCoins && "animate-bounce")} />
                      </div>
                      <div>
                         <h4 className="text-[11px] font-black uppercase text-gray-900 leading-none mb-1">ShopyKart Coins</h4>
                         <p className="text-[9px] font-bold text-amber-600 uppercase italic">
                           {userCoins > 0 ? `Redeem up to ${Math.min(userCoins, 10)} now` : 'Earn coins on this order'}
                         </p>
                      </div>
                   </div>
                   <Switch 
                     disabled={userCoins === 0}
                     checked={isRedeemingCoins} 
                     onCheckedChange={setIsRedeemingCoins} 
                     className="data-[state=checked]:bg-amber-500" 
                   />
                </div>
           </div>
        </section>

        {/* 4. PREMIUM LOGISTICS BAR */}
        <section className="bg-[#0B0B0B] rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden text-white flex items-center justify-between border border-white/5">
           <div className="flex items-center gap-5 relative z-10">
              <div className="h-14 w-14 bg-primary/20 rounded-[1.5rem] flex items-center justify-center text-primary border border-primary/20 shadow-xl shadow-primary/10">
                 <Clock className="h-7 w-7 animate-pulse" />
              </div>
              <div>
                 <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em] block mb-1">Premium Delivery</span>
                 <h4 className="text-xl font-black italic uppercase tracking-tighter leading-none">Arriving in 30 Mins</h4>
              </div>
           </div>
           <div className="text-right relative z-10 pr-2">
              <span className="text-[8px] font-black text-gray-500 uppercase block mb-1">DISTANCE</span>
              <Badge className="bg-white/10 text-white border-none font-black text-[10px] py-1 px-3">2.4 KM</Badge>
           </div>
           <div className="absolute top-0 right-0 h-full w-44 bg-white/5 -skew-x-12 translate-x-12 pointer-events-none" />
        </section>

        {/* 5. NOTES & INSTRUCTIONS */}
        <section className="space-y-4">
           <div className="bg-white rounded-[2.5rem] p-7 border border-black/5 shadow-lg space-y-6">
              <div className="flex items-start gap-4">
                 <div className="h-10 w-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 shrink-0"><MessageSquare className="h-5 w-5" /></div>
                 <div className="flex-1">
                    <label className="text-[10px] font-black uppercase text-primary tracking-widest block mb-2 italic">Chef Instructions</label>
                    <Input 
                      value={cookingNote}
                      onChange={(e) => setCookingNote(e.target.value.toUpperCase())}
                      placeholder="e.g. Less Spicy, No Onion" 
                      className="h-12 bg-gray-50/50 border-none rounded-2xl text-xs font-bold uppercase placeholder:text-gray-300"
                    />
                 </div>
              </div>

              <div className="h-[1px] w-full bg-gray-50" />

              <div className="space-y-4">
                 <div className="flex items-center justify-between p-4 bg-green-50/30 rounded-[1.5rem] border border-green-100/50">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shadow-sm"><Leaf className="h-5 w-5" /></div>
                       <div><h4 className="text-[11px] font-black uppercase text-gray-800 leading-none mb-1">Opt-out Cutlery</h4><p className="text-[8px] font-bold text-green-600 uppercase">Saving Plastic, Better Earth</p></div>
                    </div>
                    <Switch checked={noCutlery} onCheckedChange={setNoCutlery} className="data-[state=checked]:bg-green-600" />
                 </div>

                 <div className="flex items-center justify-between p-4 bg-blue-50/30 rounded-[1.5rem] border border-blue-100/50">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><ShieldCheck className="h-5 w-5" /></div>
                       <div><h4 className="text-[11px] font-black uppercase text-gray-800 leading-none mb-1">Contact-less</h4><p className="text-[8px] font-bold text-blue-600 uppercase">Safety first delivery</p></div>
                    </div>
                    <Switch checked={isContactless} onCheckedChange={setIsContactless} className="data-[state=checked]:bg-blue-600" />
                 </div>
              </div>
           </div>
        </section>

        {/* 6. RIDER TIP */}
        <section className="bg-rose-50/30 rounded-[2.5rem] p-7 border-2 border-dashed border-rose-100 space-y-6">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shadow-sm"><Zap className="h-5 w-5 fill-rose-600" /></div>
              <h4 className="text-xs font-black uppercase italic tracking-tighter">Rider Appreciation</h4>
           </div>
           <div className="grid grid-cols-4 gap-3">
              {[10, 20, 30, 50].map(amt => (
                <button key={amt} onClick={() => setDeliveryTip(deliveryTip === amt ? 0 : amt)} className={cn("h-14 rounded-2xl font-black text-xs border-2 transition-all transform-gpu", deliveryTip === amt ? "bg-rose-600 text-white border-rose-600 scale-105 shadow-xl" : "bg-white text-gray-400 border-rose-50 active:scale-95")}>₹{amt}</button>
              ))}
           </div>
           <p className="text-[8px] font-black text-rose-400 uppercase text-center tracking-[0.2em] italic">100% of this tip goes to your delivery partner</p>
        </section>

        {/* 7. FINAL BILL SUMMARY CARD */}
        <section className="bg-white rounded-[3rem] border border-black/5 shadow-2xl overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform"><Receipt className="h-40 w-40" /></div>
           <div className="p-10 space-y-6 relative z-10">
              <h3 className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 border-b border-gray-100 pb-6 mb-4">Detailed Bill</h3>
              
              <div className="space-y-4">
                 <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest"><span>Item Total</span><span className="text-gray-900 font-black italic">₹{totalPrice.toFixed(0)}</span></div>
                 <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest"><span>Logistics Fee</span><span className="text-gray-900 font-black italic">₹{deliveryFee.toFixed(0)}</span></div>
                 
                 {applicableExtraCharges.map((charge, idx) => (
                   <div key={idx} className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                     <span>{charge.name}</span>
                     <span className="text-gray-900 font-black italic">₹{charge.calculatedAmount.toFixed(0)}</span>
                   </div>
                 ))}

                 {totalSaved > 0 && (
                   <div className="flex justify-between text-[11px] font-black text-green-600 uppercase italic">
                      <span>Total Savings</span>
                      <span>- ₹{totalSaved.toFixed(0)}</span>
                   </div>
                 )}

                 {isDonating && <div className="flex justify-between text-[11px] font-black text-primary uppercase"><span>Feeding India</span><span>₹2</span></div>}
                 {deliveryTip > 0 && <div className="flex justify-between text-[11px] font-black text-rose-600 uppercase"><span>Partner Tip</span><span>₹{deliveryTip}</span></div>}
              </div>
              
              <div className="pt-8 mt-4 border-t-4 border-dashed border-gray-100 flex justify-between items-end">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-primary mb-2 tracking-[0.2em] italic">Net Payable</span>
                    <div className="flex items-center gap-1.5 text-5xl font-black italic text-gray-900 tracking-tighter leading-none">
                       <IndianRupee className="h-8 w-8 text-primary" strokeWidth={3} />
                       <span>{totalPayable.toFixed(0)}</span>
                    </div>
                 </div>
                 {totalSaved > 0 && (
                    <div className="bg-green-600 text-white px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase italic tracking-tighter shadow-xl shadow-green-100 animate-bounce">
                      SAVED ₹{totalSaved.toFixed(0)}!
                    </div>
                 )}
              </div>
           </div>
        </section>

        {/* 8. TRUST & HYGIENE SECTION */}
        <section className="px-6 py-4 space-y-6">
           <div className="flex items-center justify-center gap-10 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
              <div className="flex flex-col items-center gap-2">
                 <div className="h-14 w-14 border-4 border-black rounded-full flex items-center justify-center font-black text-base italic">FSSAI</div>
                 <span className="text-[7px] font-black uppercase tracking-widest">22724999000123</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <div className="h-14 w-14 border-4 border-black rounded-full flex items-center justify-center">
                    <Shield className="h-7 w-7 text-black fill-black/10" />
                 </div>
                 <span className="text-[7px] font-black uppercase tracking-widest">HYGIENIC PREP</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                 <div className="h-14 w-14 border-4 border-black rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-7 w-7 text-black" />
                 </div>
                 <span className="text-[7px] font-black uppercase tracking-widest">100% VEG</span>
              </div>
           </div>
           
           <div className="bg-gray-100/50 p-6 rounded-[2.5rem] border border-black/[0.03]">
              <div className="flex items-start gap-4">
                 <Info className="h-5 w-5 text-gray-400 shrink-0 mt-1" />
                 <p className="text-[9px] font-bold text-gray-500 uppercase leading-relaxed tracking-wider">
                    POLICY: Cancellation is not permitted once the store accepts the order. 
                    A 100% fee applies for no-shows or refusal.
                 </p>
              </div>
           </div>
        </section>

        {/* 9. PAYMENT SELECTION */}
        <section className="bg-white rounded-[2.5rem] p-8 border border-black/5 shadow-xl space-y-6">
           <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-inner"><CreditCard className="h-5 w-5" /></div>
              <h4 className="text-sm font-black uppercase italic tracking-tighter">Secure Payment</h4>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setPaymentMethod('COD')} className={cn("h-20 rounded-[1.75rem] border-2 flex flex-col items-center justify-center gap-2 transition-all transform-gpu", paymentMethod === 'COD' ? "bg-primary/5 border-primary text-primary shadow-xl" : "bg-gray-50 border-transparent text-gray-400 active:scale-95")}>
                 <Banknote className="h-5 w-5" /><span className="text-[10px] font-black uppercase tracking-widest">Cash on Delivery</span>
              </button>
              <button onClick={() => setPaymentMethod('UPI')} className={cn("h-20 rounded-[1.75rem] border-2 flex flex-col items-center justify-center gap-2 transition-all transform-gpu", paymentMethod === 'UPI' ? "bg-blue-50 border-blue-500 text-blue-700 shadow-xl" : "bg-gray-50 border-transparent text-gray-400 active:scale-95")}>
                 <QrCode className="h-5 w-5" /><span className="text-[10px] font-black uppercase tracking-widest">Pay Via UPI</span>
              </button>
           </div>
        </section>

        {/* 10. MEGA ACTION BUTTON */}
        <div className="pt-4 pb-12">
          <Button 
            onClick={finalizeOrder} 
            disabled={isPlacing || !isMinOrderMet || cart.length === 0} 
            className="w-full h-24 bg-[#0B0B0B] hover:bg-black text-white rounded-[3rem] font-black uppercase italic text-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] active:scale-95 transition-all transform-gpu flex items-center justify-center gap-4 group border-b-8 border-gray-900"
          >
            {isPlacing ? <Loader2 className="h-10 w-10 animate-spin" /> : <>PROCEED TO ORDER <ArrowRight className="h-8 w-8 text-primary group-hover:translate-x-2 transition-transform" strokeWidth={3} /></>}
          </Button>
          <p className="text-center text-[9px] font-black text-gray-300 uppercase tracking-[0.5em] mt-8">ShopyKart Official Premium Network</p>
        </div>
      </main>

      {/* UPI SCAN DIALOG */}
      <Dialog open={isUpiModalOpen} onOpenChange={setIsUpiModalOpen}>
        <DialogContent className="rounded-t-[4rem] p-10 bg-white focus:outline-none bottom-0 top-auto translate-y-0 h-[680px] flex flex-col border-none shadow-2xl">
           <div className="text-center space-y-8">
              <div className="h-20 w-20 bg-blue-50 rounded-[1.5rem] flex items-center justify-center text-blue-600 mx-auto shadow-inner"><QrCode className="h-10 w-10" /></div>
              <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter">Scan & Secure</DialogTitle>
              <div className="bg-gray-50 p-8 rounded-[3rem] border-4 border-dashed border-gray-200 relative overflow-hidden group">
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${totalPayable}&cu=INR`)}`} className="h-56 w-56 mx-auto relative z-10" alt="UPI QR" />
                 <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <h4 className="mt-6 text-4xl font-black italic text-gray-900 tracking-tighter">₹{totalPayable.toFixed(0)}</h4>
              </div>
              <div className="space-y-5">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-blue-600 block text-left ml-2 tracking-widest italic">12-Digit Transaction UTR</label>
                    <Input placeholder="0 0 0 0 0 0 0 0 0 0 0 0" value={utrNumber} onChange={e => setUtrNumber(e.target.value.replace(/\D/g,'').slice(0, 12))} className="h-18 rounded-[1.5rem] bg-gray-50 border-none font-black text-3xl text-center tracking-[0.2em] focus-visible:ring-1 focus-visible:ring-blue-500/20" />
                 </div>
                 <Button onClick={finalizeOrder} disabled={utrNumber.length !== 12 || isPlacing} className="w-full h-20 bg-black text-white rounded-[2rem] font-black uppercase italic text-xl shadow-xl shadow-blue-100">CONFIRM & PLACE ORDER</Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      {/* ADDRESS INPUT DIALOG */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="rounded-t-[4rem] p-10 bg-white bottom-0 top-auto translate-y-0 h-[620px] flex flex-col focus:outline-none border-none shadow-2xl">
          <DialogHeader className="text-center space-y-4">
             <div className="h-16 w-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary mx-auto shadow-inner"><MapPin className="h-8 w-8" /></div>
             <DialogTitle className="text-3xl font-black uppercase italic tracking-tighter text-gray-900">Drop Identity</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-8">
              <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Full Name</label>
                 <Input value={recipientForm.name} onChange={e => setRecipientForm({...recipientForm, name: e.target.value.toUpperCase()})} className="h-16 rounded-[1.5rem] bg-gray-50 border-none font-black text-sm px-6" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Active Mobile</label>
                 <Input type="tel" value={recipientForm.phone} onChange={e => setRecipientForm({...recipientForm, phone: e.target.value.replace(/\D/g,'').slice(0,10)})} className="h-16 rounded-[1.5rem] bg-gray-50 border-none font-black text-lg px-6 tracking-widest" />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[9px] font-black uppercase text-gray-400 ml-2 tracking-widest">Precise Address</label>
                 <textarea value={recipientForm.address} onChange={e => setRecipientForm({...recipientForm, address: e.target.value.toUpperCase()})} className="w-full h-32 p-6 rounded-[2rem] bg-gray-50 border-none font-bold text-xs uppercase focus:outline-none focus:ring-1 focus:ring-primary/20" />
              </div>
              <Button onClick={() => { if(recipientForm.phone.length===10 && recipientForm.name && recipientForm.address) { localStorage.setItem('user_name', recipientForm.name); localStorage.setItem('user_phone', recipientForm.phone); localStorage.setItem('user_address_line', recipientForm.address); setIsAddressModalOpen(false); } }} className="w-full h-20 bg-black text-white rounded-[2.5rem] font-black uppercase italic text-lg shadow-xl shadow-primary/20">LOCK DETAILS</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
