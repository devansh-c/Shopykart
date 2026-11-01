
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
  PackageCheck,
  Tag,
  Ticket,
  X,
  CreditCard,
  Banknote,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Heart,
  Receipt
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
  const [currentMinutes, setCurrentTimeMinutes] = useState<number | null>(null);
  
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [recipientForm, setRecipientForm] = useState({ name: '', phone: '', address: '' });
  
  const [deliveryTip, setDeliveryTip] = useState(0);
  const [isPremiumPacking, setIsPremiumPacking] = useState(false);
  const [isRedeemingCoins, setIsRedeemingCoins] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI'>('COD');
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');

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
        setCurrentTimeMinutes(now.getHours() * 60 + now.getMinutes()); 
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

  // Fetch extra charges (GST, Packaging Fee, etc.)
  const extraChargesQuery = useMemoFirebase(() => firestore ? collection(firestore, 'checkout_charges') : null, [firestore]);
  const { data: dbExtraCharges } = useCollection<any>(extraChargesQuery, 'checkout_extra_charges');

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
  const hardcodedPackingFee = isPremiumPacking ? 10 : 0;

  // Filter and calculate extra charges for this zone
  const applicableExtraCharges = useMemo(() => {
    if (!dbExtraCharges) return [];
    return dbExtraCharges.filter(charge => 
      charge.zoneId === 'global' || charge.zoneId === activeZoneId
    ).map(charge => {
      const chargeValue = charge.type === 'percentage' 
        ? (totalPrice * charge.value) / 100 
        : charge.value;
      return {
        ...charge,
        calculatedAmount: chargeValue
      };
    });
  }, [dbExtraCharges, activeZoneId, totalPrice]);

  const extraChargesTotal = useMemo(() => {
    return applicableExtraCharges.reduce((sum, c) => sum + c.calculatedAmount, 0);
  }, [applicableExtraCharges]);

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
          if (data.vendorId) {
            const hasStoreItem = cart.some(item => item.vendorId === data.vendorId);
            if (!hasStoreItem) {
               toast({ variant: "destructive", title: "Coupon Not Valid", description: `This offer is only for ${data.vendorName} items.` });
               return;
            }
          }
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
    
    let applicableTotal = totalPrice;
    if (appliedCoupon.vendorId) {
       applicableTotal = cart
         .filter(item => item.vendorId === appliedCoupon.vendorId)
         .reduce((acc, item) => acc + (item.price * item.quantity), 0);
    }

    if (appliedCoupon.discountType === 'percentage') {
      return (applicableTotal * appliedCoupon.discountValue) / 100;
    }
    return Math.min(applicableTotal, appliedCoupon.discountValue);
  }, [appliedCoupon, totalPrice, cart]);

  const totalPayable = useMemo(() => {
    return Math.max(0, totalPrice + deliveryFee + deliveryTip + hardcodedPackingFee + extraChargesTotal - coinDiscount - couponDiscount);
  }, [totalPrice, deliveryFee, deliveryTip, hardcodedPackingFee, extraChargesTotal, coinDiscount, couponDiscount]);

  const finalizeOrder = async () => {
    const sessionActive = typeof window !== 'undefined' && localStorage.getItem('shopykart_session_active') === 'true';
    if (!user && !sessionActive) {
      window.dispatchEvent(new CustomEvent('open-auth-overlay'));
      return;
    }
    if (cart.length === 0) {
      toast({ variant: "destructive", title: "Bag Empty" });
      return;
    }
    if (hasClosedItems) {
      toast({ variant: "destructive", title: "Items Unavailable", description: "Some stores are currently closed." });
      return;
    }
    if (!isMinOrderMet) {
      toast({ variant: "destructive", title: "Min Order Not Met", description: `Add ₹${minOrderValue - totalPrice} more.` });
      return;
    }
    if (!recipientForm.name || recipientForm.phone.length !== 10 || !recipientForm.address) {
      setIsAddressModalOpen(true); 
      return;
    }

    // Handle UPI Step
    if (paymentMethod === 'UPI' && !isUpiModalOpen && !utrNumber) {
      setIsUpiModalOpen(true);
      return;
    }

    setIsPlacing(true);
    try {
      const allVendorIds = Array.from(new Set(cart.map(item => String(item.vendorId)).filter(Boolean)));
      const firstVendorId = allVendorIds[0];
      const firstVendor = vendors?.find(v => String(v.id) === String(firstVendorId));
      const vendorPhone = firstVendor?.phone || '';

      const orderData = {
        userId: user?.uid || 'guest_user',
        customerName: recipientForm.name,
        customerPhone: recipientForm.phone,
        address: recipientForm.address,
        items: cart,
        total: totalPayable,
        status: 'Placed',
        createdAt: serverTimestamp(),
        vendorId: firstVendorId || null,
        vendorIds: allVendorIds,
        vendorPhone: vendorPhone,
        restaurantName: cart[0]?.restaurantName || 'ShopyKart Select',
        deliveryOTP: Math.floor(100000 + Math.random() * 900000).toString(),
        deliveryFee,
        deliveryTip,
        extraCharges: applicableExtraCharges,
        extraChargesTotal,
        hardcodedPackingFee,
        coinDiscount,
        couponDiscount,
        paymentMethod,
        paymentStatus: paymentMethod === 'UPI' ? 'Paid (UTR Provided)' : 'Pending (COD)',
        paymentUTR: utrNumber || null,
        redeemCoins: isRedeemingCoins,
        isPremiumPacking,
        deliveryInstructions,
        zoneId: activeZoneId,
        customerOrderNumber: Math.floor(1000 + Math.random() * 9000)
      };

      await addDoc(collection(firestore!, 'orders'), orderData);
      if (isRedeemingCoins && user) await updateDoc(doc(firestore!, 'users', user.uid), { coins: increment(-20) });

      setIsUpiModalOpen(false);
      setShowSuccessOverlay(true);
      setTimeout(() => { clearCart(); router.replace('/orders'); }, 1500);
    } catch (e) { 
      setIsPlacing(false); 
      toast({ variant: "destructive", title: "Order Failed" });
    }
  };

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
        <div className="bg-white rounded-[1.5rem] overflow-hidden border border-border shadow-sm mb-6">
          
          <section className="px-5 py-6 flex items-center justify-between border-b border-gray-50">
             <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className="h-12 w-12 bg-[#0B0B0B] rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg">
                   <Navigation className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0 pr-4">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5 italic">Drop Spot</h4>
                   <h4 className="text-xs font-black uppercase truncate text-gray-900 leading-none">{recipientForm.name || 'Set Recipient'}</h4>
                   <p className="text-[9px] font-bold text-gray-400 uppercase truncate leading-tight mt-1.5">{recipientForm.address || 'Click Edit to Add Address'}</p>
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
                     <div className="h-16 w-16 rounded-[1.25rem] overflow-hidden bg-muted border border-black/5 relative shrink-0">
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                     </div>
                     <div className="flex-1 min-w-0">
                        <h4 className="text-[11px] font-black uppercase truncate text-gray-900 leading-tight">{item.name}</h4>
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

          <section className="p-6 bg-rose-50/30 border-y border-rose-50">
             <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                   <Heart className="h-5 w-5 fill-rose-600" />
                </div>
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-rose-600 italic leading-none">Rider Support</h3>
                   <h4 className="text-xs font-black uppercase text-gray-900 mt-1">DELIVERY TIP</h4>
                </div>
             </div>
             
             <div className="grid grid-cols-5 gap-2">
                {[10, 20, 30, 50].map((amount) => (
                  <button 
                    key={amount}
                    onClick={() => setDeliveryTip(deliveryTip === amount ? 0 : amount)}
                    className={cn(
                      "h-10 rounded-xl font-black text-xs transition-all border-2",
                      deliveryTip === amount ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200" : "bg-white text-gray-400 border-gray-100"
                    )}
                  >
                    ₹{amount}
                  </button>
                ))}
                <button 
                  onClick={() => setDeliveryTip(0)}
                  className="h-10 flex items-center justify-center text-gray-300 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
             </div>
          </section>

          <section className="p-6 bg-gray-50/50">
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
                   placeholder="PROMO CODE"
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

          <section className="p-6 flex items-center justify-between border-y border-gray-50 bg-amber-50/20">
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

          <section className="p-6 space-y-4">
             <div className="flex items-center gap-4 mb-2">
                <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                   <CreditCard className="h-5 w-5" />
                </div>
                <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 italic leading-none">Secure Payment</h3>
                   <h4 className="text-xs font-black uppercase text-gray-900 mt-1">CHOOSE METHOD</h4>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setPaymentMethod('COD')}
                  className={cn(
                    "p-5 rounded-[1.75rem] border-2 flex flex-col items-center gap-2 transition-all",
                    paymentMethod === 'COD' ? "border-[#0B0B0B] bg-[#0B0B0B] text-white shadow-xl" : "border-gray-100 bg-gray-50 text-gray-400"
                  )}
                >
                  <Banknote className="h-6 w-6" />
                  <span className="text-[10px] font-black uppercase tracking-widest">CASH ON DEL</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('UPI')}
                  className={cn(
                    "p-5 rounded-[1.75rem] border-2 flex flex-col items-center gap-2 transition-all",
                    paymentMethod === 'UPI' ? "border-[#0B0B0B] bg-[#0B0B0B] text-white shadow-xl" : "border-gray-100 bg-gray-50 text-gray-400"
                  )}
                >
                  <QrCode className="h-6 w-6" />
                  <span className="text-[10px] font-black uppercase tracking-widest">UPI SCAN PAY</span>
                </button>
             </div>
          </section>

          <section className="p-6 space-y-6 bg-muted/10">
             <h3 className="text-xl font-black italic uppercase tracking-tighter text-gray-900">Final Bill</h3>
             <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Item Subtotal</span><span className="text-gray-900 font-black">₹{totalPrice.toFixed(0)}</span></div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Delivery & Handling</span><span className="text-gray-900 font-black">₹{deliveryFee.toFixed(0)}</span></div>
                
                {/* Dynamic Extra Charges from Admin */}
                {applicableExtraCharges.map((charge, idx) => (
                  <div key={idx} className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <span>{charge.name} {charge.type === 'percentage' ? `(${charge.value}%)` : ''}</span>
                    <span className="text-gray-900 font-black">₹{charge.calculatedAmount.toFixed(0)}</span>
                  </div>
                ))}

                {deliveryTip > 0 && <div className="flex justify-between text-[10px] font-bold text-rose-500 uppercase tracking-widest"><span>Rider Tip</span><span className="font-black">₹{deliveryTip}</span></div>}
                {hardcodedPackingFee > 0 && <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Safety Pack</span><span className="text-gray-900 font-black">₹{hardcodedPackingFee}</span></div>}
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
           <Button 
             onClick={finalizeOrder}
             disabled={isPlacing || hasClosedItems || !isMinOrderMet || cart.length === 0}
             className="w-full h-20 bg-[#0B0B0B] hover:bg-primary text-white rounded-[2.5rem] font-black uppercase italic text-xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
           >
             {isPlacing ? <Loader2 className="h-8 w-8 animate-spin" /> : <>PLACE ORDER <ArrowRight className="h-6 w-6" /></>}
           </Button>
        </div>
      </main>

      {/* UPI QR & UTR MODAL */}
      <Dialog open={isUpiModalOpen} onOpenChange={setIsUpiModalOpen}>
        <DialogContent className="rounded-t-[3.5rem] sm:rounded-[3.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white max-w-sm h-[680px] flex flex-col focus:outline-none bottom-0 top-auto translate-y-0 sm:top-1/2 sm:-translate-y-1/2">
           <div className="bg-primary h-2 w-full" />
           <div className="p-8 text-center flex flex-col h-full overflow-y-auto no-scrollbar">
              <div className="mb-6">
                <div className="bg-blue-50 h-16 w-16 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4 border border-blue-100 shadow-inner">
                   <QrCode className="h-8 w-8" />
                </div>
                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-gray-900 leading-none">Instant UPI Pay</DialogTitle>
                <DialogDescription className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-2 leading-relaxed">
                   Scan QR, make payment & enter UTR to confirm
                </DialogDescription>
              </div>

              <div className="bg-gray-50 p-6 rounded-[2.5rem] border-2 border-dashed border-gray-200 relative mb-6">
                 <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=9450355709@axl&pn=ShopyKart&am=${totalPayable}&cu=INR`)}`} className="h-48 w-48 mx-auto" alt="UPI QR" />
                 <div className="mt-4 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Payable Amount</span>
                    <h4 className="text-3xl font-black italic text-gray-900 tracking-tighter leading-none">₹{totalPayable.toFixed(0)}</h4>
                 </div>
              </div>

              <div className="space-y-4 pt-2">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-blue-600 text-left block ml-1">Enter 12-Digit UTR / Transaction ID</label>
                    <div className="relative group">
                       <CheckCircle2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-300 group-focus-within:text-blue-600 transition-colors" />
                       <Input 
                         placeholder="E.G. 412356789012" 
                         value={utrNumber}
                         onChange={e => setUtrNumber(e.target.value.replace(/\D/g,'').slice(0, 12))}
                         className="h-16 pl-12 rounded-2xl bg-blue-50 border-none font-black text-xl italic text-blue-900 tracking-widest"
                       />
                    </div>
                 </div>

                 <div className="bg-amber-50 p-4 rounded-2xl flex items-start gap-3 border border-amber-100">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[9px] font-bold text-amber-800 uppercase text-left leading-relaxed">
                       Aapka order tab tak confirm nahi hoga jab tak UTR verify nahi ho jata. Galat UTR par order cancel ho jayega.
                    </p>
                 </div>

                 <Button 
                   onClick={finalizeOrder}
                   disabled={utrNumber.length !== 12 || isPlacing}
                   className="w-full h-18 bg-[#0B0B0B] hover:bg-blue-600 text-white rounded-[2rem] font-black uppercase italic text-lg shadow-xl active:scale-95 transition-all py-8"
                 >
                    {isPlacing ? <Loader2 className="h-6 w-6 animate-spin" /> : "CONFIRM & PLACE ORDER"}
                 </Button>
              </div>
           </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="rounded-t-[3.5rem] p-8 border-none shadow-2xl bg-white bottom-0 top-auto translate-y-0 h-[580px] flex flex-col focus:outline-none">
          <DialogHeader className="pb-4 shrink-0 text-center">
             <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-3"><MapPin className="h-8 w-8" /></div>
             <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-gray-900">Drop Address</DialogTitle>
             <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Enter details for 10-min delivery</DialogDescription>
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
                 <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Full Delivery Address</label>
                 <textarea placeholder="HOUSE NO / STREET / AREA" value={recipientForm.address} onChange={e => setRecipientForm({...recipientForm, address: e.target.value.toUpperCase()})} className="w-full h-28 p-4 rounded-2xl bg-gray-50 border-none font-bold text-xs uppercase focus-outline-none resize-none" />
              </div>
          </div>
          <button 
            onClick={() => { 
              if(recipientForm.phone.length===10 && recipientForm.name && recipientForm.address) { 
                localStorage.setItem('user_name', recipientForm.name); 
                localStorage.setItem('user_phone', recipientForm.phone); 
                localStorage.setItem('user_address_line', recipientForm.address); 
                setIsAddressModalOpen(false); 
                toast({ title: "Address Saved" });
              } else {
                toast({ variant: "destructive", title: "Missing Information" });
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
