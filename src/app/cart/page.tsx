
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
  ShieldCheck
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
      const d = new Date();
      setCurrentTimeMinutes(d.getHours() * 60 + d.getMinutes());
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

  const totalPayable = useMemo(() => {
    const discount = appliedCoupon ? (appliedCoupon.discountType === 'percentage' ? (totalPrice * appliedCoupon.discountValue) / 100 : appliedCoupon.discountValue) : 0;
    return Math.max(0, totalPrice + deliveryFee + deliveryTip + extraChargesTotal - (isRedeemingCoins ? 5 : 0) - discount);
  }, [totalPrice, deliveryFee, deliveryTip, extraChargesTotal, isRedeemingCoins, appliedCoupon]);

  const handleApplyCoupon = async () => {
    if (!firestore || !couponCode.trim()) return;
    setIsValidatingCoupon(true);
    try {
      const q = query(collection(firestore, 'coupons'), where('code', '==', couponCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast({ variant: "destructive", title: "Invalid Coupon" });
      } else {
        const data = snap.docs[0].data();
        if (totalPrice < (data.minOrderValue || 0)) toast({ variant: "destructive", title: "Min Order ₹" + data.minOrderValue + " req." });
        else { setAppliedCoupon({ id: snap.docs[0].id, ...data }); toast({ title: "Coupon Applied!" }); }
      }
    } catch (e) { toast({ variant: "destructive", title: "Error" }); }
    finally { setIsValidatingCoupon(false); }
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
        userId: user.uid, customerName: recipientForm.name, customerPhone: recipientForm.phone, address: recipientForm.address,
        items: cart, total: totalPayable, status: 'Placed', createdAt: serverTimestamp(),
        vendorIds: allVendorIds, vendorId: allVendorIds[0], vendorPhone: firstVendor?.phone || '',
        deliveryOTP: Math.floor(100000 + Math.random() * 900000).toString(),
        deliveryFee, deliveryTip, extraCharges: applicableExtraCharges, extraChargesTotal,
        paymentMethod, paymentStatus: paymentMethod === 'UPI' ? 'Paid (UTR Provided)' : 'Pending', paymentUTR: utrNumber || null,
        zoneId: activeZoneId, customerOrderNumber: Math.floor(1000 + Math.random() * 9000)
      };

      await addDoc(collection(firestore!, 'orders'), orderData);
      if (isRedeemingCoins) await updateDoc(doc(firestore!, 'users', user.uid), { coins: increment(-20) });
      setShowSuccessOverlay(true);
      setTimeout(() => { clearCart(); router.replace('/orders'); }, 2000);
    } catch (e) { setIsPlacing(false); toast({ variant: "destructive", title: "Order Failed" }); }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-40 max-w-lg mx-auto relative overflow-hidden transform-gpu">
      <OrderSuccessOverlay isVisible={showSuccessOverlay} />
      <header className="bg-white/80 backdrop-blur-xl py-4 px-6 sticky top-0 z-[100] flex items-center gap-4 border-b border-black/5">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 active:scale-90"><ChevronLeft className="h-6 w-6" /></button>
        <h1 className="text-sm font-black uppercase italic tracking-widest text-gray-800 flex-1 text-center">Checkout</h1>
        <Badge variant="outline" className="rounded-xl bg-amber-50 text-amber-600 font-black text-[9px]"><Coins className="h-2.5 w-2.5 mr-1" /> {userCoins}</Badge>
      </header>

      <main className="px-4 pt-6 space-y-6">
        <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
          <section className="p-6 flex items-center justify-between border-b border-gray-50">
             <div className="flex items-center gap-4 min-w-0">
                <div className="h-12 w-12 bg-black rounded-2xl flex items-center justify-center text-white shrink-0"><Navigation className="h-6 w-6" /></div>
                <div className="min-w-0 pr-4">
                   <h4 className="text-[10px] font-black uppercase text-primary italic">Drop Point</h4>
                   <h4 className="text-xs font-black uppercase truncate">{recipientForm.name || 'Set Name'}</h4>
                   <p className="text-[9px] font-bold text-gray-400 truncate mt-1">{recipientForm.address || 'Set Address'}</p>
                </div>
             </div>
             <button onClick={() => setIsAddressModalOpen(true)} className="bg-primary/5 px-4 py-2 rounded-xl text-[10px] font-black uppercase text-primary border border-primary/10">EDIT</button>
          </section>

          <section className="p-6 space-y-6">
             {cart.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-center">
                   <div className="h-16 w-16 rounded-2xl overflow-hidden bg-muted relative shrink-0">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" unoptimized />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-[11px] font-black uppercase truncate">{item.name}</h4>
                      <div className="flex items-center mt-1 bg-gray-50 w-fit rounded-xl p-0.5">
                         <button onClick={() => removeFromCart(item.id)} className="h-7 w-7 flex items-center justify-center text-gray-500"><Minus className="h-3 w-3" /></button>
                         <span className="mx-2 text-[10px] font-black">{item.quantity}</span>
                         <button onClick={() => addToCart({...item, quantity: 1})} className="h-7 w-7 flex items-center justify-center text-primary"><Plus className="h-3 w-3" /></button>
                      </div>
                   </div>
                   <div className="text-sm font-black italic">₹{(item.price * item.quantity).toFixed(0)}</div>
                </div>
             ))}
          </section>

          <section className="p-6 bg-rose-50/30 border-y border-rose-50">
             <div className="flex items-center gap-3 mb-4"><div className="h-10 w-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600"><Heart className="h-5 w-5 fill-rose-600" /></div><h4 className="text-xs font-black uppercase">DELIVERY TIP</h4></div>
             <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 50].map(amt => (
                  <button key={amt} onClick={() => setDeliveryTip(deliveryTip === amt ? 0 : amt)} className={cn("h-10 rounded-xl font-black text-xs border-2", deliveryTip === amt ? "bg-rose-600 text-white border-rose-600" : "bg-white text-gray-400 border-gray-100")}>₹{amt}</button>
                ))}
             </div>
          </section>

          {/* PAYMENT METHOD SECTION */}
          <section className="p-6 space-y-4">
             <div className="flex items-center gap-3"><div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><CreditCard className="h-5 w-5" /></div><h4 className="text-xs font-black uppercase">Payment Method</h4></div>
             <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPaymentMethod('COD')} className={cn("h-14 rounded-2xl border-2 flex flex-col items-center justify-center gap-1", paymentMethod === 'COD' ? "bg-primary/5 border-primary text-primary" : "bg-gray-50 border-transparent text-gray-400")}>
                   <Banknote className="h-4 w-4" /><span className="text-[9px] font-black uppercase">COD (Cash)</span>
                </button>
                <button onClick={() => setPaymentMethod('UPI')} className={cn("h-14 rounded-2xl border-2 flex flex-col items-center justify-center gap-1", paymentMethod === 'UPI' ? "bg-blue-50 border-blue-500 text-blue-700" : "bg-gray-50 border-transparent text-gray-400")}>
                   <QrCode className="h-4 w-4" /><span className="text-[9px] font-black uppercase">Pay Via UPI</span>
                </button>
             </div>
          </section>

          <section className="p-6 space-y-6 bg-muted/10">
             <h3 className="text-xl font-black italic uppercase text-gray-900">Final Bill</h3>
             <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Item Subtotal</span><span className="text-gray-900 font-black">₹{totalPrice.toFixed(0)}</span></div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest"><span>Delivery Fee</span><span className="text-gray-900 font-black">₹{deliveryFee.toFixed(0)}</span></div>
                {applicableExtraCharges.map((charge, idx) => (
                  <div key={idx} className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-in slide-in-from-right-2">
                    <span>{charge.name} {charge.type === 'percentage' ? `(${charge.value}%)` : ''}</span>
                    <span className="text-gray-900 font-black">₹{charge.calculatedAmount.toFixed(0)}</span>
                  </div>
                ))}
                {deliveryTip > 0 && <div className="flex justify-between text-[10px] font-black text-rose-500 uppercase"><span>Rider Tip</span><span>₹{deliveryTip}</span></div>}
             </div>
             <div className="pt-6 border-t-2 border-dashed border-black/5 flex justify-between items-end">
                <div className="flex flex-col"><span className="text-[8px] font-black uppercase text-primary mb-1">To Pay</span><div className="flex items-center gap-1 text-4xl font-black italic text-gray-900 leading-none"><IndianRupee className="h-6 w-6 text-primary" /><span>{totalPayable.toFixed(0)}</span></div></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase italic">INC. ALL FEES</span>
             </div>
          </section>
        </div>

        <Button onClick={finalizeOrder} disabled={isPlacing || !isMinOrderMet || cart.length === 0} className="w-full h-20 bg-black text-white rounded-[2.5rem] font-black uppercase italic text-xl shadow-xl active:scale-95 transition-all">
          {isPlacing ? <Loader2 className="h-8 w-8 animate-spin" /> : <>PLACE ORDER <ArrowRight className="h-6 w-6 ml-2" /></>}
        </Button>
      </main>

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

      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
        <DialogContent className="rounded-t-[3.5rem] p-8 bg-white bottom-0 top-auto translate-y-0 h-[580px] flex flex-col focus:outline-none">
          <DialogHeader className="text-center"><MapPin className="h-12 w-12 mx-auto text-primary mb-2" /><DialogTitle className="text-3xl font-black uppercase italic">Drop Address</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-6">
              <Input placeholder="NAME" value={recipientForm.name} onChange={e => setRecipientForm({...recipientForm, name: e.target.value.toUpperCase()})} className="h-14 rounded-2xl bg-gray-50 border-none font-black" />
              <Input placeholder="10 DIGIT PHONE" value={recipientForm.phone} onChange={e => setRecipientForm({...recipientForm, phone: e.target.value.replace(/\D/g,'').slice(0, 10)})} className="h-14 rounded-2xl bg-gray-50 border-none font-black" />
              <textarea placeholder="HOUSE NO / STREET / AREA" value={recipientForm.address} onChange={e => setRecipientForm({...recipientForm, address: e.target.value.toUpperCase()})} className="w-full h-28 p-4 rounded-2xl bg-gray-50 border-none font-bold text-xs uppercase" />
              <Button onClick={() => { if(recipientForm.phone.length===10 && recipientForm.name && recipientForm.address) { localStorage.setItem('user_name', recipientForm.name); localStorage.setItem('user_phone', recipientForm.phone); localStorage.setItem('user_address_line', recipientForm.address); setIsAddressModalOpen(false); } }} className="w-full h-18 bg-black text-white rounded-[2rem] font-black uppercase italic">SAVE DETAILS</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
