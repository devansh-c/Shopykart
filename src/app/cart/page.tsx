
'use client';

import { useCart } from '@/components/cart/CartProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Minus, 
  Plus, 
  ChevronLeft, 
  ShoppingBag, 
  Loader2, 
  MapPin, 
  Camera,
  MessageSquare,
  Sparkles,
  Coins,
  Ticket,
  Bike,
  IndianRupee,
  CreditCard,
  Banknote,
  ArrowRight,
  Truck,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  X,
  ShieldCheck,
  Navigation,
  ChevronDown
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useFirestore, useUser, useMemoFirebase, useCollection } from '@/firebase';
import { doc, addDoc, collection, serverTimestamp, getCountFromServer, query, where, limit, orderBy } from 'firebase/firestore';
import { useState, useEffect, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { OrderSuccessOverlay } from '@/components/cart/OrderSuccessOverlay';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

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
  const [selectedTip, setSelectedTip] = useState<number | 'other'>(10);
  const [isPremiumPacking, setIsPremiumPacking] = useState(false);
  const [isRedeemCoins, setIsRedeemCoins] = useState(false);
  
  // Payment States
  const [paymentMode, setPaymentMode] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [showPaymentSelector, setShowPaymentSelector] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Slider Gesture States
  const [sliderOffset, setSliderOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const activeAddress = typeof window !== 'undefined' ? (localStorage.getItem('user_address') || 'Set Location') : 'Set Location';
  const activeCustomerName = typeof window !== 'undefined' ? (localStorage.getItem('user_name') || 'Premium User') : 'Premium User';
  
  const deliveryFee = 10;
  const platformFee = 0;
  const totalPayable = useMemo(() => {
    let base = totalPrice + deliveryFee + platformFee;
    if (isPremiumPacking) base += 10;
    if (isRedeemCoins) base -= 5;
    if (typeof selectedTip === 'number') base += selectedTip;
    return Math.max(0, base);
  }, [totalPrice, isPremiumPacking, isRedeemCoins, selectedTip]);

  const handleOpenPicker = () => {
    window.dispatchEvent(new CustomEvent('open-location-picker'));
  };

  // UPI DEEP LINK GENERATOR
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
    if (!user) { 
      window.dispatchEvent(new CustomEvent('open-auth-overlay')); 
      return; 
    }
    
    setIsPlacing(true);
    try {
      const lat = localStorage.getItem('user_lat');
      const lng = localStorage.getItem('user_lng');
      
      const q = query(collection(firestore!, 'orders'), where('userId', '==', user.uid));
      const countSnap = await getCountFromServer(q);
      const customerOrderNumber = countSnap.data().count + 1;

      const orderData = {
        userId: user.uid,
        customerName: activeCustomerName.toUpperCase(),
        address: localStorage.getItem('user_address_line') || activeAddress,
        customerLat: lat ? parseFloat(lat) : null,
        customerLng: lng ? parseFloat(lng) : null,
        items: cart,
        total: totalPayable,
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

      await addDoc(collection(firestore!, 'orders'), orderData);
      setShowSuccessOverlay(true);
      setTimeout(() => { clearCart(); router.replace(`/order/track/#${customerOrderNumber}`); }, 1500);
    } catch (e) {
      toast({ variant: "destructive", title: "Order Failed" });
    } finally {
      setIsPlacing(false);
      setIsVerifying(false);
    }
  };

  // SLIDER GESTURE LOGIC
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isPlacing) return;
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isPlacing || !sliderRef.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    const trackWidth = sliderRef.current.offsetWidth - 80; // thumb width approx
    
    if (diff > 0) {
      setSliderOffset(Math.min(diff, trackWidth));
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || isPlacing || !sliderRef.current) return;
    setIsDragging(false);
    
    const trackWidth = sliderRef.current.offsetWidth - 80;
    if (sliderOffset > trackWidth * 0.85) {
      // Trigger Order
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
      // Reset
      setSliderOffset(0);
    }
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

      <header className="bg-white border-b border-gray-100 py-5 px-6 sticky top-0 z-[100] flex items-center gap-4">
        <button onClick={() => router.back()} className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-50 active:scale-90 transition-all">
          <ChevronLeft className="h-6 w-6 text-gray-900" />
        </button>
        <h1 className="text-sm font-black uppercase italic tracking-widest text-gray-900">SECURE CHECKOUT</h1>
      </header>

      <main className="px-4 pt-6 space-y-6 max-w-lg mx-auto">
        
        {/* FREE DELIVERY TARGET */}
        <section className="bg-[#2D281F] rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden border border-white/5">
           <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="h-10 w-10 bg-amber-400 rounded-2xl flex items-center justify-center text-black">
                 <Truck className="h-5 w-5" />
              </div>
              <div>
                 <h3 className="text-xs font-black uppercase tracking-widest">FREE DELIVERY TARGET</h3>
                 <p className="text-[9px] font-bold text-amber-400/80 uppercase">Add ₹351 more for free delivery</p>
              </div>
           </div>
           <div className="space-y-2 relative z-10">
              <Progress value={30} className="h-2.5 bg-white/10" indicatorClassName="bg-amber-400" />
              <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-white/40">
                 <span>Subtotal: ₹{totalPrice}</span>
                 <span>Target: ₹499</span>
              </div>
           </div>
           <div className="absolute top-0 right-0 h-full w-24 bg-white/5 -skew-x-12 translate-x-12 pointer-events-none" />
        </section>

        {/* ITEMS IN BAG */}
        <section className="bg-[#2D281F] rounded-[2.5rem] p-6 text-white shadow-2xl space-y-6">
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
                   <div className="text-sm font-black italic">₹{item.price * item.quantity}</div>
                </div>
              ))}
           </div>
        </section>

        {/* GLOBAL INSTRUCTIONS */}
        <section className="bg-[#2D281F] rounded-[2.5rem] p-6 text-white shadow-2xl space-y-4">
           <div className="flex items-center gap-3">
              <MessageSquare className="h-4 w-4 text-amber-400" />
              <h3 className="text-xs font-black uppercase tracking-widest">GLOBAL INSTRUCTIONS <span className="opacity-40">(OPTIONAL)</span></h3>
           </div>
           <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <textarea 
                placeholder="E.g. Make it extra spicy, Leave at the gate..." 
                className="w-full bg-transparent border-none text-[11px] font-medium placeholder:text-white/20 focus:ring-0 min-h-[80px] no-scrollbar"
              />
           </div>
        </section>

        {/* DELIVERY ADDRESS */}
        <section className="bg-[#2D281F] rounded-[2rem] p-5 flex items-center justify-between border border-white/5 shadow-2xl">
           <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-amber-400 rounded-xl flex items-center justify-center text-black shrink-0">
                 <MapPin className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0 pr-4">
                 <h4 className="text-xs font-black uppercase tracking-tight italic leading-none mb-1 truncate text-white">Delivery to: {activeCustomerName}</h4>
                 <p className="text-[9px] font-bold text-white/40 uppercase truncate leading-none">{activeAddress}</p>
              </div>
           </div>
           <button onClick={handleOpenPicker} className="bg-white/10 text-white text-[9px] font-black uppercase px-4 py-2 rounded-lg border border-white/10 active:scale-95 transition-all">
              CHANGE
           </button>
        </section>

        {/* GOURMET ENHANCEMENTS */}
        <section className="bg-[#2D281F] rounded-[2.5rem] p-6 text-white shadow-2xl space-y-6">
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

        {/* BILL SUMMARY */}
        <section className="bg-[#2D281F] rounded-[2.5rem] p-8 text-white shadow-2xl space-y-8">
           <h3 className="text-xl font-black italic uppercase tracking-tighter">BILL SUMMARY</h3>
           <div className="space-y-4">
              <div className="flex justify-between items-center text-[10px] font-bold text-white/60 uppercase tracking-widest">
                 <span>ITEMS SUBTOTAL:</span>
                 <span className="text-white font-black italic text-sm">₹{totalPrice}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-bold text-white/60 uppercase tracking-widest">
                 <span>DELIVERY & HANDLING:</span>
                 <span className="text-white font-black italic text-sm">₹{deliveryFee}</span>
              </div>
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
              <span className="text-3xl font-black italic tracking-tighter text-amber-400">₹{totalPayable}</span>
           </div>
        </section>

        {/* PAYMENT MODE */}
        <section className="bg-[#2D281F] rounded-[2.5rem] p-8 text-white shadow-2xl space-y-8">
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

        {/* REAL GESTURE SLIDER BUTTON */}
        <div className="fixed bottom-0 left-0 right-0 z-[1000] p-6 bg-gradient-to-t from-white via-white to-transparent">
           <div 
             ref={sliderRef}
             className="w-full h-20 bg-[#2D281F] rounded-full p-2 flex items-center relative shadow-2xl overflow-hidden select-none"
           >
              {/* Slider Track Text */}
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

              {/* Slider Thumb */}
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

              {/* Total Display */}
              <div className="flex-1 text-right pr-6 pointer-events-none">
                 <div className="text-xl font-black text-white italic tracking-tighter">₹{totalPayable}</div>
              </div>

              {isPlacing && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-20">
                   <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                </div>
              )}
           </div>
        </div>

      </main>

      {/* UPI PAYMENT SELECTOR */}
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

      {/* PAYMENT VERIFICATION */}
      <Dialog open={isVerifying} onOpenChange={setIsVerifying}>
         <DialogContent className="rounded-[3rem] p-0 border-none shadow-2xl bg-white max-w-xs focus:outline-none overflow-hidden">
            <div className="h-2 w-full bg-amber-400 animate-pulse" />
            <div className="p-10 space-y-8 flex flex-col items-center text-center">
               <DialogHeader className="sr-only">
                  <DialogTitle>Verifying Transaction</DialogTitle>
                  <DialogDescription>Please confirm your payment status.</DialogDescription>
               </DialogHeader>
               
               <div className="relative">
                  <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-20" />
                  <div className="relative h-24 w-24 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 border-4 border-amber-100">
                     <Smartphone className="h-10 w-10 animate-bounce" />
                  </div>
               </div>
               
               <div className="space-y-2">
                  <h3 className="text-xl font-black italic uppercase text-gray-900">VERIFYING PAYMENT</h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase leading-relaxed">Please complete the payment in your UPI app and return here.</p>
               </div>

               <div className="w-full space-y-3">
                  <Button 
                    onClick={finalizeOrder}
                    disabled={isPlacing}
                    className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-black uppercase italic shadow-lg shadow-green-100"
                  >
                    {isPlacing ? <Loader2 className="h-5 w-5 animate-spin" /> : "I HAVE PAID"}
                  </Button>
                  <button 
                    onClick={() => setIsVerifying(false)}
                    className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                  >
                    Payment Failed?
                  </button>
               </div>
            </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}
