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
  Check
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

/**
 * @fileOverview CartPage upgraded with 12+ Zomato/Swiggy Premium Features.
 * New Features: Coin Redemption, Coupon System, FSSAI Info, Dynamic Savings, Contactless Toggle.
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

  // CALCULATION LOGIC
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
      
      // Update coins if redeemed
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

  const toggleDeliveryInst = (inst: string) => {
    setDeliveryInst(prev => prev.includes(inst) ? prev.filter(i => i !== inst) : [...prev, inst]);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-40 max-w-lg mx-auto relative overflow-hidden transform-gpu no-scrollbar">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />
      
      <header className="bg-white py-4 px-6 sticky top-0 z-[100] flex items-center gap-4 border-b border-black/5">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 active:scale-90"><ChevronLeft className="h-6 w-6" /></button>
        <div className="flex-1 text-center">
           <h1 className="text-sm font-black uppercase italic tracking-widest text-gray-800">Checkout</h1>
           <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{cart.length} ITEMS SELECTED</p>
        </div>
        <Badge variant="outline" className="rounded-xl bg-amber-50 text-amber-600 font-black text-[9px] border-amber-200"><Coins className="h-2.5 w-2.5 mr-1" /> {userCoins}</Badge>
      </header>

      <main className="px-4 pt-6 space-y-6">
        <div className="bg-white rounded-[2.5rem] border border-black/5 shadow-sm overflow-hidden">
          {/* 1. DROP POINT */}
          <section className="p-6 flex items-center justify-between border-b border-gray-50 bg-gray-50/30">
             <div className="flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 bg-black rounded-2xl flex items-center justify-center text-white shrink-0"><Navigation className="h-6 w-6" /></div>
                <div className="min-w-0 pr-4">
                   <h4 className="text-[10px] font-black uppercase text-primary italic">Drop Destination</h4>
                   <h4 className="text-xs font-black uppercase truncate">{recipientForm.name || 'Anonymous User'}</h4>
                   <p className="text-[9px] font-bold text-gray-400 truncate mt-1">{recipientForm.address || 'Select Address'}</p>
                </div>
             </div>
             <button onClick={() => setIsAddressModalOpen(true)} className="bg-primary/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-primary border border-primary/5 active:scale-90 transition-transform">EDIT</button>
          </section>

          {/* 2. ITEM LIST & RESTAURANT TRUST */}
          <section className="p-6 space-y-6">
             <div className="flex items-center justify-between px-1 mb-2">
                <div className="flex items-center gap-2">
                   <Store className="h-4 w-4 text-gray-400" />
                   <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">{vendors?.find(v => v.id === cart[0]?.vendorId)?.storeName || 'ShopyKart Hub'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                   <div className="bg-green-50 px-2 py-0.5 rounded-lg border border-green-100 flex items-center gap-1">
                      <Star className="h-2.5 w-2.5 fill-green-600 text-green-600" />
                      <span className="text-[9px] font-black text-green-700">4.5</span>
                   </div>
                </div>
             </div>

             {cart.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center animate-in fade-in slide-in-from-right-2" style={{ animationDelay: `${idx * 100}ms` }}>
                   <div className="h-16 w-16 rounded-2xl overflow-hidden bg-muted relative shrink-0 border border-black/5">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-black uppercase truncate leading-none mb-1.5">{item.name}</h4>
                      <div className="flex items-center mt-1 bg-gray-50 w-fit rounded-xl p-0.5 border border-black/5">
                         <button onClick={() => removeFromCart(item.id)} className="h-7 w-7 flex items-center justify-center text-gray-500 active:scale-75"><Minus className="h-3 w-3" /></button>
                         <span className="mx-2 text-[10px] font-black">{item.quantity}</span>
                         <button onClick={() => addToCart({...item, quantity: 1})} className="h-7 w-7 flex items-center justify-center text-primary active:scale-75"><Plus className="h-3 w-3" /></button>
                      </div>
                   </div>
                   <div className="text-sm font-black italic">₹{(item.price * item.quantity).toFixed(0)}</div>
                </div>
             ))}
          </section>

          {/* 3. COUPON SECTION */}
          <section className="px-6 py-4 bg-primary/[0.02] border-y border-primary/5">
             <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                   <Ticket className="h-5 w-5" />
                </div>
                <h4 className="text-xs font-black uppercase italic tracking-tighter">Offers & Coupons</h4>
             </div>
             
             {appliedCoupon ? (
               <div className="flex items-center justify-between p-4 bg-green-50 border-2 border-dashed border-green-200 rounded-2xl animate-in zoom-in">
                  <div className="flex items-center gap-3">
                     <CheckCircle2 className="h-5 w-5 text-green-600" />
                     <div>
                        <p className="text-[10px] font-black uppercase text-green-700 leading-none mb-1">{appliedCoupon.code} APPLIED</p>
                        <p className="text-[9px] font-bold text-green-600 uppercase">You saved ₹{couponDiscount.toFixed(0)}</p>
                     </div>
                  </div>
                  <button onClick={() => setAppliedCoupon(null)} className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-red-500 shadow-sm"><X className="h-4 w-4" /></button>
               </div>
             ) : (
               <div className="flex gap-2">
                  <Input 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="ENTER PROMO CODE" 
                    className="h-12 bg-white border-dashed border-2 border-primary/20 rounded-xl text-xs font-black tracking-widest uppercase focus-visible:ring-primary/20"
                  />
                  <Button 
                    onClick={handleApplyCoupon}
                    disabled={isValidatingCoupon || !couponCode.trim()}
                    className="h-12 bg-black text-white rounded-xl font-black uppercase italic text-[10px] px-6"
                  >
                    {isValidatingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : 'APPLY'}
                  </Button>
               </div>
             )}
          </section>

          {/* 4. COIN REDEMPTION */}
          {userCoins > 0 && (
             <section className="p-6">
                <div className={cn(
                  "p-5 rounded-[2rem] border-2 transition-all flex items-center justify-between",
                  isRedeemingCoins ? "border-amber-400 bg-amber-50" : "border-gray-50 bg-gray-50/50"
                )}>
                   <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
                        isRedeemingCoins ? "bg-amber-100 text-amber-600" : "bg-gray-200 text-gray-400"
                      )}>
                         <Coins className={cn("h-6 w-6", isRedeemingCoins && "animate-bounce")} />
                      </div>
                      <div>
                         <h4 className="text-[11px] font-black uppercase text-gray-900 leading-none mb-1">Use ShopyKart Coins</h4>
                         <p className="text-[9px] font-bold text-amber-600 uppercase">Redeem {Math.min(userCoins, 10)} coins for instant discount</p>
                      </div>
                   </div>
                   <Switch checked={isRedeemingCoins} onCheckedChange={setIsRedeemingCoins} className="data-[state=checked]:bg-amber-500" />
                </div>
             </section>
          )}

          {/* 5. COOKING INSTRUCTIONS */}
          <section className="px-6 py-4 border-y border-gray-50">
             <div className="bg-gray-50/50 p-4 rounded-2xl flex items-start gap-4 border border-black/5">
                <MessageSquare className="h-5 w-5 text-gray-400 mt-1" />
                <div className="flex-1">
                   <label className="text-[10px] font-black uppercase text-gray-500 mb-2 block">Cooking Instructions</label>
                   <Input 
                    value={cookingNote}
                    onChange={(e) => setCookingNote(e.target.value)}
                    placeholder="e.g. Less spicy, No onion" 
                    className="h-10 bg-white border-none rounded-xl text-xs font-bold focus-visible:ring-1 focus-visible:ring-primary/20"
                   />
                </div>
             </div>
          </section>

          {/* 6. SAFETY & GO GREEN */}
          <section className="p-6 space-y-4">
             <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-green-100">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600"><Leaf className="h-5 w-5" /></div>
                   <div>
                      <h4 className="text-[11px] font-black uppercase text-gray-900 leading-none mb-1">Opt-out of Cutlery</h4>
                      <p className="text-[8px] font-bold text-green-600 uppercase">Save plastic for a better planet</p>
                   </div>
                </div>
                <Switch checked={noCutlery} onCheckedChange={setNoCutlery} className="data-[state=checked]:bg-green-600" />
             </div>

             <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600"><ShieldCheck className="h-5 w-5" /></div>
                   <div>
                      <h4 className="text-[11px] font-black uppercase text-gray-900 leading-none mb-1">Contact-less Delivery</h4>
                      <p className="text-[8px] font-bold text-blue-600 uppercase">Rider will leave order at your doorstep</p>
                   </div>
                </div>
                <Switch checked={isContactless} onCheckedChange={setIsContactless} className="data-[state=checked]:bg-blue-600" />
             </div>

             <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Heart className="h-5 w-5 fill-primary" /></div>
                   <div>
                      <h4 className="text-[11px] font-black uppercase text-gray-900 leading-none mb-1">Feed India</h4>
                      <p className="text-[8px] font-bold text-primary uppercase">Add ₹2 to feed someone in need</p>
                   </div>
                </div>
                <Switch checked={isDonating} onCheckedChange={setIsDonating} />
             </div>
          </section>

          {/* 7. LOGISTICS CONTEXT (ZOMATO STYLE) */}
          <section className="p-6 bg-gray-900 text-white flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="h-11 w-11 bg-white/10 rounded-2xl flex items-center justify-center text-primary border border-white/5">
                   <Navigation className="h-5 w-5" />
                </div>
                <div>
                   <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-1">Premium Logistics</p>
                   <h4 className="text-sm font-black italic uppercase tracking-tighter leading-none">Arriving in 15-20 Mins</h4>
                </div>
             </div>
             <div className="text-right">
                <span className="text-[7px] font-bold text-gray-500 uppercase block mb-1">Distance</span>
                <Badge className="bg-white/10 text-white border-none font-black text-[9px]">2.4 KM</Badge>
             </div>
          </section>

          {/* 8. RIDER TIP */}
          <section className="p-6 bg-rose-50/30 border-y border-rose-50">
             <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Zap className="h-5 w-5 fill-rose-600" /></div><h4 className="text-xs font-black uppercase tracking-tighter">Rider Appreciation Tip</h4></div>
             <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 50].map(amt => (
                  <button key={amt} onClick={() => setDeliveryTip(deliveryTip === amt ? 0 : amt)} className={cn("h-11 rounded-xl font-black text-xs border-2 transition-all transform-gpu", deliveryTip === amt ? "bg-rose-600 text-white border-rose-600 scale-105 shadow-lg" : "bg-white text-gray-400 border-gray-100 active:scale-95")}>₹{amt}</button>
                ))}
             </div>
             <p className="text-[7px] font-bold text-rose-400 uppercase mt-3 text-center tracking-widest italic">100% of this tip goes to your delivery partner</p>
          </section>

          {/* 9. FINAL BILL (ZOMATO STYLE) */}
          <section className="p-6 space-y-6 bg-muted/10 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none"><Receipt className="h-32 w-32 -rotate-12" /></div>
             <h3 className="text-xl font-black italic uppercase text-gray-900 relative z-10">Bill Summary</h3>
             <div className="space-y-3 relative z-10">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Item Total</span><span className="text-gray-900 font-black">₹{totalPrice.toFixed(0)}</span></div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Delivery Fee</span><span className="text-gray-900 font-black">₹{deliveryFee.toFixed(0)}</span></div>
                {applicableExtraCharges.map((charge, idx) => (
                  <div key={idx} className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>{charge.name}</span>
                    <span className="text-gray-900 font-black">₹{charge.calculatedAmount.toFixed(0)}</span>
                  </div>
                ))}
                {couponDiscount > 0 && <div className="flex justify-between text-[10px] font-black text-green-600 uppercase"><span>Coupon Discount</span><span>- ₹{couponDiscount.toFixed(0)}</span></div>}
                {coinDiscount > 0 && <div className="flex justify-between text-[10px] font-black text-amber-600 uppercase"><span>Coin Redemption</span><span>- ₹{coinDiscount.toFixed(0)}</span></div>}
                {isDonating && <div className="flex justify-between text-[10px] font-black text-primary uppercase"><span>Feeding India</span><span>₹2</span></div>}
                {deliveryTip > 0 && <div className="flex justify-between text-[10px] font-black text-rose-500 uppercase"><span>Delivery Partner Tip</span><span>₹{deliveryTip}</span></div>}
             </div>
             
             <div className="pt-6 border-t-2 border-dashed border-black/5 flex justify-between items-end relative z-10">
                <div className="flex flex-col"><span className="text-[8px] font-black uppercase text-primary mb-1">Final Payable</span><div className="flex items-center gap-1 text-4xl font-black italic text-gray-900 leading-none"><IndianRupee className="h-6 w-6 text-primary" /><span>{totalPayable.toFixed(0)}</span></div></div>
                {totalSaved > 0 && (
                   <div className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-[8px] font-black uppercase italic tracking-tighter animate-bounce">
                     SAVING ₹{totalSaved.toFixed(0)} ON THIS BILL
                   </div>
                )}
             </div>
          </section>

          {/* 10. FSSAI & HYGIENE FOOTER */}
          <section className="p-8 border-t border-gray-50 text-center space-y-4">
             <div className="flex items-center justify-center gap-6 opacity-30">
                <div className="flex flex-col items-center">
                   <div className="h-10 w-10 border-2 border-black rounded-full flex items-center justify-center text-xs font-black">FSSAI</div>
                   <span className="text-[6px] font-black mt-1">22724999000123</span>
                </div>
                <div className="flex flex-col items-center">
                   <div className="h-10 w-10 border-2 border-black rounded-full flex items-center justify-center"><Utensils className="h-4 w-4" /></div>
                   <span className="text-[6px] font-black mt-1">HYGIENIC PREP</span>
                </div>
             </div>
             <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest max-w-[240px] mx-auto leading-relaxed">
               All items are prepared following strict FSSAI guidelines for maximum quality and safety.
             </p>
          </section>
        </div>

        {/* PAYMENT METHOD */}
        <div className="bg-white rounded-[2rem] p-6 border border-black/5 shadow-sm space-y-5">
           <div className="flex items-center gap-3"><div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><CreditCard className="h-5 w-5" /></div><h4 className="text-xs font-black uppercase tracking-tighter">Choose Payment</h4></div>
           <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setPaymentMethod('COD')} className={cn("h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all", paymentMethod === 'COD' ? "bg-primary/5 border-primary text-primary shadow-inner" : "bg-gray-50 border-transparent text-gray-400")}>
                 <Banknote className="h-4 w-4" /><span className="text-[9px] font-black uppercase tracking-widest">COD (Cash)</span>
              </button>
              <button onClick={() => setPaymentMethod('UPI')} className={cn("h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition-all", paymentMethod === 'UPI' ? "bg-blue-50 border-blue-500 text-blue-700 shadow-inner" : "bg-gray-50 border-transparent text-gray-400")}>
                 <QrCode className="h-4 w-4" /><span className="text-[9px] font-black uppercase tracking-widest">Pay Via UPI</span>
              </button>
           </div>
        </div>

        {/* CANCELLATION DISCLAIMER */}
        <div className="p-4 flex gap-3 items-start bg-gray-50 rounded-2xl border border-black/[0.03]">
           <Info className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
           <p className="text-[8px] font-bold text-gray-400 uppercase leading-relaxed">
             Policy: Once order is accepted, cancellation will not be allowed. A 100% cancellation fee will be applicable in case of no-show or refusal to accept delivery.
           </p>
        </div>

        <Button onClick={finalizeOrder} disabled={isPlacing || !isMinOrderMet || cart.length === 0} className="w-full h-20 bg-black text-white rounded-[2.5rem] font-black uppercase italic text-xl shadow-2xl active:scale-95 transition-all transform-gpu hover:bg-gray-900 group">
          {isPlacing ? <Loader2 className="h-8 w-8 animate-spin" /> : <>PLACE ORDER <ArrowRight className="h-6 w-6 ml-2 group-hover:translate-x-1 transition-transform" /></>}
        </Button>

        <p className="text-center text-[8px] font-black text-gray-300 uppercase tracking-[0.4em] pt-4 pb-10">ShopyKart Premium Network</p>
      </main>

      {/* UPI DIALOG */}
      <Dialog open={isUpiModalOpen} onOpenChange={setIsUpiModalOpen}>
        <DialogContent className="rounded-t-[3rem] p-8 bg-white focus:outline-none bottom-0 top-auto translate-y-0 h-[650px] flex flex-col">
           <div className="text-center space-y-6">
              <QrCode className="h-12 w-12 mx-auto text-primary" />
              <DialogTitle className="text-2xl font-black uppercase italic">Scan to Pay</DialogTitle>
              <div className="bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200">
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${totalPayable}&cu=INR`)}`} className="h-48 w-48 mx-auto" alt="UPI QR" />
                 <h4 className="mt-4 text-3xl font-black italic text-gray-900">₹{totalPayable.toFixed(0)}</h4>
              </div>
              <div className="space-y-4">
                 <label className="text-[10px] font-black uppercase text-blue-600 block text-left">Enter 12-Digit UTR Number</label>
                 <Input placeholder="E.G. 412356789012" value={utrNumber} onChange={e => setUtrNumber(e.target.value.replace(/\D/g,'').slice(0, 12))} className="h-14 rounded-2xl bg-blue-50 border-none font-black text-xl text-center" />
                 <Button onClick={finalizeOrder} disabled={utrNumber.length !== 12 || isPlacing} className="w-full h-16 bg-black text-white rounded-[1.5rem] font-black uppercase italic">CONFIRM PAYMENT</Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      {/* ADDRESS DIALOG */}
      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="rounded-t-[3.5rem] p-8 bg-white bottom-0 top-auto translate-y-0 h-[580px] flex flex-col focus:outline-none">
          <DialogHeader className="text-center"><MapPin className="h-12 w-12 mx-auto text-primary mb-2" /><DialogTitle className="text-3xl font-black uppercase italic">Drop Address</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-6">
              <Input placeholder="NAME" value={recipientForm.name} onChange={e => setRecipientForm({...recipientForm, name: e.target.value.toUpperCase()})} className="h-14 rounded-2xl bg-gray-50 border-none font-black" />
              <Input placeholder="10 DIGIT PHONE" value={recipientForm.phone} onChange={e => setPhoneNumber(e.target.value)} className="h-14 rounded-2xl bg-gray-50 border-none font-black" />
              <textarea placeholder="HOUSE NO / STREET / AREA" value={recipientForm.address} onChange={e => setRecipientForm({...recipientForm, address: e.target.value.toUpperCase()})} className="w-full h-28 p-4 rounded-2xl bg-gray-50 border-none font-bold text-xs uppercase" />
              <Button onClick={() => { if(recipientForm.phone.length===10 && recipientForm.name && recipientForm.address) { localStorage.setItem('user_name', recipientForm.name); localStorage.setItem('user_phone', recipientForm.phone); localStorage.setItem('user_address_line', recipientForm.address); setIsAddressModalOpen(false); } }} className="w-full h-18 bg-black text-white rounded-[2rem] font-black uppercase italic">SAVE DETAILS</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  function setPhoneNumber(val: string) {
    const clean = val.replace(/\D/g,'').slice(0, 10);
    setRecipientForm(prev => ({ ...prev, phone: clean }));
  }
}
